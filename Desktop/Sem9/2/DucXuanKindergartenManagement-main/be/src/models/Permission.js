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
  }
}, {
  timestamps: true,
  collection: 'Permission' // Tên collection trong MongoDB
});

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
