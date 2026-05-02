const AuditLog = require('../models/AuditLog');

/**
 * Log asset-related actions for audit purposes.
 * @param {string} assetId - The ID of the asset.
 * @param {string} action - Action type (e.g., 'HANDOVER', 'TRANSFER', 'ADJUST', 'INCIDENT_REPORT').
 * @param {string} userId - The user performing the action.
 * @param {object} metadata - Additional info (old values, new values, reasons).
 */
exports.logAssetAction = async (assetId, action, userId, metadata = {}) => {
  try {
    await AuditLog.create({
      entityType: 'Asset',
      entityId: assetId,
      action,
      userId,
      details: metadata,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[assetAuditService] Failed to log action:', err);
  }
};
