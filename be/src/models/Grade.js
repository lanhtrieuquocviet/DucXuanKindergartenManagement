const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  gradeName: {
    type: String,
    required: true,
    trim: true,
    unique: false
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  staticBlockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaticBlock',
    required: [true, 'Danh mục khối là bắt buộc'],
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYears',
    required: [true, 'Năm học là bắt buộc'],
  },
  classList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classes'
  }],
  maxClasses: {
    type: Number,
    default: 10,
    min: 1,
    max: 10
  },
  minAge: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxAge: {
    type: Number,
    default: 0,
    min: 0,
  },
  headTeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'Grades'
});

gradeSchema.index({ gradeName: 1, academicYearId: 1 }, { unique: true });

const Grade = mongoose.model('Grades', gradeSchema);

module.exports = Grade;
