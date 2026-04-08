const mongoose = require('mongoose');

const assetIncidentSchema = new mongoose.Schema(
  {
    classId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Classes' },
    className: { type: String, default: '' },

    allocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetAllocation' },

    assetName: { type: String, required: true, trim: true },
    assetCode: { type: String, default: '', trim: true },

    type: {
      type: String,
      enum: ['broken', 'lost'],
      required: true,
    },

    description: { type: String, default: '' },
    images: [{ type: String }], // Cloudinary URLs

    status: {
      type: String,
      enum: ['pending', 'processing', 'fixed'],
      default: 'pending',
    },

    adminNotes:  { type: String, default: '' },
    resolvedAt:  { type: Date },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'AssetIncidents',
  }
);

module.exports = mongoose.model('AssetIncident', assetIncidentSchema);
