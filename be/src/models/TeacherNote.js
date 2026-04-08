const mongoose = require('mongoose');

const teacherNoteSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Students',
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classes',
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  images: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
  collection: 'TeacherNotes',
});

const TeacherNote = mongoose.model('TeacherNotes', teacherNoteSchema);
module.exports = TeacherNote;
