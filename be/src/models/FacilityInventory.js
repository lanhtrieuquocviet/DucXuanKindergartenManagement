const mongoose = require('mongoose');

const facilityInventorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacilityLocation',
    required: true
  },
  chairmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  secretaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  otherMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  checkDate: {
    type: Date,
    default: Date.now
  },
  details: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FacilityItem' },
    systemStatus: String, // Trạng thái trên hệ thống lúc bắt đầu kiểm kê
    actualStatus: {
      type: String,
      enum: ['good', 'damaged', 'repairing', 'lost'],
      required: true
    },
    note: String
  }],
  status: {
    type: String,
    enum: ['draft', 'inspecting', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  resultSummary: String,
  approvedAt: Date,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FacilityInventory', facilityInventorySchema);
