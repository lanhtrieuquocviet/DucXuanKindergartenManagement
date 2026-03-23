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

const listTopics = async (req, res) => {
  try {
    const academicYearId = await getAcademicYearIdFromInput(req.query.yearId);
    if (!academicYearId) {
      return res.status(404).json({
        status: 'error',
        message: 'Chưa có năm học đang hoạt động',
      });
    }

    const filter = { academicYear: academicYearId };
    if (req.query.gradeId) filter.grade = req.query.gradeId;

    const topics = await AcademicPlanTopic.find(filter)
      .populate('academicYear', 'yearName')
      .populate('grade', 'gradeName')
      .populate({ path: 'teacherIds', select: 'userId', populate: { path: 'userId', select: 'fullName' } })
      .sort({ startDate: 1, createdAt: 1 });

    return res.status(200).json({
      status: 'success',
      data: topics.map(mapTopic),
    });
  } catch (error) {
    console.error('listTopics error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách chủ đề kế hoạch' });
  }
};

const createTopic = async (req, res) => {
  try {
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
    } = req.body || {};

    const academicYearId = await getAcademicYearIdFromInput(rawYearId);
    if (!academicYearId) {
      return res.status(404).json({ status: 'error', message: 'Chưa có năm học đang hoạt động' });
    }

    if (!gradeId || !mongoose.Types.ObjectId.isValid(gradeId)) {
      return res.status(400).json({ status: 'error', message: 'Thiếu hoặc sai gradeId' });
    }
    if (!topicName || !String(topicName).trim()) {
      return res.status(400).json({ status: 'error', message: 'Tên chủ đề không được để trống' });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập Từ ngày và Đến ngày' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return res.status(400).json({ status: 'error', message: 'Khoảng thời gian không hợp lệ' });
    }

    const inYear = await validateGradeInAcademicYear(academicYearId, gradeId);
    if (!inYear) {
      return res.status(400).json({ status: 'error', message: 'Khối lớp không thuộc năm học đã chọn' });
    }

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

    return res.status(201).json({
      status: 'success',
      message: 'Tạo chủ đề kế hoạch thành công',
      data: mapTopic(topic),
    });
  } catch (error) {
    console.error('createTopic error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tạo chủ đề kế hoạch' });
  }
};

const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'ID chủ đề không hợp lệ' });
    }
    const topic = await AcademicPlanTopic.findById(id);
    if (!topic) return res.status(404).json({ status: 'error', message: 'Không tìm thấy chủ đề' });

    const nextTopicName = req.body.topicName !== undefined ? String(req.body.topicName).trim() : topic.topicName;
    const nextTeachers = req.body.teachers !== undefined ? String(req.body.teachers || '').trim() : topic.teachers;
    const nextWeeks = req.body.weeks !== undefined ? Math.max(1, Number(req.body.weeks) || 1) : topic.weeks;
    const nextStart = req.body.startDate ? new Date(req.body.startDate) : topic.startDate;
    const nextEnd = req.body.endDate ? new Date(req.body.endDate) : topic.endDate;

    if (!nextTopicName) return res.status(400).json({ status: 'error', message: 'Tên chủ đề không được để trống' });
    if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime()) || nextStart > nextEnd) {
      return res.status(400).json({ status: 'error', message: 'Khoảng thời gian không hợp lệ' });
    }

    const validTeacherIds = await getValidTeacherIdsByGrade(String(topic.academicYear), String(topic.grade));
    let nextTeacherIds = topic.teacherIds || [];
    if (req.body.teacherIds !== undefined) {
      nextTeacherIds = Array.isArray(req.body.teacherIds)
        ? req.body.teacherIds
            .map((id) => String(id))
            .filter((id) => mongoose.Types.ObjectId.isValid(id) && validTeacherIds.has(id))
        : [];
    }

    topic.topicName = nextTopicName;
    topic.teachers = nextTeachers;
    topic.teacherIds = nextTeacherIds;
    topic.weeks = nextWeeks;
    topic.startDate = nextStart;
    topic.endDate = nextEnd;
    if (req.body.weeklyDetails !== undefined) {
      topic.weeklyDetails = normalizeWeeklyDetails(req.body.weeklyDetails, nextWeeks);
    }
    await topic.save();
    await topic.populate('academicYear', 'yearName');
    await topic.populate('grade', 'gradeName');
    await topic.populate({ path: 'teacherIds', select: 'userId', populate: { path: 'userId', select: 'fullName' } });

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật chủ đề kế hoạch thành công',
      data: mapTopic(topic),
    });
  } catch (error) {
    console.error('updateTopic error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật chủ đề kế hoạch' });
  }
};

const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'ID chủ đề không hợp lệ' });
    }
    const deleted = await AcademicPlanTopic.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ status: 'error', message: 'Không tìm thấy chủ đề' });
    return res.status(200).json({ status: 'success', message: 'Đã xóa chủ đề kế hoạch' });
  } catch (error) {
    console.error('deleteTopic error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi xóa chủ đề kế hoạch' });
  }
};

module.exports = {
  listTopics,
  createTopic,
  updateTopic,
  deleteTopic,
};
