const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Middleware: kiểm tra JWT từ header Authorization: Bearer <token>
 * - Gắn thông tin user + roles + permissions vào req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Thiếu token xác thực',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        message: 'Token không hợp lệ hoặc đã hết hạn',
      });
    }

    // decoded.sub là userId theo payload trong login
    const user = await User.findById(decoded.sub).populate({
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
        message: 'Người dùng không tồn tại',
      });
    }

    const roles = (user.roles || []).map((role) => ({
      id: role._id,
      roleName: role.roleName,
      permissions: (role.permissions || []).map((p) =>
        p && p.code ? p.code : p,
      ),
    }));

    req.user = {
      id: user._id.toString(),
      username: user.username,
      roles: roles.map((r) => r.roleName),
      permissions: Array.from(
        new Set(roles.flatMap((r) => r.permissions)),
      ),
      rawUser: user,
    };

    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi xác thực',
    });
  }
};

/**
 * Middleware factory: chỉ cho phép các role nhất định
 * @param  {...string} allowedRoles
 */
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Chưa đăng nhập',
    });
  }

  const userRoles = req.user.roles || [];
  const hasRole = userRoles.some((r) => allowedRoles.includes(r));

  if (!hasRole) {
    return res.status(403).json({
      status: 'error',
      message: 'Bạn không có quyền truy cập chức năng này',
    });
  }

  next();
};

/**
 * Middleware factory: kiểm tra theo permission code
 * @param  {...string} requiredPermissions
 */
const authorizePermissions = (...requiredPermissions) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Chưa đăng nhập',
    });
  }

  const userPerms = req.user.permissions || [];
  const hasPermission = requiredPermissions.every((p) =>
    userPerms.includes(p),
  );

  if (!hasPermission) {
    return res.status(403).json({
      status: 'error',
      message: 'Bạn không có quyền thực hiện thao tác này',
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorizeRoles,
  authorizePermissions,
};

