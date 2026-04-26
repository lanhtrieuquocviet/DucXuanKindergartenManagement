const mongoose = require('mongoose');

const facilityHandoverSchema = new mongoose.Schema({
  handoverCode: {
    type: String,
    required: true,
    unique: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacilityLocation'
  },
  toLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacilityLocation',
    required: true
  },
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FacilityItem' },
    statusAtHandover: String
  }],
  handoverDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'signed', 'rejected'],
    default: 'pending'
  },
  note: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FacilityHandover', facilityHandoverSchema);
