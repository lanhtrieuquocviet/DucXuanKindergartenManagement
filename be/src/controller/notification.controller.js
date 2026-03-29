const Notification = require('../models/Notification');

/**
 * Internal: tạo notification mới (gọi từ controller khác)
 */
exports.createNotification = async ({ title, body, type = 'meal_issue', extra = {} }) => {
  try {
    const notif = await Notification.create({ title, body, type, extra });
    return notif;
  } catch (err) {
    console.error('createNotification error:', err.message);
  }
};

/**
 * GET /api/notifications
 * Lấy danh sách thông báo cho phụ huynh (mới nhất trước)
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user?._id;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ targetRole: 'Parent' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Thêm trường isReadByMe cho từng thông báo
    const result = notifications.map((n) => ({
      ...n,
      isReadByMe: n.readBy?.some((id) => id.toString() === userId?.toString()) ?? false,
    }));

    const total = await Notification.countDocuments({ targetRole: 'Parent' });
    const unreadCount = await Notification.countDocuments({
      targetRole: 'Parent',
      readBy: { $nin: [userId] },
    });

    return res.json({ success: true, data: result, total, unreadCount, page, limit });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/notifications/unread-count
 * Chỉ trả về số thông báo chưa đọc (để badge chuông)
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?._id;
    const count = await Notification.countDocuments({
      targetRole: 'Parent',
      readBy: { $nin: [userId] },
    });
    return res.json({ success: true, count });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Đánh dấu một thông báo đã đọc
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, {
      $addToSet: { readBy: userId },
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/notifications/read-all
 * Đánh dấu tất cả đã đọc
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?._id;
    await Notification.updateMany(
      { targetRole: 'Parent', readBy: { $nin: [userId] } },
      { $addToSet: { readBy: userId } }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
