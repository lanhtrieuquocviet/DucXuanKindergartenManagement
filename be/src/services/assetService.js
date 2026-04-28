const Asset = require('../models/Asset');
const RoomAsset = require('../models/RoomAsset');

function normalizeWarehouseCategory(rawCategory) {
  const text = String(rawCategory || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!text) return 'Đồ dùng';
  if (text.includes('ngoai thong tu')) return 'Thiết bị ngoài thông tư';
  if (/^iii\b/.test(text) || text.includes('sach') || text.includes('tai lieu') || text.includes('bang dia')) {
    return 'Sách, tài liệu, băng đĩa';
  }
  if (/^ii\b/.test(text) || text.includes('day hoc') || text.includes('do choi') || text.includes('hoc lieu')) {
    return 'Thiết bị dạy học, đồ chơi và học liệu';
  }
  if (/^i\b/.test(text) || text.includes('do dung')) return 'Đồ dùng';
  return 'Đồ dùng';
}

function inferWarehouseCategoryFromCode(assetCode) {
  const code = String(assetCode || '').trim().toUpperCase();
  if (!code) return '';
  if (code.startsWith('TBNT')) return 'Thiết bị ngoài thông tư';
  if (/^MN?561\d+/.test(code) || /^561\d+/.test(code)) return 'Đồ dùng';
  if (/^MN?562\d+/.test(code) || /^562\d+/.test(code)) return 'Thiết bị dạy học, đồ chơi và học liệu';
  if (/^MN?563\d+/.test(code) || /^563\d+/.test(code)) return 'Sách, tài liệu, băng đĩa';
  return '';
}

function normalizeCondition(rawCondition) {
  const text = String(rawCondition || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!text) return 'Còn tốt';
  if (text.includes('da hong') || text === 'hong' || text.includes('can sua chua')) return 'Đã hỏng';
  if (text.includes('con tot') || text === 'tot') return 'Còn tốt';
  return 'Còn tốt';
}

