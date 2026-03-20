const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  updateUserRoles,
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  updateRolePermissions,
  getSystemLogs,
} = require('../controller/systemAdminController');

const router = express.Router();

/**
 * @openapi
 * /api/system-admin/dashboard:
 *   get:
 *     summary: Dashboard SystemAdmin
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin dashboard
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền SystemAdmin
 */
router.get('/dashboard', authenticate, authorizeRoles('SystemAdmin'), (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Trang SystemAdmin dashboard',
    data: {
      user: req.user,
    },
  });
});

/**
 * @openapi
 * /api/system-admin/users:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 *       403:
 *         description: Không có quyền SystemAdmin
 *   post:
 *     summary: Tạo tài khoản người dùng mới
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: teacher01
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Pass@1234
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn B
 *               email:
 *                 type: string
 *                 format: email
 *                 example: teacher@school.vn
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["664abc123def456789012345"]
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc username đã tồn tại
 *       403:
 *         description: Không có quyền SystemAdmin
 */
router.get('/users', authenticate, authorizeRoles('SystemAdmin'), getUsers);
router.post('/users', authenticate, authorizeRoles('SystemAdmin'), createUser);

/**
 * @openapi
 * /api/system-admin/users/{id}:
 *   put:
 *     summary: Cập nhật thông tin tài khoản người dùng
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy người dùng
 *   delete:
 *     summary: Xóa tài khoản người dùng
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người dùng
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.put('/users/:id', authenticate, authorizeRoles('SystemAdmin'), updateUser);
router.delete('/users/:id', authenticate, authorizeRoles('SystemAdmin'), deleteUser);

/**
 * @openapi
 * /api/system-admin/users/{id}/roles:
 *   put:
 *     summary: Cập nhật danh sách role cho người dùng
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleIds
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["664abc123def456789012345"]
 *     responses:
 *       200:
 *         description: Cập nhật role thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.put('/users/:id/roles', authenticate, authorizeRoles('SystemAdmin'), updateUserRoles);

/**
 * @openapi
 * /api/system-admin/roles:
 *   get:
 *     summary: Lấy danh sách tất cả role
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách role
 *   post:
 *     summary: Tạo role mới
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleName
 *             properties:
 *               roleName:
 *                 type: string
 *                 example: KitchenStaff
 *               description:
 *                 type: string
 *                 example: Nhân viên bếp
 *     responses:
 *       201:
 *         description: Tạo role thành công
 *       400:
 *         description: Role đã tồn tại
 */
router.get('/roles', authenticate, authorizeRoles('SystemAdmin'), getRoles);
router.post('/roles', authenticate, authorizeRoles('SystemAdmin'), createRole);

/**
 * @openapi
 * /api/system-admin/roles/{id}:
 *   put:
 *     summary: Cập nhật role
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy role
 *   delete:
 *     summary: Xóa role
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID role
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy role
 */
router.put('/roles/:id', authenticate, authorizeRoles('SystemAdmin'), updateRole);
router.delete('/roles/:id', authenticate, authorizeRoles('SystemAdmin'), deleteRole);

/**
 * @openapi
 * /api/system-admin/roles/{id}/permissions:
 *   put:
 *     summary: Cập nhật danh sách permissions cho role
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionCodes
 *             properties:
 *               permissionCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["MANAGE_DOCUMENTS", "MANAGE_BLOG_CATEGORY"]
 *     responses:
 *       200:
 *         description: Cập nhật permissions thành công
 *       404:
 *         description: Không tìm thấy role
 */
router.put('/roles/:id/permissions', authenticate, authorizeRoles('SystemAdmin'), updateRolePermissions);

/**
 * @openapi
 * /api/system-admin/permissions:
 *   get:
 *     summary: Lấy danh sách tất cả permissions
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách permissions
 *   post:
 *     summary: Tạo permission mới
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: MANAGE_DOCUMENTS
 *               description:
 *                 type: string
 *                 example: Quản lý tài liệu
 *     responses:
 *       201:
 *         description: Tạo permission thành công
 *       400:
 *         description: Permission code đã tồn tại
 */
router.get('/permissions', authenticate, authorizeRoles('SystemAdmin'), getPermissions);
router.post('/permissions', authenticate, authorizeRoles('SystemAdmin'), createPermission);

/**
 * @openapi
 * /api/system-admin/permissions/{id}:
 *   put:
 *     summary: Cập nhật permission
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID permission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy permission
 *   delete:
 *     summary: Xóa permission
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID permission
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy permission
 */
router.put('/permissions/:id', authenticate, authorizeRoles('SystemAdmin'), updatePermission);
router.delete('/permissions/:id', authenticate, authorizeRoles('SystemAdmin'), deletePermission);

/**
 * @openapi
 * /api/system-admin/system-logs:
 *   get:
 *     summary: Lấy nhật ký hệ thống
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Danh sách nhật ký hệ thống
 *       403:
 *         description: Không có quyền SystemAdmin
 */
router.get('/system-logs', authenticate, authorizeRoles('SystemAdmin'), getSystemLogs);

module.exports = router;
