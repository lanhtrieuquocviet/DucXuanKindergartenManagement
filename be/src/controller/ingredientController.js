const Ingredient = require('../models/Ingredient');

exports.getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find().sort({ name: 1 });
    res.json({ success: true, data: ingredients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createIngredient = async (req, res) => {
  try {
    const { name, unit, calories, protein, fat, carb } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên nguyên liệu là bắt buộc' });
    }

    const existed = await Ingredient.findOne({ name: name.trim() });
    if (existed) {
      return res.status(400).json({ success: false, message: 'Nguyên liệu đã tồn tại' });
    }

    const ingredient = new Ingredient({
      name: name.trim(),
      unit: unit || '100g',
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      fat: Number(fat) || 0,
      carb: Number(carb) || 0,
    });

    await ingredient.save();

    res.status(201).json({ success: true, message: 'Tạo nguyên liệu thành công', data: ingredient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
