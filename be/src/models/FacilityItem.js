const mongoose = require('mongoose');

const facilityItemSchema = new mongoose.Schema({
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacilityType',
    required: true
  },
  assetCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  serialNumber: String,
  currentLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacilityLocation',
    required: true // Mặc định khi nhập sẽ ở "Kho tổng"
  },
  status: {
    type: String,
    enum: ['good', 'damaged', 'repairing', 'liquidated', 'lost'],
    default: 'good'
  },
  purchaseDate: Date,
  warrantyExpiry: Date,
  price: Number,
  note: String,
  lastInventoryDate: Date,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FacilityItem', facilityItemSchema);
