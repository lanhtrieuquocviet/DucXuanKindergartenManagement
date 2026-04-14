const service = require('../services/studentService.js');

const getStudents = async (req, res, next) => service.getStudents(req, res, next);
const createStudent = async (req, res, next) => service.createStudent(req, res, next);
const createStudentWithParent = async (req, res, next) => service.createStudentWithParent(req, res, next);
const getStudentDetail = async (req, res, next) => service.getStudentDetail(req, res, next);
const updateStudent = async (req, res, next) => service.updateStudent(req, res, next);
const deleteStudent = async (req, res, next) => service.deleteStudent(req, res, next);
const checkUsernameAvailability = async (req, res, next) => service.checkUsernameAvailability(req, res, next);
const checkParentByPhone = async (req, res, next) => service.checkParentByPhone(req, res, next);
const importStudentsWithParents = async (req, res, next) => service.importStudentsWithParents(req, res, next);

module.exports = {
  getStudents,
  createStudent,
  createStudentWithParent,
  getStudentDetail,
  updateStudent,
  deleteStudent,
  checkUsernameAvailability,
  checkParentByPhone,
  importStudentsWithParents,
};
