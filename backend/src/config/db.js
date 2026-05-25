const mongoose = require('mongoose');

const runSelfHealingMigrations = async () => {
  try {
    const Message = require('../models/Message');
    const Conversation = require('../models/Conversation');

    const messages = await Message.find({
      $or: [{ lead: { $exists: false } }, { lead: null }]
    });

    if (messages.length > 0) {
      console.log(`[Migration] Found ${messages.length} messages missing the 'lead' field. Starting self-healing migration...`);
      let migratedCount = 0;
      for (const msg of messages) {
        if (msg.conversation) {
          const conv = await Conversation.findById(msg.conversation);
          if (conv && conv.lead) {
            msg.lead = conv.lead;
            await msg.save();
            migratedCount++;
          }
        }
      }
      console.log(`[Migration] Successfully healed ${migratedCount} messages with correct lead references!`);
    } else {
      console.log("[Migration] All messages have valid 'lead' field references.");
    }

    // Workflow Auto-Provisioning by Name
    const Workflow = require('../models/Workflow');
    const businessId = '6a139d9e1eb12caf5f178699'; // Apex Business Automation
    
    // 1. Lead Stage Engagement Auto-flow
    const w1Exists = await Workflow.findOne({ name: 'Lead Engagement Stage Autoflow', business: businessId });
    if (!w1Exists) {
      console.log("[Migration] Provisioning default workflow: Lead Engagement Stage Autoflow...");
      await Workflow.create({
        name: 'Lead Engagement Stage Autoflow',
        trigger: 'message_received',
        business: businessId,
        active: true,
        actions: [
          {
            type: 'update_status',
            params: { status: 'contacted' }
          },
          {
            type: 'assign_score',
            params: { score: 15 }
          }
        ]
      });
    }

    // 2. Gemini AI response auto-responder
    const w2Exists = await Workflow.findOne({ name: 'Gemini Generative AI Auto-Responder', business: businessId });
    if (!w2Exists) {
      console.log("[Migration] Provisioning default workflow: Gemini Generative AI Auto-Responder...");
      await Workflow.create({
        name: 'Gemini Generative AI Auto-Responder',
        trigger: 'message_received',
        business: businessId,
        active: true,
        actions: [
          {
            type: 'send_ai_reply',
            params: {}
          }
        ]
      });
    }

    // 3. Welcome Engagement Auto-responder
    const w3Exists = await Workflow.findOne({ name: 'Welcome Engagement Auto-responder', business: businessId });
    if (!w3Exists) {
      console.log("[Migration] Provisioning default workflow: Welcome Engagement Auto-responder...");
      await Workflow.create({
        name: 'Welcome Engagement Auto-responder',
        trigger: 'lead_created',
        business: businessId,
        active: true,
        actions: [
          {
            type: 'send_message',
            params: { content: 'Hello! Welcome to our Educational Institute! How can I assist you with your learning goals today?' }
          },
          {
            type: 'assign_score',
            params: { score: 10 }
          }
        ]
      });
    }

    // 4. Qualified High-Value Deal Accelerator
    const w4Exists = await Workflow.findOne({ name: 'Qualified High-Value Deal Accelerator', business: businessId });
    if (!w4Exists) {
      console.log("[Migration] Provisioning default workflow: Qualified High-Value Deal Accelerator...");
      await Workflow.create({
        name: 'Qualified High-Value Deal Accelerator',
        trigger: 'status_changed',
        business: businessId,
        active: true,
        actions: [
          {
            type: 'assign_score',
            params: { score: 25 }
          },
          {
            type: 'send_message',
            params: { content: '[System Notification] Michael Scott has been notified to fast-track your enrollment inquiry!' }
          }
        ]
      });
    }

    // 5. Generative AI Intake Auto-responder
    const w5Exists = await Workflow.findOne({ name: 'Generative AI Intake Auto-responder', business: businessId });
    if (!w5Exists) {
      console.log("[Migration] Provisioning default workflow: Generative AI Intake Auto-responder...");
      await Workflow.create({
        name: 'Generative AI Intake Auto-responder',
        trigger: 'lead_created',
        business: businessId,
        active: true,
        actions: [
          {
            type: 'send_ai_reply',
            params: {}
          }
        ]
      });
    }

    const finalCount = await Workflow.countDocuments({ business: businessId });
    console.log(`[Migration] Active workflows count in database: ${finalCount}`);

  } catch (error) {
    console.error('[Migration Error] Failed to execute self-healing database migrations:', error.message);
  }
};

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;

  if (primaryUri) {
    try {
      console.log('Attempting connection to primary MongoDB (Atlas)...');
      const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB Connected (Primary): ${conn.connection.host}`);
      await runSelfHealingMigrations();
      return;
    } catch (error) {
      console.warn(`Primary MongoDB Connection failed: ${error.message}`);
      console.warn('Attempting fallback databases...');
    }
  }

  // Fallback 1: Docker network mongodb service
  try {
    console.log('Attempting fallback 1 (Docker network "mongodb:27017")...');
    const conn = await mongoose.connect('mongodb://mongodb:27017/ai-business-platform', { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB Connected (Docker Fallback): ${conn.connection.host}`);
    await runSelfHealingMigrations();
    return;
  } catch (err) {
    console.warn(`Docker network fallback failed: ${err.message}`);
  }

  // Fallback 2: Localhost mongo database
  try {
    console.log('Attempting fallback 2 (Localhost "localhost:27017")...');
    const conn = await mongoose.connect('mongodb://localhost:27017/ai-business-platform', { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB Connected (Local Fallback): ${conn.connection.host}`);
    await runSelfHealingMigrations();
  } catch (err) {
    console.error(`Localhost fallback failed: ${err.message}`);
    console.error('No MongoDB servers available. Exiting.');
    process.exit(1);
  }
};

module.exports = connectDB;
