const express = require('express');
const blogController = require('../controller/blogController');

const router = express.Router();

/**
 * @openapi
 * /api/blogs/published:
 *   get:
 *     summary: Lấy danh sách các bài viết đã xuất bản
 *     tags:
 *       - Blogs
 *     responses:
 *       200:
 *         description: Danh sách bài viết
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Blog'
 */
router.get('/published', blogController.getPublishedBlogs);

/**
 * @openapi
 * /api/blogs/categories:
 *   get:
 *     summary: Lấy danh sách các danh mục bài viết
 *     tags:
 *       - Blogs
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BlogCategory'
 */
router.get('/categories', blogController.getBlogCategories);

/**
 * @openapi
 * /api/blogs/{id}:
 *   get:
 *     summary: Lấy chi tiết một bài viết đã xuất bản theo ID
 *     tags:
 *       - Blogs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết bài viết
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       404:
 *         description: Không tìm thấy bài viết
 */
router.get('/:id', blogController.getPublishedBlogById);

module.exports = router;
