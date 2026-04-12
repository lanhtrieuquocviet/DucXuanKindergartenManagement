const mongoose = require("mongoose");

const mealIngredientLineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    grams: { type: Number, default: 100 },
    caloriesPer100g: { type: Number, default: 0 },
    proteinPer100g: { type: Number, default: 0 },
    fatPer100g: { type: Number, default: 0 },
    carbPer100g: { type: Number, default: 0 },
  },
  { _id: false }
);

const mealSlotSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Foods",
      required: true,
    },
    ingredientLines: { type: [mealIngredientLineSchema], default: [] },
  },
  { _id: false }
);

const dailyMenuSchema = new mongoose.Schema(
  {
    // thuộc menu tháng nào
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menus",
      required: true,
    },

    // tuần lẻ / tuần chẵn
    weekType: {
      type: String,
      enum: ["odd", "even"],
      required: true,
    },

    // thứ trong tuần
    dayOfWeek: {
      type: String,
      enum: ["mon", "tue", "wed", "thu", "fri"],
      required: true,
    },

    // món bữa trưa
    lunchFoods: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Foods",
      },
    ],

    // món bữa chiều
    afternoonFoods: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Foods",
      },
    ],

    /** Bung nguyên liệu + chỉnh gram — đồng bộ với lunchFoods */
    lunchMealSlots: { type: [mealSlotSchema], default: undefined },
    afternoonMealSlots: { type: [mealSlotSchema], default: undefined },

    // tổng dinh dưỡng (Calories từ database)
    totalCalories: {
      type: Number,
      default: 0,
    },

    // Tổng Protein (grams)
    totalProtein: {
      type: Number,
      default: 0,
    },

    // Tổng Fat/Lipid (grams)
    totalFat: {
      type: Number,
      default: 0,
    },

    // Tổng Carb/Glucid (grams)
    totalCarb: {
      type: Number,
      default: 0,
    },

    // Tỉ lệ % của Protein so với tổng Kcal
    proteinPercentage: {
      type: Number,
      default: 0,
    },

    // Tỉ lệ % của Fat so với tổng Kcal
    fatPercentage: {
      type: Number,
      default: 0,
    },

    // Tỉ lệ % của Carb so với tổng Kcal
    carbPercentage: {
      type: Number,
      default: 0,
    },

    // Chi tiết quy đổi Kcal từ P-L-G
    nutritionDetails: {
      kcalFromProtein: {
        type: Number,
        default: 0,
      },
      kcalFromFat: {
        type: Number,
        default: 0,
      },
      kcalFromCarb: {
        type: Number,
        default: 0,
      },
      calculatedTotalKcal: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    collection: "DailyMenus",
  }
);

// tránh trùng ngày trong cùng menu
dailyMenuSchema.index(
  { menuId: 1, weekType: 1, dayOfWeek: 1 },
  { unique: true }
);

module.exports = mongoose.model("DailyMenus", dailyMenuSchema);
