const mongoose = require('mongoose');

const weeklyDetailSchema = new mongoose.Schema(
  {
    weekIndex: { type: Number, required: true, min: 1 },
    weekName: { type: String, trim: true, default: '' },
    weekTopic: { type: String, trim: true, default: '' },
    weekRange: { type: String, trim: true, default: '' },
    dayPlans: {
      thu2: { type: String, trim: true, default: '' },
      thu3: { type: String, trim: true, default: '' },
      thu4: { type: String, trim: true, default: '' },
      thu5: { type: String, trim: true, default: '' },
      thu6: { type: String, trim: true, default: '' },
    },
  },
  { _id: false }
);

const academicPlanTopicSchema = new mongoose.Schema(
  {
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      required: true,
      index: true,
    },
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grades',
      required: true,
      index: true,
    },
    topicName: {
      type: String,
      required: true,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    weeks: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    teachers: {
      type: String,
      trim: true,
      default: '',
    },
    weeklyDetails: {
      type: [weeklyDetailSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'AcademicPlanTopics',
  }
);

academicPlanTopicSchema.index({ academicYear: 1, grade: 1, startDate: 1 });

const AcademicPlanTopic = mongoose.model('AcademicPlanTopics', academicPlanTopicSchema);
module.exports = AcademicPlanTopic;
