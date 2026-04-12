const Ingredient = require('../models/Ingredient');

const CATEGORY_IDS = ['luong_thuc', 'giau_dam', 'rau_cu', 'gia_vi', 'phu_lieu'];

exports.getIngredients = async (req, res) => {
  try {
    const missing = await Ingredient.countDocuments({
      $or: [{ category: { $exists: false } }, { category: null }, { category: '' }],
    });
    if (missing > 0) {
      await Ingredient.updateMany(
        { $or: [{ category: { $exists: false } }, { category: null }, { category: '' }] },
        { $set: { category: 'luong_thuc' } }
      );
    }
    const ingredients = await Ingredient.find().sort({ category: 1, name: 1 });
    res.json({ success: true, data: ingredients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createIngredient = async (req, res) => {
  try {
    const { name, unit, calories, protein, fat, carb, category } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên nguyên liệu là bắt buộc' });
    }

    const cat = CATEGORY_IDS.includes(category) ? category : 'luong_thuc';

    const existed = await Ingredient.findOne({ name: name.trim() });
    if (existed) {
      return res.status(400).json({ success: false, message: 'Nguyên liệu đã tồn tại' });
    }

    const ingredient = new Ingredient({
      name: name.trim(),
      category: cat,
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

exports.updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, calories, protein, fat, carb, category } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên nguyên liệu là bắt buộc' });
    }

    const cat = CATEGORY_IDS.includes(category) ? category : 'luong_thuc';

    // Check if name is duplicate (excluding current ingredient)
    const existed = await Ingredient.findOne({
      name: name.trim(),
      _id: { $ne: id }
    });
    if (existed) {
      return res.status(400).json({ success: false, message: 'Nguyên liệu đã tồn tại' });
    }

    const ingredient = await Ingredient.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        category: cat,
        unit: unit || '100g',
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        fat: Number(fat) || 0,
        carb: Number(carb) || 0,
      },
      { new: true }
    );

    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Nguyên liệu không tồn tại' });
    }

    res.json({ success: true, message: 'Cập nhật nguyên liệu thành công', data: ingredient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;

    const ingredient = await Ingredient.findByIdAndDelete(id);

    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Nguyên liệu không tồn tại' });
    }

    res.json({ success: true, message: 'Xóa nguyên liệu thành công', data: ingredient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
