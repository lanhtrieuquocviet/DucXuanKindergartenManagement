const express = require('express');
const bannerController = require('../controller/bannerController');

const router = express.Router();

router.get('/homepage', bannerController.getPublicHomepageBanners);

module.exports = router;
