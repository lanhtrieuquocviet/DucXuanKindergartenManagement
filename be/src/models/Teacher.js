const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  degree: {
    type: String,
    trim: true,
    default: '',
  },
  experienceYears: {
    type: Number,
    default: 0,
    min: 0,
  },
  hireDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, {
  timestamps: true,
  collection: 'Teachers',
});

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
