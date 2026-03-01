const express = require('express');
const qaController = require('../controller/qaController');

const router = express.Router();

router.get('/questions', qaController.getQuestions);

router.post(
  '/questions',
  qaController.validateCreateQuestion,
  qaController.createQuestion,
);

router.post(
  '/questions/:id/answers',
  qaController.validateCreateAnswer,
  qaController.createAnswer,
);

module.exports = router;

