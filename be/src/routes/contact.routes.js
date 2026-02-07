const express = require('express');
const contactController = require('../controller/contactController');

const router = express.Router();

/** Public: gửi liên hệ */
router.post(
  '/',
  contactController.validateSubmitContact,
  contactController.submitContact
);

module.exports = router;
