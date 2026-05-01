const mongoose = require('mongoose');

const classTransferRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Students',
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fromClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classes',
      required: true,
      index: true,
    },
    toClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classes',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    rejectedReason: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'class_transfer_requests',
  },
);

module.exports = mongoose.model('ClassTransferRequest', classTransferRequestSchema);
