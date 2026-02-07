const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  /** Nội dung phản hồi từ school admin */
  reply: {
    type: String,
    trim: true,
    default: null,
  },
  repliedAt: {
    type: Date,
    default: null,
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'replied'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Contact', contactSchema);
