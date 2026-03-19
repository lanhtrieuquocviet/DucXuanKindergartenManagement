const express = require('express');
const blogController = require('../controller/blogController');

const router = express.Router();

/**
 * @openapi
 * /api/blogs/published:
 *   get:
 *     summary: Lấy danh sách bài viết đã đăng (public)
 *     tags:
 *       - Blogs (Public)
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo danh mục
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Danh sách bài viết đã đăng
 */
router.get('/published', blogController.getPublishedBlogs);

/**
 * @openapi
 * /api/blogs/categories:
 *   get:
 *     summary: Lấy danh sách danh mục blog (public)
 *     tags:
 *       - Blogs (Public)
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 */
router.get('/categories', blogController.getBlogCategories);

/**
 * @openapi
 * /api/blogs/{id}:
 *   get:
 *     summary: Lấy chi tiết bài viết đã đăng (public)
 *     tags:
 *       - Blogs (Public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bài viết
 *     responses:
 *       200:
 *         description: Chi tiết bài viết
 *       404:
 *         description: Không tìm thấy bài viết hoặc chưa được đăng
 */
router.get('/:id', blogController.getPublishedBlogById);

module.exports = router;
