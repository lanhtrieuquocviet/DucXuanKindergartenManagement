const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { listGrades, createGrade, updateGrade, deleteGrade } = require('../controller/gradeController');

const router = express.Router();

/**
 * @openapi
 * /api/grades:
 *   get:
 *     summary: Lấy danh sách tất cả các khối lớp (Chỉ SchoolAdmin)
 *     tags:
 *       - Grades
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách khối lớp
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Grade'
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
 *     summary: Cập nhật thông tin khối lớp (Chỉ SchoolAdmin)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Grade'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
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
