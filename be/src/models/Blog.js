const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    images: [{
      type: String,
      trim: true,
    }],
    status: {
      type: String,
      enum: ['draft', 'published', 'inactive'],
      default: 'draft',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'Blog',
  }
);

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;

