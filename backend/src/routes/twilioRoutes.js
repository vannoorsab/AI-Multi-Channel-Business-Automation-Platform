const express = require('express');
const router = express.Router();
const { 
  receiveTwilioWebhook,
  receiveTwilioVoice,
  processVoiceSpeech,
  handleVoiceStatus
} = require('../controllers/twilioController');

// Twilio SMS/WhatsApp Webhook (url-encoded body)
router.post('/webhook', receiveTwilioWebhook);

// Twilio voice call webhook endpoints
router.post('/voice', receiveTwilioVoice);
router.post('/voice/process', processVoiceSpeech);
router.post('/voice/status', handleVoiceStatus);

module.exports = router;
