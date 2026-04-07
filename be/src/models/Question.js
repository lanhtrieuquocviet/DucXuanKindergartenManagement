const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  authorName: {
    type: String,
    trim: true,
    default: 'Ẩn danh',
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: true,
  },
  phone: {
    type: String,
    trim: true,
    required: true,
  },
  address: {
    type: String,
    trim: true,
    required: true,
  },
  idNumber: {
    type: String,
    trim: true,
    required: false,
  },
  category: {
    type: String,
    trim: true,
    default: 'question',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    required: true,
  },
  answers: {
    type: [answerSchema],
    default: [],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Question', questionSchema);

