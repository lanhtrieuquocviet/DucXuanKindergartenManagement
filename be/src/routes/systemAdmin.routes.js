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

// Chỉ SystemAdmin mới truy cập được
/**
 * @openapi
 * /api/system-admin/dashboard:
 *   get:
 *     summary: Trang Dashboard dành cho SystemAdmin
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin dashboard
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
 *     summary: Lấy danh sách người dùng và vai trò (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 */
router.get('/users', authenticate, authorizeRoles('SystemAdmin'), getUsers);

/**
 * @openapi
 * /api/system-admin/users:
 *   post:
 *     summary: Tạo người dùng mới (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 */
router.post('/users', authenticate, authorizeRoles('SystemAdmin'), createUser);

/**
 * @openapi
 * /api/system-admin/users/{id}:
 *   put:
 *     summary: Cập nhật người dùng (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/users/:id', authenticate, authorizeRoles('SystemAdmin'), updateUser);

/**
 * @openapi
 * /api/system-admin/users/{id}:
 *   delete:
 *     summary: Xóa người dùng (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/users/:id', authenticate, authorizeRoles('SystemAdmin'), deleteUser);

/**
 * @openapi
 * /api/system-admin/roles:
 *   get:
 *     summary: Lấy danh sách vai trò (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách vai trò
 */
router.get('/roles', authenticate, authorizeRoles('SystemAdmin'), getRoles);

/**
 * @openapi
 * /api/system-admin/roles:
 *   post:
 *     summary: Tạo vai trò mới (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Role'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 */
router.post('/roles', authenticate, authorizeRoles('SystemAdmin'), createRole);

/**
 * @openapi
 * /api/system-admin/roles/{id}:
 *   put:
 *     summary: Cập nhật vai trò (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Role'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/roles/:id', authenticate, authorizeRoles('SystemAdmin'), updateRole);

/**
 * @openapi
 * /api/system-admin/roles/{id}:
 *   delete:
 *     summary: Xóa vai trò (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/roles/:id', authenticate, authorizeRoles('SystemAdmin'), deleteRole);

/**
 * @openapi
 * /api/system-admin/users/{id}/roles:
 *   put:
 *     summary: Cập nhật vai trò cho người dùng (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items: { type: 'string' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/users/:id/roles', authenticate, authorizeRoles('SystemAdmin'), updateUserRoles);

/**
 * @openapi
 * /api/system-admin/permissions:
 *   get:
 *     summary: Lấy danh sách quyền (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách quyền
 */
router.get('/permissions', authenticate, authorizeRoles('SystemAdmin'), getPermissions);

/**
 * @openapi
 * /api/system-admin/permissions:
 *   post:
 *     summary: Tạo quyền mới (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Permission'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 */
router.post('/permissions', authenticate, authorizeRoles('SystemAdmin'), createPermission);

/**
 * @openapi
 * /api/system-admin/permissions/{id}:
 *   put:
 *     summary: Cập nhật quyền (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Permission'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/permissions/:id', authenticate, authorizeRoles('SystemAdmin'), updatePermission);

/**
 * @openapi
 * /api/system-admin/permissions/{id}:
 *   delete:
 *     summary: Xóa quyền (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/permissions/:id', authenticate, authorizeRoles('SystemAdmin'), deletePermission);

/**
 * @openapi
 * /api/system-admin/roles/{id}/permissions:
 *   put:
 *     summary: Cập nhật quyền cho vai trò (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionCodes:
 *                 type: array
 *                 items: { type: 'string' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/roles/:id/permissions', authenticate, authorizeRoles('SystemAdmin'), updateRolePermissions);

/**
 * @openapi
 * /api/system-admin/system-logs:
 *   get:
 *     summary: Lấy nhật ký hệ thống (Chỉ SystemAdmin)
 *     tags:
 *       - SystemAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách nhật ký
 */
router.get('/system-logs', authenticate, authorizeRoles('SystemAdmin'), getSystemLogs);

module.exports = router;

