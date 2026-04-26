const service = require('../services/generalCategoryService');

exports.listCategories = (req, res) => service.listCategories(req, res);
exports.createCategory = (req, res) => service.createCategory(req, res);
exports.updateCategory = (req, res) => service.updateCategory(req, res);
exports.deleteCategory = (req, res) => service.deleteCategory(req, res);
