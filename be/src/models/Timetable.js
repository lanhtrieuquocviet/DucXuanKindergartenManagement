const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      required: true,
      index: true,
    },
    // summer = Mùa Hè, winter = Mùa Đông, both = Cả 2 mùa
    appliesToSeason: {
      type: String,
      enum: ['summer', 'winter', 'both'],
      required: true,
      index: true,
    },
    // minutes since midnight (0..1439)
    startMinutes: {
      type: Number,
      required: true,
      min: 0,
      max: 24 * 60 - 1,
      index: true,
    },
    endMinutes: {
      type: Number,
      required: true,
      min: 0,
      max: 24 * 60,
    },
    content: {
      type: String,
      default: '',
      trim: true,
    },
  },
  // Dùng collection riêng để tránh dính unique index cũ của schema trước đó.
  { timestamps: true, collection: 'TimetableSeasonActivities' }
);

// Phục vụ sort nhanh theo thời gian
timetableSchema.index({ academicYear: 1, appliesToSeason: 1, startMinutes: 1 });

const Timetable = mongoose.model('Timetables', timetableSchema);
module.exports = Timetable;
