const Blog = require('../models/Blog');

const validateBlogPayload = (body, isCreate = true) => {
  const errors = [];

  if (isCreate && !body.code) errors.push('Code không được để trống');
  if (body.code && typeof body.code !== 'string') errors.push('Code không hợp lệ');

  if (isCreate && !body.title) errors.push('Tiêu đề không được để trống');
  if (body.title && typeof body.title !== 'string') errors.push('Tiêu đề không hợp lệ');

  if (isCreate && !body.description) errors.push('Mô tả không được để trống');
  if (body.description && typeof body.description !== 'string') {
    errors.push('Mô tả không hợp lệ');
  }

  if (body.description && body.description.length > 5000) {
    errors.push('Mô tả quá dài (tối đa 5000 ký tự)');
  }

  return errors;
};

// GET /api/school-admin/blogs
const listBlogs = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { code: new RegExp(search, 'i') },
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Blog.find(filter)
        .populate('author', 'username fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Blog.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('listBlogs error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Không tải được danh sách blog',
    });
  }
};

// GET /api/school-admin/blogs/:id
const getBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id).populate('author', 'username fullName email');

    if (!blog) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy blog',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: blog,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getBlog error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy chi tiết blog',
    });
  }
};

// POST /api/school-admin/blogs
const createBlog = async (req, res) => {
  try {
    const { code, title, description, category, imageUrl, status } = req.body;

    const errors = validateBlogPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: errors.join(', '),
      });
    }

    const existing = await Blog.findOne({ code });
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: 'Code đã tồn tại, vui lòng chọn code khác',
      });
    }

    const blog = await Blog.create({
      code: code.trim(),
      title: title.trim(),
      description: description.trim(),
      category: category ? category.trim() : '',
      imageUrl: imageUrl ? imageUrl.trim() : '',
      status: status || 'draft',
      author: req.user.id,
    });

    const populated = await Blog.findById(blog._id).populate(
      'author',
      'username fullName email'
    );

    return res.status(201).json({
      status: 'success',
      data: populated,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('createBlog error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Tạo blog thất bại',
    });
  }
};

// PUT /api/school-admin/blogs/:id
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, title, description, category, imageUrl, status } = req.body;

    const errors = validateBlogPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: errors.join(', '),
      });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy blog',
      });
    }

    if (code && code !== blog.code) {
      const existed = await Blog.findOne({ code });
      if (existed) {
        return res.status(400).json({
          status: 'error',
          message: 'Code đã tồn tại, vui lòng chọn code khác',
        });
      }
      blog.code = code.trim();
    }

    if (title !== undefined) blog.title = title.trim();
    if (description !== undefined) blog.description = description.trim();
    if (category !== undefined) blog.category = category ? category.trim() : '';
    if (imageUrl !== undefined) blog.imageUrl = imageUrl ? imageUrl.trim() : '';
    if (status !== undefined) blog.status = status;

    await blog.save();

    const populated = await Blog.findById(blog._id).populate(
      'author',
      'username fullName email'
    );

    return res.status(200).json({
      status: 'success',
      data: populated,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('updateBlog error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Cập nhật blog thất bại',
    });
  }
};

// DELETE /api/school-admin/blogs/:id
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy blog',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { id: blog._id },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('deleteBlog error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Xóa blog thất bại',
    });
  }
};

module.exports = {
  listBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
};

