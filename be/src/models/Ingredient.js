const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    unit: {
      type: String,
      default: '100g',
    },
    calories: {
      type: Number,
      default: 0,
    },
    protein: {
      type: Number,
      default: 0,
    },
    fat: {
      type: Number,
      default: 0,
    },
    carb: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'Ingredients',
  }
);

module.exports = mongoose.model('Ingredients', ingredientSchema);
