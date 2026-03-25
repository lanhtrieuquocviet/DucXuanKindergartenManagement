const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { listGrades, createGrade, updateGrade, deleteGrade } = require('../controller/gradeController');

const router = express.Router();

/**
 * @openapi
 * /api/grades:
 *   get:
 *     summary: Lấy danh sách khối lớp
 *     tags:
 *       - Grades
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách khối lớp
 *       403:
 *         description: Không có quyền SchoolAdmin
 *   post:
 *     summary: Tạo khối lớp mới
 *     tags:
 *       - Grades
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gradeName
 *             properties:
 *               gradeName:
 *                 type: string
 *                 example: Lá
 *               description:
 *                 type: string
 *                 example: Khối lớp lá (5-6 tuổi)
 *     responses:
 *       201:
 *         description: Tạo khối lớp thành công
 */
router.get('/', authenticate, authorizeRoles('SchoolAdmin'), listGrades);

/**
 * @openapi
 * /api/grades:
 *   post:
 *     summary: Tạo khối lớp mới (Chỉ SchoolAdmin)
 *     tags:
 *       - Grades
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Grade'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 */
router.post('/', authenticate, authorizeRoles('SchoolAdmin'), createGrade);

/**
 * @openapi
 * /api/grades/{id}:
 *   put:
 *     summary: Cập nhật khối lớp
 *     tags:
 *       - Grades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID khối lớp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gradeName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy khối lớp
 *   delete:
 *     summary: Xóa khối lớp
 *     tags:
 *       - Grades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID khối lớp
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy khối lớp
 */
router.put('/:id', authenticate, authorizeRoles('SchoolAdmin'), updateGrade);

/**
 * @openapi
 * /api/grades/{id}:
 *   delete:
 *     summary: Xóa khối lớp (Chỉ SchoolAdmin)
 *     tags:
 *       - Grades
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
 *         description: Xóa thành công
 */
router.delete('/:id', authenticate, authorizeRoles('SchoolAdmin'), deleteGrade);

module.exports = router;
