const mongoose = require('mongoose');
const AcademicYear = require('../models/AcademicYear');
const Grade = require('../models/Grade');
const AcademicEventPlan = require('../models/AcademicEventPlan');

async function getAcademicYearIdFromInput(yearId) {
  if (yearId && mongoose.Types.ObjectId.isValid(yearId)) return yearId;
  const active = await AcademicYear.findOne({ status: 'active' }).select('_id').lean();
  return active?._id ? String(active._id) : null;
}

function monthKeyFromDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

async function getGradeMapByYear(academicYearId) {
  const rows = await Grade.find({}).select('_id gradeName').lean();
  const map = new Map();
  rows.forEach((row) => {
    const id = String(row?._id || '');
    const label = row?.gradeName || '';
    if (id && !map.has(id)) map.set(id, label || 'Khối lớp');
  });
  return map;
}

function normalizeMonths(inputMonths, validGradeMap) {
  const src = Array.isArray(inputMonths) ? inputMonths : [];
  return src.map((month) => {
    const monthKey = String(month?.monthKey || '').trim();
    if (!/^\d{4}-\d{2}$/.test(monthKey)) {
      const err = new Error(`Tháng không hợp lệ: ${monthKey || '(rỗng)'}`);
      err.statusCode = 400;
      throw err;
    }
    const rawItems = Array.isArray(month?.items) ? month.items : [];
    const items = rawItems.map((it) => {
      const name = String(it?.name || '').trim();
      const date = it?.date ? new Date(it.date) : null;
      const grade = String(it?.grade || '').trim();

      if (!name) {
        const err = new Error('Tên sự kiện không được để trống');
        err.statusCode = 400;
        throw err;
      }
      if (!date || Number.isNaN(date.getTime())) {
        const err = new Error(`Ngày sự kiện "${name}" không hợp lệ`);
        err.statusCode = 400;
        throw err;
      }
      if (monthKeyFromDate(date) !== monthKey) {
        const err = new Error(`Sự kiện "${name}" không thuộc tháng ${monthKey}`);
        err.statusCode = 400;
        throw err;
      }
      if (!mongoose.Types.ObjectId.isValid(grade) || !validGradeMap.has(grade)) {
        const err = new Error(`Khối lớp của sự kiện "${name}" không hợp lệ`);
        err.statusCode = 400;
        throw err;
      }

      return {
        name,
        date,
        grade,
        gradeName: validGradeMap.get(grade) || 'Khối lớp',
      };
    });
    items.sort((a, b) => new Date(a.date) - new Date(b.date));
    return { monthKey, items };
  });
}

const getEventPlan = async (req, res) => {
  try {
    const academicYearId = await getAcademicYearIdFromInput(req.query.yearId);
    if (!academicYearId) {
      return res.status(404).json({ status: 'error', message: 'Chưa có năm học đang hoạt động' });
    }

    const plan = await AcademicEventPlan.findOne({ academicYear: academicYearId }).lean();
    return res.status(200).json({
      status: 'success',
      data: {
        academicYearId,
        months: plan?.months || [],
      },
    });
  } catch (error) {
    console.error('getEventPlan error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy kế hoạch sự kiện' });
  }
};

const upsertEventPlan = async (req, res) => {
  try {
    const academicYearId = await getAcademicYearIdFromInput(req.body?.academicYearId || req.query.yearId);
    if (!academicYearId) {
      return res.status(404).json({ status: 'error', message: 'Chưa có năm học đang hoạt động' });
    }

    const validGradeMap = await getGradeMapByYear(academicYearId);
    const months = normalizeMonths(req.body?.months, validGradeMap);

    const doc = await AcademicEventPlan.findOneAndUpdate(
      { academicYear: academicYearId },
      { academicYear: academicYearId, months },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.status(200).json({
      status: 'success',
      message: 'Lưu kế hoạch sự kiện thành công',
      data: { academicYearId, months: doc?.months || [] },
    });
  } catch (error) {
    console.error('upsertEventPlan error:', error);
    return res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Lỗi khi lưu kế hoạch sự kiện',
    });
  }
};

module.exports = {
  getEventPlan,
  upsertEventPlan,
};

