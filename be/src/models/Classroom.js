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
    min: 1,
    default: 1,
  },
  zone: {
    type: String,
    enum: ['A', 'B'],
    default: 'A',
  },
  capacity: {
    type: Number,
    default: 0,
    min: 0,
  },
  roomType: {
    type: String,
    enum: ['learning', 'admin', 'support', 'outdoor'],
    default: 'learning',
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
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacilityLocation', // Liên kết tới Địa điểm/Vị trí trong danh mục CSVC
  },
}, {
  timestamps: true,
  collection: 'Classrooms',
});

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = Classroom;
