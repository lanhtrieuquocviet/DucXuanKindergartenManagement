/**
 * Tạo (hoặc cập nhật) một món ăn có tổng chỉ số đạt chuẩn đánh giá dinh dưỡng,
 * rồi gán vào một DailyMenu (bữa trưa — có thể đổi day/week trong script).
 *
 * Chạy từ thư mục be:  node scripts/seedNutritionCompliantDay.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const Food = require("../src/models/Food");
const DailyMenu = require("../src/models/DailyMenu");
const Menu = require("../src/models/Menu");
const { aggregateNutritionFromFoods } = require("../src/utils/nutritionCalculator");

/** Tổng ~670 kcal; P~16%, F~31%, C~53% (trong khoảng 615–726 kcal và % theo sở) */
const SEED_FOOD = {
  name: "Món đạt chuẩn dinh dưỡng (seed)",
  description: "Tạo bởi script seed — cân đối P/L/G và kcal",
  calories: 670,
  protein: 26,
  fat: 22,
  carb: 85,
};

async function applyNutritionToDailyMenu(dailyMenu) {
  const allFoods = await Food.find({
    _id: {
      $in: [...(dailyMenu.lunchFoods || []), ...(dailyMenu.afternoonFoods || [])],
    },
  });
  const nutritionData = aggregateNutritionFromFoods(allFoods);
  dailyMenu.totalCalories = nutritionData.totalCalories;
  dailyMenu.totalProtein = nutritionData.totalProteinGrams;
  dailyMenu.totalFat = nutritionData.totalFatGrams;
  dailyMenu.totalCarb = nutritionData.totalCarbGrams;
  dailyMenu.proteinPercentage = nutritionData.proteinPercentage;
  dailyMenu.fatPercentage = nutritionData.fatPercentage;
  dailyMenu.carbPercentage = nutritionData.carbPercentage;
  dailyMenu.nutritionDetails = {
    kcalFromProtein: nutritionData.details.kcalFromProtein,
    kcalFromFat: nutritionData.details.kcalFromFat,
    kcalFromCarb: nutritionData.details.kcalFromCarb,
    calculatedTotalKcal: nutritionData.calculatedTotalKcal,
  };
  await dailyMenu.save();
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Thiếu MONGODB_URI trong .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Đã kết nối MongoDB");

  let food = await Food.findOne({ name: SEED_FOOD.name });
  if (!food) {
    food = await Food.create(SEED_FOOD);
    console.log("Đã tạo Food:", food._id.toString());
  } else {
    Object.assign(food, SEED_FOOD);
    await food.save();
    console.log("Đã cập nhật Food:", food._id.toString());
  }

  const menu = await Menu.findOne().sort({ year: -1, month: -1 }).lean();
  if (!menu) {
    console.error("Không có Menu (thực đơn tháng) nào — hãy tạo thực đơn trong app trước.");
    await mongoose.disconnect();
    process.exit(1);
  }

  // Đổi tại đây nếu muốn: weekType: 'odd'|'even', dayOfWeek: 'mon'...'fri'
  const weekType = process.env.SEED_WEEK_TYPE || "odd";
  const dayOfWeek = process.env.SEED_DAY || "mon";

  let dm = await DailyMenu.findOne({
    menuId: menu._id,
    weekType,
    dayOfWeek,
  });
  if (!dm) {
    dm = await DailyMenu.findOne({ menuId: menu._id });
  }
  if (!dm) {
    console.error("Không tìm thấy DailyMenu cho menu", menu._id.toString());
    await mongoose.disconnect();
    process.exit(1);
  }

  dm.lunchFoods = [food._id];
  dm.afternoonFoods = [];
  await applyNutritionToDailyMenu(dm);

  const pKcal = (dm.totalProtein || 0) * 4;
  const fKcal = (dm.totalFat || 0) * 9;
  const cKcal = (dm.totalCarb || 0) * 4;
  const t = pKcal + fKcal + cKcal;
  const pp = t > 0 ? ((pKcal / t) * 100).toFixed(1) : 0;
  const fp = t > 0 ? ((fKcal / t) * 100).toFixed(1) : 0;
  const cp = t > 0 ? ((cKcal / t) * 100).toFixed(1) : 0;

  console.log("---");
  console.log("Menu tháng:", `${menu.month}/${menu.year}`, "| status:", menu.status);
  console.log(
    "DailyMenu:",
    dm._id.toString(),
    "| tuần:",
    dm.weekType,
    "| thứ:",
    dm.dayOfWeek
  );
  console.log("Tổng kcal (sum food.calories):", dm.totalCalories);
  console.log("% Đạm / Béo / Tinh bột (theo macro):", pp + "% / " + fp + "% / " + cp + "%");
  console.log("---");
  console.log("Mở thực đơn tương ứng trong app → ngày đã gán sẽ hiển thị đạt chuẩn (nếu chỉ tiêu sở mặc định).");

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
