const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Array of image URLs from Cloudinary (converted from PDF pages)
    images: [{
      type: String,
      trim: true,
    }],
    // Original PDF file URL
    pdfUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'inactive'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
    collection: 'Documents',
  }
);

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
