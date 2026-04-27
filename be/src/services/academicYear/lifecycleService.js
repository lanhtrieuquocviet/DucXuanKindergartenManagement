const mongoose = require('mongoose');
const AcademicYear = require('../../models/AcademicYear');
const Student = require('../../models/Student');
const Menu = require('../../models/Menu');
const Grade = require('../../models/Grade');
const StudentAssessment = require('../../models/StudentAssessment');
const Teacher = require('../../models/Teacher');
const Classes = require('../../models/Classes');
const { autoFinishExpiredAcademicYears, isGraduationEligibleBand, timetableSeasonLabel } = require('./core');
const { createNotification } = require('../../services/notification.service');

/**
 * PATCH /api/school-admin/academic-years/current/timetable-season
 */
const patchCurrentTimetableSeason = async (req, res) => {
  try {
    const { activeTimetableSeason } = req.body || {};
    await autoFinishExpiredAcademicYears();

    const year = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 });
    if (!year) return res.status(404).json({ status: 'error', message: 'Chưa có năm học đang hoạt động.' });

    const previousSeason = year.activeTimetableSeason || 'auto';
    year.activeTimetableSeason = activeTimetableSeason;
    await year.save();

    if (previousSeason !== activeTimetableSeason) {
      await createNotification({
        title: 'Thời gian biểu có thay đổi',
        body: `Đã đổi mùa thời gian biểu năm học ${year.yearName}: ${timetableSeasonLabel(previousSeason)} → ${timetableSeasonLabel(activeTimetableSeason)}.`,
        type: 'timetable_update',
        targetRole: 'all',
      });
    }

    return res.status(200).json({ status: 'success', data: year });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Lỗi cập nhật mùa thời gian biểu' });
  }
};

/**
 * POST /api/school-admin/academic-years (Manual creation)
 */
const createAcademicYear = async (req, res) => {
  try {
    const { yearName, startDate, endDate, description } = req.body;
    // ... validation logic ...
    await AcademicYear.updateMany({ status: 'active' }, { $set: { status: 'inactive' } });

    const newYear = await AcademicYear.create({
      yearName: yearName.trim(),
      startDate,
      endDate,
      description,
      status: 'active',
    });

    return res.status(201).json({ status: 'success', data: newYear });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Lỗi tạo năm học' });
  }
};

/**
 * Helper: Kiểm tra học sinh chưa được đánh giá trong năm học (kỳ 2)
 */
const validateEvaluations = async (academicYearId) => {
  const students = await Student.find({ academicYearId, status: 'active' }).populate('classId');
  const assessments = await StudentAssessment.find({ academicYearId, term: 2 }).select('studentId');
  const assessedStudentIds = new Set(assessments.map(a => a.studentId.toString()));

  const missingSummary = {}; 

  for (const student of students) {
    if (!assessedStudentIds.has(student._id.toString())) {
      const classId = student.classId?._id?.toString() || 'unassigned';
      if (!missingSummary[classId]) {
        const cls = student.classId;
        // Lấy thông tin giáo viên từ Teacher model
        const teachers = cls ? await Teacher.find({ _id: { $in: cls.teacherIds || [] } }).populate('userId', 'fullName') : [];
        
        missingSummary[classId] = {
          classId: classId,
          className: cls?.className || 'Chưa xếp lớp',
          teacherNames: teachers.map(t => t.userId?.fullName).filter(Boolean),
          teacherUserIds: teachers.map(t => t.userId?._id).filter(Boolean),
          missingCount: 0
        };
      }
      missingSummary[classId].missingCount++;
    }
  }

  return Object.values(missingSummary).filter(s => s.missingCount > 0);
};

/**
 * PATCH /api/school-admin/academic-years/:id/finish
 */
const finishAcademicYear = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { selectedStudentIds = [], dropoutStudentIds = [], force = false } = req.body;

    const year = await AcademicYear.findById(id).session(session);
    if (!year || year.status === 'inactive') {
        throw new Error('Năm học không tồn tại hoặc đã kết thúc');
    }

    // Kiểm tra đánh giá nếu không ép buộc (force)
    if (!force) {
      const missing = await validateEvaluations(id);
      if (missing.length > 0) {
        await session.abortTransaction();
        return res.status(400).json({
          status: 'error',
          code: 'MISSING_EVALUATIONS',
          message: 'Vẫn còn học sinh chưa được đánh giá kết thúc năm học.',
          summary: missing
        });
      }
    }

    // 1. Tìm năm học mới nhất để chuyển tiếp
    const newestYear = await AcademicYear.findOne().sort({ startDate: -1 }).session(session).lean();

    const students = await Student.find({ academicYearId: id, status: 'active' })
        .session(session)
        .populate('classId');

    for (const student of students) {
      const studentIdStr = student._id.toString();

      if (dropoutStudentIds.includes(studentIdStr)) {
        await Student.findByIdAndUpdate(student._id, { status: 'inactive', classId: null }, { session });
        continue;
      }

      const grade = student.classId?.gradeId;
      if (isGraduationEligibleBand(grade)) {
        if (selectedStudentIds.includes(studentIdStr)) {
          await Student.findByIdAndUpdate(student._id, { status: 'graduated', classId: null }, { session });
        } else if (newestYear && String(newestYear._id) !== id) {
          await Student.findByIdAndUpdate(student._id, { classId: null, $addToSet: { academicYearId: newestYear._id } }, { session });
        }
      } else if (newestYear && String(newestYear._id) !== id) {
        await Student.findByIdAndUpdate(student._id, { classId: null, $addToSet: { academicYearId: newestYear._id } }, { session });
      }
    }

    // Kết thúc menu & notification
    await Menu.updateMany({ academicYearId: id, status: 'active' }, { $set: { status: 'completed' } }, { session });
    
    year.status = 'inactive';
    await year.save({ session });

    await session.commitTransaction();
    return res.status(200).json({ status: 'success', message: 'Đã kết thúc năm học thành công' });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally { session.endSession(); }
};

