const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Chỉ Teacher mới truy cập được
/**
 * @openapi
 * /api/teacher/dashboard:
 *   get:
 *     summary: Trang Dashboard dành cho Teacher
 *     tags:
 *       - Teacher
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin dashboard
 */
router.get('/dashboard', authenticate, authorizeRoles('Teacher'), (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Trang Teacher dashboard',
    data: {
      user: req.user,
    },
  });
});

module.exports = router;

