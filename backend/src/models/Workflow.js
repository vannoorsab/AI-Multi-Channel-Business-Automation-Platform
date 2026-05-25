const mongoose = require('mongoose');

const WorkflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a workflow name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    trigger: {
      type: String,
      enum: ['lead_created', 'message_received', 'status_changed'],
      required: [true, 'Please specify a trigger event'],
      index: true,
    },
    actions: [
      {
        type: {
          type: String,
          enum: ['send_message', 'send_ai_reply', 'update_status', 'assign_score'],
          required: true,
        },
        params: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    ],
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Workflow', WorkflowSchema);
