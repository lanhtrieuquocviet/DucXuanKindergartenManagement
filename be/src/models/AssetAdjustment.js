const mongoose = require('mongoose');

const assetAdjustmentSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    type: {
      type: String,
      enum: ['excess', 'missing', 'damage', 'repair', 'disposal'],
      required: true,
    },
    oldQty: { type: Number, default: 0 },
    newQty: { type: Number, default: 0 },
    difference: { type: Number, default: 0 },
    reason: { type: String, trim: true, default: '' },
    sourceInspectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InspectionMinutes', default: null },
    status: {
      type: String,
      enum: ['pending', 'applied', 'void'],
      default: 'pending',
    },
    appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    appliedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'AssetAdjustments',
  }
);

module.exports = mongoose.model('AssetAdjustment', assetAdjustmentSchema);
