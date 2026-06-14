const twilio = require('twilio');
const logger = require('../utils/logger');

let client = null;

function getTwilioClient() {
  if (client) return client;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    logger.warn('Twilio not configured (missing ACCOUNT_SID or AUTH_TOKEN) — running in simulation mode');
    return null;
  }

  client = twilio(accountSid, authToken);
  logger.info(`Twilio client initialised — SID: ${accountSid.slice(0, 8)}...`);
  return client;
}

// Returns the correct "from" params for twilioClient.messages.create()
// Prefers TWILIO_MESSAGING_SERVICE_SID (bypasses A2P number block),
// falls back to TWILIO_PHONE_NUMBER.
function getSmsFrom() {
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    return { messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID };
  }
  if (process.env.TWILIO_PHONE_NUMBER) {
    return { from: process.env.TWILIO_PHONE_NUMBER };
  }
  throw new Error(
    'Neither TWILIO_MESSAGING_SERVICE_SID nor TWILIO_PHONE_NUMBER is set in environment variables'
  );
}

// ── Send Self-PD link via SMS ─────────────────────────────────────────────────
async function sendSelfPdLink({ mobile, customerName, pdLink, appId }) {
  const to = mobile.startsWith('+') ? mobile : `+91${mobile}`;

  // Split into two messages — Indian carriers often strip URLs from
  // mixed text+link messages, same pattern used in reKYC app.
  const msg1 =
    `Dear ${customerName}, Aditya Birla Capital Ltd. requests you to complete your ` +
    `Self Personal Discussion for Loan Application ${appId}. ` +
    `The link will follow in the next message. Valid 24 hrs. -ABCL`;

  const msg2 =
    `ABCL Self-PD link for ${appId}: ${pdLink}\n` +
    `Do not share this link. Helpline: 1800-270-7000`;

  const twilioClient = getTwilioClient();

  if (!twilioClient) {
    logger.info(`[SIMULATION] PD link SMS to ${to}`);
    logger.info(`[SIMULATION] msg1: ${msg1}`);
    logger.info(`[SIMULATION] msg2: ${msg2}`);
    return { sid: `SIM_${Date.now()}`, status: 'simulated' };
  }

  try {
    const fromParams = getSmsFrom();
    logger.info(`Sending PD link SMS to ${to} via ${JSON.stringify(fromParams)}`);

    const r1 = await twilioClient.messages.create({ ...fromParams, to, body: msg1 });
    logger.info(`SMS msg1 sent — SID: ${r1.sid}, status: ${r1.status}`);

    // Small delay so messages arrive in order
    await new Promise(resolve => setTimeout(resolve, 800));

    const r2 = await twilioClient.messages.create({ ...fromParams, to, body: msg2 });
    logger.info(`SMS msg2 (link) sent — SID: ${r2.sid}, status: ${r2.status}`);

    return { sid: r2.sid, status: r2.status };
  } catch (error) {
    logger.error(`PD link SMS failed to ${to}: ${error.message} (code: ${error.code || 'n/a'})`);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

// ── Send OTP via Twilio Verify ────────────────────────────────────────────────
// Twilio Verify is a separate product (TWILIO_VERIFY_SID starts with VA...).
// It is exempt from A2P 10DLC registration and works on Twilio trial accounts.
// It handles rate limiting, expiry (10 min), and attempt counting automatically.
async function sendOtpVerify(mobile) {
  const to = mobile.startsWith('+') ? mobile : `+91${mobile}`;
  const verifySid = process.env.TWILIO_VERIFY_SID;
  const twilioClient = getTwilioClient();

  if (!twilioClient || !verifySid) {
    logger.warn(`[SIMULATION] Twilio Verify OTP to ${to} — client=${!!twilioClient} verifySid=${!!verifySid}`);
    return { status: 'simulated' };
  }

  const verification = await twilioClient.verify.v2
    .services(verifySid)
    .verifications.create({ to, channel: 'sms' });

  logger.info(`Twilio Verify OTP sent to ${to} — status: ${verification.status}`);
  return { status: verification.status };
}

// ── Verify OTP via Twilio Verify ──────────────────────────────────────────────
async function checkOtpVerify(mobile, code) {
  const to = mobile.startsWith('+') ? mobile : `+91${mobile}`;
  const verifySid = process.env.TWILIO_VERIFY_SID;
  const twilioClient = getTwilioClient();

  if (!twilioClient || !verifySid) {
    // Simulation mode — any 6-digit code passes
    logger.warn(`[SIMULATION] OTP check for ${to} — accepting any 6-digit code`);
    return { approved: code?.length === 6, status: 'approved' };
  }

  const check = await twilioClient.verify.v2
    .services(verifySid)
    .verificationChecks.create({ to, code });

  logger.info(`Twilio Verify check for ${to} — status: ${check.status}`);
  return { approved: check.status === 'approved', status: check.status };
}

module.exports = { sendSelfPdLink, sendOtpVerify, checkOtpVerify };
