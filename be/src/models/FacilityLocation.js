const mongoose = require('mongoose');

const facilityLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['classroom', 'office', 'warehouse', 'outdoor', 'functional_room', 'kitchen', 'other'],
    default: 'classroom'
  },
  area: {
    type: String,
    required: true, // VD: Khu A, Khu B, Sân chơi
    trim: true
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Người phụ trách vị trí này
  },
  description: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FacilityLocation', facilityLocationSchema);
