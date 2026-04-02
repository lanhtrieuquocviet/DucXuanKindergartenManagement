const express = require('express');
const router = express.Router();
const ctrl = require('../controller/notification.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Parent routes
router.get('/unread-count', authenticate, authorizeRoles('Parent', 'StudentParent', 'Student'), ctrl.getUnreadCount);
router.get('/', authenticate, authorizeRoles('Parent', 'StudentParent', 'Student'), ctrl.getNotifications);
router.put('/read-all', authenticate, authorizeRoles('Parent', 'StudentParent', 'Student'), ctrl.markAllAsRead);
router.put('/:id/read', authenticate, authorizeRoles('Parent', 'StudentParent', 'Student', 'SchoolAdmin', 'SystemAdmin'), ctrl.markAsRead);

// Admin routes
router.get('/admin/unread-count', authenticate, authorizeRoles('SchoolAdmin', 'SystemAdmin'), ctrl.getUnreadCountAdmin);
router.get('/admin', authenticate, authorizeRoles('SchoolAdmin', 'SystemAdmin'), ctrl.getNotificationsAdmin);
router.put('/admin/read-all', authenticate, authorizeRoles('SchoolAdmin', 'SystemAdmin'), ctrl.markAllAsReadAdmin);

module.exports = router;
