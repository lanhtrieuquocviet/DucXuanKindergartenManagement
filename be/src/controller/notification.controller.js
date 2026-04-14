const service = require('../services/notification.service.js');

const createNotification = async (req, res, next) => service.createNotification(req, res, next);
const getNotifications = async (req, res, next) => service.getNotifications(req, res, next);
const getUnreadCount = async (req, res, next) => service.getUnreadCount(req, res, next);
const markAsRead = async (req, res, next) => service.markAsRead(req, res, next);
const markAllAsRead = async (req, res, next) => service.markAllAsRead(req, res, next);

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
