const express = require('express');
const { listPublicVideoClips } = require('../controller/videoClipController');

const router = express.Router();

router.get('/', listPublicVideoClips);

module.exports = router;
