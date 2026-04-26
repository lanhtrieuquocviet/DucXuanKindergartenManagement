const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  group: {
    type: String,
    trim: true,
    default: '',
  },
  path: {
    type: String,
    trim: true,
  },
  menuKey: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
  collection: 'Permission' // Tên collection trong MongoDB
});

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
