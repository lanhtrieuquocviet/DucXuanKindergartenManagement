const geminiService = require("../utils/geminiService");
const Food = require("../models/Food");
const Ingredient = require("../models/Ingredient");
const DailyMenu = require("../models/DailyMenu");

/**
 * Phân tích thực đơn ngày hiện tại
 */
exports.analyzeDailyMenu = async (req, res) => {
  try {
    const { dailyMenuId } = req.body;

    if (!dailyMenuId) {
      return res.status(400).json({ success: false, message: "dailyMenuId là bắt buộc" });
    }

    const dailyMenu = await DailyMenu.findById(dailyMenuId)
      .populate("lunchFoods")
      .populate("afternoonFoods");

    if (!dailyMenu) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thực đơn" });
    }

    const allFoods = await Food.find();
    const ingredients = await Ingredient.find();

    const analysis = await geminiService.analyzeMenuSuggestions(
      dailyMenu,
      allFoods,
      ingredients
    );

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("analyzeDailyMenu error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Gợi ý cải thiện một món ăn
 */
exports.improveDish = async (req, res) => {
  try {
    const { foodId } = req.body;

    if (!foodId) {
      return res.status(400).json({ success: false, message: "foodId là bắt buộc" });
    }

    const food = await Food.findById(foodId);

    if (!food) {
      return res.status(404).json({ success: false, message: "Không tìm thấy món ăn" });
    }

    const improvements = await geminiService.suggestDishImprovements(
      food.name,
      food.ingredients || [],
      {
        calories: food.calories,
        protein: food.protein,
        fat: food.fat,
        carb: food.carb,
      }
    );

    res.json({
      success: true,
      dishName: food.name,
      data: improvements,
    });
  } catch (error) {
    console.error("improveDish error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Gợi ý các món ăn mới
 */
exports.suggestNewDishes = async (req, res) => {
  try {
    const ingredients = await Ingredient.find().limit(20);
    const foods = await Food.find().limit(5).sort({ createdAt: -1 });

    const recentDishNames = foods.map((f) => f.name);

    const suggestions = await geminiService.suggestNewDishes(ingredients, recentDishNames);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error("suggestNewDishes error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Chat với AI về thực đơn
 */
exports.chatAboutMenu = async (req, res) => {
  try {
    const { message, dailyMenuId } = req.body;

    if (!message || !dailyMenuId) {
      return res
        .status(400)
        .json({ success: false, message: "message và dailyMenuId là bắt buộc" });
    }

    const dailyMenu = await DailyMenu.findById(dailyMenuId)
      .populate("lunchFoods")
      .populate("afternoonFoods");

    if (!dailyMenu) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thực đơn" });
    }

    const allFoods = await Food.find();

    const response = await geminiService.chatWithContext(message, dailyMenu, allFoods);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("chatAboutMenu error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Tạo món ăn mới từ gợi ý AI
 * (Admin/KitchenStaff upload từ gợi ý AI)
 */
exports.createDishFromAISuggestion = async (req, res) => {
  try {
    const {
      name,
      description,
      ingredients: ingredientsList,
      nutrition,
      cookingTip,
    } = req.body;

    if (!name || !nutrition) {
      return res.status(400).json({
        success: false,
        message: "name và nutrition là bắt buộc",
      });
    }

    // Check duplicated
    const existed = await Food.findOne({ name });
    if (existed) {
      return res.status(400).json({
        success: false,
        message: "Món ăn đã tồn tại",
      });
    }

    // Prepare ingredients data
    const ingredients = [];
    if (Array.isArray(ingredientsList)) {
      for (const ing of ingredientsList) {
        // Find từ DB nếu có
        let dbIngredient = await Ingredient.findOne({ name: ing.name });

        if (!dbIngredient) {
          // Nếu chưa có, tạo mới
          dbIngredient = new Ingredient({
            name: ing.name,
            unit: ing.unit || "100g",
            calories: ing.nutrition?.calories || 0,
            protein: ing.nutrition?.protein || 0,
            fat: ing.nutrition?.fat || 0,
            carb: ing.nutrition?.carb || 0,
          });
          await dbIngredient.save();
        }

        ingredients.push({
          name: ing.name,
          quantity: ing.quantity || "",
          calories: dbIngredient.calories || ing.nutrition?.calories || 0,
          protein: dbIngredient.protein || ing.nutrition?.protein || 0,
          fat: dbIngredient.fat || ing.nutrition?.fat || 0,
          carb: dbIngredient.carb || ing.nutrition?.carb || 0,
        });
      }
    }

    // Create food
    const food = new Food({
      name,
      description: description || `Món ăn được AI gợi ý. ${cookingTip || ""}`,
      calories: nutrition.calories || 0,
      protein: nutrition.protein || 0,
      fat: nutrition.fat || 0,
      carb: nutrition.carb || 0,
      ingredients,
    });

    await food.save();

    res.status(201).json({
      success: true,
      message: "Tạo món ăn từ AI thành công",
      data: food,
    });
  } catch (error) {
    console.error("createDishFromAISuggestion error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Health check
 */
exports.healthCheck = async (req, res) => {
  try {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    res.json({
      success: true,
      aiEnabled: hasApiKey,
      message: hasApiKey
        ? "AI Menu Assistant sẵn sàng"
        : "Chưa cấu hình GEMINI_API_KEY",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
