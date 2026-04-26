const AcademicYear = require('../../models/AcademicYear');
const Menu = require('../../models/Menu');

/**
 * Label cho mùa thời khóa biểu
 */
function timetableSeasonLabel(season) {
  if (season === 'summer') return 'Mùa Hè';
  if (season === 'winter') return 'Mùa Đông';
  return 'Tự động theo tháng';
}

/**
 * Tự động kết thúc năm học đã quá hạn endDate.
 */
const autoFinishExpiredAcademicYears = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const expiringYears = await AcademicYear.find({
    status: 'active',
    endDate: { $lt: startOfToday },
  }).select('_id').lean();

  if (expiringYears.length > 0) {
    const expiringIds = expiringYears.map(y => y._id);

    // Kết thúc thực đơn
    await Menu.updateMany(
      {
        academicYearId: { $in: expiringIds },
        status: 'active',
      },
      {
        $set: { status: 'completed', endedAt: new Date() },
        $push: {
          statusHistory: {
            type: 'ended',
            at: new Date(),
            detail: 'Tự động kết thúc do năm học hết hạn',
          },
        },
      },
    );

    // Cập nhật trạng thái năm học
    await AcademicYear.updateMany(
      { _id: { $in: expiringIds } },
      { $set: { status: 'inactive' } },
    );
  }
};

/**
 * Kiểm tra khối có thuộc diện tốt nghiệp (5-6 tuổi) hay không
 */
function isGraduationEligibleBand(grade) {
  if (!grade) return false;
  const min = Number(grade.minAge);
  const max = Number(grade.maxAge);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
  return min >= 5 && max >= 6;
}

module.exports = {
  timetableSeasonLabel,
  autoFinishExpiredAcademicYears,
  isGraduationEligibleBand,
};