/**
 * PUT /api/school-admin/academic-years/:id
 */
const updateAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { yearName, startDate, endDate, description } = req.body;

    const year = await AcademicYear.findById(id);
    if (!year) return res.status(404).json({ status: 'error', message: 'Không tìm thấy năm học.' });

    if (yearName) year.yearName = yearName.trim();
    if (startDate) year.startDate = startDate;
    if (endDate) year.endDate = endDate;
    if (description !== undefined) year.description = description;

    await year.save();

    return res.status(200).json({ status: 'success', data: year });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Lỗi cập nhật năm học' });
  }
};

const Enrollment = require('../../models/Enrollment');

/**
 * PATCH /api/school-admin/academic-years/:id/publish
 * Chuyển năm học DRAFT thành ACTIVE
 */
const publishAcademicYear = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const year = await AcademicYear.findById(id).session(session);

    if (!year) throw new Error('Không tìm thấy năm học');
    if (year.status !== 'draft') throw new Error('Chỉ có thể công bố năm học đang ở trạng thái bản nháp (Draft)');

    // 1. Chuyển năm học hiện tại (nếu có) sang Inactive
    await AcademicYear.updateMany(
      { status: 'active', _id: { $ne: id } }, 
      { $set: { status: 'inactive' } }, 
      { session }
    );

    // 2. Kích hoạt năm học mới
    year.status = 'active';
    await year.save({ session });

    // 3. Xử lý chuyển đổi học sinh
    const enrollments = await Enrollment.find({ academicYearId: id }).session(session);
    const promotedStudentIds = enrollments.map(en => String(en.studentId));

    // Cập nhật học sinh lên lớp / ở lại lớp (có trong Enrollment)
    for (const en of enrollments) {
      await Student.findByIdAndUpdate(en.studentId, {
        $set: { 
          classId: en.classId,
          status: 'active'
        },
        $addToSet: { academicYearId: id } // Thêm vào lịch sử năm học
      }).session(session);
    }

    // 4. Xử lý học sinh còn lại của năm học cũ (Tốt nghiệp hoặc Nghỉ học)
    // Tìm năm học vừa bị set inactive
    const prevYear = await AcademicYear.findOne({ status: 'inactive', _id: { $ne: id } })
      .sort({ endDate: -1 })
      .session(session);

    if (prevYear) {
      const remainingStudents = await Student.find({
        academicYearId: prevYear._id,
        _id: { $nin: promotedStudentIds },
        status: 'active'
      }).populate('classId').session(session);

      for (const student of remainingStudents) {
        const oldClass = student.classId;
        const oldGrade = oldClass ? await Grade.findById(oldClass.gradeId).session(session) : null;

        if (oldGrade && oldGrade.minAge >= 5) {
          student.status = 'graduated';
        } else {
          student.status = 'inactive'; 
        }
        await student.save({ session });
      }
    }

    await session.commitTransaction();
    return res.status(200).json({ status: 'success', message: `Đã công bố năm học ${year.yearName} thành công!` });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * POST /api/school-admin/academic-years/:id/remind-evaluations
 */
const remindEvaluations = async (req, res) => {
  try {
    const { id } = req.params;
    const { classes = [] } = req.body;

    for (const cls of classes) {
      for (const userId of cls.teacherUserIds) {
        await createNotification({
          title: 'Nhắc nhở hoàn tất đánh giá',
          body: `Lớp ${cls.className} vẫn còn ${cls.missingCount} học sinh chưa được đánh giá kỳ 2. Vui lòng hoàn tất trước khi kết thúc năm học.`,
          type: 'evaluation_reminder',
          targetUserId: userId,
        });
      }
    }

    return res.status(200).json({ status: 'success', message: 'Đã gửi nhắc nhở đến giáo viên các lớp.' });
  } catch (error) {
    console.error('remindEvaluations error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi gửi nhắc nhở' });
  }
};

module.exports = {
  patchCurrentTimetableSeason,
  createAcademicYear,
  finishAcademicYear,
  updateAcademicYear,
  publishAcademicYear,
  remindEvaluations,
};
