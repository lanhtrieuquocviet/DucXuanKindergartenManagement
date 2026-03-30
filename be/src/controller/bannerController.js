const HomepageBannerSetting = require('../models/HomepageBannerSetting');

const FALLBACK_BANNERS = [
  {
    imageUrl:
      'https://scontent.fhan18-1.fna.fbcdn.net/v/t39.30808-6/618702160_1461727552619714_6463649032824992629_n.jpg',
    altText: 'Banner trường mầm non',
    isActive: true,
    order: 1,
  },
  {
    imageUrl:
      'https://scontent.fhan18-1.fna.fbcdn.net/v/t39.30808-6/605784091_1450941177031685_6354221922736986229_n.jpg',
    altText: 'Banner trường mầm non',
    isActive: true,
    order: 2,
  },
  {
    imageUrl:
      'https://scontent.fhan18-1.fna.fbcdn.net/v/t39.30808-6/499477487_1247164254076046_8931851791991323309_n.jpg',
    altText: 'Banner trường mầm non',
    isActive: true,
    order: 3,
  },
];

const normalizeBanners = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item, index) => ({
      imageUrl: String(item?.imageUrl || '').trim(),
      altText: String(item?.altText || 'Banner trường mầm non').trim() || 'Banner trường mầm non',
      isActive: item?.isActive !== false,
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
    }))
    .filter((item) => Boolean(item.imageUrl));

const normalizeBanner = (item = {}, index = 0) => ({
  imageUrl: String(item?.imageUrl || '').trim(),
  altText: String(item?.altText || `Banner ${index + 1}`).trim() || `Banner ${index + 1}`,
  isActive: item?.isActive !== false,
  order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
});

const getOrCreateSetting = async () => {
  let setting = await HomepageBannerSetting.findOne({ key: 'homepage' });
  if (!setting) {
    setting = await HomepageBannerSetting.create({ key: 'homepage', banners: FALLBACK_BANNERS });
  }
  return setting;
};

const getAdminHomepageBanners = async (req, res) => {
  try {
    const setting = await getOrCreateSetting();
    const sorted = [...(setting.banners || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    const banners = sorted.map((b, i) => ({
      _id: b._id,
      imageUrl: b.imageUrl,
      altText: b.altText,
      isActive: b.isActive,
      order: i + 1,
    }));

    const hasOrderDrift = sorted.some((b, i) => Number(b.order) !== i + 1);
    if (hasOrderDrift) {
      setting.banners = banners;
      await setting.save();
    }

    return res.status(200).json({
      status: 'success',
      data: { banners },
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Không thể tải cấu hình banner.',
    });
  }
};

const updateAdminHomepageBanners = async (req, res) => {
  try {
    const normalized = normalizeBanners(req.body?.banners);
    if (normalized.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng thêm ít nhất 1 banner hợp lệ.',
      });
    }

    const setting = await getOrCreateSetting();
    setting.banners = normalized;
    setting.updatedBy = req.user?.id || null;
    await setting.save();

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật banner thành công.',
      data: { banners: setting.banners || [] },
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Không thể cập nhật banner.',
    });
  }
};

const createAdminHomepageBanner = async (req, res) => {
  try {
    const setting = await getOrCreateSetting();
    const newBanner = normalizeBanner(req.body, setting.banners.length);
    if (!newBanner.imageUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Ảnh banner là bắt buộc.',
      });
    }

    const maxPosition = setting.banners.length + 1;
    const requestedPosition = Number(req.body?.order);
    const insertPosition = Number.isFinite(requestedPosition)
      ? Math.min(Math.max(Math.floor(requestedPosition), 1), maxPosition)
      : maxPosition;

    setting.banners.splice(insertPosition - 1, 0, newBanner);
    setting.banners = setting.banners.map((b, i) => ({
      _id: b._id,
      imageUrl: b.imageUrl,
      altText: b.altText,
      isActive: b.isActive,
      order: i + 1,
    }));
    setting.updatedBy = req.user?.id || null;
    await setting.save();
    const created = setting.banners[insertPosition - 1];

    return res.status(201).json({
      status: 'success',
      message: 'Thêm banner thành công.',
      data: { banner: created, banners: setting.banners || [] },
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Không thể thêm banner.',
    });
  }
};

