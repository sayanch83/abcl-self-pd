const twilio = require('twilio');
const logger = require('../utils/logger');

let client = null;

// DEMO_MODE=true  → no real SMS; OTP fixed as 123456; link shown in modal only
// DEMO_MODE=false → real Twilio SMS for both PD link and OTP via Twilio Verify
function isDemoMode() {
  return process.env.DEMO_MODE === 'true';
}

function getTwilioClient() {
  if (client) return client;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    logger.warn('Twilio credentials not set — all SMS will be skipped');
    return null;
  }
  client = twilio(accountSid, authToken);
  logger.info(`Twilio client ready — SID: ${accountSid.slice(0, 8)}...`);
  return client;
}

function getSmsFrom() {
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    return { messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID };
  }
  if (process.env.TWILIO_PHONE_NUMBER) {
    return { from: process.env.TWILIO_PHONE_NUMBER };
  }
  throw new Error('Neither TWILIO_MESSAGING_SERVICE_SID nor TWILIO_PHONE_NUMBER is configured');
}

// ── PD Link SMS ───────────────────────────────────────────────────────────────
async function sendSelfPdLink({ mobile, customerName, pdLink, appId }) {
  const to = mobile.startsWith('+') ? mobile : `+91${mobile}`;

  if (isDemoMode()) {
    logger.info(`[DEMO] PD link not sent via SMS (DEMO_MODE=true). Link: ${pdLink}`);
    return { sid: `DEMO_${Date.now()}`, status: 'demo' };
  }

  const msg1 =
    `Dear ${customerName}, Aditya Birla Capital Ltd. requests you to complete your ` +
    `Self Personal Discussion for Application ${appId}. Link follows. Valid 24 hrs. -ABCL`;
  const msg2 =
    `ABCL Self-PD link for ${appId}: ${pdLink}\nDo not share. Helpline: 1800-270-7000`;

  const twilioClient = getTwilioClient();
  if (!twilioClient) {
    logger.info(`[NO-TWILIO] SMS skipped. Link: ${pdLink}`);
    return { sid: `SIM_${Date.now()}`, status: 'simulated' };
  }

  try {
    const from = getSmsFrom();
    const r1 = await twilioClient.messages.create({ ...from, to, body: msg1 });
    logger.info(`PD link SMS1 sent to ${to} — SID: ${r1.sid}`);
    await new Promise(r => setTimeout(r, 800));
    const r2 = await twilioClient.messages.create({ ...from, to, body: msg2 });
    logger.info(`PD link SMS2 (link) sent to ${to} — SID: ${r2.sid}`);
    return { sid: r2.sid, status: r2.status };
  } catch (err) {
    logger.error(`PD link SMS failed: ${err.message} (code: ${err.code})`);
    throw new Error(`Failed to send SMS: ${err.message}`);
  }
}

// ── OTP Send ──────────────────────────────────────────────────────────────────
async function sendOtpVerify(mobile) {
  const to = mobile.startsWith('+') ? mobile : `+91${mobile}`;

  if (isDemoMode()) {
    logger.info(`[DEMO] OTP not sent via SMS (DEMO_MODE=true) — fixed OTP is 123456`);
    return { status: 'demo' };
  }

  const verifySid = process.env.TWILIO_VERIFY_SID;
  const twilioClient = getTwilioClient();

  if (!twilioClient || !verifySid) {
    logger.warn(`[NO-TWILIO] OTP send skipped for ${to}`);
    return { status: 'simulated' };
  }

  const v = await twilioClient.verify.v2.services(verifySid).verifications.create({ to, channel: 'sms' });
  logger.info(`Twilio Verify OTP sent to ${to} — status: ${v.status}`);
  return { status: v.status };
}

// ── OTP Check ─────────────────────────────────────────────────────────────────
async function checkOtpVerify(mobile, code) {
  const to = mobile.startsWith('+') ? mobile : `+91${mobile}`;

  if (isDemoMode()) {
    const approved = code?.toString().trim() === '123456';
    logger.info(`[DEMO] OTP check for ${to} — code=${code} approved=${approved}`);
    return { approved, status: approved ? 'approved' : 'pending' };
  }

  const verifySid = process.env.TWILIO_VERIFY_SID;
  const twilioClient = getTwilioClient();

  if (!twilioClient || !verifySid) {
    logger.warn(`[NO-TWILIO] OTP check — accepting any 6-digit code`);
    return { approved: code?.toString().length === 6, status: 'approved' };
  }

  const check = await twilioClient.verify.v2.services(verifySid).verificationChecks.create({ to, code });
  logger.info(`Twilio Verify check for ${to} — status: ${check.status}`);
  return { approved: check.status === 'approved', status: check.status };
}

// ── Mode info (for /api/health and admin UI) ──────────────────────────────────
function getMode() {
  return isDemoMode() ? 'demo' : 'live';
}

module.exports = { sendSelfPdLink, sendOtpVerify, checkOtpVerify, getMode, isDemoMode };
