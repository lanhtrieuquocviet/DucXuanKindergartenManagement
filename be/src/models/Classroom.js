const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  floor: {
    type: Number,
    required: true,
    min: 1,
  },
  capacity: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['available', 'in_use', 'maintenance'],
    default: 'available',
  },
  note: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
  collection: 'Classrooms',
});

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = Classroom;
