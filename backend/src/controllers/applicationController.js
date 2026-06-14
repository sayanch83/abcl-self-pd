const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { sendSelfPdLink } = require('../services/twilioService');
const { analyzeGeoTagging } = require('../services/geoService');
const logger = require('../utils/logger');

const LINK_EXPIRY_HOURS = parseInt(process.env.LINK_EXPIRY_HOURS || '24');

async function getApplications(req, res) {
  try {
    const db = getDatabase();
    const { status, search } = req.query;

    let query = `
      SELECT a.*, 
             o.name as officer_name,
             (SELECT COUNT(*) FROM pd_links pl WHERE pl.application_id = a.id) as link_count,
             (SELECT pl.triggered_at FROM pd_links pl WHERE pl.application_id = a.id ORDER BY pl.triggered_at DESC LIMIT 1) as last_link_sent,
             (SELECT pl.expires_at FROM pd_links pl WHERE pl.application_id = a.id AND pl.is_used = 0 ORDER BY pl.triggered_at DESC LIMIT 1) as active_link_expires
      FROM applications a
      LEFT JOIN officers o ON a.assigned_officer_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND (a.app_id LIKE ? OR a.customer_name LIKE ? OR a.mobile_no LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY a.created_at DESC`;

    const applications = db.prepare(query).all(...params);

    return res.json({ success: true, data: applications });
  } catch (error) {
    logger.error(`Get applications error: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch applications' });
  }
}

async function getApplication(req, res) {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const application = db.prepare(`
      SELECT a.*, o.name as officer_name
      FROM applications a
      LEFT JOIN officers o ON a.assigned_officer_id = o.id
      WHERE a.id = ? OR a.app_id = ?
    `).get(id, id);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Get PD submission if exists
    const submission = db.prepare(`
      SELECT ps.*, o.name as reviewer_name
      FROM pd_submissions ps
      LEFT JOIN officers o ON ps.reviewed_by = o.id
      WHERE ps.application_id = ?
      ORDER BY ps.created_at DESC LIMIT 1
    `).get(application.id);

    // Get link history
    const links = db.prepare(`
      SELECT pl.*, o.name as triggered_by_name
      FROM pd_links pl
      LEFT JOIN officers o ON pl.triggered_by = o.id
      WHERE pl.application_id = ?
      ORDER BY pl.triggered_at DESC
    `).all(application.id);

    // Parse photos and run geo analysis
    let geoAnalysis = [];
    if (submission && submission.photos) {
      try {
        const photos = JSON.parse(submission.photos);
        geoAnalysis = analyzeGeoTagging(photos, application.residence_address, application.office_address);
      } catch (e) {
        logger.warn(`Failed to parse photos: ${e.message}`);
      }
    }

    return res.json({
      success: true,
      data: {
        ...application,
        submission: submission ? {
          ...submission,
          photos: submission.photos ? JSON.parse(submission.photos) : [],
        } : null,
        links,
        geoAnalysis,
      }
    });
  } catch (error) {
    logger.error(`Get application error: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch application details' });
  }
}

async function triggerPdLink(req, res) {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const application = db.prepare(`SELECT * FROM applications WHERE id = ? OR app_id = ?`).get(id, id);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.status === 'completed') {
      return res.status(400).json({ success: false, error: 'PD already completed for this application' });
    }

    // Invalidate any active links
    db.prepare(`UPDATE pd_links SET is_used = -1 WHERE application_id = ? AND is_used = 0`).run(application.id);

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + LINK_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const pdLink = `${baseUrl}/pd/${token}`;

    const linkId = uuidv4();
    db.prepare(`INSERT INTO pd_links (id, application_id, token, mobile_no, expires_at, triggered_by) VALUES (?, ?, ?, ?, ?, ?)`).run(
      linkId, application.id, token, application.mobile_no, expiresAt, req.officer.id
    );

    // Send SMS
    const smsResult = await sendSelfPdLink({
      mobile: application.mobile_no,
      customerName: application.customer_name,
      pdLink,
      appId: application.app_id,
    });

    // Update SMS SID
    db.prepare(`UPDATE pd_links SET sms_sid = ? WHERE id = ?`).run(smsResult.sid, linkId);

    // Update application status
    db.prepare(`UPDATE applications SET status = 'link_sent', updated_at = datetime('now') WHERE id = ?`).run(application.id);

    // Audit log
    db.prepare(`INSERT INTO audit_log (id, entity_type, entity_id, action, performed_by, details, ip_address) VALUES (?, 'pd_link', ?, 'triggered', ?, ?, ?)`).run(
      uuidv4(), linkId, req.officer.id, JSON.stringify({ mobile: application.mobile_no, smsStatus: smsResult.status }), req.ip
    );

    logger.info(`PD link triggered for ${application.app_id} by ${req.officer.email}`);

    return res.json({
      success: true,
      message: `Self-PD link sent to ${application.mobile_no.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2')}`,
      data: {
        linkId,
        expiresAt,
        pdLink,  // Always return — officer needs this to share/demo without Twilio
      }
    });
  } catch (error) {
    logger.error(`Trigger PD link error: ${error.message}`);
    return res.status(500).json({ success: false, error: `Failed to send link: ${error.message}` });
  }
}

async function updatePdOutcome(req, res) {
  try {
    const { id } = req.params;
    const { outcome, remarks } = req.body;

    if (!['positive', 'negative'].includes(outcome)) {
      return res.status(400).json({ success: false, error: 'Outcome must be positive or negative' });
    }

    const db = getDatabase();
    const application = db.prepare(`SELECT * FROM applications WHERE id = ? OR app_id = ?`).get(id, id);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    db.prepare(`
      UPDATE pd_submissions 
      SET pd_outcome = ?, outcome_remarks = ?, reviewed_by = ?, reviewed_at = datetime('now')
      WHERE application_id = ?
    `).run(outcome, remarks || null, req.officer.id, application.id);

    db.prepare(`UPDATE applications SET updated_at = datetime('now') WHERE id = ?`).run(application.id);

    // Audit
    db.prepare(`INSERT INTO audit_log (id, entity_type, entity_id, action, performed_by, details, ip_address) VALUES (?, 'application', ?, 'pd_outcome_updated', ?, ?, ?)`).run(
      uuidv4(), application.id, req.officer.id, JSON.stringify({ outcome, remarks }), req.ip
    );

    return res.json({ success: true, message: `PD outcome marked as ${outcome}` });
  } catch (error) {
    logger.error(`Update PD outcome error: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to update outcome' });
  }
}

async function getDashboardStats(req, res) {
  try {
    const db = getDatabase();

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'link_sent' THEN 1 ELSE 0 END) as link_sent,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM applications
    `).get();

    const recentActivity = db.prepare(`
      SELECT al.*, o.name as officer_name
      FROM audit_log al
      LEFT JOIN officers o ON al.performed_by = o.id
      ORDER BY al.created_at DESC LIMIT 10
    `).all();

    return res.json({ success: true, data: { stats, recentActivity } });
  } catch (error) {
    logger.error(`Dashboard stats error: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
}

module.exports = { getApplications, getApplication, triggerPdLink, updatePdOutcome, getDashboardStats };
