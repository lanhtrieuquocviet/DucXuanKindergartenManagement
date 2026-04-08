const Classroom = require('../models/Classroom');
const Classes = require('../models/Classes');

/** GET /api/classrooms — Danh sách tất cả phòng học (kèm thông tin lớp đang sử dụng) */
const listClassrooms = async (req, res) => {
  try {
    const AcademicYear = require('../models/AcademicYear');
    const classrooms = await Classroom.find().sort({ floor: 1, roomName: 1 }).lean();

    // Tìm năm học đang hoạt động để kiểm tra phòng đang được sử dụng
    const activeYear = await AcademicYear.findOne({ status: 'active' }).lean();
    if (activeYear) {
      const occupiedClasses = await Classes.find({ academicYearId: activeYear._id, roomId: { $ne: null } })
        .select('roomId className')
        .lean();
      const occupiedMap = {};
      for (const cls of occupiedClasses) {
        if (cls.roomId) occupiedMap[cls.roomId.toString()] = cls.className;
      }
      for (const room of classrooms) {
        const usedBy = occupiedMap[room._id.toString()];
        room.occupiedByClass = usedBy || null;
      }
    } else {
      for (const room of classrooms) room.occupiedByClass = null;
    }

    return res.status(200).json({ status: 'success', data: classrooms });
  } catch (error) {
    console.error('listClassrooms error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách phòng học' });
  }
};

/** POST /api/classrooms — Tạo phòng học */
const createClassroom = async (req, res) => {
  try {
    const { roomName, floor, capacity, note } = req.body;

    if (!roomName || !String(roomName).trim()) {
      return res.status(400).json({ status: 'error', message: 'Tên phòng không được để trống' });
    }
    const floorNum = Number(floor);
    if (!floor || isNaN(floorNum) || floorNum < 1) {
      return res.status(400).json({ status: 'error', message: 'Tầng phải là số nguyên >= 1' });
    }

    const existing = await Classroom.findOne({ roomName: String(roomName).trim() });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Tên phòng đã tồn tại' });
    }

    const classroom = await Classroom.create({
      roomName: String(roomName).trim(),
      floor: floorNum,
      capacity: Number(capacity) || 0,
      note: typeof note === 'string' ? note.trim() : '',
    });

    return res.status(201).json({ status: 'success', message: 'Tạo phòng học thành công', data: classroom });
  } catch (error) {
    console.error('createClassroom error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tạo phòng học' });
  }
};

/** PUT /api/classrooms/:id — Cập nhật phòng học */
const updateClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomName, floor, capacity, status, note } = req.body;

    const classroom = await Classroom.findById(id);
    if (!classroom) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy phòng học' });
    }

    if (roomName !== undefined) {
      const trimmed = String(roomName).trim();
      if (!trimmed) return res.status(400).json({ status: 'error', message: 'Tên phòng không được để trống' });
      if (trimmed !== classroom.roomName) {
        const dup = await Classroom.findOne({ roomName: trimmed });
        if (dup) return res.status(400).json({ status: 'error', message: 'Tên phòng đã tồn tại' });
      }
      classroom.roomName = trimmed;
    }

    if (floor !== undefined) {
      const floorNum = Number(floor);
      if (isNaN(floorNum) || floorNum < 1) {
        return res.status(400).json({ status: 'error', message: 'Tầng phải là số nguyên >= 1' });
      }
      classroom.floor = floorNum;
    }

    if (capacity !== undefined) classroom.capacity = Number(capacity) || 0;
    if (status !== undefined) classroom.status = status;
    if (note !== undefined) classroom.note = typeof note === 'string' ? note.trim() : '';

    await classroom.save();
    return res.status(200).json({ status: 'success', message: 'Cập nhật phòng học thành công', data: classroom });
  } catch (error) {
    console.error('updateClassroom error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật phòng học' });
  }
};

/** DELETE /api/classrooms/:id — Xóa phòng học (chỉ khi không có lớp nào dùng) */
const deleteClassroom = async (req, res) => {
  try {
    const { id } = req.params;

    const classroom = await Classroom.findById(id);
    if (!classroom) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy phòng học' });
    }

    const inUse = await Classes.countDocuments({ roomId: id });
    if (inUse > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Không thể xóa: phòng đang được sử dụng bởi ${inUse} lớp học`,
      });
    }

    await Classroom.findByIdAndDelete(id);
    return res.status(200).json({ status: 'success', message: 'Xóa phòng học thành công' });
  } catch (error) {
    console.error('deleteClassroom error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi xóa phòng học' });
  }
};

module.exports = { listClassrooms, createClassroom, updateClassroom, deleteClassroom };
