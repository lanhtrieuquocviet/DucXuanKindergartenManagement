const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classes'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  collection: 'Students'
});

const Student = mongoose.model('Students', studentSchema);

module.exports = Student;
