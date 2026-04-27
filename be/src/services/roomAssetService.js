const RoomAsset = require('../models/RoomAsset');
const Classroom = require('../models/Classroom');
const Asset = require('../models/Asset');
const mongoose = require('mongoose');

let roomAssetIndexesEnsured = false;
let roomAssetEnsurePromise = null;

function normalizeText(v) {
  return String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getWarehouseAvailableQty(asset) {
  if (!asset) return 0;
  if (asset.type === 'asset') {
    return Math.max(0, Number(asset.goodQuantity ?? asset.quantity ?? 0) || 0);
  }
  return Math.max(0, Number(asset.quantity || 0));
}

async function ensureRoomAssetIndexes() {
  if (roomAssetIndexesEnsured) return;
  if (roomAssetEnsurePromise) return roomAssetEnsurePromise;

  roomAssetEnsurePromise = (async () => {
    try {
      const indexes = await RoomAsset.collection.indexes();
      const legacy = indexes.find((idx) =>
        idx?.name === 'room_1_assetType_1'
        || (idx?.key?.room === 1 && idx?.key?.assetType === 1)
      );
      if (legacy) {
        await RoomAsset.collection.dropIndex(legacy.name);
      }
    } catch {
      // Ignore: collection/index may not exist yet on fresh DB
    }

    try {
      await RoomAsset.collection.createIndex(
        { classroomId: 1, assetId: 1 },
        { unique: true, name: 'classroomId_1_assetId_1' }
      );
    } catch {
      // Keep app running; schema index will still apply when possible
    }

    roomAssetIndexesEnsured = true;
  })();

  try {
    await roomAssetEnsurePromise;
  } finally {
    roomAssetEnsurePromise = null;
  }
}

// GET /room-assets — danh sách tất cả phòng kèm số lượng tài sản
exports.listRooms = async (req, res) => {
  try {
    const Classes = require('../models/Classes');
    const classrooms = await Classroom.find().sort({ roomName: 1 }).lean();

    const counts = await RoomAsset.aggregate([
      { $group: { _id: '$classroomId', totalTypes: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
    ]);
    const countMap = {};
    counts.forEach((c) => { countMap[c._id.toString()] = c; });

    // Lấy danh sách lớp đang dùng phòng nào (roomId != null)
    const classesWithRoom = await Classes.find({ roomId: { $ne: null } })
      .select('roomId className')
      .lean();
    const classMap = {};
    const classIdMap = {};
    for (const cls of classesWithRoom) {
      if (cls.roomId) {
        classMap[cls.roomId.toString()] = cls.className;
        classIdMap[cls.roomId.toString()] = cls._id.toString();
      }
    }

    const data = classrooms.map((room) => {
      const stat = countMap[room._id.toString()] || { totalTypes: 0, totalQuantity: 0 };
      return {
        ...room,
        totalTypes: stat.totalTypes,
        totalQuantity: stat.totalQuantity,
        occupiedByClass: classMap[room._id.toString()] || null,
        occupiedByClassId: classIdMap[room._id.toString()] || null,
      };
    });

    return res.json({ status: 'success', data: { classrooms: data } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// GET /room-assets/:roomId — danh sách tài sản trong phòng
exports.listRoomAssets = async (req, res) => {
  try {
    const { roomId } = req.params;

    const classroom = await Classroom.findById(roomId).lean();
    if (!classroom) return res.status(404).json({ status: 'error', message: 'Không tìm thấy phòng.' });

    const items = await RoomAsset.find({ classroomId: roomId })
      .populate('assetId', 'assetCode name category unit')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ status: 'success', data: { classroom, items } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// POST /room-assets/:roomId — thêm tài sản vào phòng
exports.addAssetToRoom = async (req, res) => {
  try {
    await ensureRoomAssetIndexes();
    const { roomId } = req.params;
    const { assetId, quantity, notes } = req.body;

    if (!assetId) return res.status(400).json({ status: 'error', message: 'Vui lòng chọn loại tài sản.' });
    if (quantity === undefined || quantity < 0) return res.status(400).json({ status: 'error', message: 'Số lượng không hợp lệ.' });

    const [classroom, asset] = await Promise.all([
      Classroom.findById(roomId),
      Asset.findById(assetId),
    ]);
    if (!classroom) return res.status(404).json({ status: 'error', message: 'Không tìm thấy phòng.' });
    if (!asset) return res.status(404).json({ status: 'error', message: 'Không tìm thấy tài sản.' });

    const existing = await RoomAsset.findOne({ classroomId: roomId, assetId });
    if (existing) return res.status(409).json({ status: 'error', message: `Tài sản "${asset.name}" đã có trong phòng này.` });

    const [totalAllocated] = await RoomAsset.aggregate([
      { $match: { assetId: asset._id } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const allocated = totalAllocated?.total || 0;
    const remaining = getWarehouseAvailableQty(asset) - allocated;
    if (Number(quantity) > remaining) {
      return res.status(400).json({
        status: 'error',
        message: `Không đủ số lượng trong kho. Tồn còn lại: ${remaining}, yêu cầu: ${quantity}.`,
      });
    }

    const item = await RoomAsset.create({
      classroomId: roomId,
      assetId,
      quantity: Number(quantity),
      notes: notes?.trim() || '',
      createdBy: req.user._id,
    });

    const populated = await item.populate('assetId', 'assetCode name category unit');
    return res.status(201).json({ status: 'success', data: { item: populated } });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        status: 'error',
        message: 'Bản ghi tài sản theo phòng bị trùng do ràng buộc dữ liệu. Vui lòng tải lại trang và thử lại.',
      });
    }
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// PUT /room-assets/:roomId/:id — cập nhật số lượng / ghi chú
exports.updateRoomAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, notes } = req.body;

    const item = await RoomAsset.findById(id);
    if (!item) return res.status(404).json({ status: 'error', message: 'Không tìm thấy bản ghi.' });

    if (quantity !== undefined) {
      if (Number(quantity) < 0) return res.status(400).json({ status: 'error', message: 'Số lượng không hợp lệ.' });

      const asset = await Asset.findById(item.assetId);
      if (asset) {
        const [totalAllocated] = await RoomAsset.aggregate([
          { $match: { assetId: asset._id, _id: { $ne: item._id } } },
          { $group: { _id: null, total: { $sum: '$quantity' } } },
        ]);
        const allocated = totalAllocated?.total || 0;
        const remaining = getWarehouseAvailableQty(asset) - allocated;
        if (Number(quantity) > remaining) {
          return res.status(400).json({
            status: 'error',
            message: `Không đủ số lượng trong kho. Tồn còn lại: ${remaining}, yêu cầu: ${quantity}.`,
          });
        }
      }

      item.quantity = Number(quantity);
    }
    if (notes !== undefined) item.notes = notes.trim();

    await item.save();
    const populated = await item.populate('assetId', 'assetCode name category unit');
    return res.json({ status: 'success', data: { item: populated } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// DELETE /room-assets/:roomId/:id — xóa tài sản khỏi phòng
exports.removeAssetFromRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await RoomAsset.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ status: 'error', message: 'Không tìm thấy bản ghi.' });
    return res.json({ status: 'success', message: 'Đã xóa tài sản khỏi phòng.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// POST /room-assets/:roomId/import — import tài sản theo phòng (cộng dồn)
exports.bulkImportRoomAssets = async (req, res) => {
  try {
    await ensureRoomAssetIndexes();
    const { roomId } = req.params;
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Không có dữ liệu import.' });
    }

    const classroom = await Classroom.findById(roomId).lean();
    if (!classroom) return res.status(404).json({ status: 'error', message: 'Không tìm thấy phòng.' });

    const [roomItems, catalog] = await Promise.all([
      RoomAsset.find({ classroomId: roomId }).lean(),
      Asset.find({ type: 'asset' }).select('_id assetCode name type quantity goodQuantity').lean(),
    ]);

    const catalogByCode = new Map();
    const catalogByName = new Map();
    const assetById = new Map();
    catalog.forEach((a) => {
      const codeKey = normalizeText(a.assetCode);
      if (codeKey) catalogByCode.set(codeKey, a);
      const nameKey = normalizeText(a.name);
      if (nameKey) catalogByName.set(nameKey, a);
      assetById.set(String(a._id), a);
    });

    const roomByAssetId = new Map(
      roomItems.map((i) => [String(i.assetId), i])
    );

    const prepared = new Map();
    const result = { created: 0, updated: 0, skipped: 0, errors: [] };

    rows.forEach((r, idx) => {
      const rowNo = idx + 1;
      const qty = Number(r?.quantity) || 0;
      if (qty <= 0) {
        result.skipped++;
        result.errors.push(`Dòng ${rowNo}: Số lượng không hợp lệ.`);
        return;
      }

      const code = normalizeText(r?.assetCode);
      const name = normalizeText(r?.name);
      const matched = (code ? catalogByCode.get(code) : null) || (name ? catalogByName.get(name) : null);
      if (!matched?._id) {
        result.skipped++;
        result.errors.push(`Dòng ${rowNo}: Không tìm thấy tài sản "${r?.assetCode || r?.name || '?'}" trong kho.`);
        return;
      }

      const id = String(matched._id);
      if (!prepared.has(id)) {
        const existed = roomByAssetId.get(id);
        prepared.set(id, { assetId: id, addQty: 0, roomItem: existed || null });
      }
      prepared.get(id).addQty += qty;
    });

    const preparedIds = [...prepared.keys()];
    const allocatedRows = preparedIds.length
      ? await RoomAsset.aggregate([
        { $match: { assetId: { $in: preparedIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
        { $group: { _id: '$assetId', total: { $sum: '$quantity' } } },
      ])
      : [];
    const allocatedMap = new Map(
      allocatedRows.map((a) => [String(a._id), Number(a.total) || 0])
    );

    for (const [assetId, payload] of prepared.entries()) {
      const asset = assetById.get(assetId);
      if (!asset) {
        result.skipped++;
        result.errors.push(`Không tìm thấy tài sản ID ${assetId}.`);
        continue;
      }

      const roomItem = payload.roomItem;
      const currentRoomQty = Number(roomItem?.quantity || 0);
      const totalAllocated = Number(allocatedMap.get(assetId) || 0);
      const availableFromWarehouse = getWarehouseAvailableQty(asset);
      const maxAllowedForRoom = availableFromWarehouse - (totalAllocated - currentRoomQty);
      const nextQty = currentRoomQty + payload.addQty;

      if (nextQty > maxAllowedForRoom) {
        result.skipped++;
        result.errors.push(
          `Không đủ kho cho "${asset.name}": còn ${Math.max(0, maxAllowedForRoom)} để phân bổ, cần thêm ${payload.addQty}.`
        );
        continue;
      }

      if (roomItem) {
        await RoomAsset.findByIdAndUpdate(roomItem._id, { quantity: nextQty });
        result.updated++;
      } else {
        await RoomAsset.create({
          classroomId: roomId,
          assetId,
          quantity: payload.addQty,
          notes: '',
          createdBy: req.user._id,
        });
        result.created++;
      }
    }

    return res.json({ status: 'success', data: result });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        status: 'error',
        message: 'Import bị trùng ràng buộc dữ liệu theo phòng. Vui lòng thử lại sau khi tải lại trang.',
      });
    }
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
