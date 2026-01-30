const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  avatar: {
    type: String,
    default: ''
  },
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roles'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // Rate limiting cho forgot password
  passwordResetAttempts: {
    type: Number,
    default: 0
  },
  lastPasswordResetAt: {
    type: Date,
    default: null
  },
  nextPasswordResetAllowedAt: {
    type: Date,
    default: null
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
  timestamps: true, // Tự động cập nhật createdAt và updatedAt
  collection: 'User' // Tên collection trong MongoDB
});

// Middleware để tự động cập nhật updatedAt trước khi save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
