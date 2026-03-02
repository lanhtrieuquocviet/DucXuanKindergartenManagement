const SystemLog = require('../models/SystemLog');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || '';
};

const createSystemLog = async ({ req, actor, action, detail }) => {
  try {
    const actorName =
      actor?.fullName ||
      actor?.username ||
      req?.user?.rawUser?.fullName ||
      req?.user?.username ||
      'anonymous';

    const log = new SystemLog({
      actorId: actor?._id || req?.user?._id || null,
      actorName,
      action,
      detail: detail || '',
      ip: req ? getClientIp(req) : '',
      userAgent: req?.headers?.['user-agent'] || '',
      method: req?.method || '',
      path: req?.originalUrl || req?.path || '',
    });

    await log.save();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to write system log:', error.message || error);
  }
};

module.exports = {
  createSystemLog,
};
