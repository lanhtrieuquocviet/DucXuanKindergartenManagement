const Asset = require('../models/Asset');
const RoomAsset = require('../models/RoomAsset');

exports.listAssets = async (req, res) => {
  try {
    // ?type=csvc hoặc ?type=asset; mặc định trả tất cả
    // Dữ liệu cũ không có field type → coi là 'csvc'
    let filter = {};
    if (req.query.type === 'asset') {
      filter = { type: 'asset' };
    } else if (req.query.type === 'csvc') {
      filter = { $or: [{ type: 'csvc' }, { type: { $exists: false } }] };
    }

    const assets = await Asset.find(filter)
      .populate('createdBy', 'fullName username')
      .sort({ category: 1, createdAt: -1 });

    const allocations = await RoomAsset.aggregate([
      { $group: { _id: '$assetId', allocatedQty: { $sum: '$quantity' } } },
    ]);
    const allocMap = {};
    allocations.forEach((a) => { allocMap[a._id.toString()] = a.allocatedQty; });

    const result = assets.map((asset) => {
      const a = asset.toObject();
      a.allocatedQty  = allocMap[a._id.toString()] || 0;
      a.remainingQty  = Math.max(0, (a.quantity || 0) - a.allocatedQty);
      a.brokenQty     = a.brokenQuantity || 0;
      a.goodQty       = Math.max(0, (a.quantity || 0) - a.brokenQty);
      return a;
    });

    return res.json({ status: 'success', data: { assets: result } });
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
    const { assetCode, name, type, category, room, requiredQuantity, quantity, area, constructionType, condition, notes } = req.body;
    if (!assetCode?.trim()) return res.status(400).json({ status: 'error', message: 'Mã tài sản không được để trống.' });
    if (!name?.trim())      return res.status(400).json({ status: 'error', message: 'Tên tài sản không được để trống.' });

    const existing = await Asset.findOne({ assetCode: assetCode.trim() });
    if (existing) return res.status(409).json({ status: 'error', message: 'Mã tài sản đã tồn tại.' });

    const asset = await Asset.create({
      assetCode:        assetCode.trim(),
      name:             name.trim(),
      type:             type || 'csvc',
      category:         category || 'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em',
      room:             room?.trim() || '',
      requiredQuantity: requiredQuantity ?? 0,
      quantity:         quantity ?? 1,
      area:             area != null && area !== '' ? Number(area) : null,
      constructionType: constructionType || 'Không áp dụng',
      condition:        condition || 'Còn tốt',
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
    const { assetCode, name, type, category, room, requiredQuantity, quantity, area, constructionType, condition, notes } = req.body;
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ status: 'error', message: 'Không tìm thấy tài sản.' });

    if (assetCode && assetCode.trim() !== asset.assetCode) {
      const existing = await Asset.findOne({ assetCode: assetCode.trim(), _id: { $ne: asset._id } });
      if (existing) return res.status(409).json({ status: 'error', message: 'Mã tài sản đã tồn tại.' });
      asset.assetCode = assetCode.trim();
    }
    if (name !== undefined)             asset.name             = name.trim();
    if (type !== undefined)             asset.type             = type;
    if (category !== undefined)         asset.category         = category;
    if (room !== undefined)             asset.room             = room.trim();
    if (requiredQuantity !== undefined) asset.requiredQuantity = requiredQuantity;
    if (quantity !== undefined)         asset.quantity         = quantity;
    if (brokenQuantity !== undefined)   asset.brokenQuantity   = Math.min(Number(brokenQuantity), asset.quantity);
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
        const VALID_CONDITION = ['Còn tốt', 'Không sử dụng được'];
        await Asset.create({
          assetCode:        assetCode.trim(),
          name:             name.trim(),
          category:         VALID_CATEGORIES.includes(category) ? category : 'Khác',
          room:             room?.trim() || '',
          requiredQuantity: Number(requiredQuantity) || 0,
          quantity:         quantity != null && quantity !== '' ? Number(quantity) : 0,
          area:             area != null && area !== '' ? Number(area) : null,
          constructionType: VALID_CONSTRUCTION.includes(constructionType) ? constructionType : 'Không áp dụng',
          condition:        VALID_CONDITION.includes(condition) ? condition : 'Còn tốt',
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

exports.bulkCreateWarehouseAssets = async (req, res) => {
  try {
    const { assets } = req.body;
    if (!Array.isArray(assets) || assets.length === 0)
      return res.status(400).json({ status: 'error', message: 'Danh sách tài sản không hợp lệ.' });

    const VALID_CATEGORIES = ['Đồ dùng', 'Thiết bị dạy học, đồ chơi và học liệu', 'Sách, tài liệu, băng đĩa', 'Thiết bị ngoài thông tư'];
    const VALID_CONDITION = ['Còn tốt', 'Không sử dụng được'];

    const results = { created: 0, skipped: 0, errors: [] };
    let nttCounter = await Asset.countDocuments({ type: 'asset', category: 'Thiết bị ngoài thông tư' });

    for (const item of assets) {
      try {
        const { name, category, quantity, condition, unit, notes } = item;
        let { assetCode } = item;

        if (!name?.trim()) {
          results.skipped++;
          results.errors.push('Thiếu tên tài sản');
          continue;
        }

        if (!assetCode?.trim()) {
          nttCounter++;
          assetCode = `TBNT${String(nttCounter).padStart(3, '0')}`;
        }

        const existing = await Asset.findOne({ assetCode: assetCode.trim() });
        if (existing) {
          results.skipped++;
          results.errors.push(`Mã "${assetCode}" đã tồn tại, bỏ qua.`);
          continue;
        }

        await Asset.create({
          assetCode: assetCode.trim(),
          name: name.trim(),
          type: 'asset',
          category: VALID_CATEGORIES.includes(category) ? category : 'Đồ dùng',
          quantity: Number(quantity) || 0,
          condition: VALID_CONDITION.includes(condition) ? condition : 'Còn tốt',
          unit: unit?.trim() || 'Cái',
          notes: notes?.trim() || '',
          createdBy: req.user._id,
        });
        results.created++;
      } catch (err) {
        results.skipped++;
        results.errors.push(`Lỗi "${item.name || '?'}": ${err.message}`);
      }
    }
    return res.json({ status: 'success', data: results });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
