const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============================================
// Constants
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// ============================================
// Helpers
// ============================================

/**
 * Remove sensitive fields from user document before sending to client
 * @param {import('../models/User')} userDoc
 */
const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, __v, ...safeUser } = user;
  return safeUser;
};

/**
 * Helper: build user response (kèm roles đã format)
 * @param {import('../models/User')} user
 */
const buildUserResponse = (user) => {
  const roles = (user.roles || []).map((role) => ({
    id: role._id,
    roleName: role.roleName,
    permissions: (role.permissions || []).map((p) => (p.code ? p.code : p)),
  }));

  return {
    ...sanitizeUser(user),
    roles,
  };
};

// ============================================
// Controller Functions
// ============================================

/**
 * POST /api/auth/login
 * Đăng nhập bằng tài khoản + mật khẩu
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu',
      });
    }

    if (!User || !User.findOne) {
      return res.status(500).json({
        status: 'error',
        message: 'User model is not available',
      });
    }

    const user = await User.findOne({ username }).populate({
      path: 'roles',
      model: 'Roles',
      populate: {
        path: 'permissions',
        model: 'Permission',
      },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Tài khoản hoặc mật khẩu không đúng',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        status: 'error',
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ nhà trường.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Tài khoản hoặc mật khẩu không đúng',
      });
    }

    const roles = (user.roles || []).map((role) => ({
      id: role._id,
      roleName: role.roleName,
      permissions: (role.permissions || []).map((p) => (p.code ? p.code : p)),
    }));

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      roles: (user.roles || []).map((r) => r.roleName),
      permissions: Array.from(
        new Set(
          (user.roles || []).flatMap((role) =>
            (role.permissions || []).map((p) => (p.code ? p.code : p)),
          ),
        ),
      ),
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Đăng nhập thất bại',
    });
  }
};

/**
 * GET /api/auth/me
 * Lấy thông tin hồ sơ người dùng hiện tại (dựa trên token)
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'roles',
      model: 'Roles',
      populate: {
        path: 'permissions',
        model: 'Permission',
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: buildUserResponse(user),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không lấy được hồ sơ người dùng',
    });
  }
};

/**
 * PUT /api/auth/me
 * Cập nhật thông tin cơ bản của người dùng hiện tại
 * (fullName, email, avatar; các field khác có thể bổ sung sau)
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, email, avatar } = req.body;

    const user = await User.findById(req.user.id).populate({
      path: 'roles',
      model: 'Roles',
      populate: {
        path: 'permissions',
        model: 'Permission',
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng',
      });
    }

    if (typeof fullName === 'string' && fullName.trim() !== '') {
      user.fullName = fullName.trim();
    }

    if (typeof email === 'string' && email.trim() !== '') {
      user.email = email.trim().toLowerCase();
    }

    if (typeof avatar === 'string') {
      user.avatar = avatar;
    }

    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật hồ sơ thành công',
      data: buildUserResponse(user),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không cập nhật được hồ sơ',
    });
  }
};

/**
 * POST /api/auth/change-password
 * Đổi mật khẩu cho người dùng hiện tại
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng',
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Mật khẩu hiện tại không đúng',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Change password error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không đổi được mật khẩu',
    });
  }
};

module.exports = {
  login,
  getProfile,
  updateProfile,
  changePassword,
};
