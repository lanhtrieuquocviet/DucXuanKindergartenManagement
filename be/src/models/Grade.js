const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  gradeName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  classList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classes'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'Grades'
});

const Grade = mongoose.model('Grades', gradeSchema);

module.exports = Grade;
