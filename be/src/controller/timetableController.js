const Timetable = require('../models/Timetable');
const AcademicYear = require('../models/AcademicYear');
const { resolveEffectiveTimetableSeason } = require('../utils/timetableSeason');
const { createNotification } = require('./notification.controller');

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

async function getAcademicYearIdFromQueryOrActive(req) {
  let yearId = req.query?.yearId;
  if (!yearId) {
    const current = await AcademicYear.findOne({ status: 'active' })
      .sort({ startDate: -1 })
      .select('_id')
      .lean();
    yearId = current?._id;
  }
  return yearId || null;
}

/**
 * GET /api/school-admin/timetable?yearId=xxx
 * Trả về danh sách hoạt động theo năm học (Mùa Hè/Mùa Đông).
 */
const listByYear = async (req, res) => {
  try {
    const academicYearId = await getAcademicYearIdFromQueryOrActive(req);
    if (!academicYearId) {
      return res.status(200).json({ status: 'success', data: [], yearName: '' });
    }

    const year = await AcademicYear.findById(academicYearId)
      .select('yearName activeTimetableSeason')
      .lean();
    const list = await Timetable.find({ academicYear: academicYearId })
      .sort({ startMinutes: 1 })
      .lean();

    const data = list.map((a) => ({
      _id: a._id,
      appliesToSeason: a.appliesToSeason,
      startMinutes: a.startMinutes,
      endMinutes: a.endMinutes,
      startLabel: minutesToLabel(a.startMinutes),
      endLabel: minutesToLabel(a.endMinutes),
      content: a.content || '',
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    return res.status(200).json({
      status: 'success',
      data,
      yearName: year?.yearName || '',
      activeTimetableSeason: year?.activeTimetableSeason || 'auto',
    });
  } catch (error) {
    console.error('listByYear timetable activities error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy thời gian biểu hoạt động',
    });
  }
};

async function checkOverlap({ academicYearId, appliesToSeason, startMinutes, endMinutes, excludeId }) {
  const affectedSeasons = getAffectedSeasons(appliesToSeason);
  const existing = await Timetable.find({ academicYear: academicYearId }).lean();

  // tìm mùa có conflict đầu tiên
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

/**
 * PUT /api/school-admin/timetable
 * Body:
 * - create: { academicYearId?, appliesToSeason, startTime, endTime, content }
 * - edit:   { id, academicYearId?, appliesToSeason, startTime, endTime, content }
 */
const upsert = async (req, res) => {
  try {
    const {
      id,
      academicYearId,
      appliesToSeason,
      startTime,
      endTime,
      content,
    } = req.body || {};

    let yearId = academicYearId;
    if (!yearId) yearId = await getAcademicYearIdFromQueryOrActive(req);

    if (!yearId) {
      return res.status(400).json({ status: 'error', message: 'Chưa có năm học đang hoạt động.' });
    }

    if (!appliesToSeason) {
      return res.status(400).json({ status: 'error', message: 'Thiếu áp dụng cho mùa.' });
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    if (startMinutes == null || endMinutes == null) {
      return res.status(400).json({ status: 'error', message: 'Thiếu thời gian (từ giờ / đến giờ).' });
    }
    if (startMinutes >= endMinutes) {
      return res.status(400).json({ status: 'error', message: 'Từ giờ phải nhỏ hơn đến giờ.' });
    }

    const overlap = await checkOverlap({
      academicYearId: yearId,
      appliesToSeason,
      startMinutes,
      endMinutes,
      excludeId: id || null,
    });
    if (!overlap.ok) {
      return res.status(400).json({ status: 'error', message: overlap.message });
    }

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

    if (!doc) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy hoạt động.' });
    }

    const year = await AcademicYear.findById(yearId).select('yearName').lean();
    const yearName = year?.yearName || '';
    const actionText = id ? 'cập nhật' : 'thêm mới';
    const detailText = `${minutesToLabel(doc.startMinutes)} - ${minutesToLabel(doc.endMinutes)} · ${doc.content || 'Không có nội dung'}`;

    await createNotification({
      title: 'Thời gian biểu có thay đổi',
      body: id
        ? `Đã ${actionText} hoạt động (${seasonLabel(doc.appliesToSeason)}) năm học ${yearName}: ${detailText}`
        : `Đã ${actionText} hoạt động (${seasonLabel(doc.appliesToSeason)}) năm học ${yearName}: ${detailText}`,
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

    return res.status(200).json({
      status: 'success',
      data: {
        _id: doc._id,
        appliesToSeason: doc.appliesToSeason,
        startMinutes: doc.startMinutes,
        endMinutes: doc.endMinutes,
        startLabel: minutesToLabel(doc.startMinutes),
        endLabel: minutesToLabel(doc.endMinutes),
        content: doc.content || '',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error) {
    console.error('upsert timetable activities error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi khi lưu thời gian biểu hoạt động',
    });
  }
};

/**
 * DELETE /api/school-admin/timetable/:id?yearId=xxx
 * Xóa một hoạt động theo id.
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ status: 'error', message: 'Thiếu id hoạt động.' });
    }

    let academicYearId = req.query?.yearId || req.body?.academicYearId;
    if (!academicYearId) academicYearId = await getAcademicYearIdFromQueryOrActive(req);

    const filter = academicYearId ? { _id: id, academicYear: academicYearId } : { _id: id };
    const deleted = await Timetable.findOneAndDelete(filter).lean();

    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy hoạt động để xóa.' });
    }

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

    return res.status(200).json({ status: 'success', message: 'Đã xóa hoạt động.' });
  } catch (error) {
    console.error('remove timetable activity error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi khi xóa hoạt động',
    });
  }
};

/**
 * GET /api/timetable?yearId=xxx (public)
 * Trả về toàn bộ hoạt động (cả 2 mùa) + mùa đang hiệu lực.
 */
const listPublic = async (req, res) => {
  try {
    const academicYearId = await getAcademicYearIdFromQueryOrActive(req);
    if (!academicYearId) {
      return res.status(200).json({ status: 'success', data: [], effectiveSeason: null });
    }

    const year = await AcademicYear.findById(academicYearId)
      .select('activeTimetableSeason yearName')
      .lean();
    const effectiveSeason = resolveEffectiveTimetableSeason(year);

    const list = await Timetable.find({ academicYear: academicYearId })
      .sort({ startMinutes: 1 })
      .lean();

    const data = list.map((a) => ({
      _id: a._id,
      appliesToSeason: a.appliesToSeason,
      startMinutes: a.startMinutes,
      endMinutes: a.endMinutes,
      startLabel: minutesToLabel(a.startMinutes),
      endLabel: minutesToLabel(a.endMinutes),
      content: a.content || '',
    }));

    return res.status(200).json({
      status: 'success',
      data,
      effectiveSeason,
      activeTimetableSeason: year?.activeTimetableSeason || 'auto',
      yearName: year?.yearName || '',
    });
  } catch (error) {
    console.error('listPublic timetable activities error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy thời gian biểu' });
  }
};

module.exports = {
  listByYear,
  upsert,
  remove,
  listPublic,
};
