const express = require("express");
const router = express.Router();
const foodController = require("../controller/foodController");

router.post("/", foodController.createFood);

router.get("/", foodController.getFoods);

router.get("/:id", foodController.getFoodById);

router.put("/:id", foodController.updateFood);

router.delete("/:id", foodController.deleteFood);

module.exports = router;
