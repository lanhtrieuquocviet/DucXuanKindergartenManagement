const mongoose = require("mongoose");

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

    // tổng dinh dưỡng
    totalCalories: {
      type: Number,
      default: 0,
    },

    totalProtein: {
      type: Number,
      default: 0,
    },

    totalFat: {
      type: Number,
      default: 0,
    },

    totalCarb: {
      type: Number,
      default: 0,
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
