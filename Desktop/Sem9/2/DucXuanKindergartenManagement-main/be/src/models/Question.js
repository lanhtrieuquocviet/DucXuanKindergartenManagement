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
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  idNumber: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
    default: 'question',
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  answers: {
    type: [answerSchema],
    default: [],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Question', questionSchema);

