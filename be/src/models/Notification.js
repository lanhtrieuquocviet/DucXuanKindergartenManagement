const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, default: 'meal_issue' },
    // who should see this: role-based broadcast
    targetRole: { type: String, default: 'Parent' },
    // optional: target a specific user (e.g. parent of a specific student)
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isRead: { type: Boolean, default: false },
    // optional: per-user read tracking (array of userIds who read it)
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    extra: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
