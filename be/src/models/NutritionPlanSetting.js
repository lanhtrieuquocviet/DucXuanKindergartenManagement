const mongoose = require("mongoose");

const nutritionPlanItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    min: { type: Number, required: true, default: 0 },
    max: { type: Number, required: true, default: 0 },
    actual: { type: Number, default: 0 },
  },
  { _id: false }
);

const nutritionPlanSettingSchema = new mongoose.Schema(
  {
    items: { type: [nutritionPlanItemSchema], default: [] },
  },
  {
    timestamps: true,
    collection: "NutritionPlanSettings",
  }
);

module.exports = mongoose.model(
  "NutritionPlanSetting",
  nutritionPlanSettingSchema
);
