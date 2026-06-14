const express = require('express');
const { authenticateOfficer } = require('../middleware/auth');
const {
  getApplications,
  getApplication,
  triggerPdLink,
  updatePdOutcome,
  getDashboardStats,
} = require('../controllers/applicationController');

const router = express.Router();

router.use(authenticateOfficer);

router.get('/stats', getDashboardStats);
router.get('/', getApplications);
router.get('/:id', getApplication);
router.post('/:id/trigger-pd', triggerPdLink);
router.post('/:id/pd-outcome', updatePdOutcome);

module.exports = router;
