const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');
const logger = require('../utils/logger');

function authenticateOfficer(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDatabase();
    const officer = db.prepare(`SELECT * FROM officers WHERE id = ? AND is_active = 1`).get(decoded.id);

    if (!officer) {
      return res.status(401).json({ success: false, error: 'Officer account not found or inactive' });
    }

    req.officer = officer;
    next();
  } catch (error) {
    logger.warn(`Auth failed: ${error.message}`);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Session expired. Please login again.' });
    }
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }
}

function authenticatePdSession(req, res, next) {
  // For customer PD - validate token from URL param
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({ success: false, error: 'PD token required' });
  }

  const db = getDatabase();
  const pdLink = db.prepare(`
    SELECT pl.*, a.customer_name, a.mobile_no, a.product, a.employment_type,
           a.residence_address, a.office_address, a.app_id, a.loan_amount, a.location
    FROM pd_links pl
    JOIN applications a ON pl.application_id = a.id
    WHERE pl.token = ?
  `).get(token);

  if (!pdLink) {
    return res.status(404).json({ success: false, error: 'Invalid or expired link.' });
  }

  if (pdLink.is_used) {
    return res.status(410).json({ success: false, error: 'This link has already been used. The form has been submitted.' });
  }

  if (new Date(pdLink.expires_at) < new Date()) {
    return res.status(410).json({ success: false, error: 'This link has expired. Please contact your loan officer.' });
  }

  req.pdLink = pdLink;
  next();
}

module.exports = { authenticateOfficer, authenticatePdSession };
