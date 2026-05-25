/**
 * Sends an outward WhatsApp message using Twilio Messages REST API
 * @param {string} to - Customer phone number (e.g. +14155552671)
 * @param {string} from - Business Twilio number (e.g. +14155557777)
 * @param {string} body - Message text content
 * @param {string} mediaUrl - Optional media attachment URL
 */
exports.sendWhatsAppMessage = async (to, from, body, mediaUrl = '') => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Enforce correct phone formatting (whatsapp: prefix required by Twilio)
  const twilioTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const twilioFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;

  if (!accountSid || !authToken) {
    console.log(`[Twilio SMS Simulator Mode] Outward WhatsApp Dispatched:`);
    console.log(`  To: ${twilioTo}`);
    console.log(`  From: ${twilioFrom}`);
    console.log(`  Content: "${body}"`);
    if (mediaUrl) console.log(`  Attachment: ${mediaUrl}`);
    return { success: true, simulated: true };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Formulate URL-encoded body
    const params = new URLSearchParams();
    params.append('To', twilioTo);
    params.append('From', twilioFrom);
    params.append('Body', body);
    if (mediaUrl) {
      params.append('MediaUrl', mediaUrl);
    }

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to dispatch Twilio message');
    }

    console.log(`Twilio WhatsApp message sent successfully: ${data.sid}`);
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error('Twilio REST dispatch failed:', error.message);
    return { success: false, error: error.message };
  }
};
