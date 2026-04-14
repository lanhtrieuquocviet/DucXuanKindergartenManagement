const mongoose = require('mongoose');
const AcademicYear = require('../models/AcademicYear');
const Classes = require('../models/Classes');
const AcademicPlanTopic = require('../models/AcademicPlanTopic');

const DAY_MAP = {
  'Thứ 2': 'thu2',
  'Thứ 3': 'thu3',
  'Thứ 4': 'thu4',
  'Thứ 5': 'thu5',
  'Thứ 6': 'thu6',
};

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

function normalizeWeeklyDetails(rawWeeklyDetails, weeks) {
  const totalWeeks = Math.max(1, Number(weeks) || 1);
  const input = Array.isArray(rawWeeklyDetails) ? rawWeeklyDetails : [];
  const result = [];

  for (let i = 0; i < totalWeeks; i += 1) {
    const row = input[i] || {};
    const rawDayPlans = row.dayPlans || {};
    result.push({
      weekIndex: i + 1,
      weekName: String(row.weekName || `Tuần ${i + 1}`).trim(),
      weekTopic: String(row.weekTopic || '').trim(),
      weekRange: String(row.weekRange || '').trim(),
      dayPlans: {
        thu2: String(rawDayPlans.thu2 ?? rawDayPlans[DAY_MAP['Thứ 2']] ?? rawDayPlans['Thứ 2'] ?? '').trim(),
        thu3: String(rawDayPlans.thu3 ?? rawDayPlans[DAY_MAP['Thứ 3']] ?? rawDayPlans['Thứ 3'] ?? '').trim(),
        thu4: String(rawDayPlans.thu4 ?? rawDayPlans[DAY_MAP['Thứ 4']] ?? rawDayPlans['Thứ 4'] ?? '').trim(),
        thu5: String(rawDayPlans.thu5 ?? rawDayPlans[DAY_MAP['Thứ 5']] ?? rawDayPlans['Thứ 5'] ?? '').trim(),
        thu6: String(rawDayPlans.thu6 ?? rawDayPlans[DAY_MAP['Thứ 6']] ?? rawDayPlans['Thứ 6'] ?? '').trim(),
      },
    });
  }

  return result;
}

function mapTopic(topic) {
  const teacherRows = Array.isArray(topic.teacherIds) ? topic.teacherIds : [];
  const teacherNames = teacherRows
    .map((t) => t?.userId?.fullName || t?.fullName || '')
    .filter(Boolean);
  return {
    id: topic._id,
    academicYearId: topic.academicYear?._id || topic.academicYear,
    yearName: topic.academicYear?.yearName || '',
    gradeId: topic.grade?._id || topic.grade,
    gradeName: topic.grade?.gradeName || '',
    topicName: topic.topicName || '',
    startDate: topic.startDate,
    endDate: topic.endDate,
    weeks: topic.weeks,
    teachers: topic.teachers || '',
    teacherIds: teacherRows.map((t) => t?._id || t).filter(Boolean),
    teacherNames,
    weeklyDetails: (topic.weeklyDetails || []).map((w) => ({
      weekIndex: w.weekIndex,
      weekName: w.weekName || '',
      weekTopic: w.weekTopic || '',
      weekRange: w.weekRange || '',
      dayPlans: {
        thu2: w.dayPlans?.thu2 || '',
        thu3: w.dayPlans?.thu3 || '',
        thu4: w.dayPlans?.thu4 || '',
        thu5: w.dayPlans?.thu5 || '',
        thu6: w.dayPlans?.thu6 || '',
      },
    })),
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
  };
}

async function validateGradeInAcademicYear(academicYearId, gradeId) {
  if (!mongoose.Types.ObjectId.isValid(gradeId)) return false;
  const cls = await Classes.findOne({ academicYearId, gradeId }).select('_id').lean();
  return !!cls;
}

async function getValidTeacherIdsByGrade(academicYearId, gradeId) {
  const classes = await Classes.find({ academicYearId, gradeId }).select('teacherIds').lean();
  const set = new Set();
  classes.forEach((cls) => {
    (cls.teacherIds || []).forEach((id) => set.add(String(id)));
  });
  return set;
}

const listTopics = async ({ yearId, gradeId }) => {
  const academicYearId = await getAcademicYearIdFromInput(yearId);
  if (!academicYearId) throw createHttpError(404, 'Chưa có năm học đang hoạt động');

  const filter = { academicYear: academicYearId };
  if (gradeId) filter.grade = gradeId;

  const topics = await AcademicPlanTopic.find(filter)
    .populate('academicYear', 'yearName')
    .populate('grade', 'gradeName')
    .populate({ path: 'teacherIds', select: 'userId', populate: { path: 'userId', select: 'fullName' } })
    .sort({ startDate: 1, createdAt: 1 });

  return topics.map(mapTopic);
};

