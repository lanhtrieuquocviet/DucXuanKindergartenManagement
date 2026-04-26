const mongoose = require('mongoose');

const facilityTypeSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacilityCategory',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    default: 'Cái' // Cái, Bộ, Chiếc, Mét...
  },
  specifications: String, // Thông số kỹ thuật
  image: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FacilityType', facilityTypeSchema);
