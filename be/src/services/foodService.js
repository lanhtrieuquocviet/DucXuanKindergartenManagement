const { default: mongoose } = require("mongoose");
const Food = require("../models/Food");
const DailyMenu = require("../models/DailyMenu");

const NUTRITION_FIELDS = [
  { key: "calories", label: "Calories" },
  { key: "protein", label: "Protein" },
  { key: "fat", label: "Fat" },
  { key: "carb", label: "Carb" },
];

const validateNutritionFields = (source, fields = NUTRITION_FIELDS) => {
  for (const field of fields) {
    const raw = source?.[field.key];
    if (raw == null || raw === "") {
      return `${field.label} là bắt buộc`;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      return `${field.label} phải là số hợp lệ`;
    }
    if (parsed < 0) {
      return `${field.label} không được âm`;
    }
  }
  return "";
};

// Tạo món ăn
exports.createFood = async (req, res) => {
  try {
    const { name, calories, protein, fat, carb, ingredients } = req.body;

    // validate required
    if (!name || calories == null || protein == null || fat == null || carb == null) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin món ăn",
      });
    }

    if (ingredients && !Array.isArray(ingredients)) {
      return res.status(400).json({ success: false, message: "Ingredients phải là mảng" });
    }

    if (Array.isArray(ingredients)) {
      const invalid = ingredients.find(
        (item) =>
          !item.name ||
          item.calories == null ||
          item.protein == null ||
          item.fat == null ||
          item.carb == null ||
          Number(item.calories) < 0 ||
          Number(item.protein) < 0 ||
          Number(item.fat) < 0 ||
          Number(item.carb) < 0 ||
          Number.isNaN(Number(item.calories)) ||
          Number.isNaN(Number(item.protein)) ||
          Number.isNaN(Number(item.fat)) ||
          Number.isNaN(Number(item.carb))
      );
      if (invalid) {
        return res.status(400).json({
          success: false,
          message: "Thông tin nguyên liệu không hợp lệ",
        });
      }
    }

    const nutritionError = validateNutritionFields({ calories, protein, fat, carb });
    if (nutritionError) {
      return res.status(400).json({
        success: false,
        message: nutritionError,
      });
    }

    // check trùng tên
    const normalizedName = String(name).trim();
    const existingFood = await Food.findOne({ name: normalizedName });

    if (existingFood) {
      if (existingFood.isDeleted) {
        Object.assign(existingFood, {
          ...req.body,
          name: normalizedName,
          isDeleted: false,
          deletedAt: null,
        });
        await existingFood.save();
        return res.status(200).json({
          success: true,
          message: "Khôi phục món ăn thành công",
          data: existingFood,
        });
      }
      return res.status(400).json({
        success: false,
        message: "Món ăn đã tồn tại",
      });
    }

    const food = new Food({ ...req.body, name: normalizedName });
    await food.save();

    res.status(201).json({
      success: true,
      message: "Tạo món ăn thành công",
      data: food,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách món ăn
exports.getFoods = async (req, res) => {
  try {
    const filter = req.query?.filter;
    const query =
      filter === "deleted"
        ? { isDeleted: true }
        : filter === "all"
          ? {}
          : { isDeleted: { $ne: true } };
    const foods = await Food.find(query);

    res.json({
      success: true,
      data: foods,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Khôi phục món ăn đã xóa mềm
exports.restoreFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Món ăn không tồn tại",
      });
    }

    if (!food.isDeleted) {
      return res.json({
        success: true,
        message: "Món ăn đang hoạt động",
        data: food,
      });
    }

    food.isDeleted = false;
    food.deletedAt = null;
    await food.save();

    return res.json({
      success: true,
      message: "Khôi phục món ăn thành công",
      data: food,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy chi tiết món ăn

exports.getFoodById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "ID không hợp lệ",
      });
    }

    const food = await Food.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!food) {
      return res.status(404).json({
        message: "Không tìm thấy món ăn",
      });
    }

    res.json({
      success: true,
      data: food,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Cập nhật món ăn
exports.updateFood = async (req, res) => {
  try {
    const food = await Food.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Món ăn không tồn tại",
      });
    }

    const { ingredients, calories, protein, fat, carb } = req.body;
    const hasAnyTopLevelNutrition = [calories, protein, fat, carb].some((v) => v !== undefined);
    if (hasAnyTopLevelNutrition) {
      const nutritionError = validateNutritionFields(
        {
          calories: calories ?? food.calories,
          protein: protein ?? food.protein,
          fat: fat ?? food.fat,
          carb: carb ?? food.carb,
        },
        NUTRITION_FIELDS
      );
      if (nutritionError) {
        return res.status(400).json({ success: false, message: nutritionError });
      }
    }

    if (ingredients && !Array.isArray(ingredients)) {
      return res.status(400).json({ success: false, message: "Ingredients phải là mảng" });
    }
    if (Array.isArray(ingredients)) {
      const invalid = ingredients.find(
        (item) =>
          !item.name ||
          item.calories == null ||
          item.protein == null ||
          item.fat == null ||
          item.carb == null ||
          Number(item.calories) < 0 ||
          Number(item.protein) < 0 ||
          Number(item.fat) < 0 ||
          Number(item.carb) < 0 ||
          Number.isNaN(Number(item.calories)) ||
          Number.isNaN(Number(item.protein)) ||
          Number.isNaN(Number(item.fat)) ||
          Number.isNaN(Number(item.carb))
      );
      if (invalid) {
        return res.status(400).json({
          success: false,
          message: "Thông tin nguyên liệu không hợp lệ",
        });
      }
    }

    Object.assign(food, req.body);

    await food.save();

    res.json({
      success: true,
      message: "Cập nhật thành công",
      data: food,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa món ăn
exports.deleteFood = async (req, res) => {
  try {
    const food = await Food.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Món ăn không tồn tại",
      });
    }

    const usedInAnyMenu = await DailyMenu.findOne({
      $or: [
        { lunchFoods: food._id },
        { afternoonFoods: food._id },
        { "lunchMealSlots.food": food._id },
        { "afternoonMealSlots.food": food._id },
      ],
    }).select("_id menuId");

    if (usedInAnyMenu) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa món ăn vì đã được gắn vào thực đơn (kể cả bản nháp)",
      });
    }

    food.isDeleted = true;
    food.deletedAt = new Date();
    await food.save();

    res.json({
      success: true,
      message: "Xóa món ăn thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};