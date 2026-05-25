const Lead = require('../models/Lead');
const Message = require('../models/Message');
const Business = require('../models/Business');
const Conversation = require('../models/Conversation');
const { receiveSimulatedWhatsAppMessage } = require('../services/whatsappSimService');
const { sendWhatsAppMessage } = require('../services/twilioService');
const { generateAIResponse } = require('../services/geminiService');

// @desc    Receive incoming WhatsApp messages from Twilio Webhook (URL-encoded)
// @route   POST /api/twilio/webhook
// @access  Public (webhook endpoint)
exports.receiveTwilioWebhook = async (req, res) => {
  try {
    console.log('[Twilio Webhook Raw Body]', req.body);
    const { From, To, Body, ProfileName, NumMedia, MediaUrl0 } = req.body;

    if (!From || !Body) {
      console.warn('Twilio webhook received without From or Body fields.');
      return res.type('text/xml').send('<Response></Response>');
    }

    // 1. Clean Twilio formats (e.g. "whatsapp:+14155552671" -> "+14155552671")
    const cleanFrom = From.replace('whatsapp:', '').trim();
    const cleanTo = To ? To.replace('whatsapp:', '').trim() : '';
    const customerName = ProfileName || 'WhatsApp Customer';

    // 2. Identify the active Business tenant context by matching Twilio number
    let business = null;
    if (cleanTo) {
      business = await Business.findOne({ 'settings.whatsappNumber': cleanTo });
    }
    
    // Fallback: If no business number matches, try to find the primary active workspace or first business
    if (!business) {
      business = await Business.findOne({ name: 'EDTECH' });
    }
    if (!business) {
      business = await Business.findOne({ name: 'Apex Business Automation' });
    }
    if (!business) {
      business = await Business.findOne();
    }

    if (!business) {
      console.warn('No active business tenant registered to route webhook message.');
      return res.type('text/xml').send('<Response></Response>');
    }

    // 3. Media attachments handler
    let finalContent = Body;
    if (Number(NumMedia) > 0 && MediaUrl0) {
      finalContent = `${Body}\n\n[Attachment: ${MediaUrl0}]`;
      console.log(`Twilio webhook media attachment captured: ${MediaUrl0}`);
    }

    // 4. Invoke simulator service to auto-register lead, conversation, and run RAG/Gemini
    const result = await receiveSimulatedWhatsAppMessage(
      business._id,
      cleanFrom,
      customerName,
      finalContent,
      'whatsapp'
    );

    // 5. Determine reply – demo confirmation or AI response
    let replyBody = null;
    const lowerContent = finalContent.toLowerCase();
    
    // Demo/book request detection
    if (lowerContent.includes('demo') || lowerContent.includes('book') || lowerContent.includes('schedule') || lowerContent.includes('consultation')) {
      replyBody = '✅ Your demo request has been received! Our team will contact you shortly to confirm the details.';
      console.log(`[Twilio Webhook] Detected demo request, sending booking confirmation to ${cleanFrom}.`);
    } else {
      // Use AI-generated reply or fallback acknowledgment
      if (result && result.aiMessage && result.aiMessage.content) {
        replyBody = result.aiMessage.content;
        console.log(`[Twilio Webhook] Sending AI reply via TwiML to ${cleanFrom}: "${replyBody.substring(0, 60)}..."`);
      } else {
        replyBody = 'Thank you for your message. We will get back to you shortly.';
        console.log(`[Twilio Webhook] No AI reply generated; sending fallback acknowledgment to ${cleanFrom}.`);
      }
    }

    // 6. Dispatch reply via Twilio REST API explicitly to guarantee delivery and avoid TwiML timeouts
    if (replyBody) {
      console.log(`[Twilio Webhook] Dispatching response via REST API to ${cleanFrom} from ${cleanTo || '+14155238886'}...`);
      const dispatchResult = await sendWhatsAppMessage(cleanFrom, cleanTo || '+14155238886', replyBody);
      if (dispatchResult.success) {
        console.log(`[Twilio Webhook] REST API dispatch succeeded. SID: ${dispatchResult.sid}`);
      } else {
        console.error(`[Twilio Webhook] REST API dispatch failed:`, dispatchResult.error);
      }
    }
    
    // Always return empty TwiML response immediately to close webhook and prevent Twilio timeouts
    return res.type('text/xml').send('<Response></Response>');    

  } catch (error) {
    console.error('Error handling Twilio webhook:', error.message);
    res.status(500).type('text/xml').send('<Response><Message>Internal webhook failure</Message></Response>');
  }
};