const updateAdminHomepageBannerById = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const setting = await getOrCreateSetting();
    const banner = setting.banners.id(bannerId);

    if (!banner) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy banner.',
      });
    }

    const currentIndex = setting.banners.findIndex((b) => String(b._id) === String(bannerId));
    const next = normalizeBanner(
      {
        imageUrl: req.body?.imageUrl ?? banner.imageUrl,
        altText: req.body?.altText ?? banner.altText,
        isActive: typeof req.body?.isActive === 'boolean' ? req.body.isActive : banner.isActive,
        order: req.body?.order ?? banner.order,
      },
      currentIndex
    );

    if (!next.imageUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Ảnh banner là bắt buộc.',
      });
    }

    const normalizedList = [...(setting.banners || [])]
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
      .map((b, i) => ({
        _id: b._id,
        imageUrl: b.imageUrl,
        altText: b.altText,
        isActive: b.isActive,
        order: i + 1,
      }));

    const orderedCurrentIndex = normalizedList.findIndex((b) => String(b._id) === String(bannerId));
    const total = normalizedList.length;
    const currentOrder = orderedCurrentIndex + 1;
    const targetOrder = Math.min(Math.max(Math.floor(Number(next.order) || currentOrder), 1), total);

    // Cập nhật nội dung banner đang sửa
    normalizedList[orderedCurrentIndex] = {
      ...normalizedList[orderedCurrentIndex],
      imageUrl: next.imageUrl,
      altText: next.altText,
      isActive: next.isActive,
    };

    // Swap theo vị trí để đảm bảo target về current
    if (targetOrder !== currentOrder) {
      const targetIndex = targetOrder - 1;
      const currentItem = normalizedList[orderedCurrentIndex];
      const targetItem = normalizedList[targetIndex];
      normalizedList[targetIndex] = currentItem;
      normalizedList[orderedCurrentIndex] = targetItem;
    }

    setting.banners = normalizedList.map((b, i) => ({
      _id: b._id,
      imageUrl: b.imageUrl,
      altText: b.altText,
      isActive: b.isActive,
      order: i + 1,
    }));
    setting.updatedBy = req.user?.id || null;
    await setting.save();

    const updatedBanner = setting.banners.id(bannerId);
    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật banner thành công.',
      data: { banner: updatedBanner, banners: setting.banners || [] },
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Không thể cập nhật banner.',
    });
  }
};

const deleteAdminHomepageBannerById = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const setting = await getOrCreateSetting();
    const index = setting.banners.findIndex((b) => String(b._id) === String(bannerId));
    if (index < 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy banner.',
      });
    }

    setting.banners.splice(index, 1);
    setting.banners = setting.banners.map((b, i) => ({
      _id: b._id,
      imageUrl: b.imageUrl,
      altText: b.altText,
      isActive: b.isActive,
      order: i + 1,
    }));
    setting.updatedBy = req.user?.id || null;
    await setting.save();

    return res.status(200).json({
      status: 'success',
      message: 'Xóa banner thành công.',
      data: { banners: setting.banners || [] },
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Không thể xóa banner.',
    });
  }
};

const getPublicHomepageBanners = async (req, res) => {
  try {
    const setting = await getOrCreateSetting();
    const banners = (setting.banners || [])
      .filter((item) => item.isActive !== false && item.imageUrl)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return res.status(200).json({
      status: 'success',
      data: { banners },
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Không thể tải danh sách banner.',
    });
  }
};

module.exports = {
  getAdminHomepageBanners,
  updateAdminHomepageBanners,
  createAdminHomepageBanner,
  updateAdminHomepageBannerById,
  deleteAdminHomepageBannerById,
  getPublicHomepageBanners,
};
