const DailyMenu = require("../models/DailyMenu");
const Food = require("../models/Food");
const {
  aggregateNutritionFromFoods,
  calculateNutritionPercentage,
  convertGramsToKcal,
} = require("../utils/nutritionCalculator");
const {
  rebuildMealSlots,
  sumNutritionFromSlots,
} = require("../utils/mealExplode");

function mealUsesSlots(slots) {
  return Array.isArray(slots) && slots.length > 0;
}

function sumLegacyMeal(foodIds, foodsById) {
  const list = (foodIds || [])
    .map((id) => foodsById.get(String(id)))
    .filter(Boolean);
  return aggregateNutritionFromFoods(list);
}

/**
 * Cộng dinh dưỡng bữa trưa + chiều (slots nếu có, không thì từ Food).
 */
function computeDailyTotals(dailyMenu, foodsById) {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarb = 0;

  if (mealUsesSlots(dailyMenu.lunchMealSlots)) {
    const s = sumNutritionFromSlots(dailyMenu.lunchMealSlots, foodsById);
    totalCalories += s.totalCalories;
    totalProtein += s.totalProtein;
    totalFat += s.totalFat;
    totalCarb += s.totalCarb;
  } else {
    const n = sumLegacyMeal(dailyMenu.lunchFoods, foodsById);
    totalCalories += n.totalCalories;
    totalProtein += n.totalProteinGrams;
    totalFat += n.totalFatGrams;
    totalCarb += n.totalCarbGrams;
  }

  if (mealUsesSlots(dailyMenu.afternoonMealSlots)) {
    const s = sumNutritionFromSlots(dailyMenu.afternoonMealSlots, foodsById);
    totalCalories += s.totalCalories;
    totalProtein += s.totalProtein;
    totalFat += s.totalFat;
    totalCarb += s.totalCarb;
  } else {
    const n = sumLegacyMeal(dailyMenu.afternoonFoods, foodsById);
    totalCalories += n.totalCalories;
    totalProtein += n.totalProteinGrams;
    totalFat += n.totalFatGrams;
    totalCarb += n.totalCarbGrams;
  }

  const nutritionInfo = calculateNutritionPercentage({
    protein: totalProtein,
    fat: totalFat,
    carb: totalCarb,
  });

  return {
    totalCalories: Math.round(totalCalories * 100) / 100,
    totalProteinGrams: nutritionInfo.proteinGrams,
    totalFatGrams: nutritionInfo.fatGrams,
    totalCarbGrams: nutritionInfo.carbGrams,
    proteinPercentage: nutritionInfo.proteinPercentage,
    fatPercentage: nutritionInfo.fatPercentage,
    carbPercentage: nutritionInfo.carbPercentage,
    calculatedTotalKcal: nutritionInfo.totalKcal,
    details: {
      kcalFromProtein: convertGramsToKcal({
        protein: totalProtein,
        fat: 0,
        carb: 0,
      }).kcalFromProtein,
      kcalFromFat: convertGramsToKcal({
        protein: 0,
        fat: totalFat,
        carb: 0,
      }).kcalFromFat,
      kcalFromCarb: convertGramsToKcal({
        protein: 0,
        fat: 0,
        carb: totalCarb,
      }).kcalFromCarb,
    },
  };
}

async function persistNutrition(dailyMenu) {
  const lunchIds = dailyMenu.lunchFoods || [];
  const aftIds = dailyMenu.afternoonFoods || [];
  const allIds = [...new Set([...lunchIds, ...aftIds].map(String))];
  const foods = await Food.find({ _id: { $in: allIds } }).lean();
  const foodsById = new Map(foods.map((f) => [String(f._id), f]));

  const nutritionData = computeDailyTotals(dailyMenu, foodsById);

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
}

exports.updateDailyMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      lunchFoods,
      afternoonFoods,
      lunchMealSlots,
      afternoonMealSlots,
    } = req.body;

    const dailyMenu = await DailyMenu.findById(id);

    if (!dailyMenu) {
      return res.status(404).json({
        message: "Daily menu không tồn tại",
      });
    }

    if (lunchMealSlots !== undefined) {
      dailyMenu.lunchMealSlots = lunchMealSlots;
      dailyMenu.lunchFoods = (lunchMealSlots || []).map((s) => s.food);
    } else if (lunchFoods !== undefined) {
      const prev = dailyMenu.lunchMealSlots;
      dailyMenu.lunchFoods = lunchFoods;
      dailyMenu.lunchMealSlots = await rebuildMealSlots(prev, lunchFoods);
    }

    if (afternoonMealSlots !== undefined) {
      dailyMenu.afternoonMealSlots = afternoonMealSlots;
      dailyMenu.afternoonFoods = (afternoonMealSlots || []).map((s) => s.food);
    } else if (afternoonFoods !== undefined) {
      const prev = dailyMenu.afternoonMealSlots;
      dailyMenu.afternoonFoods = afternoonFoods;
      dailyMenu.afternoonMealSlots = await rebuildMealSlots(
        prev,
        afternoonFoods
      );
    }

    await persistNutrition(dailyMenu);
    await dailyMenu.save();

    const populated = await DailyMenu.findById(dailyMenu._id)
      .populate("lunchFoods")
      .populate("afternoonFoods")
      .populate("lunchMealSlots.food")
      .populate("afternoonMealSlots.food");

    res.json({
      success: true,
      data: populated,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
