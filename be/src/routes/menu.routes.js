const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const router = express.Router();
const menuController = require("../controller/menuController");
const districtNutritionPlanController = require("../controller/districtNutritionPlanController");
const { authenticate, authorizePermissions, authorizeAnyPermission } = require("../middleware/auth");

const nutritionUploadDir = path.join(__dirname, "../uploads/nutrition-plans");
if (!fs.existsSync(nutritionUploadDir)) {
  fs.mkdirSync(nutritionUploadDir, { recursive: true });
}

const nutritionStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, nutritionUploadDir),
  filename: (_, file, cb) => {
    const safe = (file.originalname || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const nutritionUpload = multer({
  storage: nutritionStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const name = file.originalname || "";
    if (/\.(docx|doc)$/i.test(name)) return cb(null, true);
    cb(new Error("Chỉ chấp nhận file Word (.doc, .docx)"));
  },
});

function nutritionUploadOptional(req, res, next) {
  nutritionUpload.single("regulationFile")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Tải file thất bại",
      });
    }
    next();
  });
}

/**
 * @openapi
 * /api/menus:
 *   get:
 *     summary: Lấy danh sách thực đơn
 *     tags:
 *       - Menus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, approved, rejected]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách thực đơn
 *   post:
 *     summary: Tạo thực đơn mới (KitchenStaff)
 *     tags:
 *       - Menus
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - weekStart
 *             properties:
 *               name:
 *                 type: string
 *                 example: Thực đơn tuần 38/2024
 *               weekStart:
 *                 type: string
 *                 format: date
 *                 example: "2024-09-16"
 *               items:
 *                 type: array
 *                 description: Danh sách món ăn trong tuần
 *     responses:
 *       201:
 *         description: Tạo thực đơn thành công
 *       403:
 *         description: Không có quyền KitchenStaff
 */
// Public: no auth required, only approved/active/completed menus
router.get("/public", menuController.getPublicMenus);
router.get("/public/:id", menuController.getPublicMenuDetail);
router.get("/", authenticate, menuController.getMenus);
router.post("/", authenticate, authorizePermissions("MANAGE_MENU"), menuController.createMenu);
router.get("/nutrition-plan", authenticate, menuController.getNutritionPlanSetting);
router.put(
  "/nutrition-plan",
  authenticate,
  authorizePermissions("APPROVE_MENU"),
  menuController.updateNutritionPlanSetting
);

router.get(
  "/district-nutrition-plans",
  authenticate,
  authorizeAnyPermission("APPROVE_MENU", "MANAGE_MENU"),
  districtNutritionPlanController.listDistrictNutritionPlans
);
router.get(
  "/district-nutrition-plans/:id",
  authenticate,
  authorizeAnyPermission("APPROVE_MENU", "MANAGE_MENU"),
  districtNutritionPlanController.getDistrictNutritionPlanDetail
);
router.post(
  "/district-nutrition-plans",
  authenticate,
  authorizePermissions("APPROVE_MENU"),
  nutritionUploadOptional,
  districtNutritionPlanController.createDistrictNutritionPlan
);
router.get(
  "/district-nutrition-plans/:id/regulation",
  authenticate,
  authorizeAnyPermission("APPROVE_MENU", "MANAGE_MENU"),
  districtNutritionPlanController.downloadRegulationFile
);
router.put(
  "/district-nutrition-plans/:id",
  authenticate,
  authorizePermissions("APPROVE_MENU"),
  nutritionUploadOptional,
  districtNutritionPlanController.updateDistrictNutritionPlan
);
router.put(
  "/district-nutrition-plans/:id/scheduled",
  authenticate,
  authorizePermissions("APPROVE_MENU"),
  nutritionUploadOptional,
  districtNutritionPlanController.updateScheduledDistrictPlan
);
router.patch(
  "/district-nutrition-plans/:id/apply-now",
  authenticate,
  authorizePermissions("APPROVE_MENU"),
  districtNutritionPlanController.applyScheduledDistrictPlanNow
);
router.delete(
  "/district-nutrition-plans/:id/scheduled",
  authenticate,
  authorizePermissions("APPROVE_MENU"),
  districtNutritionPlanController.deleteScheduledDistrictPlan
);
router.patch(
  "/district-nutrition-plans/:id/end",
  authenticate,
  authorizePermissions("APPROVE_MENU"),
  districtNutritionPlanController.endDistrictNutritionPlan
);

/**
 * @openapi
 * /api/menus/{id}:
 *   get:
 *     summary: Lấy chi tiết thực đơn
 *     tags:
 *       - Menus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thực đơn
 *     responses:
 *       200:
 *         description: Chi tiết thực đơn
 *       404:
 *         description: Không tìm thấy thực đơn
 *   put:
 *     summary: Cập nhật thực đơn (KitchenStaff)
 *     tags:
 *       - Menus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               items:
 *                 type: array
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.get("/:id", authenticate, menuController.getMenuDetail);
router.put("/:id", authenticate, authorizePermissions("MANAGE_MENU"), menuController.updateMenu);

/**
 * @openapi
 * /api/menus/{id}/submit:
 *   put:
 *     summary: Gửi thực đơn lên SchoolAdmin duyệt (KitchenStaff)
 *     tags:
 *       - Menus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Gửi duyệt thành công
 *       400:
 *         description: Thực đơn không ở trạng thái draft
 */
router.put("/:id/submit", authenticate, authorizePermissions("MANAGE_MENU"), menuController.submitMenu);

/**
 * @openapi
 * /api/menus/{id}/approve:
 *   put:
 *     summary: Duyệt thực đơn (SchoolAdmin)
 *     tags:
 *       - Menus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Duyệt thực đơn thành công
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.put("/:id/approve", authenticate, authorizePermissions("APPROVE_MENU"), menuController.approveMenu);

/**
 * @openapi
 * /api/menus/{id}/reject:
 *   put:
 *     summary: Từ chối thực đơn (SchoolAdmin)
 *     tags:
 *       - Menus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Thực đơn chưa đủ dinh dưỡng
 *     responses:
 *       200:
 *         description: Từ chối thực đơn thành công
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.put("/:id/reject", authenticate, authorizePermissions("APPROVE_MENU"), menuController.rejectMenu);

router.patch(
  "/:id/request-edit",
  authenticate,
  authorizePermissions("APPROVE_MENU"),
  menuController.requestEditFromActiveMenu
);

router.patch(
  "/:id/apply",
  authenticate,
  authorizePermissions("APPROVE_MENU"),
  menuController.applyMenu
);
router.patch(
  "/:id/end",
  authenticate,
  authorizePermissions("APPROVE_MENU"),
  menuController.endMenu
);

// Hội trưởng phụ huynh xem xét thực đơn (có hoặc không có ý kiến) → chuyển lên ban giám hiệu
router.put(
  "/:id/headparent-review",
  authenticate,
  authorizePermissions("REVIEW_MENU"),
  menuController.headParentReviewMenu
);

module.exports = router;
