const express = require('express');
const { listPublicImageLibrary } = require('../controller/imageLibraryController');

const router = express.Router();

router.get('/', listPublicImageLibrary);

module.exports = router;
