const mongoose = require('mongoose');

const imageLibraryItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    // Backward-compatible legacy single image field
    imageUrl: { type: String, trim: true, default: null },
    // New field: allow an album with multiple images
    imageUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr),
        message: 'imageUrls phải là mảng',
      },
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    collection: 'ImageLibraryItems',
  }
);

module.exports = mongoose.model('ImageLibraryItem', imageLibraryItemSchema);
