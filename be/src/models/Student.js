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
  // stored parent contact number; some existing docs may use parentPhone field
  parentPhone: {
    type: String,
    trim: true,
    default: ''
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
  // parentId: tham chiếu đến tài khoản User của phụ huynh
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  avatar: {
    type: String,
    trim: true,
    default: ''
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
