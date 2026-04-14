const service = require('../services/contactService.js');

const validateSubmitContact = async (req, res, next) => service.validateSubmitContact(req, res, next);
const submitContact = async (req, res, next) => service.submitContact(req, res, next);
const listContacts = async (req, res, next) => service.listContacts(req, res, next);
const validateReplyContact = async (req, res, next) => service.validateReplyContact(req, res, next);
const replyContact = async (req, res, next) => service.replyContact(req, res, next);
const clearReplyContact = async (req, res, next) => service.clearReplyContact(req, res, next);
const resendReplyEmail = async (req, res, next) => service.resendReplyEmail(req, res, next);

module.exports = {
  validateSubmitContact,
  submitContact,
  listContacts,
  validateReplyContact,
  replyContact,
  clearReplyContact,
  resendReplyEmail,
};
