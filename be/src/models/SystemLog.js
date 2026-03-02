const mongoose = require('mongoose');

const SystemLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorName: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    detail: {
      type: String,
      default: '',
      trim: true,
    },
    ip: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
    method: {
      type: String,
      default: '',
      trim: true,
    },
    path: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemLog', SystemLogSchema);
