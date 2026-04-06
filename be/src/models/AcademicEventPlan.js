const mongoose = require('mongoose');

const academicEventItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: 'Grades', required: true },
    gradeName: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const monthBucketSchema = new mongoose.Schema(
  {
    monthKey: { type: String, required: true, trim: true },
    items: { type: [academicEventItemSchema], default: [] },
  },
  { _id: false }
);

const academicEventPlanSchema = new mongoose.Schema(
  {
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      required: true,
      unique: true,
      index: true,
    },
    months: { type: [monthBucketSchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'AcademicEventPlans',
  }
);

const AcademicEventPlan = mongoose.model('AcademicEventPlans', academicEventPlanSchema);
module.exports = AcademicEventPlan;

