const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const logger = require('../utils/logger');

// ── GET all applications with officer info ────────────────────────────────────
function getAll(req, res) {
  try {
    const db = getDatabase();
    const apps = db.prepare(`
      SELECT a.*, o.name as officer_name, o.id as officer_id
      FROM applications a
      LEFT JOIN officers o ON a.assigned_officer_id = o.id
      ORDER BY a.created_at ASC
    `).all();

    const officers = db.prepare(`SELECT id, name, branch FROM officers WHERE is_active = 1 ORDER BY name`).all();

    return res.json({ success: true, data: { applications: apps, officers } });
  } catch (err) {
    logger.error(`Demo config getAll: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── CREATE new application ────────────────────────────────────────────────────
function create(req, res) {
  try {
    const db = getDatabase();
    const {
      app_id, customer_name, mobile_no, product, loan_amount,
      branch, location, employment_type,
      residence_address, office_address,
      assigned_officer_id,
    } = req.body;

    // Validate required fields
    const missing = ['customer_name', 'mobile_no', 'product', 'employment_type']
      .filter(f => !req.body[f]);
    if (missing.length) {
      return res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(', ')}` });
    }

    // Validate mobile
    const cleanMobile = String(mobile_no).replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      return res.status(400).json({ success: false, error: 'Mobile number must be 10 digits' });
    }

    // Auto-generate App ID if not provided
    const productPrefix = { 'Personal Loan': 'PL', 'Business Loan': 'BL', 'Home Loan': 'HL', 'LAP': 'LAP' };
    const prefix = productPrefix[product] || 'APP';
    const generatedAppId = app_id?.trim() || `${prefix}${Date.now().toString().slice(-8)}`;

    // Check uniqueness
    const existing = db.prepare(`SELECT id FROM applications WHERE app_id = ?`).get(generatedAppId);
    if (existing) {
      return res.status(400).json({ success: false, error: `App ID ${generatedAppId} already exists` });
    }

    // Default officer to requesting officer if not specified
    const officerId = assigned_officer_id || req.officer.id;

    const id = uuidv4();
    db.prepare(`
      INSERT INTO applications (id, app_id, customer_name, mobile_no, product, loan_amount,
        branch, location, employment_type, residence_address, office_address,
        status, assigned_officer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(id, generatedAppId, customer_name.trim(), cleanMobile,
           product, parseFloat(loan_amount) || 0,
           branch || '', location || '',
           employment_type, residence_address || '', office_address || '',
           officerId);

    const created = db.prepare(`
      SELECT a.*, o.name as officer_name FROM applications a
      LEFT JOIN officers o ON a.assigned_officer_id = o.id
      WHERE a.id = ?
    `).get(id);

    logger.info(`Demo config: application created ${generatedAppId} by ${req.officer.email}`);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    logger.error(`Demo config create: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── UPDATE application ────────────────────────────────────────────────────────
function update(req, res) {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const app = db.prepare(`SELECT * FROM applications WHERE id = ?`).get(id);
    if (!app) return res.status(404).json({ success: false, error: 'Application not found' });

    const {
      customer_name, mobile_no, product, loan_amount,
      branch, location, employment_type,
      residence_address, office_address,
      status, assigned_officer_id,
    } = req.body;

    const cleanMobile = mobile_no ? String(mobile_no).replace(/\D/g, '') : app.mobile_no;
    if (cleanMobile.length !== 10) {
      return res.status(400).json({ success: false, error: 'Mobile number must be 10 digits' });
    }

    db.prepare(`
      UPDATE applications SET
        customer_name = ?,
        mobile_no = ?,
        product = ?,
        loan_amount = ?,
        branch = ?,
        location = ?,
        employment_type = ?,
        residence_address = ?,
        office_address = ?,
        status = ?,
        assigned_officer_id = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      customer_name || app.customer_name,
      cleanMobile,
      product || app.product,
      parseFloat(loan_amount) || app.loan_amount,
      branch ?? app.branch,
      location ?? app.location,
      employment_type || app.employment_type,
      residence_address ?? app.residence_address,
      office_address ?? app.office_address,
      status || app.status,
      assigned_officer_id || app.assigned_officer_id,
      id
    );

    const updated = db.prepare(`
      SELECT a.*, o.name as officer_name FROM applications a
      LEFT JOIN officers o ON a.assigned_officer_id = o.id
      WHERE a.id = ?
    `).get(id);

    logger.info(`Demo config: application updated ${app.app_id} by ${req.officer.email}`);
    return res.json({ success: true, data: updated });
  } catch (err) {
    logger.error(`Demo config update: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── DELETE application ────────────────────────────────────────────────────────
function remove(req, res) {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const app = db.prepare(`SELECT * FROM applications WHERE id = ?`).get(id);
    if (!app) return res.status(404).json({ success: false, error: 'Application not found' });

    // Cascade delete related records
    db.exec(`
      DELETE FROM pd_submissions WHERE application_id = '${id}';
      DELETE FROM otp_sessions WHERE pd_link_id IN (SELECT id FROM pd_links WHERE application_id = '${id}');
      DELETE FROM pd_links WHERE application_id = '${id}';
      DELETE FROM applications WHERE id = '${id}';
    `);

    logger.info(`Demo config: application deleted ${app.app_id} by ${req.officer.email}`);
    return res.json({ success: true, message: `Application ${app.app_id} deleted` });
  } catch (err) {
    logger.error(`Demo config delete: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── RESET application status (clear PD submission, reset to pending) ──────────
function resetStatus(req, res) {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const app = db.prepare(`SELECT * FROM applications WHERE id = ?`).get(id);
    if (!app) return res.status(404).json({ success: false, error: 'Application not found' });

    db.exec(`
      DELETE FROM pd_submissions WHERE application_id = '${id}';
      DELETE FROM otp_sessions WHERE pd_link_id IN (SELECT id FROM pd_links WHERE application_id = '${id}');
      DELETE FROM pd_links WHERE application_id = '${id}';
      UPDATE applications SET status = 'pending', updated_at = datetime('now') WHERE id = '${id}';
    `);

    logger.info(`Demo config: reset ${app.app_id} to pending`);
    return res.json({ success: true, message: `${app.app_id} reset to Pending` });
  } catch (err) {
    logger.error(`Demo config reset: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { getAll, create, update, remove, resetStatus };
