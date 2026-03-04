const express = require('express');
const { getPublishedPublicInfos, getPublishedPublicInfoById } = require('../controller/publicInfoController');

const router = express.Router();

router.get('/', getPublishedPublicInfos);
router.get('/:id', getPublishedPublicInfoById);

module.exports = router;
