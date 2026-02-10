const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Students',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classes',
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'leave'],
      default: 'present',
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    time: {
      checkIn: { type: Date, default: null },
      checkOut: { type: Date, default: null },
    },
    timeString: {
      checkIn: { type: String, trim: true, default: '' },
      checkOut: { type: String, trim: true, default: '' },
    },
    isTakeOff: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'Attendances',
  }
);

// 1 học sinh chỉ nên có 1 bản ghi điểm danh cho 1 ngày
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

const Attendances = mongoose.model('Attendances', attendanceSchema);

module.exports = Attendances;

