const express = require("express");
const router = express.Router();
const aiMenuController = require("../controller/aiMenuController");
const { authenticate } = require("../middleware/auth");

// Health check
router.get("/health", aiMenuController.healthCheck);

// Analyze daily menu - giáo viên / ngoại bếp
router.post("/analyze-menu", authenticate, aiMenuController.analyzeDailyMenu);

// Suggest improvements for a dish
router.post("/improve-dish", authenticate, aiMenuController.improveDish);

// Suggest new dishes based on available ingredients
router.post("/suggest-dishes", authenticate, aiMenuController.suggestNewDishes);

// Chat with AI about menu
router.post("/chat", authenticate, aiMenuController.chatAboutMenu);

// Create dish from AI suggestion - ngoại bếp only
router.post("/create-from-suggestion", authenticate, aiMenuController.createDishFromAISuggestion);

module.exports = router;