function toNonNegativeNumber(value, fallback = 0) {
  if (value === '' || value == null) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function deriveWarehouseQuantities({ quantity, goodQuantity, brokenQuantity, condition }) {
  const hasGood = goodQuantity !== undefined && goodQuantity !== null && goodQuantity !== '';
  const hasBroken = brokenQuantity !== undefined && brokenQuantity !== null && brokenQuantity !== '';
  if (hasGood || hasBroken) {
    const good = toNonNegativeNumber(goodQuantity, 0);
    const broken = toNonNegativeNumber(brokenQuantity, 0);
    const total = good + broken;
    const normalizedCondition = broken > 0 ? 'Đã hỏng' : 'Còn tốt';
    return { quantity: total, goodQuantity: good, brokenQuantity: broken, condition: normalizedCondition };
  }

  const total = toNonNegativeNumber(quantity, 0);
  const normalized = normalizeCondition(condition);
  const good = normalized === 'Đã hỏng' ? 0 : total;
  const broken = normalized === 'Đã hỏng' ? total : 0;
  return { quantity: total, goodQuantity: good, brokenQuantity: broken, condition: normalized };
}

function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.listAssets = async (req, res) => {
  try {
    // ?type=csvc hoặc ?type=asset; mặc định trả tất cả
    // Dữ liệu cũ không có field type → coi là 'csvc'
    let filter = {};
    if (req.query.type === 'asset') {
      filter = { type: 'asset' };
    } else if (req.query.type === 'csvc') {
      filter = { $or: [{ type: 'csvc' }, { type: { $exists: false } }, { type: null }] };
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
      if (a.type === 'asset') {
        const normalized = deriveWarehouseQuantities({
          quantity: a.quantity,
          goodQuantity: a.goodQuantity,
          brokenQuantity: a.brokenQuantity,
          condition: a.condition,
        });
        a.quantity = normalized.quantity;
        a.goodQuantity = normalized.goodQuantity;
        a.brokenQuantity = normalized.brokenQuantity;
        a.condition = normalized.condition;
      }
      a.allocatedQty = allocMap[a._id.toString()] || 0;
      const availableQty = a.type === 'asset' ? (a.goodQuantity || 0) : (a.quantity || 0);
      a.remainingQty = Math.max(0, availableQty - a.allocatedQty);
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
    const { assetCode, name, type, category, room, requiredQuantity, quantity, area, constructionType, condition, notes, goodQuantity, brokenQuantity } = req.body;
    if (!assetCode?.trim()) return res.status(400).json({ status: 'error', message: 'Mã tài sản không được để trống.' });
    if (!name?.trim())      return res.status(400).json({ status: 'error', message: 'Tên tài sản không được để trống.' });

    const existing = await Asset.findOne({ assetCode: assetCode.trim() });
    if (existing) return res.status(409).json({ status: 'error', message: 'Mã tài sản đã tồn tại.' });

    const isWarehouse = (type || 'csvc') === 'asset';
    const warehouseQuantities = isWarehouse
      ? deriveWarehouseQuantities({ quantity, goodQuantity, brokenQuantity, condition })
      : null;
    const asset = await Asset.create({
      assetCode:        assetCode.trim(),
      name:             name.trim(),
      type:             type || 'csvc',
      category:         category || 'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em',
      room:             room?.trim() || '',
      requiredQuantity: requiredQuantity ?? 0,
      quantity:         isWarehouse ? warehouseQuantities.quantity : (quantity ?? 1),
      area:             area != null && area !== '' ? Number(area) : null,
      constructionType: constructionType || 'Không áp dụng',
      condition:        isWarehouse ? warehouseQuantities.condition : normalizeCondition(condition),
      goodQuantity:     isWarehouse ? warehouseQuantities.goodQuantity : null,
      brokenQuantity:   isWarehouse ? warehouseQuantities.brokenQuantity : null,
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
    const { assetCode, name, type, category, room, requiredQuantity, quantity, area, constructionType, condition, notes, goodQuantity, brokenQuantity } = req.body;
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
    const nextType = type !== undefined ? type : asset.type;
    if (nextType === 'asset') {
      const normalized = deriveWarehouseQuantities({
        quantity: quantity !== undefined ? quantity : asset.quantity,
        goodQuantity: goodQuantity !== undefined ? goodQuantity : asset.goodQuantity,
        brokenQuantity: brokenQuantity !== undefined ? brokenQuantity : asset.brokenQuantity,
        condition: condition !== undefined ? condition : asset.condition,
      });
      asset.quantity = normalized.quantity;
      asset.goodQuantity = normalized.goodQuantity;
      asset.brokenQuantity = normalized.brokenQuantity;
      asset.condition = normalized.condition;
    } else if (quantity !== undefined) {
      asset.quantity = quantity;
    }
    if (area !== undefined)             asset.area             = area !== '' && area != null ? Number(area) : null;
    if (constructionType !== undefined) asset.constructionType = constructionType;
    if (condition !== undefined && nextType !== 'asset') asset.condition = normalizeCondition(condition);
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
        const normalizedCondition = normalizeCondition(condition);
        await Asset.create({
          assetCode:        assetCode.trim(),
          name:             name.trim(),
          category:         VALID_CATEGORIES.includes(category) ? category : 'Khác',
          room:             room?.trim() || '',
          requiredQuantity: Number(requiredQuantity) || 0,
          quantity:         quantity != null && quantity !== '' ? Number(quantity) : 0,
          area:             area != null && area !== '' ? Number(area) : null,
          constructionType: VALID_CONSTRUCTION.includes(constructionType) ? constructionType : 'Không áp dụng',
          condition:        normalizedCondition,
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

    const results = { created: 0, updated: 0, skipped: 0, errors: [] };
    let nttCounter = await Asset.countDocuments({ type: 'asset', category: 'Thiết bị ngoài thông tư' });
    const existingAssets = await Asset.find({ type: 'asset' });
    const byCodeAndName = new Map();
    const byCategoryAndName = new Map();

    for (const asset of existingAssets) {
      const canonicalName = toCanonical(asset.name);
      if (!canonicalName) continue;
      if (asset.assetCode) byCodeAndName.set(`${asset.assetCode}::${canonicalName}`, asset);
      byCategoryAndName.set(`${asset.category || ''}::${canonicalName}`, asset);
    }

    for (const item of assets) {
      try {
        const { name, category, quantity, condition, unit, notes, goodQuantity, brokenQuantity } = item;
        const normalizedCondition = normalizeCondition(condition);
        let { assetCode } = item;
        const normalizedCategory = normalizeWarehouseCategory(category);
        const inferredCategory = inferWarehouseCategoryFromCode(assetCode);
        const finalCategory = (
          !category?.trim()
          || (normalizedCategory === 'Đồ dùng' && inferredCategory && inferredCategory !== 'Đồ dùng')
          || inferredCategory === 'Thiết bị ngoài thông tư'
        ) ? (inferredCategory || normalizedCategory) : normalizedCategory;

        if (!canonicalName) {
          results.skipped++;
          results.errors.push('Thiếu tên tài sản');
          continue;
        }

        const warehouseQuantities = deriveWarehouseQuantities({
          quantity: Number(quantity) || 0,
          goodQuantity,
          brokenQuantity,
          condition: normalizedCondition,
        });

        let existing = null;
        if (assetCode?.trim()) {
          existing = await Asset.findOne({ type: 'asset', assetCode: assetCode.trim() });
        }
        if (!existing) {
          existing = await Asset.findOne({
            type: 'asset',
            category: finalCategory,
            name: { $regex: `^${escapeRegex(name.trim())}$`, $options: 'i' },
          });
        }

        if (existing) {
          const current = deriveWarehouseQuantities({
            quantity: existing.quantity,
            goodQuantity: existing.goodQuantity,
            brokenQuantity: existing.brokenQuantity,
            condition: existing.condition,
          });
          const mergedGood = current.goodQuantity + warehouseQuantities.goodQuantity;
          const mergedBroken = current.brokenQuantity + warehouseQuantities.brokenQuantity;
          existing.goodQuantity = mergedGood;
          existing.brokenQuantity = mergedBroken;
          existing.quantity = mergedGood + mergedBroken;
          existing.condition = mergedBroken > 0 ? 'Đã hỏng' : 'Còn tốt';
          if (!existing.unit && unit?.trim()) existing.unit = unit.trim();
          await existing.save();
          results.updated++;
          continue;
        }

        if (!assetCode?.trim()) {
          nttCounter++;
          assetCode = `TBNT${String(nttCounter).padStart(3, '0')}`;
        }

        await Asset.create({
          assetCode: assetCode.trim(),
          name: normalizedName,
          type: 'asset',
          category: finalCategory,
          quantity: warehouseQuantities.quantity,
          condition: warehouseQuantities.condition,
          goodQuantity: warehouseQuantities.goodQuantity,
          brokenQuantity: warehouseQuantities.brokenQuantity,
          unit: unit?.trim() || 'Cái',
          notes: notes?.trim() || '',
          createdBy: req.user._id,
        });
        byCodeAndName.set(`${createdAsset.assetCode}::${canonicalName}`, createdAsset);
        byCategoryAndName.set(`${createdAsset.category || ''}::${canonicalName}`, createdAsset);
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
