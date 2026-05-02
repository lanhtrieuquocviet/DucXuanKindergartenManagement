const mongoose = require('mongoose');

const assetIncidentSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    assetName: { type: String, required: true, trim: true },
    assetCode: { type: String, default: '', trim: true },

    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classes' },
    className: { type: String, default: '' },
    location: { type: String, default: '' },

    type: {
      type: String,
      enum: ['broken', 'lost', 'damaged', 'other'],
      required: true,
    },

    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },

    description: { type: String, default: '' },
    images: [{ type: String }], // Cloudinary URLs

    status: {
      type: String,
      enum: ['pending', 'processing', 'fixed', 'disposed', 'rejected'],
      default: 'pending',
    },

    adminNotes: { type: String, default: '' },
    resolvedAt: { type: Date },
    
    // Nguồn gốc sự cố (nếu từ kiểm kê)
    sourceInspectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InspectionMinutes' },
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Thường là giáo viên
  },
  {
    timestamps: true,
    collection: 'AssetIncidents',
  }
);

module.exports = mongoose.model('AssetIncident', assetIncidentSchema);
