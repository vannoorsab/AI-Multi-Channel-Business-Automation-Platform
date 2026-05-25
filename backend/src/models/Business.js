const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a business name'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['admin', 'business owner', 'support agent'],
          default: 'support agent',
        },
      },
    ],
    settings: {
      whatsappNumber: {
        type: String,
        default: '',
      },
      whatsappApiKey: {
        type: String,
        default: '',
      },
      aiEnabled: {
        type: Boolean,
        default: true,
      },
      aiSystemPrompt: {
        type: String,
        default: 'You are a helpful, professional AI customer service agent. Answer questions concisely, professionally, and try to guide customers toward leaving their details or booking a call if needed.',
      },
      aiGreetingMessage: {
        type: String,
        default: 'Hello! Welcome to our automated customer service. How can we help you today?',
      },
      geminiApiKey: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug before validation if not present
BusinessSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Business', BusinessSchema);
