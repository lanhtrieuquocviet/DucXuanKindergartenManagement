const mongoose = require('mongoose');

const facilityIssueSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacilityItem',
    required: true
  },
  issueDescription: {
    type: String,
    required: true
  },
  images: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['reported', 'approved', 'repairing', 'fixed', 'liquidated', 'cancelled'],
    default: 'reported'
  },
  resolution: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Kỹ thuật viên / Người phụ trách sửa chữa
  },
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FacilityIssue', facilityIssueSchema);
