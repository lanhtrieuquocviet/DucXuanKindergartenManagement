const express = require('express');
const router = express.Router();
const ctrl = require('../controller/notification.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.get('/unread-count', authenticate, authorizeRoles('Parent', 'StudentParent', 'Student'), ctrl.getUnreadCount);
router.get('/', authenticate, authorizeRoles('Parent', 'StudentParent', 'Student'), ctrl.getNotifications);
router.put('/read-all', authenticate, authorizeRoles('Parent', 'StudentParent', 'Student'), ctrl.markAllAsRead);
router.put('/:id/read', authenticate, authorizeRoles('Parent', 'StudentParent', 'Student'), ctrl.markAsRead);

module.exports = router;
