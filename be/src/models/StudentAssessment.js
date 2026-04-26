const mongoose = require('mongoose');

const studentAssessmentSchema = new mongoose.Schema({
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
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYears',
    required: true,
  },
  term: {
    type: Number, // 1 hoặc 2
    required: true,
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssessmentTemplates',
    required: true,
  },
  results: [{
    criterionName: { type: String, required: true },
    isPassed: { type: Boolean, default: true },
  }],
  overallResult: {
    type: String,
    enum: ['Đạt', 'Chưa đạt'],
    default: 'Đạt',
  },
  notes: {
    type: String,
    default: '',
  },
  assessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Giáo viên thực hiện đánh giá
  },
  assessedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
  collection: 'StudentAssessments'
});

// Index để tránh đánh giá trùng cho cùng 1 học sinh trong 1 kỳ
studentAssessmentSchema.index({ studentId: 1, academicYearId: 1, term: 1 }, { unique: true });

const StudentAssessment = mongoose.model('StudentAssessments', studentAssessmentSchema);

module.exports = StudentAssessment;
