const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { sendOtp } = require('./twilioService');
const logger = require('../utils/logger');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
const MAX_ATTEMPTS = 3;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createAndSendOtp(pdLinkId, mobile, customerName) {
  const db = getDatabase();
  const otp = generateOtp();
  const otpHash = bcrypt.hashSync(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Invalidate any existing OTPs for this link
  db.prepare(`UPDATE otp_sessions SET is_verified = -1 WHERE pd_link_id = ? AND is_verified = 0`).run(pdLinkId);

  const sessionId = uuidv4();
  db.prepare(`INSERT INTO otp_sessions (id, pd_link_id, mobile_no, otp_hash, expires_at) VALUES (?, ?, ?, ?, ?)`).run(
    sessionId, pdLinkId, mobile, otpHash, expiresAt
  );

  await sendOtp({ mobile, otp, customerName });

  logger.info(`OTP created for link ${pdLinkId}`);
  return { sessionId };
}

function verifyOtp(pdLinkId, mobile, submittedOtp) {
  const db = getDatabase();

  const session = db.prepare(`
    SELECT * FROM otp_sessions 
    WHERE pd_link_id = ? AND mobile_no = ? AND is_verified = 0
    ORDER BY created_at DESC LIMIT 1
  `).get(pdLinkId, mobile);

  if (!session) {
    return { success: false, error: 'No active OTP session found. Please request a new OTP.' };
  }

  if (new Date(session.expires_at) < new Date()) {
    return { success: false, error: 'OTP has expired. Please request a new one.' };
  }

  if (session.attempts >= MAX_ATTEMPTS) {
    return { success: false, error: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
  }

  // Increment attempts
  db.prepare(`UPDATE otp_sessions SET attempts = attempts + 1 WHERE id = ?`).run(session.id);

  const isValid = bcrypt.compareSync(submittedOtp, session.otp_hash);

  if (!isValid) {
    const remaining = MAX_ATTEMPTS - session.attempts - 1;
    return { success: false, error: `Invalid OTP. ${remaining} attempt(s) remaining.` };
  }

  // Mark as verified
  db.prepare(`UPDATE otp_sessions SET is_verified = 1 WHERE id = ?`).run(session.id);

  return { success: true, sessionId: session.id };
}

module.exports = { createAndSendOtp, verifyOtp };
