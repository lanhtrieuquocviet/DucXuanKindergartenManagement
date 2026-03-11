const Grade = require('../models/Grade');
const Classes = require('../models/Classes');

/**
 * GET /api/grades
 * Lấy danh sách tất cả khối lớp
 */
const listGrades = async (req, res) => {
  try {
    const grades = await Grade.find().sort({ gradeName: 1 }).lean();
    return res.status(200).json({ status: 'success', data: grades });
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
    const { gradeName, description } = req.body;

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

    const existing = await Grade.findOne({ gradeName: trimmed });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Tên khối lớp đã tồn tại' });
    }

    const grade = await Grade.create({ gradeName: trimmed, description: desc });

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
    const { gradeName, description } = req.body;

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

    if (trimmed !== grade.gradeName) {
      const existing = await Grade.findOne({ gradeName: trimmed });
      if (existing) {
        return res.status(400).json({ status: 'error', message: 'Tên khối lớp đã tồn tại' });
      }
    }

    grade.gradeName = trimmed;
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