// @desc    Receive incoming Voice calls from Twilio (initial answer)
// @route   POST /api/twilio/voice
// @access  Public
exports.receiveTwilioVoice = async (req, res) => {
  try {
    const { From, To, CallSid } = req.body;
    console.log(`Incoming Twilio Voice Call received. Sid: ${CallSid}, From: ${From}`);

    const cleanFrom = From ? From.replace('whatsapp:', '').trim() : '';
    const cleanTo = To ? To.replace('whatsapp:', '').trim() : '';

    // 1. Identify active Business tenant context by matching Twilio number
    let business = null;
    if (cleanTo) {
      business = await Business.findOne({ 'settings.whatsappNumber': cleanTo });
    }
    if (!business) {
      business = await Business.findOne();
    }

    // Determine greeting
    const companyName = business ? business.name : 'our automation office';
    
    // Return TwiML to answer and gather speech
    res.type('text/xml').send(`
      <Response>
        <Say voice="Polly.Joey-Neural" language="en-US">
          Hello! Thank you for calling ${companyName}. How can I help you today?
        </Say>
        <Gather input="speech" action="/api/twilio/voice/process" method="POST" timeout="3" speechModel="phone_call" />
        <Say voice="Polly.Joey-Neural" language="en-US">
          We did not hear a response. Goodbye.
        </Say>
      </Response>
    `);
  } catch (error) {
    console.error('Error handling initial Twilio voice call:', error.message);
    res.type('text/xml').send('<Response><Say>Sorry, we encountered a system error answering your call.</Say></Response>');
  }
};

// @desc    Process voice speech result from Twilio Gather loop
// @route   POST /api/twilio/voice/process
// @access  Public
exports.processVoiceSpeech = async (req, res) => {
  try {
    const { From, To, SpeechResult, CallSid } = req.body;

    if (!SpeechResult) {
      console.warn('Twilio voice processing hook called without SpeechResult.');
      return res.type('text/xml').send(`
        <Response>
          <Say voice="Polly.Joey-Neural" language="en-US">We didn't catch that. Could you please repeat?</Say>
          <Gather input="speech" action="/api/twilio/voice/process" method="POST" timeout="3" speechModel="phone_call" />
        </Response>
      `);
    }

    console.log(`Voice call speech transcribed: "${SpeechResult}" from ${From}`);

    const cleanFrom = From ? From.replace('whatsapp:', '').trim() : '';
    const cleanTo = To ? To.replace('whatsapp:', '').trim() : '';

    // 1. Identify active Business tenant
    let business = null;
    if (cleanTo) {
      business = await Business.findOne({ 'settings.whatsappNumber': cleanTo });
    }
    if (!business) {
      business = await Business.findOne();
    }

    if (!business) {
      return res.type('text/xml').send('<Response><Say>No active business registered.</Say></Response>');
    }

    // 2. Invoke WhatsApp Simulator Service to auto-register lead, conversation, run vector RAG and Gemini AI
    const result = await receiveSimulatedWhatsAppMessage(
      business._id,
      cleanFrom,
      'Voice Caller',
      SpeechResult,
      'voice'
    );

    // 3. Retrieve the generated AI reply
    let responseText = "Thank you. Is there anything else I can help you with today?";
    if (result && business.settings?.aiEnabled) {
      const lastAIMessage = await Message.findOne({
        lead: result.lead._id,
        sender: 'ai'
      }).sort({ timestamp: -1 });

      if (lastAIMessage) {
        responseText = lastAIMessage.content;
      }
    }

    // Strip markdown formatting if present (voice synthesizers don't like asterisks/markdown tags)
    const cleanResponseText = responseText
      .replace(/\*+/g, '') // remove asterisks
      .replace(/\[AI Auto-Response.*?\]\n/g, '') // remove simulation header tags
      .trim();

    // 4. Return TwiML with Gemini response and loop back to Gather for next input
    res.type('text/xml').send(`
      <Response>
        <Say voice="Polly.Joey-Neural" language="en-US">${cleanResponseText}</Say>
        <Gather input="speech" action="/api/twilio/voice/process" method="POST" timeout="3" speechModel="phone_call" />
        <Say voice="Polly.Joey-Neural" language="en-US">Thank you for calling. Goodbye.</Say>
      </Response>
    `);

  } catch (error) {
    console.error('Error processing Twilio voice speech:', error.message);
    res.type('text/xml').send('<Response><Say>System processing error. Goodbye.</Say></Response>');
  }
};

