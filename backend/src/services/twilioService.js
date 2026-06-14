const twilio = require('twilio');
const logger = require('../utils/logger');

let client = null;

function getTwilioClient() {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken || accountSid.startsWith('AC_dummy')) {
      logger.warn('Twilio not configured — SMS will be logged only');
      return null;
    }

    client = twilio(accountSid, authToken);
  }
  return client;
}

async function sendSelfPdLink({ mobile, customerName, pdLink, appId }) {
  const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;

  const messageBody = 
    `Dear ${customerName},\n\n` +
    `Aditya Birla Capital Ltd. requests you to complete your Self Personal Discussion for Loan Application ${appId}.\n\n` +
    `Click the link below to proceed (valid for 24 hours):\n${pdLink}\n\n` +
    `Do not share this link with anyone.\n\n` +
    `For queries, call 1800-270-7000\n- ABCL Team`;

  const twilioClient = getTwilioClient();

  if (!twilioClient) {
    logger.info(`[SMS SIMULATION] To: ${formattedMobile}`);
    logger.info(`[SMS SIMULATION] Body: ${messageBody}`);
    return { sid: `SIM_${Date.now()}`, status: 'simulated' };
  }

  try {
    const message = await twilioClient.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedMobile,
    });

    logger.info(`SMS sent to ${formattedMobile}, SID: ${message.sid}`);
    return { sid: message.sid, status: message.status };
  } catch (error) {
    logger.error(`SMS failed to ${formattedMobile}: ${error.message}`);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

async function sendOtp({ mobile, otp, customerName }) {
  const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;

  const messageBody =
    `Dear ${customerName},\n\n` +
    `Your OTP for ABCL Self-PD verification is: ${otp}\n\n` +
    `This OTP is valid for 10 minutes. Do not share it with anyone.\n\n` +
    `- ABCL Team`;

  const twilioClient = getTwilioClient();

  if (!twilioClient) {
    logger.info(`[OTP SIMULATION] To: ${formattedMobile}, OTP: ${otp}`);
    return { sid: `SIM_OTP_${Date.now()}`, status: 'simulated' };
  }

  try {
    const message = await twilioClient.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedMobile,
    });

    logger.info(`OTP sent to ${formattedMobile}, SID: ${message.sid}`);
    return { sid: message.sid, status: message.status };
  } catch (error) {
    logger.error(`OTP SMS failed: ${error.message}`);
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
}

module.exports = { sendSelfPdLink, sendOtp };
