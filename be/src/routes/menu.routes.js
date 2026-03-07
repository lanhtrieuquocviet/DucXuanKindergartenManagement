const express = require("express");
const router = express.Router();
const menuController = require("../controller/menuController");
const {
  authenticate,
  authorizeRoles,
  // authorizePermissions, // nếu cần dùng permission code sau này
} = require("../middleware/auth"); // điều chỉnh path nếu cần
router.post("/",authenticate,authorizeRoles('KitchenStaff'), menuController.createMenu);

router.get("/",authenticate,menuController.getMenus);

router.get("/:id",authenticate, menuController.getMenuDetail);

router.put("/:id", authenticate, authorizeRoles('KitchenStaff'),menuController.updateMenu);


router.put("/:id/submit", authenticate, authorizeRoles('KitchenStaff'),menuController.submitMenu);

router.put(
  "/:id/approve",
  authenticate,
  authorizeRoles("SchoolAdmin"),
  menuController.approveMenu
);

router.put(
  "/:id/reject",
  authenticate,
  authorizeRoles("SchoolAdmin"),
  menuController.rejectMenu
);

module.exports = router;
