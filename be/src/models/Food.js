const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },
    // Số calo của món ăn
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
    //Hàm lượng carbohydrate.
    carb: {
      type: Number,
      default: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "Foods",
  }
);

module.exports = mongoose.model("Foods", foodSchema);