const createTopic = async (payload) => {
  const {
    academicYearId: rawYearId,
    gradeId,
    teacherIds,
    topicName,
    startDate,
    endDate,
    weeks,
    teachers,
    weeklyDetails,
  } = payload || {};

  const academicYearId = await getAcademicYearIdFromInput(rawYearId);
  if (!academicYearId) throw createHttpError(404, 'Chưa có năm học đang hoạt động');
  if (!gradeId || !mongoose.Types.ObjectId.isValid(gradeId)) throw createHttpError(400, 'Thiếu hoặc sai gradeId');
  if (!topicName || !String(topicName).trim()) throw createHttpError(400, 'Tên chủ đề không được để trống');
  if (!startDate || !endDate) throw createHttpError(400, 'Vui lòng nhập Từ ngày và Đến ngày');

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw createHttpError(400, 'Khoảng thời gian không hợp lệ');
  }

  const inYear = await validateGradeInAcademicYear(academicYearId, gradeId);
  if (!inYear) throw createHttpError(400, 'Khối lớp không thuộc năm học đã chọn');

  const validTeacherIds = await getValidTeacherIdsByGrade(academicYearId, gradeId);
  const selectedTeacherIds = Array.isArray(teacherIds)
    ? teacherIds
      .map((id) => String(id))
      .filter((id) => mongoose.Types.ObjectId.isValid(id) && validTeacherIds.has(id))
    : [];

  const totalWeeks = Math.max(1, Number(weeks) || 1);
  const topic = await AcademicPlanTopic.create({
    academicYear: academicYearId,
    grade: gradeId,
    topicName: String(topicName).trim(),
    startDate: start,
    endDate: end,
    weeks: totalWeeks,
    teachers: String(teachers || '').trim(),
    teacherIds: selectedTeacherIds,
    weeklyDetails: normalizeWeeklyDetails(weeklyDetails, totalWeeks),
  });

  await topic.populate('academicYear', 'yearName');
  await topic.populate('grade', 'gradeName');
  await topic.populate({ path: 'teacherIds', select: 'userId', populate: { path: 'userId', select: 'fullName' } });

  return mapTopic(topic);
};

const updateTopic = async (id, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw createHttpError(400, 'ID chủ đề không hợp lệ');
  const topic = await AcademicPlanTopic.findById(id);
  if (!topic) throw createHttpError(404, 'Không tìm thấy chủ đề');

  const nextTopicName = payload.topicName !== undefined ? String(payload.topicName).trim() : topic.topicName;
  const nextTeachers = payload.teachers !== undefined ? String(payload.teachers || '').trim() : topic.teachers;
  const nextWeeks = payload.weeks !== undefined ? Math.max(1, Number(payload.weeks) || 1) : topic.weeks;
  const nextStart = payload.startDate ? new Date(payload.startDate) : topic.startDate;
  const nextEnd = payload.endDate ? new Date(payload.endDate) : topic.endDate;

  if (!nextTopicName) throw createHttpError(400, 'Tên chủ đề không được để trống');
  if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime()) || nextStart > nextEnd) {
    throw createHttpError(400, 'Khoảng thời gian không hợp lệ');
  }

  const validTeacherIds = await getValidTeacherIdsByGrade(String(topic.academicYear), String(topic.grade));
  let nextTeacherIds = topic.teacherIds || [];
  if (payload.teacherIds !== undefined) {
    nextTeacherIds = Array.isArray(payload.teacherIds)
      ? payload.teacherIds
        .map((value) => String(value))
        .filter((value) => mongoose.Types.ObjectId.isValid(value) && validTeacherIds.has(value))
      : [];
  }

  topic.topicName = nextTopicName;
  topic.teachers = nextTeachers;
  topic.teacherIds = nextTeacherIds;
  topic.weeks = nextWeeks;
  topic.startDate = nextStart;
  topic.endDate = nextEnd;
  if (payload.weeklyDetails !== undefined) {
    topic.weeklyDetails = normalizeWeeklyDetails(payload.weeklyDetails, nextWeeks);
  }

  await topic.save();
  await topic.populate('academicYear', 'yearName');
  await topic.populate('grade', 'gradeName');
  await topic.populate({ path: 'teacherIds', select: 'userId', populate: { path: 'userId', select: 'fullName' } });
  return mapTopic(topic);
};

const deleteTopic = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw createHttpError(400, 'ID chủ đề không hợp lệ');
  const deleted = await AcademicPlanTopic.findByIdAndDelete(id);
  if (!deleted) throw createHttpError(404, 'Không tìm thấy chủ đề');
};

module.exports = {
  listTopics,
  createTopic,
  updateTopic,
  deleteTopic,
};
