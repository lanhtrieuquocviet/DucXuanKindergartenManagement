const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    /** Khối lớp tại thời điểm ghi nhận — dùng để giới hạn số năm học khác nhau / khối */
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grades',
      default: null,
      index: true,
    },
    /** Năm học của lớp tại thời điểm ghi nhận — dùng đếm tối đa 2 năm / khối */
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      default: null,
      index: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    healthNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    /** Đánh giá học tập tổng quan của cả năm */
    academicEvaluation: {
      type: String,
      enum: ['đạt', 'chưa đạt', null],
      default: null,
      trim: true,
    },
    evaluationNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    collection: 'Enrollments',
  }
);

enrollmentSchema.index({ studentId: 1, gradeId: 1, academicYearId: 1 });

const Enrollment = mongoose.model('Enrollments', enrollmentSchema);

module.exports = Enrollment;
