const DailyMenu = require("../models/DailyMenu");
const Food = require("../models/Food");
const {
  aggregateNutritionFromFoods,
} = require("../utils/nutritionCalculator");

exports.updateDailyMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { lunchFoods, afternoonFoods } = req.body;

    const dailyMenu = await DailyMenu.findById(id);

    if (!dailyMenu) {
      return res.status(404).json({
        message: "Daily menu không tồn tại",
      });
    }

    // chỉ update nếu có gửi lên
    if (lunchFoods !== undefined) {
      dailyMenu.lunchFoods = lunchFoods;
    }

    if (afternoonFoods !== undefined) {
      dailyMenu.afternoonFoods = afternoonFoods;
    }

    // Lấy toàn bộ foods từ lunch và afternoon
    const allFoods = await Food.find({
      _id: {
        $in: [
          ...(dailyMenu.lunchFoods || []),
          ...(dailyMenu.afternoonFoods || []),
        ],
      },
    });

    // Sử dụng nutrition calculator để tính toán giá trị dinh dưỡng
    const nutritionData = aggregateNutritionFromFoods(allFoods);

    // Cập nhật các giá trị dinh dưỡng
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

    res.json({
      success: true,
      data: dailyMenu,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};