const AuditLog = require('../models/AuditLog');

/**
 * Ghi log thao tác của người dùng
 * @param {Object} params
 * @param {string} params.action - Tên hành động (e.g., 'CREATE_STUDENT')
 * @param {string} params.actorId - ID của người thực hiện
 * @param {string} params.targetModel - Tên model bị tác động
 * @param {string} params.targetId - ID của bản ghi bị tác động
 * @param {Object} [params.oldData] - Dữ liệu cũ (nếu có)
 * @param {Object} [params.newData] - Dữ liệu mới (nếu có)
 * @param {Object} [req] - Request object để lấy IP và UserAgent
 */
const logAction = async ({ action, actorId, targetModel, targetId, oldData, newData }, req = null) => {
  try {
    const logEntry = new AuditLog({
      action,
      actorId,
      targetModel,
      targetId,
      oldData,
      newData,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '',
      userAgent: req?.headers?.['user-agent'] || '',
    });
    await logEntry.save();
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Không ném lỗi ra ngoài để tránh làm gián đoạn luồng chính
  }
};

module.exports = {
  logAction,
};
