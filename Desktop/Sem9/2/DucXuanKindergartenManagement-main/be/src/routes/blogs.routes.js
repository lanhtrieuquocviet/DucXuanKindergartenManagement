const express = require('express');
const blogController = require('../controller/blogController');

const router = express.Router();

// Public endpoint - get published blogs
router.get('/published', blogController.getPublishedBlogs);

// Public endpoint - list available categories
router.get('/categories', blogController.getBlogCategories);

module.exports = router;
