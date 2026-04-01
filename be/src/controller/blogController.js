const Blog = require('../models/Blog');
// Blog categories are now stored in their own collection (BlogCategory)

const validateBlogPayload = (body, isCreate = true) => {
  const errors = [];

  // code required only on creation, on update we allow omitting it
  if (isCreate && !body.code) errors.push('Code không được để trống');
  if (body.code && typeof body.code !== 'string') errors.push('Code không hợp lệ');
  if (body.code && body.code.length > 100) errors.push('Tiêu đề quá dài (tối đa 100 ký tự)');

  if (isCreate && !body.description) errors.push('Mô tả không được để trống');
  if (body.description && typeof body.description !== 'string') {
    errors.push('Mô tả không hợp lệ');
  }

  if (body.description && body.description.length > 500000) {
    errors.push('Nội dung quá dài');
  }

  if (isCreate && !body.category) errors.push('Danh mục không được để trống');
  // category should be a non-empty string representing ObjectId
  if (body.category && typeof body.category !== 'string') {
    errors.push('Danh mục không hợp lệ');
  }

  if (body.images && Array.isArray(body.images)) {
    if (body.images.length > 1) {
      errors.push('Tối đa 1 ảnh bìa cho mỗi bài viết');
    }
    body.images.forEach((img, idx) => {
      if (!img || typeof img !== 'string') {
        errors.push(`Ảnh ${idx + 1} không hợp lệ`);
      }
    });
  }

  if (body.status && !['draft', 'published', 'inactive'].includes(body.status)) {
    errors.push('Trạng thái không hợp lệ (draft | published | inactive)');
  }

  if (body.attachmentUrl && typeof body.attachmentUrl !== 'string') {
    errors.push('URL tệp đính kèm không hợp lệ');
  }
  if (body.attachmentType && !['pdf', 'word'].includes(body.attachmentType)) {
    errors.push('Loại tệp đính kèm không hợp lệ');
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
        .populate('category', 'name')
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
    const blog = await Blog.findById(id)
      .populate('author', 'username fullName email')
      .populate('category', 'name');

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
    const { code, description, category, images, status, attachmentUrl, attachmentType } = req.body;

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

    // verify category id
    const BlogCategory = require('../models/BlogCategory');
    const cat = await BlogCategory.findById(category);
    if (!cat) {
      return res.status(400).json({ status: 'error', message: 'Danh mục không hợp lệ' });
    }

    // Filter images - tối đa 3
    const validImages = Array.isArray(images) 
      ? images.filter(img => img && typeof img === 'string').slice(0, 1)
      : [];

    const blog = await Blog.create({
      code: code.trim(),
      description: description.trim(),
      category: cat._id,
      images: validImages,
      status: status || 'draft',
      author: req.user.id,
      attachmentUrl: attachmentUrl || null,
      attachmentType: attachmentType || null,
    });

    const populated = await Blog.findById(blog._id)
      .populate('author', 'username fullName email')
      .populate('category', 'name');

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
    console.log('updateBlog endpoint hit, body:', req.body);
    const { code, description, category, images, status, attachmentUrl, attachmentType } = req.body;

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

    // allow updating code similar to description: just trim and assign
    if (code !== undefined) {
      blog.code = String(code).trim();
    }

    /* ===== UPDATE OTHER FIELDS ===== */
    if (typeof description === 'string') {
      blog.description = description.trim();
    }

    if (category !== undefined) {
      // category is expected to be an ObjectId
      const BlogCategory = require('../models/BlogCategory');
      const cat = await BlogCategory.findById(category);
      if (!cat) {
        return res.status(400).json({ status: 'error', message: 'Danh mục không hợp lệ' });
      }
      blog.category = cat._id;
    }

    if (images !== undefined) {
      blog.images = Array.isArray(images)
        ? images.filter(img => typeof img === 'string' && img.trim()).slice(0, 1)
        : [];
    }

    if (status !== undefined) {
      blog.status = status;
    }

    if (attachmentUrl !== undefined) {
      blog.attachmentUrl = attachmentUrl || null;
    }
    if (attachmentType !== undefined) {
      blog.attachmentType = attachmentType || null;
    }

    await blog.save();

    const populated = await Blog.findById(blog._id)
      .populate('author', 'username fullName email')
      .populate('category', 'name');

    return res.status(200).json({
      status: 'success',
      data: populated,
    });
  } catch (error) {
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

// GET /api/blogs/published (PUBLIC - for frontend)
const getPublishedBlogs = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    // Filter only published blogs
    const filter = { status: 'published' };
    
    // Optional: filter by category if provided
    if (category && category.trim()) {
      filter.category = category.trim();
    }
    
    // Optional: filter by search term
    if (search && search.trim()) {
      filter.$or = [
        { code: new RegExp(search.trim(), 'i') },
        { description: new RegExp(search.trim(), 'i') },
      ];
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Blog.find(filter)
        .populate('author', 'username fullName email')
        .populate('category', 'name')
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
    console.error('getPublishedBlogs error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Không tải được danh sách blog',
    });
  }
};


// GET /api/blogs/:id (PUBLIC - published only)
const getPublishedBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findOne({ _id: id, status: 'published' })
      .populate('author', 'username fullName')
      .populate('category', 'name');

    if (!blog) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài viết' });
    }

    return res.status(200).json({ status: 'success', data: blog });
  } catch (error) {
    console.error('getPublishedBlogById error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tải bài viết' });
  }
};

// retrieve all categories (public)
const getBlogCategories = async (req, res) => {
  try {
    const BlogCategory = require('../models/BlogCategory');
    // Public side only shows active categories on homepage/menu.
    // Keep backward compatibility for old records without status field.
    const cats = await BlogCategory.find({
      $or: [{ status: 'active' }, { status: { $exists: false } }],
    }).sort({ name: 1 });
    return res.status(200).json({ status: 'success', data: cats });
  } catch (error) {
    console.error('getBlogCategories error:', error);
    return res.status(500).json({ status: 'error', message: 'Không tải được danh mục' });
  }
};

module.exports = {
  listBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  getPublishedBlogs,
  getPublishedBlogById,
  getBlogCategories,
};

