const mongoose = require('mongoose');

const assessmentTemplateSchema = new mongoose.Schema({
  templateName: {
    type: String,
    required: true,
    trim: true,
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYears',
    required: true,
  },
  gradeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grades', // Nếu form riêng cho từng khối (Mầm, Chồi, Lá)
    default: null,
  },
  criteria: [{
    name: { type: String, required: true }, // VD: Phát triển thể chất
    description: { type: String, default: '' },
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true,
  collection: 'AssessmentTemplates'
});

const AssessmentTemplate = mongoose.model('AssessmentTemplates', assessmentTemplateSchema);

module.exports = AssessmentTemplate;
