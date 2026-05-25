const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a lead name'],
      trim: true,
      minlength: [2, 'Lead name must be at least 2 characters'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
      match: [
        /^$|^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Please add a contact phone number'],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
      default: 'new',
      index: true,
    },
    value: {
      type: Number,
      default: 0,
      min: [0, 'Lead value cannot be negative'],
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    leadScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    assignedAgent: {
      type: String,
      default: 'Unassigned',
      index: true,
    },
    reminders: [
      {
        date: { type: Date, required: true },
        description: { type: String, required: true },
        completed: { type: Boolean, default: false },
      }
    ],
    notesFeed: [
      {
        content: { type: String, required: true },
        author: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    lastInteraction: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for querying leads per phone per business uniquely
LeadSchema.index({ phone: 1, business: 1 }, { unique: true });

module.exports = mongoose.model('Lead', LeadSchema);
