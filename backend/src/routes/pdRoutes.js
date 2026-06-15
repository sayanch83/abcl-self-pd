const express = require('express');
const { authenticatePdSession } = require('../middleware/auth');
const { createUploadMiddleware } = require('../middleware/upload');
const { getLinkInfo, requestOtp, validateOtp, uploadPhoto, uploadVideo, submitPd } = require('../controllers/pdController');

const router = express.Router();
const upload = createUploadMiddleware();

router.get('/:token/info', authenticatePdSession, getLinkInfo);
router.post('/:token/request-otp', authenticatePdSession, requestOtp);
router.post('/:token/validate-otp', authenticatePdSession, validateOtp);

router.post('/upload-photo', upload.single('photo'), uploadPhoto);
router.post('/upload-video', upload.single('video'), uploadVideo);
router.post('/submit', submitPd);

module.exports = router;
