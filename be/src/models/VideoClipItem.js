const mongoose = require('mongoose');

const videoClipItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, required: true, trim: true },
    videoUrl: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    collection: 'VideoClipItems',
  }
);

module.exports = mongoose.model('VideoClipItem', videoClipItemSchema);
