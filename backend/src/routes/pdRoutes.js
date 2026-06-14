const express = require('express');
const { authenticatePdSession } = require('../middleware/auth');
const { createUploadMiddleware } = require('../middleware/upload');
const { getLinkInfo, requestOtp, validateOtp, uploadPhoto, submitPd } = require('../controllers/pdController');

const router = express.Router();
const upload = createUploadMiddleware();

// Token-based routes (validates link)
router.get('/:token/info', authenticatePdSession, getLinkInfo);
router.post('/:token/request-otp', authenticatePdSession, requestOtp);
router.post('/:token/validate-otp', authenticatePdSession, validateOtp);

// Session-based routes (after OTP verification, uses sessionToken)
router.post('/upload-photo', upload.single('photo'), uploadPhoto);
router.post('/submit', submitPd);

module.exports = router;
