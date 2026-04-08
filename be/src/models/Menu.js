const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

  status: {
  type: String,
  enum: [
    "draft",
    "pending",
    "approved",
    "active",
    "completed",
    "rejected"
  ],
  default: "draft"
  },

    rejectReason: {
      type: String,
      default: "",
    },
    nutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      carb: { type: Number, default: 0 },
      avgCalories: { type: Number, default: 0 },
      proteinPercent: { type: Number, default: 0 },
      fatPercent: { type: Number, default: 0 },
      carbPercent: { type: Number, default: 0 },
    },
    nutritionPlan: [
      {
        label: { type: String, required: true },
        target: { type: Number, required: true, default: 0 },
        actual: { type: Number, required: true, default: 0 },
      }
    ],
  },
  {
    timestamps: true,
    collection: "Menus",
  }
);

module.exports = mongoose.model("Menus", menuSchema);
