const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

// ============================================
// User & Role Management
// ============================================

/**
 * GET /api/system-admin/users
 * Lấy danh sách user + roles để SystemAdmin phân quyền
 */
const getUsers = async (req, res) => {
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
};

/**
 * GET /api/system-admin/roles
 * Lấy danh sách role
 */
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .select('roleName description permissions')
      .populate({
        path: 'permissions',
        model: 'Permission',
        select: 'code description',
      })
      .sort({ roleName: 1 });

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
};

/**
 * POST /api/system-admin/roles
 * Tạo role mới
 * body: { roleName: string, description?: string }
 */
// Validate dữ liệu role (roleName & description)
// - roleName: bắt buộc, độ dài 3-32, chỉ chữ cái và số, bắt đầu bằng chữ cái, không khoảng trắng/ký tự đặc biệt
//   Ví dụ hợp lệ: Teacher, SchoolAdmin, SystemAdmin
// - description: tùy chọn, tối đa 255 ký tự
const validateRoleName = (roleName) => {
  if (!roleName) {
    return 'Tên vai trò là bắt buộc';
  }

  const trimmedName = roleName.trim();

  if (trimmedName.length < 3 || trimmedName.length > 32) {
    return 'Tên vai trò phải có từ 3 đến 32 ký tự';
  }

  const namePattern = /^[A-Za-z][A-Za-z0-9]*$/;
  if (!namePattern.test(trimmedName)) {
    return 'Tên vai trò chỉ được chứa chữ cái và số, bắt đầu bằng chữ cái, không có khoảng trắng hoặc ký tự đặc biệt. Ví dụ: Teacher, SchoolAdmin';
  }

  return null;
};

const validateRoleDescription = (description) => {
  if (description === undefined || description === null) {
    return null;
  }

  const trimmed = description.trim();

  if (trimmed.length > 255) {
    return 'Mô tả vai trò không được vượt quá 255 ký tự';
  }

  return null;
};

const createRole = async (req, res) => {
  try {
    const { roleName, description } = req.body;

    const nameError = validateRoleName(roleName);
    if (nameError) {
      return res.status(400).json({
        status: 'error',
        message: nameError,
      });
    }

    const descError = validateRoleDescription(description);
    if (descError) {
      return res.status(400).json({
        status: 'error',
        message: descError,
      });
    }

    const role = new Role({
      roleName: roleName.trim(),
      description: description ? description.trim() : '',
    });

    await role.save();

    const populatedRole = await Role.findById(role._id)
      .populate({
        path: 'permissions',
        model: 'Permission',
        select: 'code description',
      });

    const mapped = {
      id: populatedRole._id,
      roleName: populatedRole.roleName,
      description: populatedRole.description,
      permissions: (populatedRole.permissions || []).map((p) => ({
        code: p.code,
        description: p.description,
      })),
    };

    return res.status(201).json({
      status: 'success',
      message: 'Tạo vai trò thành công',
      data: mapped,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Tên vai trò đã tồn tại',
      });
    }
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không tạo được vai trò',
    });
  }
};

/**
 * PUT /api/system-admin/roles/:id
 * Cập nhật role
 * body: { roleName?: string, description?: string }
 */
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleName, description } = req.body;

    if (!roleName && description === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp ít nhất một trường để cập nhật (tên vai trò hoặc mô tả)',
      });
    }

    if (roleName) {
      const nameError = validateRoleName(roleName);
      if (nameError) {
        return res.status(400).json({
          status: 'error',
          message: nameError,
        });
      }
    }

    if (description !== undefined) {
      const descError = validateRoleDescription(description);
      if (descError) {
        return res.status(400).json({
          status: 'error',
          message: descError,
        });
      }
    }

    const updateData = {};
    if (roleName) updateData.roleName = roleName.trim();
    if (description !== undefined) updateData.description = description.trim();

    const role = await Role.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: 'permissions',
      model: 'Permission',
      select: 'code description',
    });

    if (!role) {
      return res.status(404).json({
        status: 'error',
        message: 'Vai trò không tồn tại',
      });
    }

    const mapped = {
      id: role._id,
      roleName: role.roleName,
      description: role.description,
      permissions: (role.permissions || []).map((p) => ({
        code: p.code,
        description: p.description,
      })),
    };

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật vai trò thành công',
      data: mapped,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Tên vai trò đã tồn tại',
      });
    }
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không cập nhật được vai trò',
    });
  }
};

/**
 * DELETE /api/system-admin/roles/:id
 * Xóa role
 */
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem role có đang được sử dụng bởi users không
    const usersUsingRole = await User.find({ roles: id });
    if (usersUsingRole.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Không thể xóa vai trò đang được sử dụng bởi các người dùng',
      });
    }

    const role = await Role.findByIdAndDelete(id);

    if (!role) {
      return res.status(404).json({
        status: 'error',
        message: 'Vai trò không tồn tại',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Xóa vai trò thành công',
      data: role,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không xóa được vai trò',
    });
  }
};

/**
 * PUT /api/system-admin/users/:id/roles
 * Cập nhật danh sách role cho 1 user
 * body: { roleIds: string[] }
 */
const updateUserRoles = async (req, res) => {
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
};

// ============================================
// Permission Management
// ============================================

