const Message = require('../models/Message');
const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');
const Business = require('../models/Business');
const { receiveSimulatedWhatsAppMessage } = require('../services/whatsappSimService');
const { sendWhatsAppMessage } = require('../services/twilioService');

// @desc    Get messages for a lead conversation (and mark conversation read)
// @route   GET /api/messages/:leadId?businessId=... OR ?workspaceId=...
// @access  Private
exports.getLeadMessages = async (req, res) => {
  try {
    const { leadId } = req.params;
    // Accept both businessId and workspaceId
    const businessId = req.query.businessId || req.query.workspaceId;

    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID is required' });
    }

    // Find or create Conversation container
    let conversation = await Conversation.findOne({ business: businessId, lead: leadId });
    if (!conversation) {
      conversation = await Conversation.create({
        business: businessId,
        lead: leadId,
        unreadCount: 0,
      });
    } else if (conversation.unreadCount > 0) {
      conversation.unreadCount = 0;
      await conversation.save();
      
      const io = req.app.get('socketio');
      if (io) {
        io.to(businessId.toString()).emit('conversation_updated', conversation);
      }
    }

    const messages = await Message.find({ lead: leadId, business: businessId }).sort({ timestamp: 1 });
    
    // Mark messages as read since agent is viewing them
    await Message.updateMany(
      { lead: leadId, business: businessId, sender: 'lead', read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, messages, conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Send a manual reply from agent
// @route   POST /api/messages
// @access  Private
exports.sendAgentReply = async (req, res) => {
  try {
    const { leadId, content, channel } = req.body;
    // Accept both businessId and workspaceId
    const businessId = req.body.businessId || req.body.workspaceId;

    if (!leadId || !content || !businessId) {
      return res.status(400).json({ success: false, error: 'LeadId, content and businessId are required' });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Find or create Conversation container
    let conversation = await Conversation.findOne({ business: businessId, lead: leadId });
    if (!conversation) {
      conversation = await Conversation.create({
        business: businessId,
        lead: leadId,
        channel: channel || 'webchat',
        lastMessage: content,
        unreadCount: 0,
        lastMessageAt: Date.now(),
      });
    } else {
      conversation.lastMessage = content;
      conversation.unreadCount = 0;
      conversation.lastMessageAt = Date.now();
      await conversation.save();
    }

    const message = await Message.create({
      sender: 'agent',
      content,
      channel: channel || 'webchat',
      lead: leadId,
      conversation: conversation._id,
      business: businessId,
      read: true,
    });

    // Update lead last interaction
    lead.lastInteraction = Date.now();
    await lead.save();

    // Send outward Twilio WhatsApp message if the channel is whatsapp
    const activeChannel = channel || conversation.channel || 'webchat';
    if (activeChannel === 'whatsapp') {
      const business = await Business.findById(businessId);
      const whatsappFrom = business?.settings?.whatsappNumber || '+14155238886';
      console.log(`[Agent Composer] Dispatching manual agent reply to WhatsApp number: ${lead.phone} from ${whatsappFrom}`);
      const twilioRes = await sendWhatsAppMessage(lead.phone, whatsappFrom, content);
      if (!twilioRes.success) {
        console.warn(`[Agent Composer Warning] Failed to deliver WhatsApp message via Twilio: ${twilioRes.error}`);
      }
    }

    // Broadcast message and conversation updates via Socket
    const io = req.app.get('socketio');
    if (io) {
      io.to(businessId.toString()).emit('message_received', message);
      io.to(businessId.toString()).emit('conversation_updated', conversation);
      io.to(businessId.toString()).emit('lead_updated', lead);
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Simulate incoming message from a customer
// @route   POST /api/messages/simulate-whatsapp
// @access  Private
exports.simulateWhatsAppIncoming = async (req, res) => {
  try {
    const { phone, customerName, content, channel } = req.body;
    // Accept both businessId and workspaceId
    const businessId = req.body.businessId || req.body.workspaceId;

    if (!businessId || !phone || !content) {
      return res.status(400).json({ success: false, error: 'businessId, phone and content are required' });
    }

    const result = await receiveSimulatedWhatsAppMessage(
      businessId,
      phone,
      customerName,
      content,
      channel || 'whatsapp'
    );

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Reset AI Sandbox Playground (Delete simulated lead '+10005550000' and its messages)
// @route   POST /api/messages/reset-sandbox
// @access  Private
exports.resetSandbox = async (req, res) => {
  try {
    const businessId = req.body.businessId || req.body.workspaceId;
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID is required' });
    }

    const sandboxPhone = '+10005550000';
    const lead = await Lead.findOne({ phone: sandboxPhone, business: businessId });
    
    if (lead) {
      // Cascade delete sandbox messages and conversations
      await Message.deleteMany({ lead: lead._id, business: businessId });
      await Conversation.deleteMany({ lead: lead._id, business: businessId });
      await lead.deleteOne();
      console.log(`[AI Sandbox Reset] Sandbox Tester lead and messages deleted successfully for workspace ${businessId}.`);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
