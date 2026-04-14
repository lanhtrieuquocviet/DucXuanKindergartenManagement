const Menu = require('../models/Menu');
const DailyMenu = require('../models/DailyMenu');
const MealPhoto = require('../models/MealPhoto');
const Attendance = require('../models/Attendances');
const Student = require('../models/Student');
const ExcelJS = require('exceljs');

const DAY_LABELS = { mon: 'Thứ 2', tue: 'Thứ 3', wed: 'Thứ 4', thu: 'Thứ 5', fri: 'Thứ 6' };
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri'];
const MEAL_LABELS = { trua: 'Bữa trưa', chieu: 'Bữa chiều', sang: 'Bữa sáng', xe: 'Bữa xế' };
const SAMPLE_STATUS_LABELS = {
  cho_kiem_tra: 'Chờ kiểm tra',
  khong_co_van_de: 'Không có vấn đề',
  khong_dat: 'Không đạt',
};

const styleHeaderRow = (row, fillColor = 'FF4472C4') => {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
};

const styleDataRow = (row, isEven = false) => {
  row.eachCell((cell) => {
    cell.fill = isEven
      ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
      : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
};

/**
 * GET /api/reports/weekly?menuId=xxx&weekType=odd|even
 * Báo cáo tuần: thực đơn, dinh dưỡng theo tuần
 */
exports.exportWeeklyReport = async (req, res) => {
  try {
    const { menuId, weekType } = req.query;
    if (!menuId || !weekType) {
      return res.status(400).json({ success: false, message: 'Thiếu menuId hoặc weekType' });
    }

    const menu = await Menu.findById(menuId);
    if (!menu) return res.status(404).json({ success: false, message: 'Không tìm thấy thực đơn' });

    const dailyMenus = await DailyMenu.find({ menuId, weekType })
      .populate('lunchFoods')
      .populate('afternoonFoods')
      .lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MamNon DX';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Báo cáo tuần');

    ws.mergeCells('A1:G1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `BÁO CÁO THỰC ĐƠN TUẦN ${weekType === 'odd' ? 'LẺ' : 'CHẴN'} - THÁNG ${menu.month}/${menu.year}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1F497D' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    ws.addRow([]);

    ws.columns = [
      { key: 'day', width: 12 },
      { key: 'lunch', width: 38 },
      { key: 'afternoon', width: 38 },
      { key: 'calories', width: 18 },
      { key: 'protein', width: 14 },
      { key: 'fat', width: 14 },
      { key: 'carb', width: 14 },
    ];

    const headerRow = ws.addRow(['Thứ', 'Món bữa trưa', 'Món bữa chiều', 'Tổng Calo (kcal)', 'Protein (g)', 'Chất béo (g)', 'Carb (g)']);
    styleHeaderRow(headerRow);
    ws.getRow(3).height = 25;

    DAY_ORDER.forEach((day, idx) => {
      const dm = dailyMenus.find((d) => d.dayOfWeek === day);
      const lunchNames = dm?.lunchFoods?.map((f) => f.name).join(', ') || '-';
      const afternoonNames = dm?.afternoonFoods?.map((f) => f.name).join(', ') || '-';
      const row = ws.addRow([
        DAY_LABELS[day],
        lunchNames,
        afternoonNames,
        dm?.totalCalories ?? 0,
        dm?.totalProtein ?? 0,
        dm?.totalFat ?? 0,
        dm?.totalCarb ?? 0,
      ]);
      styleDataRow(row, idx % 2 === 1);
      row.height = 30;
    });

    ws.addRow([]);

    const count = DAY_ORDER.length;
    const avgCal = (DAY_ORDER.reduce((s, d) => s + (dailyMenus.find((dm) => dm.dayOfWeek === d)?.totalCalories ?? 0), 0) / count).toFixed(1);
    const avgPro = (DAY_ORDER.reduce((s, d) => s + (dailyMenus.find((dm) => dm.dayOfWeek === d)?.totalProtein ?? 0), 0) / count).toFixed(1);
    const avgFat = (DAY_ORDER.reduce((s, d) => s + (dailyMenus.find((dm) => dm.dayOfWeek === d)?.totalFat ?? 0), 0) / count).toFixed(1);
    const avgCarb = (DAY_ORDER.reduce((s, d) => s + (dailyMenus.find((dm) => dm.dayOfWeek === d)?.totalCarb ?? 0), 0) / count).toFixed(1);

    const avgRow = ws.addRow(['TB/ngày', '', '', avgCal, avgPro, avgFat, avgCarb]);
    styleHeaderRow(avgRow, 'FF70AD47');
    avgRow.height = 25;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bao-cao-tuan-${weekType === 'odd' ? 'le' : 'chan'}-thang-${menu.month}-${menu.year}.xlsx"`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/reports/monthly?month=3&year=2026
 * Báo cáo tháng: tổng hợp tháng, so sánh dinh dưỡng
 */
exports.exportMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Thiếu month hoặc year' });
    }

    const menu = await Menu.findOne({ month: parseInt(month), year: parseInt(year) });
    if (!menu) return res.status(404).json({ success: false, message: 'Không tìm thấy menu tháng này' });

    const dailyMenus = await DailyMenu.find({ menuId: menu._id })
      .populate('lunchFoods')
      .populate('afternoonFoods')
      .lean();

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Báo cáo tháng');

    ws.mergeCells('A1:H1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `BÁO CÁO THỰC ĐƠN THÁNG ${month}/${year}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1F497D' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    ws.mergeCells('A2:H2');
    ws.getCell('A2').value = `Trạng thái: ${menu.status.toUpperCase()} | Tạo lúc: ${new Date(menu.createdAt).toLocaleDateString('vi-VN')}`;
    ws.getCell('A2').alignment = { horizontal: 'center' };
    ws.getCell('A2').font = { italic: true, color: { argb: 'FF595959' } };

    ws.addRow([]);

    ws.columns = [
      { key: 'week', width: 12 },
      { key: 'day', width: 10 },
      { key: 'lunch', width: 38 },
      { key: 'afternoon', width: 38 },
      { key: 'calories', width: 16 },
      { key: 'protein', width: 14 },
      { key: 'fat', width: 14 },
      { key: 'carb', width: 14 },
    ];

    const headerRow = ws.addRow(['Tuần', 'Thứ', 'Món bữa trưa', 'Món bữa chiều', 'Calo (kcal)', 'Protein (g)', 'Fat (g)', 'Carb (g)']);
    styleHeaderRow(headerRow);
    ws.getRow(4).height = 25;

    let rowIdx = 0;
    ['odd', 'even'].forEach((weekType) => {
      const weekLabel = weekType === 'odd' ? 'Tuần lẻ' : 'Tuần chẵn';
      DAY_ORDER.forEach((day) => {
        const dm = dailyMenus.find((d) => d.weekType === weekType && d.dayOfWeek === day);
        const row = ws.addRow([
          weekLabel,
          DAY_LABELS[day],
          dm?.lunchFoods?.map((f) => f.name).join(', ') || '-',
          dm?.afternoonFoods?.map((f) => f.name).join(', ') || '-',
          dm?.totalCalories ?? 0,
          dm?.totalProtein ?? 0,
          dm?.totalFat ?? 0,
          dm?.totalCarb ?? 0,
        ]);
        styleDataRow(row, rowIdx % 2 === 1);
        row.height = 28;
        rowIdx++;
      });
    });

    ws.addRow([]);

    const total = dailyMenus.length || 1;
    const summaryRow = ws.addRow([
      'TB/ngày', '', '', '',
      (dailyMenus.reduce((s, d) => s + (d.totalCalories ?? 0), 0) / total).toFixed(1),
      (dailyMenus.reduce((s, d) => s + (d.totalProtein ?? 0), 0) / total).toFixed(1),
      (dailyMenus.reduce((s, d) => s + (d.totalFat ?? 0), 0) / total).toFixed(1),
      (dailyMenus.reduce((s, d) => s + (d.totalCarb ?? 0), 0) / total).toFixed(1),
    ]);
    styleHeaderRow(summaryRow, 'FF70AD47');
    summaryRow.height = 25;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-thang-${month}-${year}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/reports/food-sample?month=3&year=2026
 * Báo cáo mẫu thực phẩm: lịch sử kiểm tra
 */
exports.exportFoodSampleReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Thiếu month hoặc year' });
    }

    const m = parseInt(month);
    const y = parseInt(year);
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;

    const mealPhotos = await MealPhoto.find({ date: { $gte: startDate, $lte: endDate } })
      .populate('sampleEntries.uploadedBy', 'fullName')
      .populate('sampleEntries.reviewedBy', 'fullName')
      .lean();

    const totalEntries = mealPhotos.reduce((s, mp) => s + (mp.sampleEntries?.length || 0), 0);
    if (totalEntries === 0) {
      return res.status(404).json({ success: false, message: `Không có dữ liệu mẫu thực phẩm trong tháng ${month}/${year}` });
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Mẫu thực phẩm');

    ws.mergeCells('A1:G1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `BÁO CÁO MẪU THỰC PHẨM - THÁNG ${month}/${year}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1F497D' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    ws.addRow([]);

    ws.columns = [
      { key: 'date', width: 14 },
      { key: 'meal', width: 14 },
      { key: 'desc', width: 32 },
      { key: 'status', width: 22 },
      { key: 'reviewer', width: 22 },
      { key: 'reviewedAt', width: 20 },
      { key: 'note', width: 32 },
    ];

    const headerRow = ws.addRow(['Ngày', 'Bữa ăn', 'Mô tả', 'Trạng thái', 'Kiểm tra bởi', 'Kiểm tra lúc', 'Ghi chú']);
    styleHeaderRow(headerRow);
    ws.getRow(3).height = 25;

    let rowIdx = 0;
    const sorted = [...mealPhotos].sort((a, b) => a.date.localeCompare(b.date));
    for (const mp of sorted) {
      for (const entry of mp.sampleEntries || []) {
        const row = ws.addRow([
          mp.date,
          MEAL_LABELS[entry.mealType] || entry.mealType,
          entry.description || '-',
          SAMPLE_STATUS_LABELS[entry.status] || entry.status,
          entry.reviewedBy?.fullName || '-',
          entry.reviewedAt ? new Date(entry.reviewedAt).toLocaleDateString('vi-VN') : '-',
          entry.reviewNote || '-',
        ]);
        styleDataRow(row, rowIdx % 2 === 1);
        rowIdx++;
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-mau-thuc-pham-thang-${month}-${year}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/reports/meal-portion?month=3&year=2026
 * Báo cáo suất ăn: thống kê theo lớp, theo ngày
 */
exports.exportMealPortionReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Thiếu month hoặc year' });
    }

    const m = parseInt(month);
    const y = parseInt(year);
    const startOfMonth = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

    const records = await Attendance.find({ date: { $gte: startOfMonth, $lte: endOfMonth } })
      .populate('classId', 'className')
      .lean();

    if (records.length === 0) {
      return res.status(404).json({ success: false, message: `Không có dữ liệu điểm danh trong tháng ${month}/${year}` });
    }

    // Group by date string → class name → counts
    const grouped = {};
    for (const r of records) {
      const dateStr = new Date(r.date).toLocaleDateString('vi-VN');
      const className = r.classId?.className || 'Không rõ';
      if (!grouped[dateStr]) grouped[dateStr] = {};
      if (!grouped[dateStr][className]) grouped[dateStr][className] = { present: 0, absent: 0, leave: 0 };
      if (r.status === 'present') grouped[dateStr][className].present++;
      else if (r.status === 'absent') grouped[dateStr][className].absent++;
      else if (r.status === 'leave') grouped[dateStr][className].leave++;
    }

    // Total students per class
    const studentCounts = await Student.aggregate([
      { $match: { status: { $ne: 'inactive' } } },
      {
        $lookup: {
          from: 'Classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'classInfo',
        },
      },
      { $unwind: { path: '$classInfo', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$classInfo.className', total: { $sum: 1 } } },
    ]);
    const totalMap = {};
    studentCounts.forEach((c) => { if (c._id) totalMap[c._id] = c.total; });

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Suất ăn');

    ws.mergeCells('A1:G1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `BÁO CÁO SUẤT ĂN - THÁNG ${month}/${year}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1F497D' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    ws.addRow([]);

    ws.columns = [
      { key: 'date', width: 14 },
      { key: 'class', width: 18 },
      { key: 'total', width: 14 },
      { key: 'present', width: 12 },
      { key: 'absent', width: 12 },
      { key: 'leave', width: 12 },
      { key: 'portions', width: 12 },
    ];

    const headerRow = ws.addRow(['Ngày', 'Lớp', 'Tổng sĩ số', 'Có mặt', 'Vắng mặt', 'Nghỉ phép', 'Suất cơm']);
    styleHeaderRow(headerRow);
    ws.getRow(3).height = 25;

    let rowIdx = 0;
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      const [da, ma, ya] = a.split('/').map(Number);
      const [db, mb, yb] = b.split('/').map(Number);
      return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    });

    for (const dateStr of sortedDates) {
      for (const className of Object.keys(grouped[dateStr]).sort()) {
        const { present = 0, absent = 0, leave = 0 } = grouped[dateStr][className];
        const total = totalMap[className] || present + absent + leave;
        const row = ws.addRow([dateStr, className, total, present, absent, leave, present]);
        styleDataRow(row, rowIdx % 2 === 1);
        rowIdx++;
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-suat-an-thang-${month}-${year}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
