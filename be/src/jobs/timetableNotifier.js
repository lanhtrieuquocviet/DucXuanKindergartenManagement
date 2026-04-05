const cron = require('node-cron');
const Timetable = require('../models/Timetable');
const AcademicYear = require('../models/AcademicYear');
const Notification = require('../models/Notification');

const TZ = 'Asia/Ho_Chi_Minh';

/** Lấy đối tượng Date đã quy đổi sang giờ Việt Nam */
function nowVN() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}

/** Chuyển số phút → "H:mm" */
function minutesToLabel(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}:${min.toString().padStart(2, '0')}`;
}

/** Xác định mùa hiện tại dựa theo tháng (giờ VN) */
function getCurrentSeason() {
  const month = nowVN().getMonth() + 1; // 1–12
  // Hè: tháng 4–9 | Đông: tháng 10–3
  return month >= 4 && month <= 9 ? 'summer' : 'winter';
}

/** Lấy năm học đang hoạt động */
async function getActiveYear() {
  return AcademicYear.findOne({ status: 'active' }).lean();
}

/** Logic tổng hợp lịch ngày (dùng chung cho cron + startup) */
async function runDailySummary() {
  const activeYear = await getActiveYear();
  if (!activeYear) {
    console.log('⚠️  [TimetableNotifier] Không có năm học đang hoạt động, bỏ qua.');
    return;
  }

  const vn = nowVN();
  const today = `${vn.getFullYear()}-${String(vn.getMonth() + 1).padStart(2, '0')}-${String(vn.getDate()).padStart(2, '0')}`;

  // Kiểm tra đã tạo thông báo hôm nay chưa (tránh trùng khi server restart)
  const existing = await Notification.findOne({
    type: 'timetable_daily',
    targetRole: 'all',
    'extra.date': today,
  });
  if (existing) {
    console.log('ℹ️  [TimetableNotifier] Lịch ngày hôm nay đã được tạo, bỏ qua.');
    return;
  }

  const season = getCurrentSeason();
  const items = await Timetable.find({
    academicYear: activeYear._id,
    appliesToSeason: { $in: [season, 'both'] },
  }).sort({ startMinutes: 1 }).lean();

  if (items.length === 0) {
    console.log('📭 [TimetableNotifier] Không có hoạt động nào hôm nay.');
    return;
  }

  const todayLabel = nowVN().toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const scheduleLines = items
    .map(i => `• ${minutesToLabel(i.startMinutes)} — ${i.content || '(không có nội dung)'}`)
    .join('\n');

  await Notification.create({
    title: `📅 Lịch hoạt động hôm nay — ${todayLabel}`,
    body: `${items.length} hoạt động trong ngày:\n${scheduleLines}`,
    type: 'timetable_daily',
    targetRole: 'all',
    extra: {
      date: today,
      count: items.length,
      season,
      yearName: activeYear.yearName,
    },
  });

  console.log(`✅ [TimetableNotifier] Đã lưu lịch ngày ${todayLabel} (${items.length} hoạt động)`);
}

// ─────────────────────────────────────────────────────────────
// JOB 1: Chạy lúc 00:01 hàng ngày
// Lưu thông báo tổng hợp lịch hôm nay vào database
// ─────────────────────────────────────────────────────────────
function startDailyTimetableSummary() {
  // Chạy ngay khi server khởi động (tạo notification hôm nay nếu chưa có)
  setTimeout(() => runDailySummary().catch(err =>
    console.error('❌ [TimetableNotifier] Lỗi khởi động lịch ngày:', err.message)
  ), 5000);

  // Cron 00:01 hàng ngày
  cron.schedule('1 0 * * *', () => {
    runDailySummary().catch(err =>
      console.error('❌ [TimetableNotifier] Lỗi tổng hợp lịch ngày:', err.message)
    );
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  console.log('🕐 [TimetableNotifier] Cron tổng hợp lịch ngày đã đăng ký (chạy lúc 00:01 hàng ngày + khởi động)');
}

// ─────────────────────────────────────────────────────────────
// JOB 2: Chạy mỗi phút
// Kiểm tra hoạt động bắt đầu đúng giờ → tạo thông báo real-time
// ─────────────────────────────────────────────────────────────
function startTimetableRealtime() {
  cron.schedule('* * * * *', async () => {
    try {
      const now = nowVN();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const activeYear = await getActiveYear();
      if (!activeYear) return;

      const season = getCurrentSeason();

      const items = await Timetable.find({
        academicYear: activeYear._id,
        appliesToSeason: { $in: [season, 'both'] },
        startMinutes: currentMinutes,
      }).lean();

      for (const item of items) {
        const timeLabel = minutesToLabel(item.startMinutes);
        const endLabel  = minutesToLabel(item.endMinutes);

        await Notification.create({
          title: `⏰ ${timeLabel} — ${item.content || 'Hoạt động bắt đầu'}`,
          body: `Hoạt động diễn ra từ ${timeLabel} đến ${endLabel}`,
          type: 'timetable_realtime',
          targetRole: 'all',
          extra: {
            timetableId: item._id,
            startMinutes: item.startMinutes,
            endMinutes: item.endMinutes,
            season: item.appliesToSeason,
          },
        });

        console.log(`🔔 [TimetableNotifier] Thông báo: ${timeLabel} — ${item.content}`);
      }
    } catch (err) {
      console.error('❌ [TimetableNotifier] Lỗi real-time:', err.message);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  console.log('⏱️  [TimetableNotifier] Cron real-time đã đăng ký (chạy mỗi phút)');
}

module.exports = { startDailyTimetableSummary, startTimetableRealtime };
