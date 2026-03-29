const Grade = require('../models/Grade');
const Classes = require('../models/Classes');
const Student = require('../models/Student');

/**
 * GET /api/grades
 * Lấy danh sách tất cả khối lớp (kèm tổng số trẻ)
 */
const listGrades = async (req, res) => {
  try {
    const grades = await Grade.find().sort({ gradeName: 1 }).lean();

    // Lấy tất cả lớp học để tính số lớp và giáo viên theo khối
    const allClasses = await Classes.find()
      .select('gradeId teacherIds')
      .populate({ path: 'teacherIds', populate: { path: 'userId', select: 'fullName' } })
      .lean();

    // Đếm học sinh theo classId
    const studentCounts = await Student.aggregate([
      { $match: { classId: { $ne: null } } },
      { $group: { _id: '$classId', count: { $sum: 1 } } },
    ]);
    const studentByClass = {};
    studentCounts.forEach(sc => { studentByClass[sc._id.toString()] = sc.count; });

    // Map gradeId → { totalStudents, teachers }
    const gradeStats = {};
    allClasses.forEach(cls => {
      const gId = (cls.gradeId?._id || cls.gradeId)?.toString();
      if (!gId) return;
      if (!gradeStats[gId]) gradeStats[gId] = { totalStudents: 0, teacherNames: new Set() };
      gradeStats[gId].totalStudents += studentByClass[cls._id.toString()] || 0;
      (cls.teacherIds || []).forEach(t => {
        const name = t?.userId?.fullName;
        if (name) gradeStats[gId].teacherNames.add(name);
      });
    });

    const data = grades.map(g => ({
      ...g,
      totalStudents: gradeStats[g._id.toString()]?.totalStudents || 0,
      teacherNames: gradeStats[g._id.toString()]
        ? [...gradeStats[g._id.toString()].teacherNames]
        : [],
    }));

    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    console.error('listGrades error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách khối lớp' });
  }
};

/**
 * POST /api/grades
 * Tạo khối lớp mới
 */
const createGrade = async (req, res) => {
  try {
    const { gradeName, description, maxClasses, minAge, maxAge, ageRange } = req.body;

    if (!gradeName || !String(gradeName).trim()) {
      return res.status(400).json({ status: 'error', message: 'Tên khối lớp không được để trống' });
    }

    const trimmed = String(gradeName).trim();
    if (trimmed.length > 10) {
      return res.status(400).json({ status: 'error', message: 'Tên khối lớp không được quá 10 ký tự' });
    }

    const desc = typeof description === 'string' ? description.trim() : '';
    if (desc.length > 50) {
      return res.status(400).json({ status: 'error', message: 'Mô tả không được quá 50 ký tự' });
    }

    let maxCls = 10;
    if (maxClasses !== undefined) {
      maxCls = Number(maxClasses);
      if (!Number.isInteger(maxCls) || maxCls < 1 || maxCls > 10) {
        return res.status(400).json({ status: 'error', message: 'Số lớp tối đa phải từ 1 đến 10' });
      }
    }

    const existing = await Grade.findOne({ gradeName: trimmed });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Tên khối lớp đã tồn tại' });
    }

    const minAgeVal = minAge !== undefined ? Number(minAge) : 0;
    const maxAgeVal = maxAge !== undefined ? Number(maxAge) : 0;
    const ageRangeVal = typeof ageRange === 'string' ? ageRange.trim() : '';

    const grade = await Grade.create({ gradeName: trimmed, description: desc, maxClasses: maxCls, minAge: minAgeVal, maxAge: maxAgeVal, ageRange: ageRangeVal });

    return res.status(201).json({ status: 'success', message: 'Tạo khối lớp thành công', data: grade });
  } catch (error) {
    console.error('createGrade error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tạo khối lớp' });
  }
};

/**
 * PUT /api/grades/:id
 * Cập nhật khối lớp
 */
const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { gradeName, description, maxClasses, minAge, maxAge, ageRange } = req.body;

    const grade = await Grade.findById(id);
    if (!grade) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy khối lớp' });
    }

    if (!gradeName || !String(gradeName).trim()) {
      return res.status(400).json({ status: 'error', message: 'Tên khối lớp không được để trống' });
    }

    const trimmed = String(gradeName).trim();
    if (trimmed.length > 10) {
      return res.status(400).json({ status: 'error', message: 'Tên khối lớp không được quá 10 ký tự' });
    }

    if (description !== undefined) {
      const desc = typeof description === 'string' ? description.trim() : '';
      if (desc.length > 50) {
        return res.status(400).json({ status: 'error', message: 'Mô tả không được quá 50 ký tự' });
      }
      grade.description = desc;
    }

    if (maxClasses !== undefined) {
      const maxCls = Number(maxClasses);
      if (!Number.isInteger(maxCls) || maxCls < 1 || maxCls > 10) {
        return res.status(400).json({ status: 'error', message: 'Số lớp tối đa phải từ 1 đến 10' });
      }
      // Ensure we don't reduce below the current class count
      const currentCount = await Classes.countDocuments({ gradeId: id });
      if (maxCls < currentCount) {
        return res.status(400).json({
          status: 'error',
          message: `Không thể đặt tối đa ${maxCls} lớp vì khối đang có ${currentCount} lớp học`,
        });
      }
      grade.maxClasses = maxCls;
    }

    if (trimmed !== grade.gradeName) {
      const existing = await Grade.findOne({ gradeName: trimmed });
      if (existing) {
        return res.status(400).json({ status: 'error', message: 'Tên khối lớp đã tồn tại' });
      }
    }

    grade.gradeName = trimmed;
    if (minAge !== undefined) grade.minAge = Number(minAge) || 0;
    if (maxAge !== undefined) grade.maxAge = Number(maxAge) || 0;
    if (ageRange !== undefined) grade.ageRange = typeof ageRange === 'string' ? ageRange.trim() : '';
    await grade.save();

    return res.status(200).json({ status: 'success', message: 'Cập nhật khối lớp thành công', data: grade });
  } catch (error) {
    console.error('updateGrade error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật khối lớp' });
  }
};

/**
 * DELETE /api/grades/:id
 * Xóa khối lớp (chỉ khi không có lớp nào thuộc khối này)
 */
const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;

    const grade = await Grade.findById(id);
    if (!grade) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy khối lớp' });
    }

    const classCount = await Classes.countDocuments({ gradeId: id });
    if (classCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Không thể xóa: khối lớp đang có ${classCount} lớp học liên kết`,
      });
    }

    await Grade.findByIdAndDelete(id);
    return res.status(200).json({ status: 'success', message: 'Xóa khối lớp thành công' });
  } catch (error) {
    console.error('deleteGrade error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi xóa khối lớp' });
  }
};

module.exports = { listGrades, createGrade, updateGrade, deleteGrade };
