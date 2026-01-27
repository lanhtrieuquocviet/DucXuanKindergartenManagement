const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  roleName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
    // Lưu ý: Giữ nguyên lỗi chính tả "desscription" theo schema của bạn
  },
  Permisstons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
    // Lưu ý: Giữ nguyên lỗi chính tả "Permisstons" theo schema của bạn
  }]
}, {
  timestamps: true,
  collection: 'Roles' // Tên collection trong MongoDB
});

const Role = mongoose.model('Roles', roleSchema);

module.exports = Role;
