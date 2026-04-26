const mongoose = require('mongoose');

const generalCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Facility', 'Asset', 'Ingredient'],
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, {
  timestamps: true,
  collection: 'GeneralCategories',
});

// Ensure unique name per type
generalCategorySchema.index({ name: 1, type: 1 }, { unique: true });

const GeneralCategory = mongoose.model('GeneralCategory', generalCategorySchema);

module.exports = GeneralCategory;
