const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  yearName: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  termCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  collection: 'AcademicYears',
});

const AcademicYear = mongoose.model('AcademicYears', academicYearSchema);

module.exports = AcademicYear;
