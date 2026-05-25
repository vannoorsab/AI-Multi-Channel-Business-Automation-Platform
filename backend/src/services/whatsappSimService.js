const Lead = require('../models/Lead');
const Message = require('../models/Message');
const Business = require('../models/Business');
const Workflow = require('../models/Workflow');
const Conversation = require('../models/Conversation');
const { generateAIResponse } = require('./geminiService');
const ragService = require('./ragService');

let socketIOInstance = null;

/**
 * Initializes the WhatsApp Simulation service with Socket.IO
 * @param {object} io - The Socket.IO server instance
 */
exports.initWhatsAppSimService = (io) => {
  socketIOInstance = io;
  console.log('WhatsApp Simulator Service initialized with Socket.IO context.');
};

/**
 * Simulates receiving an incoming message from a customer on a specific channel
 * @param {string} businessId - Mongoose ID of the active business
 * @param {string} phone - Customer phone/ID number
 * @param {string} customerName - Customer name
 * @param {string} content - Message text
 * @param {string} channel - Channel signature ('whatsapp' | 'instagram' | 'webchat')
 */
exports.receiveSimulatedWhatsAppMessage = async (businessId, phone, customerName, content, channel = 'whatsapp', skipAIReply = false) => {
  try {
    const activeChannel = ['whatsapp', 'instagram', 'webchat', 'voice'].includes(channel) ? channel : 'whatsapp';

    // 1. Find or create lead for the phone number within this business tenant
    let isNewLead = false;
    let lead = await Lead.findOne({ phone, business: businessId });

    if (!lead) {
      lead = await Lead.create({
        name: customerName || 'New Client',
        phone,
        business: businessId,
        status: 'new',
        leadScore: 50,
      });
      isNewLead = true;
    } else {
      lead.lastInteraction = Date.now();
      await lead.save();
    }

    // 2. Find or create Conversation container
    let conversation = await Conversation.findOne({ business: businessId, lead: lead._id });
    if (!conversation) {
      conversation = await Conversation.create({
        business: businessId,
        lead: lead._id,
        channel: activeChannel,
        lastMessage: content,
        unreadCount: 1,
        lastMessageAt: Date.now(),
      });
    } else {
      conversation.lastMessage = content;
      conversation.unreadCount += 1;
      conversation.channel = activeChannel; // Update active channel if changed
      conversation.lastMessageAt = Date.now();
      await conversation.save();
    }

    // 3. Save customer's incoming message
    const incomingMessage = await Message.create({
      sender: 'lead',
      content,
      channel: activeChannel,
      lead: lead._id,
      conversation: conversation._id,
      business: businessId,
      read: false,
    });

    // Notify connected agents via Sockets
    if (socketIOInstance) {
      socketIOInstance.to(businessId.toString()).emit('message_received', incomingMessage);
      socketIOInstance.to(businessId.toString()).emit('conversation_updated', conversation);
      if (isNewLead) {
        socketIOInstance.to(businessId.toString()).emit('lead_created', lead);
      }
    }

    // 3.5. Auto-assign lead to agent and advance CRM pipeline stage when customer requests a demo booking
    const lowerContent = content.toLowerCase();
    let leadUpdated = false;

    if (lowerContent.includes('demo') || lowerContent.includes('book') || lowerContent.includes('schedule') || lowerContent.includes('consultation')) {
      console.log(`[Auto-Assignment] Customer '${lead.name}' requested a demo booking. Assigning lead to agent: Michael Scott & updating status to: qualified`);
      lead.assignedAgent = 'Michael Scott';
      lead.status = 'qualified';
      leadUpdated = true;
    }

    // 3.6. Active Capture: Extract email and schedule demo appointment from incoming message
    // A. Parse email address using regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
    const emailMatch = content.match(emailRegex);
    if (emailMatch) {
      const extractedEmail = emailMatch[0].toLowerCase();
      console.log(`[Auto-Capture] Extracted email: ${extractedEmail} for lead: ${lead.name}`);
      lead.email = extractedEmail;
      
      // Record a log in the timeline notes
      const isDuplicateNote = lead.notesFeed.some(n => n.content.includes(extractedEmail));
      if (!isDuplicateNote) {
        lead.notesFeed.push({
          content: `[System Auto-Capture] Captured customer email: ${extractedEmail}`,
          author: 'System Capture',
          createdAt: new Date()
        });
      }
      leadUpdated = true;
    }

    // B. Check for date/time hints and schedule in reminders
    const timeKeywords = ['am', 'pm', 'clock', 'time', 'date', 'tomorrow', 'today', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'next', 'at', ':', '/', '-'];
    const hasDateTimeHint = timeKeywords.some(kw => lowerContent.includes(kw)) || /\d+/.test(content);
    
    if (hasDateTimeHint && (lowerContent.includes('demo') || lowerContent.includes('book') || lowerContent.includes('schedule') || emailMatch || lead.status === 'qualified')) {
      let parsedDate = null;
      
      // Robust basic human date parsing
      if (lowerContent.includes('tomorrow')) {
        parsedDate = new Date();
        parsedDate.setDate(parsedDate.getDate() + 1);
        parsedDate.setHours(10, 0, 0, 0); // default 10 AM tomorrow
      } else if (lowerContent.includes('today')) {
        parsedDate = new Date();
        parsedDate.setHours(parsedDate.getHours() + 2); // 2 hours from now
      } else {
        // Standard ISO or standard local formats
        const standardDateMatch = content.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) || content.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
        if (standardDateMatch) {
          try {
            parsedDate = new Date(standardDateMatch[0]);
          } catch(e) {}
        }
      }
      
      // Fallback machine date to tomorrow 10 AM if not parsed natively
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
        parsedDate.setDate(parsedDate.getDate() + 1);
        parsedDate.setHours(10, 0, 0, 0);
      }
      
      // Parse hours and minutes if specified in user message
      const pmMatch = lowerContent.match(/(\d{1,2})\s*pm/);
      const amMatch = lowerContent.match(/(\d{1,2})\s*am/);
      const colonMatch = lowerContent.match(/(\d{1,2}):(\d{2})/);
      
      if (pmMatch) {
        let hr = parseInt(pmMatch[1]);
        if (hr < 12) hr += 12;
        parsedDate.setHours(hr, 0, 0, 0);
      } else if (amMatch) {
        let hr = parseInt(amMatch[1]);
        if (hr === 12) hr = 0;
        parsedDate.setHours(hr, 0, 0, 0);
      } else if (colonMatch) {
        let hr = parseInt(colonMatch[1]);
        let min = parseInt(colonMatch[2]);
        if (lowerContent.includes('pm') && hr < 12) hr += 12;
        parsedDate.setHours(hr, min, 0, 0);
      }

      const cleanDesc = `Demo Appointment Scheduled: [Customer Details: "${content.substring(0, 100)}"]`;
      const isDuplicateReminder = lead.reminders.some(r => r.description.includes(content.substring(0, 30)));
      
      if (!isDuplicateReminder && content.length > 5) {
        console.log(`[Auto-Capture] Scheduling CRM appointment reminder on ${parsedDate} for lead: ${lead.name}`);
        lead.reminders.push({
          date: parsedDate,
          description: cleanDesc,
          completed: false
        });
        
        lead.notesFeed.push({
          content: `[System Auto-Capture] Scheduled demo appointment for: ${parsedDate.toLocaleString()} (Details: "${content}")`,
          author: 'System Capture',
          createdAt: new Date()
        });
        
        // Ensure status progresses to qualified and assigned to Michael Scott
        lead.status = 'qualified';
        lead.assignedAgent = 'Michael Scott';
        leadUpdated = true;
      }
    }

    if (leadUpdated) {
      lead.lastInteraction = Date.now();
      await lead.save();
      
      if (socketIOInstance) {
        socketIOInstance.to(businessId.toString()).emit('lead_updated', lead);
      }
    }

    // 4. Process automation workflows (this triggers Gemini AI and saves the reply)
    const aiMessage = await processWorkflows(businessId, lead, conversation, incomingMessage, isNewLead);

    return { success: true, message: incomingMessage, aiMessage, lead, conversation };
  } catch (error) {
    console.error('Error simulating incoming message:', error);
    throw error;
  }
};

