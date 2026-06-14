const express = require('express');
const { login, getProfile } = require('../controllers/authController');
const { authenticateOfficer } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticateOfficer, getProfile);

module.exports = router;
