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
 * GET /api/system-admin/users
 * Lấy danh sách user + roles để SystemAdmin phân quyền
 */
router.get('/users', authenticate, authorizeRoles('SystemAdmin'), getUsers);

/**
 * POST /api/system-admin/users
 * Tạo tài khoản người dùng mới
 */
router.post('/users', authenticate, authorizeRoles('SystemAdmin'), createUser);

/**
 * PUT /api/system-admin/users/:id
 * Cập nhật thông tin tài khoản người dùng
 */
router.put('/users/:id', authenticate, authorizeRoles('SystemAdmin'), updateUser);

/**
 * DELETE /api/system-admin/users/:id
 * Xóa tài khoản người dùng
 */
router.delete('/users/:id', authenticate, authorizeRoles('SystemAdmin'), deleteUser);

/**
 * GET /api/system-admin/roles
 * Lấy danh sách role
 */
router.get('/roles', authenticate, authorizeRoles('SystemAdmin'), getRoles);

/**
 * POST /api/system-admin/roles
 * Tạo role mới
 * body: { roleName: string, description?: string }
 */
router.post('/roles', authenticate, authorizeRoles('SystemAdmin'), createRole);

/**
 * PUT /api/system-admin/roles/:id
 * Cập nhật role
 * body: { roleName?: string, description?: string }
 */
router.put('/roles/:id', authenticate, authorizeRoles('SystemAdmin'), updateRole);

/**
 * DELETE /api/system-admin/roles/:id
 * Xóa role
 */
router.delete('/roles/:id', authenticate, authorizeRoles('SystemAdmin'), deleteRole);

/**
 * PUT /api/system-admin/users/:id/roles
 * Cập nhật danh sách role cho 1 user
 * body: { roleIds: string[] }
 */
router.put('/users/:id/roles', authenticate, authorizeRoles('SystemAdmin'), updateUserRoles);

/**
 * GET /api/system-admin/permissions
 * Lấy danh sách tất cả permissions
 */
router.get('/permissions', authenticate, authorizeRoles('SystemAdmin'), getPermissions);

/**
 * POST /api/system-admin/permissions
 * Tạo permission mới
 * body: { code: string, description: string }
 */
router.post('/permissions', authenticate, authorizeRoles('SystemAdmin'), createPermission);

/**
 * PUT /api/system-admin/permissions/:id
 * Cập nhật permission
 * body: { code?: string, description?: string }
 */
router.put('/permissions/:id', authenticate, authorizeRoles('SystemAdmin'), updatePermission);

/**
 * DELETE /api/system-admin/permissions/:id
 * Xóa permission
 */
router.delete('/permissions/:id', authenticate, authorizeRoles('SystemAdmin'), deletePermission);

/**
 * PUT /api/system-admin/roles/:id/permissions
 * Cập nhật danh sách permissions cho 1 role
 * body: { permissionCodes: string[] }
 */
router.put('/roles/:id/permissions', authenticate, authorizeRoles('SystemAdmin'), updateRolePermissions);

/**
 * GET /api/system-admin/system-logs
 * Lấy nhật ký hệ thống
 */
router.get('/system-logs', authenticate, authorizeRoles('SystemAdmin'), getSystemLogs);

module.exports = router;

