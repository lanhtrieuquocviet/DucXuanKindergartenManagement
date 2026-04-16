const Grade = require('../models/Grade');
const Classes = require('../models/Classes');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

function normalizeAgeLabel(minAge, maxAge) {
  const min = Number(minAge);
  const max = Number(maxAge);

  if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0) {
    return `${min} - ${max}`;
  }
  if (Number.isFinite(min) && min > 0) {
    return `${min}+`;
  }
  if (Number.isFinite(max) && max > 0) {
    return `0 - ${max}`;
  }
  return '';
}

/**
 * GET /api/grades
 * Lấy danh sách tất cả khối lớp (kèm tổng số trẻ)
 */
const listGrades = async (req, res) => {
  try {
    await Grade.updateMany({ ageRange: { $exists: true } }, { $unset: { ageRange: '' } });

    const grades = await Grade.find().sort({ gradeName: 1 })
      .populate({ path: 'headTeacherId', populate: { path: 'userId', select: 'fullName' } })
      .lean();

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
      ageLabel: normalizeAgeLabel(g.minAge, g.maxAge),
      totalStudents: gradeStats[g._id.toString()]?.totalStudents || 0,
      teacherNames: gradeStats[g._id.toString()]
        ? [...gradeStats[g._id.toString()].teacherNames]
        : [],
      headTeacher: g.headTeacherId
        ? { _id: g.headTeacherId._id, fullName: g.headTeacherId.userId?.fullName || '' }
        : null,
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
    const { gradeName, description, maxClasses, minAge, maxAge, headTeacherId } = req.body;

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

    // Kiểm tra tổ trưởng: 1 giáo viên không được làm tổ trưởng 2 khối trong cùng năm học
    let headTeacherVal = null;
    if (headTeacherId) {
      const conflict = await Grade.findOne({ headTeacherId, _id: { $ne: null } }).lean();
      if (conflict) {
        return res.status(400).json({
          status: 'error',
          message: `Giáo viên này đã là tổ trưởng của khối "${conflict.gradeName}" trong năm học hiện tại`,
        });
      }
      headTeacherVal = headTeacherId;
    }

    const minAgeVal = minAge !== undefined ? Number(minAge) : 0;
    const maxAgeVal = maxAge !== undefined ? Number(maxAge) : 0;
    if (Number.isNaN(minAgeVal) || minAgeVal < 0) {
      return res.status(400).json({ status: 'error', message: 'Độ tuổi tối thiểu không hợp lệ' });
    }
    if (Number.isNaN(maxAgeVal) || maxAgeVal < 0) {
      return res.status(400).json({ status: 'error', message: 'Độ tuổi tối đa không hợp lệ' });
    }
    if (minAgeVal > 0 && maxAgeVal > 0 && minAgeVal >= maxAgeVal) {
      return res.status(400).json({ status: 'error', message: 'Tuổi tối đa phải lớn hơn tuổi tối thiểu' });
    }

    const grade = await Grade.create({
      gradeName: trimmed, description: desc, maxClasses: maxCls,
      minAge: minAgeVal, maxAge: maxAgeVal,
      headTeacherId: headTeacherVal,
    });

    await Grade.updateOne({ _id: grade._id }, { $unset: { ageRange: '' } });

    if (headTeacherVal) {
      await Teacher.findByIdAndUpdate(headTeacherVal, { isLeader: true });
    }

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
    const { maxClasses, headTeacherId } = req.body;

    const grade = await Grade.findById(id);
    if (!grade) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy khối lớp' });
    }

    const immutableFieldChanged = [
      ['gradeName', String(req.body?.gradeName || '').trim(), String(grade.gradeName || '').trim()],
      ['description', String(req.body?.description || '').trim(), String(grade.description || '').trim()],
      ['minAge', req.body?.minAge ?? grade.minAge, grade.minAge],
      ['maxAge', req.body?.maxAge ?? grade.maxAge, grade.maxAge],
    ].some(([field, incoming, current]) => {
      if (!(field in (req.body || {}))) return false;
      return String(incoming) !== String(current);
    });

    if (immutableFieldChanged) {
      return res.status(400).json({
        status: 'error',
        message: 'Chỉ được phép chỉnh sửa tổ trưởng khối và số lớp tối đa',
      });
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

    // Kiểm tra tổ trưởng: 1 giáo viên không được làm tổ trưởng 2 khối trong cùng năm học
    if (headTeacherId !== undefined) {
      const oldHeadTeacherId = grade.headTeacherId ? grade.headTeacherId.toString() : null;
      const newHeadTeacherId = headTeacherId || null;

      if (newHeadTeacherId) {
        const conflict = await Grade.findOne({ headTeacherId: newHeadTeacherId, _id: { $ne: id } }).lean();
        if (conflict) {
          return res.status(400).json({
            status: 'error',
            message: `Giáo viên này đã là tổ trưởng của khối "${conflict.gradeName}" trong năm học hiện tại`,
          });
        }
      }

      // Sync isLeader: remove from old, assign to new
      if (oldHeadTeacherId && oldHeadTeacherId !== newHeadTeacherId) {
        // Check if old teacher is still head of another grade before unsetting
        const stillLeader = await Grade.findOne({ headTeacherId: oldHeadTeacherId, _id: { $ne: id } }).lean();
        if (!stillLeader) {
          await Teacher.findByIdAndUpdate(oldHeadTeacherId, { isLeader: false });
        }
      }
      if (newHeadTeacherId && newHeadTeacherId !== oldHeadTeacherId) {
        await Teacher.findByIdAndUpdate(newHeadTeacherId, { isLeader: true });
      }

      grade.headTeacherId = newHeadTeacherId;
    }

    grade.set('ageRange', undefined, { strict: false });
    await grade.save();
    await Grade.updateOne({ _id: grade._id }, { $unset: { ageRange: '' } });

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
