const { getDatabase } = require('../config/database');
const { generatePdReport } = require('../services/pdfService');
const { analyzeGeoTagging } = require('../services/geoService');
const logger = require('../utils/logger');

async function downloadPdReport(req, res) {
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

    const submission = db.prepare(`
      SELECT ps.*, o.name as reviewer_name
      FROM pd_submissions ps
      LEFT JOIN officers o ON ps.reviewed_by = o.id
      WHERE ps.application_id = ?
      ORDER BY ps.created_at DESC LIMIT 1
    `).get(application.id);

    if (!submission) {
      return res.status(400).json({ success: false, error: 'No PD submission found for this application' });
    }

    // Parse photos
    let photos = [];
    try { photos = JSON.parse(submission.photos || '[]'); } catch {}

    // Run geo analysis
    const geoAnalysis = analyzeGeoTagging(photos, application.residence_address, application.office_address);

    // Attach parsed photos to submission object
    const submissionWithPhotos = { ...submission, photos };

    logger.info(`Generating PDF report for ${application.app_id}`);
    const pdfBuffer = await generatePdReport(application, submissionWithPhotos, geoAnalysis);

    const filename = `ABCL-Self-PD-${application.app_id}-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);

  } catch (err) {
    logger.error(`PDF report generation error: ${err.message}`);
    return res.status(500).json({ success: false, error: `Failed to generate report: ${err.message}` });
  }
}

module.exports = { downloadPdReport };
