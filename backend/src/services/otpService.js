const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { sendOtpVerify, checkOtpVerify } = require('./twilioService');
const logger = require('../utils/logger');

// ── Send OTP ──────────────────────────────────────────────────────────────────
// Delegates entirely to Twilio Verify — no manual OTP generation, hashing,
// or storage needed. Twilio handles expiry (10 min) and attempt counting (5 max).
// We record a lightweight session row just for the audit trail.
async function createAndSendOtp(pdLinkId, mobile, customerName) {
  const db = getDatabase();

  // Cancel any previous pending sessions for this link
  db.prepare(`UPDATE otp_sessions SET is_verified = -1 WHERE pd_link_id = ? AND is_verified = 0`).run(pdLinkId);

  // Placeholder session row — otp_hash not used with Verify, stored as empty string
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min (matches Verify default)
  db.prepare(
    `INSERT INTO otp_sessions (id, pd_link_id, mobile_no, otp_hash, expires_at) VALUES (?, ?, ?, '', ?)`
  ).run(sessionId, pdLinkId, mobile, expiresAt);

  // Twilio Verify sends the SMS — handles everything
  await sendOtpVerify(mobile);

  logger.info(`OTP dispatched via Twilio Verify for link ${pdLinkId}`);
  return { sessionId };
}

// ── Verify OTP ────────────────────────────────────────────────────────────────
// Twilio Verify checks the code against what it sent — we just pass it through.
async function verifyOtp(pdLinkId, mobile, submittedOtp) {
  const db = getDatabase();

  // Confirm there is an active session for this link+mobile
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

  // Delegate actual code check to Twilio Verify
  let result;
  try {
    result = await checkOtpVerify(mobile, submittedOtp);
  } catch (err) {
    logger.error(`Twilio Verify check error: ${err.message} (code: ${err.code})`);

    // Map well-known Twilio Verify error codes to user-friendly messages
    if (err.code === 60202) {
      return { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
    }
    if (err.code === 20404) {
      return { success: false, error: 'OTP expired or already used. Please request a new one.' };
    }
    return { success: false, error: 'OTP verification failed. Please try again.' };
  }

  if (!result.approved) {
    // Increment local attempts counter for display purposes
    db.prepare(`UPDATE otp_sessions SET attempts = attempts + 1 WHERE id = ?`).run(session.id);
    const remaining = Math.max(0, 5 - (session.attempts + 1)); // Twilio allows 5 attempts
    return { success: false, error: `Invalid OTP. ${remaining} attempt(s) remaining.` };
  }

  // Mark session as verified
  db.prepare(`UPDATE otp_sessions SET is_verified = 1 WHERE id = ?`).run(session.id);
  logger.info(`OTP verified for link ${pdLinkId}`);
  return { success: true, sessionId: session.id };
}

module.exports = { createAndSendOtp, verifyOtp };