/**
 * Executes triggered automation workflows for the business
 */
async function processWorkflows(businessId, lead, conversation, incomingMessage, isNewLead) {
  try {
    const business = await Business.findById(businessId);
    if (!business) return null;

    const triggers = ['message_received'];
    if (isNewLead) triggers.push('lead_created');

    const workflows = await Workflow.find({
      business: businessId,
      trigger: { $in: triggers },
      active: true,
    });

    let aiMessageResult = null;

    for (const workflow of workflows) {
      console.log(`Executing automation: "${workflow.name}"`);
      for (const action of workflow.actions) {
        switch (action.type) {
          case 'update_status': {
            const newStatus = action.params?.status || 'contacted';
            lead.status = newStatus;
            await lead.save();
            
            if (socketIOInstance) {
              socketIOInstance.to(businessId.toString()).emit('lead_updated', lead);
            }
            break;
          }
          
          case 'assign_score': {
            const scoreAdjustment = Number(action.params?.score) || 10;
            lead.leadScore = Math.min(100, Math.max(0, lead.leadScore + scoreAdjustment));
            await lead.save();
            
            if (socketIOInstance) {
              socketIOInstance.to(businessId.toString()).emit('lead_updated', lead);
            }
            break;
          }

          case 'send_message': {
            const templateText = action.params?.content || 'Hello! Thank you for contacting us.';
            
            // Update conversation details
            conversation.lastMessage = templateText;
            conversation.lastMessageAt = Date.now();
            await conversation.save();

            const autoMsg = await Message.create({
              sender: 'system',
              content: templateText,
              channel: conversation.channel,
              lead: lead._id,
              conversation: conversation._id,
              business: businessId,
              read: true,
            });
            
            if (socketIOInstance) {
              socketIOInstance.to(businessId.toString()).emit('message_received', autoMsg);
              socketIOInstance.to(businessId.toString()).emit('conversation_updated', conversation);
            }
            break;
          }

          case 'send_ai_reply': {
            const isAiEnabled = business.settings?.aiEnabled !== false; // default ON
            if (isAiEnabled) {
              aiMessageResult = await triggerAIChatbot(business, lead, conversation, incomingMessage.content);
            }
            break;
          }
        }
      }
    }

    // Default Fallback auto-reply — runs if no explicit workflow action handled AI reply
    const hasAIReplyWorkflow = workflows.some(w => w.actions.some(a => a.type === 'send_ai_reply'));
    const isAiEnabled = business.settings?.aiEnabled !== false; // default ON
    if (!hasAIReplyWorkflow && isAiEnabled) {
      console.log(`[AI Chatbot] Triggering Gemini auto-reply for business: ${business.name}`);
      aiMessageResult = await triggerAIChatbot(business, lead, conversation, incomingMessage.content);
    }
    return aiMessageResult;
  } catch (error) {
    console.error('Error running workflows:', error);
    return null;
  }
}

