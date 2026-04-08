const express = require('express');
const router = express.Router();
const ctrl = require('../controller/notification.controller');
const { authenticate } = require('../middleware/auth');

// Tất cả tài khoản đã đăng nhập đều có thể dùng
router.get('/unread-count', authenticate, ctrl.getUnreadCount);
router.get('/', authenticate, ctrl.getNotifications);
router.put('/read-all', authenticate, ctrl.markAllAsRead);
router.put('/:id/read', authenticate, ctrl.markAsRead);

module.exports = router;
