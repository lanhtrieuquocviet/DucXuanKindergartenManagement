const service = require('../services/documentService.js');

const listDocuments = async (req, res, next) => service.listDocuments(req, res, next);
const getDocument = async (req, res, next) => service.getDocument(req, res, next);
const createDocument = async (req, res, next) => service.createDocument(req, res, next);
const updateDocument = async (req, res, next) => service.updateDocument(req, res, next);
const deleteDocument = async (req, res, next) => service.deleteDocument(req, res, next);
const getPublishedDocuments = async (req, res, next) => service.getPublishedDocuments(req, res, next);
const getPublishedDocumentById = async (req, res, next) => service.getPublishedDocumentById(req, res, next);

module.exports = {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getPublishedDocuments,
  getPublishedDocumentById,
};
