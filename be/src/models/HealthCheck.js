const mongoose = require("mongoose");

const healthCheckSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    checkDate: {
      type: Date,
      default: Date.now,
    },
    height: {
      type: Number,
      min: 0,
      description: "cm",
    },
    weight: {
      type: Number,
      min: 0,
      description: "kg",
    },
    temperature: {
      type: Number,
      min: 35,
      max: 43,
      description: "Celsius",
    },
    bloodPressure: {
      systolic: { type: Number, min: 0 },
      diastolic: { type: Number, min: 0 },
    },
    heartRate: {
      type: Number,
      min: 0,
      description: "bpm",
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

module.exports = mongoose.model("HealthCheck", healthCheckSchema);
