const mongoose = require('mongoose');

const jobPositionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  roleName: {
    type: String,
    default: null, // null nếu không có tài khoản hệ thống
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  isDefault: {
    type: Boolean,
    default: false, // Các chức vụ hệ thống mặc định không cho xóa
  },
}, {
  timestamps: true,
  collection: 'JobPositions',
});

const JobPosition = mongoose.model('JobPosition', jobPositionSchema);

module.exports = JobPosition;
