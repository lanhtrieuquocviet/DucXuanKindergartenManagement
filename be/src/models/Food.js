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

    ingredients: [
      {
        name: { type: String, required: true, trim: true },
        /** Đồng bộ mã nhóm với Ingredient.category */
        category: {
          type: String,
          enum: ["luong_thuc", "giau_dam", "rau_cu", "gia_vi", "phu_lieu"],
          default: "luong_thuc",
          trim: true,
        },
        quantity: { type: String, default: "" },
        calories: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        fat: { type: Number, default: 0 },
        carb: { type: Number, default: 0 },
      },
    ],

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
