const mongoose = require('mongoose');

const bpmWorkflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    module: {
      type: String,
      enum: ['attendance', 'food_sample', 'purchase', 'leave', 'general'],
      default: 'general',
      required: true,
    },
    type: {
      type: String,
      enum: ['checkin', 'checkout', 'general'],
      default: 'general',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
    },
    // Lưu trữ mảng Nodes của React Flow
    nodes: {
      type: Array,
      default: [],
    },
    // Lưu trữ mảng Edges của React Flow
    edges: {
      type: Array,
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BPMWorkflow', bpmWorkflowSchema);
