const Ingredient = require('../models/Ingredient');
const Food = require('../models/Food');

const CATEGORY_IDS = ['luong_thuc', 'giau_dam', 'rau_cu', 'gia_vi', 'phu_lieu'];
const NUTRITION_FIELDS = [
  { key: 'protein', label: 'Đạm' },
  { key: 'fat', label: 'Béo' },
  { key: 'carb', label: 'Tinh bột' },
];

const calculateCaloriesFromMacros = (protein, fat, carb) => {
  const p = Number(protein) || 0;
  const f = Number(fat) || 0;
  const c = Number(carb) || 0;
  return Math.round((p * 4 + f * 9 + c * 4) * 10) / 10;
};

const normalizeName = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const parseNutritionPayload = (body = {}) => {
  const parsedValues = {};

  for (const field of NUTRITION_FIELDS) {
    const rawValue = body[field.key];
    const parsed = rawValue === '' || rawValue === undefined || rawValue === null ? 0 : Number(rawValue);

    if (Number.isNaN(parsed)) {
      return { error: `${field.label} phải là số hợp lệ` };
    }
    if (parsed < 0) {
      return { error: `${field.label} không được là số âm` };
    }

    parsedValues[field.key] = parsed;
  }

  parsedValues.calories = calculateCaloriesFromMacros(
    parsedValues.protein,
    parsedValues.fat,
    parsedValues.carb
  );

  return { values: parsedValues };
};

exports.getIngredients = async (req, res) => {
  try {
    const filter = req.query?.filter;
    const isDeletedQuery =
      filter === 'deleted'
        ? true
        : filter === 'all'
          ? undefined
          : { $ne: true };
    const query = isDeletedQuery === undefined ? {} : { isDeleted: isDeletedQuery };
    const missing = await Ingredient.countDocuments({
      ...(isDeletedQuery === undefined ? {} : { isDeleted: isDeletedQuery }),
      $or: [{ category: { $exists: false } }, { category: null }, { category: '' }],
    });
    if (missing > 0) {
      await Ingredient.updateMany(
        {
          ...(isDeletedQuery === undefined ? {} : { isDeleted: isDeletedQuery }),
          $or: [{ category: { $exists: false } }, { category: null }, { category: '' }],
        },
        { $set: { category: 'luong_thuc' } }
      );
    }
    const ingredients = await Ingredient.find(query).sort({ category: 1, name: 1 });
    res.json({ success: true, data: ingredients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createIngredient = async (req, res) => {
  try {
    const { name, unit, protein, fat, carb, category } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên nguyên liệu là bắt buộc' });
    }

    const cat = CATEGORY_IDS.includes(category) ? category : 'luong_thuc';

    const normalizedName = name.trim();
    const existed = await Ingredient.findOne({ name: normalizedName });
    if (existed) {
      if (existed.isDeleted) {
        existed.name = normalizedName;
        existed.category = cat;
        existed.unit = unit || '100g';
        Object.assign(existed, nutrition.values, { isDeleted: false, deletedAt: null });
        await existed.save();
        return res.status(200).json({
          success: true,
          message: 'Khôi phục nguyên liệu thành công',
          data: existed,
        });
      }
      return res.status(400).json({ success: false, message: 'Nguyên liệu đã tồn tại' });
    }

    const nutrition = parseNutritionPayload({ protein, fat, carb });
    if (nutrition.error) {
      return res.status(400).json({ success: false, message: nutrition.error });
    }

    const ingredient = new Ingredient({
      name: normalizedName,
      category: cat,
      unit: unit || '100g',
      ...nutrition.values,
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
    const { name, unit, protein, fat, carb, category } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên nguyên liệu là bắt buộc' });
    }

    const cat = CATEGORY_IDS.includes(category) ? category : 'luong_thuc';

    // Check if name is duplicate (excluding current ingredient)
    const existed = await Ingredient.findOne({
      name: name.trim(),
      isDeleted: { $ne: true },
      _id: { $ne: id }
    });
    if (existed) {
      return res.status(400).json({ success: false, message: 'Nguyên liệu đã tồn tại' });
    }

    const nutrition = parseNutritionPayload({ protein, fat, carb });
    if (nutrition.error) {
      return res.status(400).json({ success: false, message: nutrition.error });
    }

    const ingredient = await Ingredient.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        category: cat,
        unit: unit || '100g',
        ...nutrition.values,
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
    const ingredient = await Ingredient.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Nguyên liệu không tồn tại' });
    }

    const targetIngredientName = normalizeName(ingredient.name);
    const foodsWithIngredients = await Food.find({
      isDeleted: { $ne: true },
      ingredients: { $exists: true, $ne: [] },
    }).select('_id name ingredients.name');
    const foodsUsingIngredient = foodsWithIngredients.filter((food) =>
      (food.ingredients || []).some((line) => normalizeName(line?.name) === targetIngredientName)
    );

    if (foodsUsingIngredient.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa: nguyên liệu đang được sử dụng trong món ăn đang dùng',
      });
    }

    const deletedIngredient = await Ingredient.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    res.json({ success: true, message: 'Xóa nguyên liệu thành công', data: deletedIngredient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.restoreIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const ingredient = await Ingredient.findById(id);

    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Nguyên liệu không tồn tại' });
    }

    if (!ingredient.isDeleted) {
      return res.json({ success: true, message: 'Nguyên liệu đang hoạt động', data: ingredient });
    }

    ingredient.isDeleted = false;
    ingredient.deletedAt = null;
    await ingredient.save();

    return res.json({ success: true, message: 'Khôi phục nguyên liệu thành công', data: ingredient });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
