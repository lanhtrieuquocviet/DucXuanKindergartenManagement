const express = require('express');
const documentController = require('../controller/documentController');

const router = express.Router();

// Public endpoint - get list of published documents
router.get('/published', documentController.getPublishedDocuments);

// Public endpoint - get single published document
router.get('/:id', documentController.getPublishedDocumentById);

module.exports = router;
