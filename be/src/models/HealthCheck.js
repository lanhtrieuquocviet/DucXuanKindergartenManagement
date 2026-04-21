const mongoose = require("mongoose");

const healthCheckSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYears",
      default: null,
      index: true,
    },
    checkDate: {
      type: Date,
      default: Date.now,
    },
    height: {
      type: Number,
      min: [0, 'Chiều cao không được âm'],
    },
    weight: {
      type: Number,
      min: [0, 'Cân nặng không được âm'],
    },
    temperature: {
      type: Number,
      min: [35, 'Nhiệt độ phải từ 35°C trở lên'],
      max: [43, 'Nhiệt độ không được vượt quá 43°C'],
    },
    bloodPressure: {
      systolic:  { type: Number, min: [0, 'Huyết áp tâm thu không hợp lệ'] },
      diastolic: { type: Number, min: [0, 'Huyết áp tâm trương không hợp lệ'] },
    },
    heartRate: {
      type: Number,
      min: [0, 'Nhịp tim không được âm'],
    },
    vision: {
      left: { type: Number, description: "Left eye" },
      right: { type: Number, description: "Right eye" },
    },
    teeth: {
      status: {
        type: String,
        enum: ["good", "fair", "poor"],
        default: "good",
      },
      cavities: { type: Number, default: 0 },
      notes: String,
    },
    skin: {
      status: {
        type: String,
        enum: ["normal", "dry", "oily", "other"],
        default: "normal",
      },
      issues: String,
    },
    allergies: [
      {
        allergen: String,
        severity: {
          type: String,
          enum: ["mild", "moderate", "severe"],
        },
        reaction: String,
      },
    ],
    medications: [
      {
        name: String,
        dosage: String,
        frequency: String,
        reason: String,
      },
    ],
    chronicDiseases: {
      type: [String],
      description: "e.g., asthma, diabetes, etc.",
    },
    notes: String,
    generalStatus: {
      type: String,
      enum: ["healthy", "monitor", "concerning"],
      default: "healthy",
    },
    recommendations: String,
    followUpDate: Date,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for fast queries
healthCheckSchema.index({ studentId: 1, checkDate: -1 });
healthCheckSchema.index({ recordedBy: 1 });
healthCheckSchema.index({ academicYearId: 1, checkDate: -1 });
healthCheckSchema.index({ academicYearId: 1, studentId: 1 });

module.exports = mongoose.model("HealthCheck", healthCheckSchema);
