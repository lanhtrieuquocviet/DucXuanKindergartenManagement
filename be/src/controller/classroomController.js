const service = require('../services/classroomService');

const listClassrooms = async (req, res, next) => service.listClassrooms(req, res, next);
const createClassroom = async (req, res, next) => service.createClassroom(req, res, next);
const updateClassroom = async (req, res, next) => service.updateClassroom(req, res, next);
const deleteClassroom = async (req, res, next) => service.deleteClassroom(req, res, next);

module.exports = {
  listClassrooms,
  createClassroom,
  updateClassroom,
  deleteClassroom,
};
