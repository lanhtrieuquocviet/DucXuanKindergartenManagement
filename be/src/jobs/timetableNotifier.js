const cron = require('node-cron');
const Timetable = require('../models/Timetable');
const AcademicYear = require('../models/AcademicYear');
const Notification = require('../models/Notification');

/** Chuyển số phút → "H:mm" */
function minutesToLabel(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}:${min.toString().padStart(2, '0')}`;
}

/** Xác định mùa hiện tại dựa theo tháng */
function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1–12
  // Hè: tháng 4–9 | Đông: tháng 10–3
  return month >= 4 && month <= 9 ? 'summer' : 'winter';
}

/** Lấy năm học đang hoạt động */
async function getActiveYear() {
  return AcademicYear.findOne({ status: 'active' }).lean();
}

// ─────────────────────────────────────────────────────────────
// JOB 1: Chạy lúc 00:01 hàng ngày
// Lưu thông báo tổng hợp lịch hôm nay vào database
// ─────────────────────────────────────────────────────────────
function startDailyTimetableSummary() {
  cron.schedule('1 0 * * *', async () => {
    try {
      const activeYear = await getActiveYear();
      if (!activeYear) {
        console.log('⚠️  [TimetableNotifier] Không có năm học đang hoạt động, bỏ qua.');
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

      const today = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
      });

      const scheduleLines = items
        .map(i => `• ${minutesToLabel(i.startMinutes)} — ${i.content || '(không có nội dung)'}`)
        .join('\n');

      await Notification.create({
        title: `📅 Lịch hoạt động hôm nay — ${today}`,
        body: `${items.length} hoạt động trong ngày:\n${scheduleLines}`,
        type: 'timetable_daily',
        targetRole: 'SchoolAdmin',
        extra: {
          date: new Date().toISOString().split('T')[0],
          count: items.length,
          season,
          yearName: activeYear.yearName,
        },
      });

      console.log(`✅ [TimetableNotifier] Đã lưu lịch ngày ${today} (${items.length} hoạt động)`);
    } catch (err) {
      console.error('❌ [TimetableNotifier] Lỗi tổng hợp lịch ngày:', err.message);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  console.log('🕐 [TimetableNotifier] Cron tổng hợp lịch ngày đã đăng ký (chạy lúc 00:01 hàng ngày)');
}

// ─────────────────────────────────────────────────────────────
// JOB 2: Chạy mỗi phút
// Kiểm tra hoạt động bắt đầu đúng giờ → tạo thông báo real-time
// ─────────────────────────────────────────────────────────────
function startTimetableRealtime() {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
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
          targetRole: 'SchoolAdmin',
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
