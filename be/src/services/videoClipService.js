const VideoClipItem = require('../models/VideoClipItem');

const isValidHttpUrl = (str) => {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const createHttpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const listAdminVideoClips = async () => VideoClipItem.find({})
  .sort({ createdAt: -1 })
  .populate('createdBy', 'fullName username');

const createVideoClipItem = async (payload, user) => {
  const title = String(payload?.title || '').trim();
  const thumbnailUrl = String(payload?.thumbnailUrl || '').trim();
  const videoUrl = String(payload?.videoUrl || '').trim();

  if (!title) throw createHttpError(400, 'Tiêu đề không được để trống');
  if (!thumbnailUrl) throw createHttpError(400, 'Ảnh bìa không được để trống');
  if (!videoUrl) throw createHttpError(400, 'Link video không được để trống');
  if (!isValidHttpUrl(thumbnailUrl)) throw createHttpError(400, 'URL ảnh bìa không hợp lệ');
  if (!isValidHttpUrl(videoUrl)) throw createHttpError(400, 'Link video phải là URL http/https hợp lệ');

  return VideoClipItem.create({
    title,
    thumbnailUrl,
    videoUrl,
    status: payload?.status === 'inactive' ? 'inactive' : 'active',
    createdBy: user?._id || user?.id || null,
  });
};

const deleteVideoClipItem = async (id) => {
  const deleted = await VideoClipItem.findByIdAndDelete(id);
  if (!deleted) throw createHttpError(404, 'Không tìm thấy video');
};

const listPublicVideoClips = async () => VideoClipItem.find({ status: 'active' })
  .sort({ createdAt: -1 })
  .select('title thumbnailUrl videoUrl createdAt');

module.exports = {
  listAdminVideoClips,
  createVideoClipItem,
  deleteVideoClipItem,
  listPublicVideoClips,
};
