const express = require('express');
const router = express.Router();
const {
  getLeadMessages,
  sendAgentReply,
  simulateWhatsAppIncoming,
  resetSandbox,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect); // Secure all message routes

router.route('/')
  .post(sendAgentReply);

router.route('/simulate-whatsapp')
  .post(simulateWhatsAppIncoming);

router.route('/reset-sandbox')
  .post(resetSandbox);

router.route('/:leadId')
  .get(getLeadMessages);

module.exports = router;
