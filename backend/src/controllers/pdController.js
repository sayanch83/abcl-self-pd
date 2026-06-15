const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { createAndSendOtp, verifyOtp } = require('../services/otpService');
const { getFileUrl } = require('../middleware/upload');
const logger = require('../utils/logger');

// node:sqlite (Node 22 built-in) rejects undefined — must use null explicitly.
// This helper converts any undefined/empty value to null for safe DB binding.
const n = (v) => (v === undefined || v === '' || v === null) ? null : v;
const ni = (v) => { const x = parseInt(v); return isNaN(x) ? null : x; };

async function getLinkInfo(req, res) {
  try {
    const { pdLink } = req;
    return res.json({
      success: true,
      data: {
        applicationId:  pdLink.app_id,
        customerName:   pdLink.customer_name,
        product:        pdLink.product,
        loanAmount:     pdLink.loan_amount,
        location:       pdLink.location,
        employmentType: pdLink.employment_type,
        maskedMobile:   pdLink.mobile_no.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2'),
        expiresAt:      pdLink.expires_at,
      }
    });
  } catch (error) {
    logger.error(`Get link info error: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to get link info' });
  }
}

async function requestOtp(req, res) {
  try {
    const { pdLink } = req;
    const { mobile } = req.body;

    if (!mobile || mobile.replace(/\D/g, '').length !== 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number' });
    }

    const cleanMobile = mobile.replace(/\D/g, '');

    if (cleanMobile !== pdLink.mobile_no.replace(/\D/g, '')) {
      return res.status(403).json({
        success: false,
        error: 'This mobile number does not match the one registered for this application. Please use the mobile number on which you received the SMS.'
      });
    }

    const result = await createAndSendOtp(pdLink.id, cleanMobile, pdLink.customer_name);

    return res.json({
      success: true,
      message: `OTP sent to ${mobile.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2')}`,
      data: { sessionId: result.sessionId },
    });
  } catch (error) {
    logger.error(`Request OTP error: ${error.message}`);
    return res.status(500).json({ success: false, error: `Failed to send OTP: ${error.message}` });
  }
}

async function validateOtp(req, res) {
  try {
    const { pdLink } = req;
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ success: false, error: 'Mobile and OTP are required' });
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    const result = await verifyOtp(pdLink.id, cleanMobile, otp.toString().trim());

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    const jwt = require('jsonwebtoken');
    const sessionToken = jwt.sign(
      { pdLinkId: pdLink.id, applicationId: pdLink.application_id, mobile: cleanMobile },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        sessionToken,
        applicationInfo: {
          appId:            pdLink.app_id,
          customerName:     pdLink.customer_name,
          product:          pdLink.product,
          employmentType:   pdLink.employment_type,
          residenceAddress: pdLink.residence_address,
          officeAddress:    pdLink.office_address,
        }
      }
    });
  } catch (error) {
    logger.error(`Validate OTP error: ${error.message}`);
    return res.status(500).json({ success: false, error: 'OTP validation failed' });
  }
}

