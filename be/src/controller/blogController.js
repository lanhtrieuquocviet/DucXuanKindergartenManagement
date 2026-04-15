const service = require('../services/blogService.js');

const listBlogs = async (req, res, next) => service.listBlogs(req, res, next);
const getBlog = async (req, res, next) => service.getBlog(req, res, next);
const createBlog = async (req, res, next) => service.createBlog(req, res, next);
const updateBlog = async (req, res, next) => service.updateBlog(req, res, next);
const deleteBlog = async (req, res, next) => service.deleteBlog(req, res, next);
const getPublishedBlogs = async (req, res, next) => service.getPublishedBlogs(req, res, next);
const getPublishedBlogById = async (req, res, next) => service.getPublishedBlogById(req, res, next);
const getBlogCategories = async (req, res, next) => service.getBlogCategories(req, res, next);

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
