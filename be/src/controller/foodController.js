const { default: mongoose } = require("mongoose");
const Food = require("../models/Food");

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

    // validate số
    if (calories < 0 || protein < 0 || fat < 0 || carb < 0) {
      return res.status(400).json({
        success: false,
        message: "Chỉ số dinh dưỡng không được âm",
      });
    }

    if ([calories, protein, fat, carb].some((num) => Number.isNaN(Number(num)))) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu dinh dưỡng phải là số hợp lệ",
      });
    }

    // check trùng tên
    const existingFood = await Food.findOne({ name });

    if (existingFood) {
      return res.status(400).json({
        success: false,
        message: "Món ăn đã tồn tại",
      });
    }

    const food = new Food(req.body);
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
    const foods = await Food.find();

    res.json({
      success: true,
      data: foods,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    const food = await Food.findById(id);

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
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Món ăn không tồn tại",
      });
    }

    const { ingredients } = req.body;
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
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Món ăn không tồn tại",
      });
    }

    await food.deleteOne();

    res.json({
      success: true,
      message: "Xóa món ăn thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};