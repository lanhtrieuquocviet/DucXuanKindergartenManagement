const Timetable = require('../models/Timetable');
const AcademicYear = require('../models/AcademicYear');
const { resolveEffectiveTimetableSeason } = require('../utils/timetableSeason');
const { createNotification } = require('../controller/notification.controller');

const createHttpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

function parseTimeToMinutes(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = String(value).trim();
  if (!s) return null;

  const amPmMatch = s.match(/\b(AM|PM)\b/i);
  const amPm = amPmMatch ? amPmMatch[1].toUpperCase() : null;

  const hmMatch = s.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (!hmMatch) return null;

  let hours = Number(hmMatch[1]);
  const minutes = Number(hmMatch[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (minutes < 0 || minutes > 59) return null;

  if (amPm) {
    if (amPm === 'AM') {
      if (hours === 12) hours = 0;
    } else if (amPm === 'PM') {
      if (hours !== 12) hours += 12;
    }
  }

  if (hours < 0 || hours > 23) return null;
  return hours * 60 + minutes;
}

function minutesToLabel(m) {
  const mm = Number(m);
  if (Number.isNaN(mm)) return '';
  const h = Math.floor(mm / 60);
  const minutes = mm % 60;
  return `${h}:${String(minutes).padStart(2, '0')}`;
}

function seasonLabel(season) {
  if (season === 'summer') return 'Mùa Hè';
  if (season === 'winter') return 'Mùa Đông';
  return 'Cả 2 mùa';
}

function recordAffectsSeason(record, season) {
  if (!record) return false;
  if (record.appliesToSeason === 'both') return true;
  return record.appliesToSeason === season;
}

function getAffectedSeasons(appliesToSeason) {
  if (appliesToSeason === 'both') return ['summer', 'winter'];
  return [appliesToSeason];
}

async function getAcademicYearIdFromInput(queryYearId) {
  let yearId = queryYearId;
  if (!yearId) {
    const current = await AcademicYear.findOne({ status: 'active' })
      .sort({ startDate: -1 })
      .select('_id')
      .lean();
    yearId = current?._id;
  }
  return yearId || null;
}

async function checkOverlap({ academicYearId, appliesToSeason, startMinutes, endMinutes, excludeId }) {
  const affectedSeasons = getAffectedSeasons(appliesToSeason);
  const existing = await Timetable.find({ academicYear: academicYearId }).lean();

  for (const season of affectedSeasons) {
    const conflict = existing.find((r) => {
      if (excludeId && String(r._id) === String(excludeId)) return false;
      if (!recordAffectsSeason(r, season)) return false;
      return startMinutes < r.endMinutes && endMinutes > r.startMinutes;
    });

    if (conflict) {
      return {
        ok: false,
        message: 'Đã trùng với giờ trong thời gian biểu. Vui lòng chọn giờ khác.',
      };
    }
  }

  return { ok: true };
}

function mapTimetableItem(a) {
  return {
    _id: a._id,
    appliesToSeason: a.appliesToSeason,
    startMinutes: a.startMinutes,
    endMinutes: a.endMinutes,
    startLabel: minutesToLabel(a.startMinutes),
    endLabel: minutesToLabel(a.endMinutes),
    content: a.content || '',
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

const listByYear = async (queryYearId) => {
  const academicYearId = await getAcademicYearIdFromInput(queryYearId);
  if (!academicYearId) {
    return { data: [], yearName: '', activeTimetableSeason: 'auto' };
  }

  const year = await AcademicYear.findById(academicYearId)
    .select('yearName activeTimetableSeason')
    .lean();
  const list = await Timetable.find({ academicYear: academicYearId })
    .sort({ startMinutes: 1 })
    .lean();

  return {
    data: list.map(mapTimetableItem),
    yearName: year?.yearName || '',
    activeTimetableSeason: year?.activeTimetableSeason || 'auto',
  };
};

const upsert = async ({ id, academicYearId, queryYearId, appliesToSeason, startTime, endTime, content }) => {
  let yearId = academicYearId;
  if (!yearId) yearId = await getAcademicYearIdFromInput(queryYearId);
  if (!yearId) throw createHttpError(400, 'Chưa có năm học đang hoạt động.');
  if (!appliesToSeason) throw createHttpError(400, 'Thiếu áp dụng cho mùa.');

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (startMinutes == null || endMinutes == null) {
    throw createHttpError(400, 'Thiếu thời gian (từ giờ / đến giờ).');
  }
  if (startMinutes >= endMinutes) throw createHttpError(400, 'Từ giờ phải nhỏ hơn đến giờ.');

  const overlap = await checkOverlap({
    academicYearId: yearId,
    appliesToSeason,
    startMinutes,
    endMinutes,
    excludeId: id || null,
  });
  if (!overlap.ok) throw createHttpError(400, overlap.message);

  const payload = {
    academicYear: yearId,
    appliesToSeason,
    startMinutes,
    endMinutes,
    content: typeof content === 'string' ? content.trim() : '',
  };

  let doc;
  let previousDoc = null;
  if (id) {
    previousDoc = await Timetable.findOne({ _id: id, academicYear: yearId }).lean();
    doc = await Timetable.findOneAndUpdate(
      { _id: id, academicYear: yearId },
      payload,
      { new: true, runValidators: true }
    );
  } else {
    doc = await Timetable.create(payload);
  }

  if (!doc) throw createHttpError(404, 'Không tìm thấy hoạt động.');

  const year = await AcademicYear.findById(yearId).select('yearName').lean();
  const yearName = year?.yearName || '';
  const actionText = id ? 'cập nhật' : 'thêm mới';
  const detailText = `${minutesToLabel(doc.startMinutes)} - ${minutesToLabel(doc.endMinutes)} · ${doc.content || 'Không có nội dung'}`;

  await createNotification({
    title: 'Thời gian biểu có thay đổi',
    body: `Đã ${actionText} hoạt động (${seasonLabel(doc.appliesToSeason)}) năm học ${yearName}: ${detailText}`,
    type: 'timetable_update',
    targetRole: 'all',
    extra: {
      action: id ? 'update' : 'create',
      timetableId: String(doc._id),
      yearId: String(yearId),
      yearName,
      season: doc.appliesToSeason,
      startMinutes: doc.startMinutes,
      endMinutes: doc.endMinutes,
      content: doc.content || '',
      previous: previousDoc
        ? {
          startMinutes: previousDoc.startMinutes,
          endMinutes: previousDoc.endMinutes,
          content: previousDoc.content || '',
          season: previousDoc.appliesToSeason,
        }
        : null,
    },
  });

  return mapTimetableItem(doc);
};

const remove = async ({ id, queryYearId, bodyYearId }) => {
  if (!id) throw createHttpError(400, 'Thiếu id hoạt động.');

  let academicYearId = queryYearId || bodyYearId;
  if (!academicYearId) academicYearId = await getAcademicYearIdFromInput(queryYearId);

  const filter = academicYearId ? { _id: id, academicYear: academicYearId } : { _id: id };
  const deleted = await Timetable.findOneAndDelete(filter).lean();
  if (!deleted) throw createHttpError(404, 'Không tìm thấy hoạt động để xóa.');

  const year = academicYearId
    ? await AcademicYear.findById(academicYearId).select('yearName').lean()
    : null;
  const yearName = year?.yearName || '';

  await createNotification({
    title: 'Thời gian biểu có thay đổi',
    body: `Đã xóa hoạt động (${seasonLabel(deleted.appliesToSeason)}) năm học ${yearName}: ${minutesToLabel(deleted.startMinutes)} - ${minutesToLabel(deleted.endMinutes)} · ${deleted.content || 'Không có nội dung'}`,
    type: 'timetable_update',
    targetRole: 'all',
    extra: {
      action: 'delete',
      timetableId: String(deleted._id),
      yearId: academicYearId ? String(academicYearId) : '',
      yearName,
      season: deleted.appliesToSeason,
      startMinutes: deleted.startMinutes,
      endMinutes: deleted.endMinutes,
      content: deleted.content || '',
    },
  });
};

const listPublic = async (queryYearId) => {
  const academicYearId = await getAcademicYearIdFromInput(queryYearId);
  if (!academicYearId) {
    return { data: [], effectiveSeason: null, activeTimetableSeason: 'auto', yearName: '' };
  }

  const year = await AcademicYear.findById(academicYearId)
    .select('activeTimetableSeason yearName')
    .lean();
  const effectiveSeason = resolveEffectiveTimetableSeason(year);

  const list = await Timetable.find({ academicYear: academicYearId })
    .sort({ startMinutes: 1 })
    .lean();

  return {
    data: list.map(mapTimetableItem),
    effectiveSeason,
    activeTimetableSeason: year?.activeTimetableSeason || 'auto',
    yearName: year?.yearName || '',
  };
};

module.exports = {
  listByYear,
  upsert,
  remove,
  listPublic,
};