async function uploadPhoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No photo uploaded' });
    }

    const { photoType, lat, lng } = req.body;

    const VALID_PHOTO_TYPES = [
      'residence', 'residence_building', 'residence_door',
      'office', 'business', 'business_outside', 'business_inside',
    ];

    if (!photoType || !VALID_PHOTO_TYPES.includes(photoType)) {
      return res.status(400).json({ success: false, error: 'Invalid photo type' });
    }

    const url = getFileUrl(req.file);

    return res.json({
      success: true,
      data: {
        url,
        lat:          parseFloat(lat) || null,
        lng:          parseFloat(lng) || null,
        type:         photoType,
        timestamp:    new Date().toISOString(),
        originalName: req.file.originalname,
      }
    });
  } catch (error) {
    logger.error(`Upload photo error: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to upload photo' });
  }
}

async function submitPd(req, res) {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers['authorization'];
    const sessionToken = authHeader && authHeader.split(' ')[1];

    if (!sessionToken) {
      return res.status(401).json({ success: false, error: 'Session token required' });
    }

    let session;
    try {
      session = jwt.verify(sessionToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session. Please start over.' });
    }

    // Guard: ensure session contains required fields (JWT drops undefined on sign)
    if (!session.pdLinkId || !session.applicationId) {
      logger.error(`Submit PD: session missing fields — pdLinkId=${session.pdLinkId} applicationId=${session.applicationId}`);
      return res.status(401).json({ success: false, error: 'Session is incomplete. Please verify your OTP again.' });
    }

    const db = getDatabase();

    const pdLink = db.prepare(`SELECT * FROM pd_links WHERE id = ? AND is_used = 0`).get(session.pdLinkId);
    if (!pdLink) {
      return res.status(410).json({ success: false, error: 'This link has already been used or expired.' });
    }

    const {
      residenceType, yearsAtResidence, residenceOwnership, localityType,
      employerName, designation, yearsEmployed, monthlyIncome,
      businessName, businessType, yearsInBusiness, monthlyTurnover,
      familyMembers, dependents, existingLoans, loanPurpose,
      interactionQuality, customerCooperative, additionalNotes,
      photos,
    } = req.body;

    // Normalise photos — may arrive as array, JSON string, or undefined
    let photosArray = photos || [];
    if (typeof photosArray === 'string') {
      try { photosArray = JSON.parse(photosArray); } catch { photosArray = []; }
    }
    if (!Array.isArray(photosArray)) photosArray = [];
    // Strip client-only 'preview' blob URLs before storing
    photosArray = photosArray.map(({ preview, ...rest }) => rest);

    const submissionId = uuidv4();

    // Use n() / ni() to convert every undefined → null so node:sqlite doesn't throw
    db.prepare(`
      INSERT INTO pd_submissions (
        id, application_id, pd_link_id,
        residence_type, years_at_residence, residence_ownership, locality_type,
        employer_name, designation, years_employed, monthly_income,
        business_name, business_type, years_in_business, monthly_turnover,
        family_members, dependents, existing_loans, loan_purpose,
        interaction_quality, customer_cooperative, additional_notes,
        photos, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      submissionId,        session.applicationId, session.pdLinkId,
      n(residenceType),    n(yearsAtResidence),   n(residenceOwnership), n(localityType),
      n(employerName),     n(designation),        n(yearsEmployed),      n(monthlyIncome),
      n(businessName),     n(businessType),       n(yearsInBusiness),    n(monthlyTurnover),
      ni(familyMembers),   ni(dependents),
      n(existingLoans),    n(loanPurpose),
      n(interactionQuality), customerCooperative ? 1 : 0, n(additionalNotes),
      JSON.stringify(photosArray)
    );

    db.prepare(`UPDATE pd_links SET is_used = 1 WHERE id = ?`).run(session.pdLinkId);
    db.prepare(`UPDATE applications SET status = 'completed', updated_at = datetime('now') WHERE id = ?`).run(session.applicationId);
    db.prepare(`INSERT INTO audit_log (id, entity_type, entity_id, action, details) VALUES (?, 'pd_submission', ?, 'submitted', ?)`).run(
      uuidv4(), submissionId, JSON.stringify({ applicationId: session.applicationId })
    );

    logger.info(`PD submitted for application ${session.applicationId}`);

    return res.json({
      success: true,
      message: 'Your Personal Discussion form has been submitted successfully.',
      data: { submissionId }
    });
  } catch (error) {
    logger.error(`Submit PD error: ${error.message}`);
    return res.status(500).json({ success: false, error: `Submission failed: ${error.message}` });
  }
}

async function uploadVideo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video uploaded' });
    }

    const { videoType, lat, lng } = req.body;

    const VALID_VIDEO_TYPES = ['residence_video', 'business_video', 'office_video'];
    if (!videoType || !VALID_VIDEO_TYPES.includes(videoType)) {
      return res.status(400).json({ success: false, error: 'Invalid video type' });
    }

    const url = getFileUrl(req.file);

    return res.json({
      success: true,
      data: {
        url,
        lat:          parseFloat(lat) || null,
        lng:          parseFloat(lng) || null,
        type:         videoType,
        mediaType:    'video',
        timestamp:    new Date().toISOString(),
        originalName: req.file.originalname,
        size:         req.file.size,
      }
    });
  } catch (error) {
    logger.error(`Upload video error: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to upload video' });
  }
}

module.exports = { getLinkInfo, requestOtp, validateOtp, uploadPhoto, uploadVideo, submitPd };