// @desc    Handle voice call completed status and summarize conversation
// @route   POST /api/twilio/voice/status
// @access  Public
exports.handleVoiceStatus = async (req, res) => {
  try {
    const { From, To, CallStatus, CallSid } = req.body;
    console.log(`Voice Call Status Update. Sid: ${CallSid}, Status: ${CallStatus}`);

    // We only summarize on call completion
    if (CallStatus !== 'completed') {
      return res.status(200).json({ success: true });
    }

    const cleanFrom = From ? From.replace('whatsapp:', '').trim() : '';
    const cleanTo = To ? To.replace('whatsapp:', '').trim() : '';

    // 1. Identify active Business tenant
    let business = null;
    if (cleanTo) {
      business = await Business.findOne({ 'settings.whatsappNumber': cleanTo });
    }
    if (!business) {
      business = await Business.findOne();
    }

    if (!business) {
      return res.status(200).json({ success: true });
    }

    // 2. Locate Lead
    const lead = await Lead.findOne({ phone: cleanFrom, business: business._id });
    if (!lead) {
      console.warn(`Voice call completed but no lead found for phone ${cleanFrom}`);
      return res.status(200).json({ success: true });
    }

    // 3. Fetch recent messages for the lead under 'voice' channel within last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const messages = await Message.find({
      lead: lead._id,
      channel: 'voice',
      timestamp: { $gte: oneHourAgo }
    }).sort({ timestamp: 1 });

    if (messages.length === 0) {
      console.log('No recent call messages recorded to summarize.');
      return res.status(200).json({ success: true });
    }

    // 4. Compile transcripts
    const transcriptText = messages
      .map(m => `${m.sender === 'lead' ? 'Customer' : 'AI Voice Assistant'}: ${m.content}`)
      .join('\n');

    console.log('Generating AI Voice Call summary for transcript...');

    // 5. Query Gemini to generate a professional call summary
    const summaryPrompt = `Generate a highly concise 2-sentence summary of the following customer phone call transcript. Be objective, highlight the customer's main inquiry or issue, and list any follow-up actions:\n\n${transcriptText}`;
    
    const summary = await generateAIResponse(
      summaryPrompt,
      [],
      "You are a professional CRM call summarization assistant. Summarize calls strictly in exactly two sentences, focusing on the customer request and next steps. Do not include markdown formatting or brackets.",
      business.settings?.geminiApiKey || ''
    );

    // 6. Push summary to chronological notes feed
    const callSummaryNote = {
      content: `[AI Voice Call Summary] ${summary.replace(/\[AI Auto-Response.*?\]\n/g, '').replace(/\[AI Auto-Response.*?\]/g, '')}`,
      author: 'AI Voice Assistant',
      createdAt: new Date()
    };

    lead.notesFeed = lead.notesFeed || [];
    lead.notesFeed.push(callSummaryNote);
    lead.lastInteraction = Date.now();
    await lead.save();

    console.log(`AI Voice Call Summary generated and saved in lead notes.`);

    // 7. Emit Socket.IO event to update frontend dashboard/leads pipeline
    const io = req.app.get('socketio');
    if (io) {
      io.to(business._id.toString()).emit('lead_updated', lead);
      console.log('Socket broadcast lead_updated emitted for Voice Call summary.');
    }

    res.status(200).json({ success: true, summary });

  } catch (error) {
    console.error('Error handling Twilio voice status callback:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
