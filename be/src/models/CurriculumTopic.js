const mongoose = require('mongoose');

const curriculumTopicSchema = new mongoose.Schema(
  {
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      required: true,
      index: true,
    },
    monthQuarter: {
      type: String,
      trim: true,
      default: '',
    },
    topicName: {
      type: String,
      trim: true,
      default: '',
    },
    mainField: {
      type: String,
      trim: true,
      default: '',
    },
    mainObjectives: {
      type: String,
      trim: true,
      default: '',
    },
    featuredActivities: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'CurriculumTopics',
  }
);

const CurriculumTopic = mongoose.model('CurriculumTopics', curriculumTopicSchema);
module.exports = CurriculumTopic;
