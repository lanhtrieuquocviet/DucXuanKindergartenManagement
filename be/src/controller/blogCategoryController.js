const service = require('../services/blogCategoryService.js');

const listBlogCategories = async (req, res, next) => service.listBlogCategories(req, res, next);
const createBlogCategory = async (req, res, next) => service.createBlogCategory(req, res, next);
const updateBlogCategory = async (req, res, next) => service.updateBlogCategory(req, res, next);
const deleteBlogCategory = async (req, res, next) => service.deleteBlogCategory(req, res, next);

module.exports = {
  listBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
};
