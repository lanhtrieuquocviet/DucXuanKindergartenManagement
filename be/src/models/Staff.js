const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  // Các trường thông tin cơ bản (dùng khi không có userId)
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  position: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maternity_leave', 'on_leave', 'resigned'],
    default: 'active',
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
}, {
  timestamps: true,
  collection: 'Staff',
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
