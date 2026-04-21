const RoomAsset = require('../models/RoomAsset');
const Classroom = require('../models/Classroom');
const Asset = require('../models/Asset');

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
    const remaining = (asset.quantity || 0) - allocated;
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
        const remaining = (asset.quantity || 0) - allocated;
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
