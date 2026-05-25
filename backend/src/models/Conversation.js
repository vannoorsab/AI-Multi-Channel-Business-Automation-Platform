const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'instagram', 'webchat'],
      default: 'webchat',
    },
    lastMessage: {
      type: String,
      default: '',
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'snoozed'],
      default: 'active',
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index so there is exactly one conversation per lead-business
ConversationSchema.index({ business: 1, lead: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