/**
 * Validate code và description của phân quyền
 * - Code: chỉ cho phép A-Z và dấu gạch dưới (_), theo định dạng ACTION_MODULE
 * - Code: độ dài 3-64 ký tự, không có dấu, không khoảng trắng
 * - Description: tối đa 255 ký tự
 * @param {string} code
 * @param {string} description
 * @returns {string|null} - Thông báo lỗi (null nếu hợp lệ)
 */
const validatePermissionData = (code, description) => {
  if (!code || !description) {
    return 'Code và mô tả là bắt buộc';
  }

  const trimmedCode = code.toUpperCase().trim();

  if (trimmedCode.length < 3 || trimmedCode.length > 64) {
    return 'Code phải có từ 3 đến 64 ký tự';
  }

  // Chỉ cho phép chữ in hoa A-Z và dấu gạch dưới, định dạng ACTION_MODULE
  const codePattern = /^[A-Z]+_[A-Z]+$/;
  if (!codePattern.test(trimmedCode)) {
    return 'Code chỉ được chứa chữ in hoa (A-Z) và dấu gạch dưới (_), theo định dạng ACTION_MODULE. Ví dụ: CREATE_USER';
  }

  const trimmedDescription = description.trim();
  if (trimmedDescription.length === 0) {
    return 'Mô tả không được để trống';
  }

  if (trimmedDescription.length > 355) {
    return 'Mô tả không được vượt quá 355 ký tự';
  }

  return null;
};

/**
 * GET /api/system-admin/permissions
 * Lấy danh sách tất cả permissions
 */
const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find()
      .select('code description')
      .sort({ code: 1 });

    return res.status(200).json({
      status: 'success',
      data: permissions,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không lấy được danh sách phân quyền',
    });
  }
};

/**
 * POST /api/system-admin/permissions
 * Tạo permission mới
 * body: { code: string, description: string }
 */
const createPermission = async (req, res) => {
  try {
    const { code, description } = req.body;

    const validationError = validatePermissionData(code, description);
    if (validationError) {
      return res.status(400).json({
        status: 'error',
        message: validationError,
      });
    }

    const permission = new Permission({
      code: code.toUpperCase().trim(),
      description: description.trim(),
    });

    await permission.save();

    return res.status(201).json({
      status: 'success',
      message: 'Tạo phân quyền thành công',
      data: permission,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Code phân quyền đã tồn tại',
      });
    }
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không tạo được phân quyền',
    });
  }
};

/**
 * PUT /api/system-admin/permissions/:id
 * Cập nhật permission
 * body: { code?: string, description?: string }
 */
const updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description } = req.body;

    if (!code && !description) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp ít nhất một trường để cập nhật (code hoặc mô tả)',
      });
    }

    // Nếu có code hoặc description mới, validate đầy đủ
    const validationError = validatePermissionData(
      code || 'DUMMY_CODE',
      description || 'DUMMY_DESCRIPTION',
    );
    if (validationError) {
      return res.status(400).json({
        status: 'error',
        message: validationError,
      });
    }

    const updateData = {};
    if (code) updateData.code = code.toUpperCase().trim();
    if (description) updateData.description = description.trim();

    const permission = await Permission.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!permission) {
      return res.status(404).json({
        status: 'error',
        message: 'Phân quyền không tồn tại',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật phân quyền thành công',
      data: permission,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Code phân quyền đã tồn tại',
      });
    }
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không cập nhật được phân quyền',
    });
  }
};

/**
 * DELETE /api/system-admin/permissions/:id
 * Xóa permission
 */
const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem permission có đang được sử dụng trong roles không
    const rolesUsingPermission = await Role.find({ permissions: id });
    if (rolesUsingPermission.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Không thể xóa phân quyền đang được sử dụng bởi các vai trò',
      });
    }

    const permission = await Permission.findByIdAndDelete(id);

    if (!permission) {
      return res.status(404).json({
        status: 'error',
        message: 'Phân quyền không tồn tại',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Xóa phân quyền thành công',
      data: permission,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không xóa được phân quyền',
    });
  }
};

/**
 * PUT /api/system-admin/roles/:id/permissions
 * Cập nhật danh sách permissions cho 1 role
 * body: { permissionCodes: string[] }
 */
const updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionCodes } = req.body;

    if (!Array.isArray(permissionCodes)) {
      return res.status(400).json({
        status: 'error',
        message: 'permissionCodes phải là một mảng',
      });
    }

    // Kiểm tra các permission có tồn tại không
    const validPermissions = await Permission.find({ code: { $in: permissionCodes } }).select('_id');
    const validPermissionIds = validPermissions.map((p) => p._id);

    const role = await Role.findByIdAndUpdate(
      id,
      { permissions: validPermissionIds },
      { new: true },
    ).populate({
      path: 'permissions',
      model: 'Permission',
      select: 'code description',
    });

    if (!role) {
      return res.status(404).json({
        status: 'error',
        message: 'Vai trò không tồn tại',
      });
    }

    const mapped = {
      id: role._id,
      roleName: role.roleName,
      description: role.description,
      permissions: (role.permissions || []).map((p) => ({
        code: p.code,
        description: p.description,
      })),
    };

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật phân quyền cho vai trò thành công',
      data: mapped,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không cập nhật được phân quyền cho vai trò',
    });
  }
};

module.exports = {
  getUsers,
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
};