/**
 * Generates and saves a Gemini AI automatic response
 * Returns the saved AI message document
 */
async function triggerAIChatbot(business, lead, conversation, userMessage) {
  try {
    const recentMessages = await Message.find({ lead: lead._id })
      .sort({ timestamp: -1 })
      .limit(10);
    
    recentMessages.reverse();

    const systemPrompt = business.settings?.aiSystemPrompt || 'You are a professional assistant.';
    const customApiKey = business.settings?.geminiApiKey || '';

    // Retrieve relevant context chunks semantically using Gemini Embeddings
    const retrievedChunks = await ragService.retrieveContext(
      userMessage,
      business._id,
      customApiKey
    );

    // Formulate augmented prompt injecting matching fact sheets
    const augmentedPrompt = ragService.injectContextIntoSystemPrompt(
      systemPrompt,
      retrievedChunks
    );

    // generateAIResponse now always returns a string (real or fallback)
    const aiText = await generateAIResponse(
      userMessage,
      recentMessages,
      augmentedPrompt,
      customApiKey
    );

    // Update conversation details
    conversation.lastMessage = aiText;
    conversation.lastMessageAt = Date.now();
    await conversation.save();

    const aiMessage = await Message.create({
      sender: 'ai',
      content: aiText,
      channel: conversation.channel,
      lead: lead._id,
      conversation: conversation._id,
      business: business._id,
      read: true,
    });

    if (socketIOInstance) {
      socketIOInstance.to(business._id.toString()).emit('message_received', aiMessage);
      socketIOInstance.to(business._id.toString()).emit('conversation_updated', conversation);
    }

    console.log(`[AI Chatbot] Reply saved: "${aiText.substring(0, 80)}..."`);
    return aiMessage; // Return the saved message so caller can use its content
  } catch (error) {
    console.error('Error in triggerAIChatbot:', error);
    return null;
  }
}
