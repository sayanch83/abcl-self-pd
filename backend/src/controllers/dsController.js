const { getDatabase } = require('../config/database');
const { fetchDsAuthenticate } = require('../services/dsStubService');
const logger = require('../utils/logger');

async function getDsData(req, res) {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const application = db.prepare(`
      SELECT * FROM applications WHERE id = ? OR app_id = ?
    `).get(id, id);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const result = await fetchDsAuthenticate(application);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    return res.json({ success: true, data: result.data });
  } catch (err) {
    logger.error(`DS controller error: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { getDsData };
