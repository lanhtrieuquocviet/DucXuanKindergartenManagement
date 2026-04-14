const Asset = require('../models/Asset');

exports.listAssets = async (req, res) => {
  try {
    const assets = await Asset.find()
      .populate('createdBy', 'fullName username')
      .sort({ category: 1, createdAt: -1 });
    return res.json({ status: 'success', data: { assets } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('createdBy', 'fullName username');
    if (!asset) return res.status(404).json({ status: 'error', message: 'Không tìm thấy tài sản.' });
    return res.json({ status: 'success', data: { asset } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.createAsset = async (req, res) => {
  try {
    const { assetCode, name, category, room, requiredQuantity, quantity, area, constructionType, condition, notes } = req.body;
    if (!assetCode?.trim()) return res.status(400).json({ status: 'error', message: 'Mã tài sản không được để trống.' });
    if (!name?.trim())      return res.status(400).json({ status: 'error', message: 'Tên tài sản không được để trống.' });

    const existing = await Asset.findOne({ assetCode: assetCode.trim() });
    if (existing) return res.status(409).json({ status: 'error', message: 'Mã tài sản đã tồn tại.' });

    const asset = await Asset.create({
      assetCode:        assetCode.trim(),
      name:             name.trim(),
      category:         category || 'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em',
      room:             room?.trim() || '',
      requiredQuantity: requiredQuantity ?? 0,
      quantity:         quantity ?? 1,
      area:             area != null && area !== '' ? Number(area) : null,
      constructionType: constructionType || 'Không áp dụng',
      condition:        condition || 'Tốt',
      notes:            notes?.trim() || '',
      createdBy:        req.user._id,
    });
    return res.status(201).json({ status: 'success', data: { asset } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const { assetCode, name, category, room, requiredQuantity, quantity, area, constructionType, condition, notes } = req.body;
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ status: 'error', message: 'Không tìm thấy tài sản.' });

    if (assetCode && assetCode.trim() !== asset.assetCode) {
      const existing = await Asset.findOne({ assetCode: assetCode.trim(), _id: { $ne: asset._id } });
      if (existing) return res.status(409).json({ status: 'error', message: 'Mã tài sản đã tồn tại.' });
      asset.assetCode = assetCode.trim();
    }
    if (name !== undefined)             asset.name             = name.trim();
    if (category !== undefined)         asset.category         = category;
    if (room !== undefined)             asset.room             = room.trim();
    if (requiredQuantity !== undefined) asset.requiredQuantity = requiredQuantity;
    if (quantity !== undefined)         asset.quantity         = quantity;
    if (area !== undefined)             asset.area             = area !== '' && area != null ? Number(area) : null;
    if (constructionType !== undefined) asset.constructionType = constructionType;
    if (condition !== undefined)        asset.condition        = condition;
    if (notes !== undefined)            asset.notes            = notes.trim();

    await asset.save();
    return res.json({ status: 'success', data: { asset } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) return res.status(404).json({ status: 'error', message: 'Không tìm thấy tài sản.' });
    return res.json({ status: 'success', message: 'Xóa tài sản thành công.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.bulkCreateAssets = async (req, res) => {
  try {
    const { assets } = req.body;
    if (!Array.isArray(assets) || assets.length === 0)
      return res.status(400).json({ status: 'error', message: 'Danh sách tài sản không hợp lệ.' });

    const results = { created: 0, skipped: 0, errors: [] };
    for (const item of assets) {
      try {
        const { assetCode, name, category, room, requiredQuantity, quantity, area, constructionType, condition, unit, notes } = item;
        if (!assetCode?.trim() || !name?.trim()) {
          results.skipped++;
          results.errors.push(`Thiếu mã hoặc tên: "${assetCode || '?'}"`);
          continue;
        }
        const existing = await Asset.findOne({ assetCode: assetCode.trim() });
        if (existing) {
          results.skipped++;
          results.errors.push(`Mã "${assetCode}" đã tồn tại.`);
          continue;
        }
        const VALID_CATEGORIES = ['Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em','Số bàn, ghế ngồi','Khối phòng phục vụ học tập','Phòng tổ chức ăn, nghỉ','Công trình công cộng và khối phòng phục vụ khác','Khối phòng hành chính quản trị','Diện tích đất','Thiết bị dạy học và CNTT'];
        const VALID_CONSTRUCTION = ['Kiên cố', 'Bán kiên cố', 'Tạm', 'Không áp dụng'];
        const VALID_CONDITION = ['Tốt', 'Hỏng', 'Cần sửa chữa'];
        await Asset.create({
          assetCode:        assetCode.trim(),
          name:             name.trim(),
          category:         VALID_CATEGORIES.includes(category) ? category : 'Khác',
          room:             room?.trim() || '',
          requiredQuantity: Number(requiredQuantity) || 0,
          quantity:         quantity != null && quantity !== '' ? Number(quantity) : 0,
          area:             area != null && area !== '' ? Number(area) : null,
          constructionType: VALID_CONSTRUCTION.includes(constructionType) ? constructionType : 'Không áp dụng',
          condition:        VALID_CONDITION.includes(condition) ? condition : 'Tốt',
          unit:             unit?.trim() || 'Cái',
          notes:            notes?.trim() || '',
          createdBy:        req.user._id,
        });
        results.created++;
      } catch (err) {
        results.skipped++;
        results.errors.push(`Lỗi "${item.assetCode || '?'}": ${err.message}`);
      }
    }
    return res.json({ status: 'success', data: results });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
