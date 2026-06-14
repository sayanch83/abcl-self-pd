const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');
const logger = require('../utils/logger');

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Employee ID and password are required' });
    }

    const db = getDatabase();
    // Accept either employee_id (e.g. ABCL001) or email
    const officer = db.prepare(
      `SELECT * FROM officers WHERE (employee_id = ? OR email = ?) AND is_active = 1`
    ).get(username.trim().toUpperCase(), username.trim().toLowerCase());

    if (!officer) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isPasswordValid = bcrypt.compareSync(password, officer.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: officer.id, email: officer.email, role: officer.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    db.prepare(`INSERT INTO audit_log (id, entity_type, entity_id, action, performed_by, ip_address) VALUES (?, 'officer', ?, 'login', ?, ?)`).run(
      require('uuid').v4(), officer.id, officer.id, req.ip
    );

    logger.info(`Officer login: ${officer.employee_id} (${officer.email})`);

    return res.json({
      success: true,
      data: {
        token,
        officer: {
          id: officer.id,
          name: officer.name,
          email: officer.email,
          employeeId: officer.employee_id,
          branch: officer.branch,
          role: officer.role,
        }
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
}

async function getProfile(req, res) {
  const { password_hash, ...officer } = req.officer;
  return res.json({ success: true, data: officer });
}

module.exports = { login, getProfile };
