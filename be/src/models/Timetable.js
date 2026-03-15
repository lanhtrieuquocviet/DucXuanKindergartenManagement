const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      required: true,
      index: true,
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grades',
      required: true,
      index: true,
    },
    sang: {
      type: [String],
      default: () => ['', '', '', '', '', ''],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length === 6;
        },
        message: 'sang phải có đúng 6 phần tử (Thứ Hai → Thứ Bảy)',
      },
    },
    chieu: {
      type: [String],
      default: () => ['', '', '', '', '', ''],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length === 6;
        },
        message: 'chieu phải có đúng 6 phần tử (Thứ Hai → Thứ Bảy)',
      },
    },
  },
  { timestamps: true, collection: 'Timetables' }
);

timetableSchema.index({ academicYear: 1, gradeId: 1 }, { unique: true });

const Timetable = mongoose.model('Timetables', timetableSchema);
module.exports = Timetable;
