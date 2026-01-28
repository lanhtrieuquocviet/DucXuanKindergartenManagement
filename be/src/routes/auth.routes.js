const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ============================================
// Helpers
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

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

// ============================================
// Authentication Routes
// ============================================

/**
 * POST /api/auth/login
 * Đăng nhập bằng tài khoản + mật khẩu
 */
router.post('/login', async (req, res) => {
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
      roles: roles.map((r) => r.roleName),
      permissions: Array.from(
        new Set(roles.flatMap((r) => r.permissions)),
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
        user: {
          ...sanitizeUser(user),
          roles,
        },
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
});

module.exports = router;
