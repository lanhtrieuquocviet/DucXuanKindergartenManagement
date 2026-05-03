const mongoose = require('mongoose');

const studentRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Students',
    required: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['transfer', 'withdrawal'],
    required: true,
  },
  reason: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  effectiveDate: {
    type: Date,
  },
  adminNote: {
    type: String,
    trim: true,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  processedAt: {
    type: Date,
  },
}, {
  timestamps: true,
  collection: 'StudentRequests',
});

const StudentRequest = mongoose.model('StudentRequests', studentRequestSchema);
module.exports = StudentRequest;
