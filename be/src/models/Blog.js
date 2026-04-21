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
      default: '',
      trim: true,
    },
    layout: {
      type: String,
      enum: ['layout1', 'layout2'],
      default: 'layout1',
    },
    sections: [
      {
        image: { type: String, default: '' },
        content: { type: String, default: '' },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogCategory',
      required: true,
    },
    images: [{
      type: String,
      trim: true,
    }],
    attachmentUrl: {
      type: String,
      trim: true,
      default: null,
    },
    attachmentType: {
      type: String,
      enum: ['pdf', 'word', null],
      default: null,
    },
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

blogSchema.index({ category: 1, status: 1, createdAt: -1 });
blogSchema.index({ status: 1, createdAt: -1 });

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
