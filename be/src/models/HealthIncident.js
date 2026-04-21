const mongoose = require('mongoose');

const healthIncidentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Students',
      required: [true, 'Vui lòng chọn học sinh'],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classes',
      default: null,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      default: null,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Vui lòng chọn ngày'],
      default: Date.now,
    },
    symptoms: {
      type: String,
      trim: true,
      required: [true, 'Vui lòng nhập triệu chứng'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    severity: {
      type: String,
      enum: {
        values: ['mild', 'moderate', 'severe'],
        message: 'Mức độ không hợp lệ',
      },
      default: 'mild',
    },
    // Trạng thái xử lý
    status: {
      type: String,
      enum: {
        values: ['monitoring', 'sent_home', 'recovered', 'referred'],
        message: 'Trạng thái không hợp lệ',
      },
      default: 'monitoring',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'HealthIncidents',
  }
);

healthIncidentSchema.index({ date: -1 });
healthIncidentSchema.index({ studentId: 1, date: -1 });
healthIncidentSchema.index({ classId: 1, date: -1 });
healthIncidentSchema.index({ academicYearId: 1, date: -1 });
healthIncidentSchema.index({ academicYearId: 1, classId: 1 });

module.exports = mongoose.model('HealthIncident', healthIncidentSchema);
