const mongoose = require('mongoose');

const roomAssetSchema = new mongoose.Schema(
  {
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    assetId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    quantity:    { type: Number, required: true, min: 0, default: 1 },
    notes:       { type: String, trim: true, default: '' },
    status:      { type: String, enum: ['active', 'broken', 'repairing'], default: 'active' },
    assignedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'RoomAssets',
  }
);

// Mỗi loại tài sản chỉ xuất hiện 1 lần trong 1 phòng
roomAssetSchema.index({ classroomId: 1, assetId: 1 }, { unique: true });

module.exports = mongoose.model('RoomAsset', roomAssetSchema);
