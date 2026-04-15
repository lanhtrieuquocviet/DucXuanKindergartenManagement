const mongoose = require('mongoose');
const AcademicYear = require('../models/AcademicYear');
const Grade = require('../models/Grade');
const AcademicEventPlan = require('../models/AcademicEventPlan');

const createHttpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

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

async function getGradeMapByYear() {
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
      throw createHttpError(400, `Tháng không hợp lệ: ${monthKey || '(rỗng)'}`);
    }

    const rawItems = Array.isArray(month?.items) ? month.items : [];
    const items = rawItems.map((it) => {
      const name = String(it?.name || '').trim();
      const startDate = it?.startDate
        ? new Date(it.startDate)
        : (it?.date ? new Date(it.date) : null);
      const endDate = it?.endDate
        ? new Date(it.endDate)
        : (it?.date ? new Date(it.date) : null);
      const grade = String(it?.grade || '').trim();

      if (!name) throw createHttpError(400, 'Tên sự kiện không được để trống');
      if (
        !startDate ||
        Number.isNaN(startDate.getTime()) ||
        !endDate ||
        Number.isNaN(endDate.getTime())
      ) {
        throw createHttpError(400, `Khoảng ngày sự kiện "${name}" không hợp lệ`);
      }
      if (startDate > endDate) {
        throw createHttpError(400, `Sự kiện "${name}" có ngày kết thúc nhỏ hơn ngày bắt đầu`);
      }
      if (monthKeyFromDate(startDate) !== monthKey || monthKeyFromDate(endDate) !== monthKey) {
        throw createHttpError(400, `Khoảng ngày sự kiện "${name}" phải thuộc tháng ${monthKey}`);
      }
      if (!mongoose.Types.ObjectId.isValid(grade) || !validGradeMap.has(grade)) {
        throw createHttpError(400, `Khối lớp của sự kiện "${name}" không hợp lệ`);
      }

      return {
        name,
        date: startDate,
        startDate,
        endDate,
        grade,
        gradeName: validGradeMap.get(grade) || 'Khối lớp',
      };
    });

    items.sort((a, b) => new Date(a.startDate || a.date) - new Date(b.startDate || b.date));
    return { monthKey, items };
  });
}

const getEventPlan = async (yearIdInput) => {
  const academicYearId = await getAcademicYearIdFromInput(yearIdInput);
  if (!academicYearId) throw createHttpError(404, 'Chưa có năm học đang hoạt động');

  const plan = await AcademicEventPlan.findOne({ academicYear: academicYearId }).lean();
  return {
    academicYearId,
    months: plan?.months || [],
  };
};

const upsertEventPlan = async ({ academicYearId: inputYearId, months: inputMonths, queryYearId }) => {
  const academicYearId = await getAcademicYearIdFromInput(inputYearId || queryYearId);
  if (!academicYearId) throw createHttpError(404, 'Chưa có năm học đang hoạt động');

  const validGradeMap = await getGradeMapByYear(academicYearId);
  const months = normalizeMonths(inputMonths, validGradeMap);

  const doc = await AcademicEventPlan.findOneAndUpdate(
    { academicYear: academicYearId },
    { academicYear: academicYearId, months },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return {
    academicYearId,
    months: doc?.months || [],
  };
};

module.exports = {
  getEventPlan,
  upsertEventPlan,
};
