const Notification = require('../models/Notification');

/**
 * Internal: tạo notification mới (gọi từ controller khác)
 */
exports.createNotification = async ({ title, body, type = 'general', targetRole = 'all', targetUserId = null, extra = {} }) => {
  try {
    const notif = await Notification.create({ title, body, type, targetRole, targetUserId, extra });
    return notif;
  } catch (err) {
    console.error('createNotification error:', err.message);
  }
};

/**
 * GET /api/notifications
 * Lấy danh sách thông báo (mới nhất trước) — mọi tài khoản đã đăng nhập
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user?._id;
    const limit = parseInt(req.query.limit) || 20;
    const page  = parseInt(req.query.page)  || 1;
    const skip  = (page - 1) * limit;

    // Hiển thị: thông báo cho user cụ thể, hoặc 'all' hoặc đúng role của user
    const userRoles = (req.user?.roles || []).map(r => r.roleName || r);
    const filter = {
      $or: [
        { targetUserId: userId },
        { targetUserId: null, targetRole: { $in: ['all', ...userRoles] } },
      ],
    };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const result = notifications.map((n) => ({
      ...n,
      isReadByMe: n.readBy?.some((id) => id.toString() === userId?.toString()) ?? false,
    }));

    const total       = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      $and: [filter, { readBy: { $nin: [userId] } }],
    });

    return res.json({ success: true, data: result, total, unreadCount, page, limit });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId    = req.user?._id;
    const userRoles = (req.user?.roles || []).map(r => r.roleName || r);
    const count = await Notification.countDocuments({
      $and: [
        {
          $or: [
            { targetUserId: userId },
            { targetUserId: null, targetRole: { $in: ['all', ...userRoles] } },
          ],
        },
        { readBy: { $nin: [userId] } },
      ],
    });
    return res.json({ success: true, count });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { $addToSet: { readBy: userId } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId    = req.user?._id;
    const userRoles = (req.user?.roles || []).map(r => r.roleName || r);
    await Notification.updateMany(
      {
        $and: [
          {
            $or: [
              { targetUserId: userId },
              { targetUserId: null, targetRole: { $in: ['all', ...userRoles] } },
            ],
          },
          { readBy: { $nin: [userId] } },
        ],
      },
      { $addToSet: { readBy: userId } }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
