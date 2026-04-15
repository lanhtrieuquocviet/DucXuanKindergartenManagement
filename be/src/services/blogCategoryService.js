const BlogCategory = require('../models/BlogCategory');
const Blog = require('../models/Blog');

// GET /api/school-admin/blog-categories
const listBlogCategories = async (req, res) => {
  try {
    const categories = await BlogCategory.find().sort({ name: 1 });
    return res.status(200).json({ status: 'success', data: categories });
  } catch (error) {
    console.error('listBlogCategories error:', error);
    return res.status(500).json({ status: 'error', message: 'Không tải được danh mục' });
  }
};

// POST /api/school-admin/blog-categories
const createBlogCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Tên danh mục không được để trống' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ status: 'error', message: 'Tên danh mục tối đa 100 ký tự' });
    }

    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Trạng thái không hợp lệ' });
    }

    const existing = await BlogCategory.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Tên danh mục đã tồn tại' });
    }

    const category = await BlogCategory.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      status: status || 'active',
    });

    return res.status(201).json({ status: 'success', data: category });
  } catch (error) {
    console.error('createBlogCategory error:', error);
    return res.status(500).json({ status: 'error', message: 'Tạo danh mục thất bại' });
  }
};

// PUT /api/school-admin/blog-categories/:id
const updateBlogCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Trạng thái không hợp lệ' });
    }


    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Tên danh mục không được để trống' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ status: 'error', message: 'Tên danh mục tối đa 100 ký tự' });
    }

    const category = await BlogCategory.findById(id);
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy danh mục' });
    }

    const duplicate = await BlogCategory.findOne({ name: name.trim(), _id: { $ne: id } });
    if (duplicate) {
      return res.status(400).json({ status: 'error', message: 'Tên danh mục đã tồn tại' });
    }

    category.name = name.trim();
    category.description = description ? description.trim() : category.description;
    if (status) category.status = status;
    await category.save();

    return res.status(200).json({ status: 'success', data: category });
  } catch (error) {
    console.error('updateBlogCategory error:', error);
    return res.status(500).json({ status: 'error', message: 'Cập nhật danh mục thất bại' });
  }
};

// DELETE /api/school-admin/blog-categories/:id
const deleteBlogCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await BlogCategory.findById(id);
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy danh mục' });
    }

    const blogsUsing = await Blog.countDocuments({ category: id });
    if (blogsUsing > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Không thể xóa — có ${blogsUsing} bài viết đang dùng danh mục này`,
      });
    }

    await BlogCategory.findByIdAndDelete(id);
    return res.status(200).json({ status: 'success', data: { id } });
  } catch (error) {
    console.error('deleteBlogCategory error:', error);
    return res.status(500).json({ status: 'error', message: 'Xóa danh mục thất bại' });
  }
};

module.exports = {
  listBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
};
