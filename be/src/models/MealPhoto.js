const mongoose = require('mongoose');

const mealEntrySchema = new mongoose.Schema(
  {
    mealType: {
      type: String,
      enum: ['trua', 'chieu', 'sang', 'xe'],
      required: true,
    },
    description: { type: String, default: '' },
    images: [{ type: String, trim: true }],
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const mealPhotoSchema = new mongoose.Schema(
  {
    // Ngày dưới dạng chuỗi YYYY-MM-DD để dễ query
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    // Ảnh theo từng bữa (sáng/trưa/chiều/xế)
    meals: [mealEntrySchema],

    // Ảnh món ăn (nhiều ảnh) - giữ backward compat
    mealImages: [{ type: String, trim: true }],

    // Ảnh mẫu thực phẩm (nhiều ảnh)
    sampleImages: [{ type: String, trim: true }],

    // Người upload
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'MealPhotos',
  }
);

module.exports = mongoose.model('MealPhotos', mealPhotoSchema);
