const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');
const Role = require('../models/Role');

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
router.get('/users', authenticate, authorizeRoles('SystemAdmin'), async (req, res) => {
  try {
    const users = await User.find()
      .select('username fullName email roles status')
      .populate({
        path: 'roles',
        model: 'Roles',
        select: 'roleName description',
      });

    return res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không lấy được danh sách người dùng',
    });
  }
});

/**
 * GET /api/system-admin/roles
 * Lấy danh sách role để gán cho user
 */
router.get('/roles', authenticate, authorizeRoles('SystemAdmin'), async (req, res) => {
  try {
    const roles = await Role.find()
      .select('roleName description permissions')
      .populate({
        path: 'permissions',
        model: 'Permission',
        select: 'code description',
      });

    const mapped = roles.map((role) => ({
      id: role._id,
      roleName: role.roleName,
      description: role.description,
      // Trả về đầy đủ thông tin permission (code + description)
      permissions: (role.permissions || []).map((p) => ({
        code: p.code,
        description: p.description,
      })),
    }));

    return res.status(200).json({
      status: 'success',
      data: mapped,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không lấy được danh sách vai trò',
    });
  }
});

/**
 * PUT /api/system-admin/users/:id/roles
 * Cập nhật danh sách role cho 1 user
 * body: { roleIds: string[] }
 */
router.put('/users/:id/roles', authenticate, authorizeRoles('SystemAdmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { roleIds } = req.body;

    if (!Array.isArray(roleIds)) {
      return res.status(400).json({
        status: 'error',
        message: 'roleIds phải là một mảng',
      });
    }

    // Kiểm tra các role có tồn tại không
    const validRoles = await Role.find({ _id: { $in: roleIds } }).select('_id');
    const validRoleIds = validRoles.map((r) => r._id);

    const user = await User.findByIdAndUpdate(
      id,
      { roles: validRoleIds },
      { new: true },
    ).populate({
      path: 'roles',
      model: 'Roles',
      select: 'roleName description',
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Người dùng không tồn tại',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật vai trò cho người dùng thành công',
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không cập nhật được vai trò cho người dùng',
    });
  }
});

module.exports = router;

