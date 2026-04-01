const mongoose = require('mongoose');

const imageLibraryItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    collection: 'ImageLibraryItems',
  }
);

module.exports = mongoose.model('ImageLibraryItem', imageLibraryItemSchema);
