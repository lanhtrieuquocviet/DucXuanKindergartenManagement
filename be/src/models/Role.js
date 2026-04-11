const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  roleName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  // Đổi tên đúng chính tả: permissions
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
  }],
  // Role cha để kế thừa quyền (vd: HeadTeacher → parent: Teacher)
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roles',
    default: null,
  },
}, {
  timestamps: true,
  collection: 'Roles', // Tên collection trong MongoDB
});

const Role = mongoose.model('Roles', roleSchema);

module.exports = Role;
