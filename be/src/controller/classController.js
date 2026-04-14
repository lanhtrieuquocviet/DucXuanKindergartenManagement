const service = require('../services/classService.js');

const getClassList = async (req, res, next) => service.getClassList(req, res, next);
const getStudentInClass = async (req, res, next) => service.getStudentInClass(req, res, next);
const getClassDetail = async (req, res, next) => service.getClassDetail(req, res, next);
const getGradeList = async (req, res, next) => service.getGradeList(req, res, next);
const createClass = async (req, res, next) => service.createClass(req, res, next);
const updateClass = async (req, res, next) => service.updateClass(req, res, next);
const addStudentsToClass = async (req, res, next) => service.addStudentsToClass(req, res, next);
const removeStudentFromClass = async (req, res, next) => service.removeStudentFromClass(req, res, next);
const deleteClass = async (req, res, next) => service.deleteClass(req, res, next);

module.exports = {
  getClassList,
  getStudentInClass,
  getClassDetail,
  getGradeList,
  createClass,
  updateClass,
  addStudentsToClass,
  removeStudentFromClass,
  deleteClass,
};
