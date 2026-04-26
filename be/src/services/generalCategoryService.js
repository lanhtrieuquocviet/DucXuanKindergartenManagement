const GeneralCategory = require('../models/GeneralCategory');

exports.listCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;
    
    const categories = await GeneralCategory.find(filter).sort({ name: 1 }).lean();
    return res.status(200).json({ status: 'success', data: categories });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, type, description, status } = req.body;
    if (!name || !type) {
      return res.status(400).json({ status: 'error', message: 'Tên và loại danh mục là bắt buộc' });
    }

    const existing = await GeneralCategory.findOne({ name: name.trim(), type });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Danh mục này đã tồn tại trong nhóm này' });
    }

    const category = await GeneralCategory.create({
      name: name.trim(),
      type,
      description: description || '',
      status: status || 'active',
    });

    return res.status(201).json({ status: 'success', data: category });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const category = await GeneralCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy danh mục' });
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (status) category.status = status;

    await category.save();
    return res.status(200).json({ status: 'success', data: category });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await GeneralCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy danh mục' });
    }

    await GeneralCategory.findByIdAndDelete(req.params.id);
    return res.status(200).json({ status: 'success', message: 'Đã xóa danh mục' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
