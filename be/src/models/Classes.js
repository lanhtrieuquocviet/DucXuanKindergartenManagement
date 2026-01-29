const mongoose = require('mongoose');

const classesSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  capacity: {
    type: Number,
    default: 0
  },
  gradeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grades'
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYears'
  },
  teacherIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxStudents: {
    type: Number,
    default: 0
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
  collection: 'Classes'
});

const Classes = mongoose.model('Classes', classesSchema);

module.exports = Classes;
