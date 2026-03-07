const DailyMenu = require("../models/DailyMenu");
const Food = require("../models/Food");

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

    const allFoods = await Food.find({
      _id: {
        $in: [
          ...(dailyMenu.lunchFoods || []),
          ...(dailyMenu.afternoonFoods || []),
        ],
      },
    });

    let calories = 0;
    let protein = 0;
    let fat = 0;
    let carb = 0;

    allFoods.forEach((food) => {
      calories += food.calories || 0;
      protein += food.protein || 0;
      fat += food.fat || 0;
      carb += food.carb || 0;
    });

    dailyMenu.totalCalories = calories;
    dailyMenu.totalProtein = protein;
    dailyMenu.totalFat = fat;
    dailyMenu.totalCarb = carb;

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