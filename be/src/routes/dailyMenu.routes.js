const express = require("express");
const dailyMenuController = require("../controller/dailyMenu.controller");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const router = express.Router();
router.put(
  "/:id",
  authenticate,
  authorizeRoles("KitchenStaff"),
  dailyMenuController.updateDailyMenu
);
module.exports = router;