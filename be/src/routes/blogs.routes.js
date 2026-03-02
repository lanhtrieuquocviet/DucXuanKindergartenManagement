const express = require('express');
const blogController = require('../controller/blogController');

const router = express.Router();

// Public endpoint - get published blogs
router.get('/published', blogController.getPublishedBlogs);

// Public endpoint - list available categories
router.get('/categories', blogController.getBlogCategories);

// Public endpoint - get single published blog by id
router.get('/:id', blogController.getPublishedBlogById);

module.exports = router;
