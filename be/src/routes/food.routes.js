const express = require("express");
const router = express.Router();
const foodController = require("../controller/foodController");
const { authenticate, authorizePermissions } = require("../middleware/auth");

router.get("/", authenticate, authorizePermissions('MANAGE_FOOD'), foodController.getFoods);
router.post("/", authenticate, authorizePermissions('MANAGE_FOOD'), foodController.createFood);
router.get("/:id", authenticate, authorizePermissions('MANAGE_FOOD'), foodController.getFoodById);
router.put("/:id", authenticate, authorizePermissions('MANAGE_FOOD'), foodController.updateFood);
router.delete("/:id", authenticate, authorizePermissions('MANAGE_FOOD'), foodController.deleteFood);

module.exports = router;
