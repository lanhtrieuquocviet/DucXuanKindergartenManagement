const VideoClipItem = require('../models/VideoClipItem');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

const listAdminVideoClips = async (query = {}) => {
  const { search } = query;
  const q = String(search || '').trim();
  let filter = {};
  if (q) {
    const escaped = escapeRegex(q);
    filter = {
      $or: [
        { title: { $regex: escaped, $options: 'i' } },
        {
          $expr: {
            $regexMatch: {
              input: {
                $concat: [
                  { $dateToString: { format: '%d/%m/%Y', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } },
                  ' ',
                  { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } },
                ],
              },
              regex: escaped,
              options: 'i',
            },
          },
        },
      ],
    };
  }

  const pageRaw = parseInt(query.page, 10);
  const limitRaw = parseInt(query.limit, 10);
  const pageNum = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limitNum = Math.min(50, Math.max(1, Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 12));

  const total = await VideoClipItem.countDocuments(filter);
  const totalPages = Math.ceil(total / limitNum) || 1;
  const safePage = Math.min(pageNum, totalPages);
  const skip = (safePage - 1) * limitNum;

  const items = await VideoClipItem.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('createdBy', 'fullName username');

  return {
    items,
    pagination: {
      page: safePage,
      limit: limitNum,
      total,
      totalPages,
    },
  };
};

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

/** PATCH body: { status: 'active' | 'inactive' } — ẩn khỏi thư viện video công khai khi inactive */
const updateVideoClipItem = async (id, payload) => {
  const { status } = payload || {};
  if (status !== 'active' && status !== 'inactive') {
    throw createHttpError(400, 'Trạng thái phải là active hoặc inactive');
  }
  const doc = await VideoClipItem.findById(id);
  if (!doc) throw createHttpError(404, 'Không tìm thấy video');
  doc.status = status;
  await doc.save();
  return doc;
};

const listPublicVideoClips = async () => VideoClipItem.find({ status: 'active' })
  .sort({ createdAt: -1 })
  .select('title thumbnailUrl videoUrl createdAt');

module.exports = {
  listAdminVideoClips,
  createVideoClipItem,
  updateVideoClipItem,
  deleteVideoClipItem,
  listPublicVideoClips,
};
