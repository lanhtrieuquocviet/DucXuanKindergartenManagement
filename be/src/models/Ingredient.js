const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    /** Nhóm nguyên liệu (dinh dưỡng / kho) */
    category: {
      type: String,
      enum: ['luong_thuc', 'giau_dam', 'rau_cu', 'gia_vi', 'phu_lieu'],
      default: 'luong_thuc',
    },
    unit: {
      type: String,
      default: '100g',
    },
    calories: {
      type: Number,
      default: 0,
      min: 0,
    },
    protein: {
      type: Number,
      default: 0,
      min: 0,
    },
    fat: {
      type: Number,
      default: 0,
      min: 0,
    },
    carb: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'Ingredients',
  }
);

module.exports = mongoose.model('Ingredients', ingredientSchema);
