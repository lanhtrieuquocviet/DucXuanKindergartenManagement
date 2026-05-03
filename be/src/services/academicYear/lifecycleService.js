const mongoose = require('mongoose');
const AcademicYear = require('../../models/AcademicYear');
const Student = require('../../models/Student');
const Menu = require('../../models/Menu');
const Grade = require('../../models/Grade');
const StudentAssessment = require('../../models/StudentAssessment');
const Teacher = require('../../models/Teacher');
const Classes = require('../../models/Classes');
const Enrollment = require('../../models/Enrollment');
const { autoFinishExpiredAcademicYears, isGraduationEligibleBand, timetableSeasonLabel } = require('./core');
const { createNotification } = require('../../services/notification.service');
const { logAction } = require('../auditService');

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
  
  // 1. Lấy tất cả studentId đã có đánh giá trong năm học này từ hệ thống mới (không phân biệt kỳ)
  const assessments = await StudentAssessment.find({ 
    academicYearId, 
    overallResult: { $exists: true, $nin: [null, '', 'Chưa đánh giá', 'chưa đánh giá'] }
  }).select('studentId');
  const assessedStudentIds = new Set(assessments.map(a => a.studentId.toString()));

  const missingSummary = {}; 

  for (const student of students) {
    if (!assessedStudentIds.has(student._id.toString())) {
      const classId = student.classId?._id?.toString() || 'unassigned';
      if (!missingSummary[classId]) {
        const cls = student.classId;
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

    // 1. Phân loại và cập nhật trạng thái Enrollment/Student bằng bulk operations
    // Nhóm 1: Thôi học
    if (dropoutStudentIds.length > 0) {
      await Enrollment.updateMany(
        { academicYearId: id, studentId: { $in: dropoutStudentIds } },
        { $set: { status: 'dropped' } },
        { session }
      );
      await Student.updateMany(
        { _id: { $in: dropoutStudentIds } },
        { $set: { status: 'inactive' } },
        { session }
      );
    }

    // Nhóm 2: Tốt nghiệp (Những em thuộc khối Lá và được chọn)
    if (selectedStudentIds.length > 0) {
      await Enrollment.updateMany(
        { academicYearId: id, studentId: { $in: selectedStudentIds } },
        { $set: { status: 'graduated' } },
        { session }
      );
      await Student.updateMany(
        { _id: { $in: selectedStudentIds } },
        { $set: { status: 'graduated' } },
        { session }
      );
    }

    // Nhóm 3: Ở lại lớp (Dựa trên đánh giá semester_2 có promotionStatus === 'retained')
    const handledIds = [
      ...dropoutStudentIds.map((sid) => sid.toString()),
      ...selectedStudentIds.map((sid) => sid.toString()),
    ];

    const retainedAssessments = await StudentAssessment.find({
      academicYearId: id,
      period: 'semester_2',
      promotionStatus: 'retained'
    }).distinct('studentId');

    const retainedStudentIds = retainedAssessments.filter(rid => !handledIds.includes(rid.toString()));

    if (retainedStudentIds.length > 0) {
      await Enrollment.updateMany(
        { academicYearId: id, studentId: { $in: retainedStudentIds } },
        { $set: { status: 'retained' } },
        { session }
      );
    }

    // Nhóm 4: Chuyển tiếp (Những em còn lại và Đạt đánh giá)
    const finalHandledIds = [...handledIds, ...retainedStudentIds.map(rid => rid.toString())];
    await Enrollment.updateMany(
      { 
        academicYearId: id, 
        studentId: { $nin: finalHandledIds } 
      },
      { $set: { status: 'promoted' } },
      { session }
    );

    // Kết thúc menu & notification
    await Menu.updateMany({ academicYearId: id, status: 'active' }, { $set: { status: 'completed' } }, { session });
    
    year.status = 'inactive';
    await year.save({ session });

    await logAction({
      action: 'FINISH_ACADEMIC_YEAR',
      actorId: req.user.id,
      targetModel: 'AcademicYear',
      targetId: id,
      newData: { status: 'inactive', dropoutCount: dropoutStudentIds.length, graduatedCount: selectedStudentIds.length }
    }, req);

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
    const {
      yearName,
      startDate,
      endDate,
      description,
      term1StartDate,
      term1EndDate,
      term2StartDate,
      term2EndDate,
    } = req.body;

    const year = await AcademicYear.findById(id);
    if (!year) return res.status(404).json({ status: 'error', message: 'Không tìm thấy năm học.' });

    if (yearName) year.yearName = yearName.trim();
    if (startDate) year.startDate = startDate;
    if (endDate) year.endDate = endDate;
    if (description !== undefined) year.description = description;
    if (term1StartDate !== undefined) year.term1StartDate = term1StartDate || null;
    if (term1EndDate !== undefined) year.term1EndDate = term1EndDate || null;
    if (term2StartDate !== undefined) year.term2StartDate = term2StartDate || null;
    if (term2EndDate !== undefined) year.term2EndDate = term2EndDate || null;

    await year.save();

    return res.status(200).json({ status: 'success', data: year });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Lỗi cập nhật năm học' });
  }
};

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

    const { force = false } = req.body || {};

    // 0. Kiểm tra đánh giá của năm học hiện tại (nếu có)
    const activeYear = await AcademicYear.findOne({ status: 'active' }).session(session);
    if (activeYear && !force) {
      const missing = await validateEvaluations(activeYear._id);
      if (missing.length > 0) {
        await session.abortTransaction();
        return res.status(400).json({
          status: 'error',
          code: 'MISSING_EVALUATIONS',
          message: 'Vẫn còn học sinh ở năm học hiện tại chưa được đánh giá kết thúc năm học.',
          summary: missing
        });
      }
    }

    // 1. Chuyển năm học hiện tại (nếu có) sang Inactive
    await AcademicYear.updateMany(
      { status: 'active', _id: { $ne: id } }, 
      { $set: { status: 'inactive' } }, 
      { session }
    );

    // 2. Kích hoạt năm học mới
    year.status = 'active';
    await year.save({ session });

    // 3. Chuyển đổi trạng thái Enrollment và đồng bộ hồ sơ Student (Cache classId)
    await Enrollment.updateMany(
      { academicYearId: id, status: 'draft' },
      { $set: { status: 'studying' } },
      { session }
    );

    const enrollments = await Enrollment.find({ academicYearId: id }).session(session);
    for (const en of enrollments) {
      await Student.findByIdAndUpdate(en.studentId, {
        $set: { 
          classId: en.classId,
          status: 'active'
        },
        $addToSet: { academicYearId: id } 
      }).session(session);
    }

    // 4. Phòng chống học sinh "mồ côi" (Orphan Prevention)
    // Tìm các bé được 'promoted' từ năm trước nhưng chưa được xếp lớp ở năm nay
    const prevYear = await AcademicYear.findOne({ status: 'inactive', _id: { $ne: id } })
      .sort({ endDate: -1 })
      .session(session);

    if (prevYear) {
      const promotedIds = await Enrollment.find({ 
        academicYearId: prevYear._id, 
        status: 'promoted' 
      }).distinct('studentId').session(session);
      
      const enrolledIds = await Enrollment.find({ academicYearId: id }).distinct('studentId').session(session);
      const enrolledSet = new Set(enrolledIds.map(eid => eid.toString()));
      const missingIds = promotedIds.filter(pid => !enrolledSet.has(pid.toString()));

      if (missingIds.length > 0) {
        // Lấy danh sách lớp của năm học mới để làm căn cứ xếp lớp
        const nextYearClasses = await Classes.find({ academicYearId: id }).populate('gradeId').lean();
        
        // Lấy thông tin lớp cũ của các học sinh này
        const prevEnrollments = await Enrollment.find({ 
          academicYearId: prevYear._id, 
          studentId: { $in: missingIds } 
        }).populate({ path: 'classId', populate: { path: 'gradeId' } }).lean();

        const enrollmentMap = prevEnrollments.reduce((acc, curr) => {
          acc[curr.studentId.toString()] = curr;
          return acc;
        }, {});

        // Cập nhật Student cache
        await Student.updateMany(
          { _id: { $in: missingIds } },
          { $addToSet: { academicYearId: id } },
          { session }
        );
        
        // Tạo Enrollment kèm theo logic xếp lớp thông minh
        const orphanEnrollments = [];
        for (const sid of missingIds) {
          const prevEn = enrollmentMap[sid.toString()];
          let targetClassId = null;
          let targetGradeId = null;

          if (prevEn && prevEn.classId && prevEn.classId.gradeId) {
            const currentGrade = prevEn.classId.gradeId;
            const currentClassName = prevEn.classId.className;
            const currentClassNum = currentClassName.match(/\d+/)?.[0] || currentClassName;

            // Tìm khối tiếp theo (minAge + 1)
            const targetGrade = nextYearClasses.find(c => c.gradeId.minAge === currentGrade.minAge + 1)?.gradeId;
            
            if (targetGrade) {
              targetGradeId = targetGrade._id;
              // Tìm lớp có cùng hậu tố ở khối mới
              const match = nextYearClasses.find(c => 
                String(c.gradeId._id) === String(targetGrade._id) && 
                (c.className.match(/\d+/)?.[0] || c.className) === currentClassNum
              );
              if (match) targetClassId = match._id;
            }
          }

          orphanEnrollments.push({
            studentId: sid,
            classId: targetClassId,
            gradeId: targetGradeId,
            academicYearId: id,
            status: 'studying',
            enrollmentDate: new Date()
          });
        }
        
        if (orphanEnrollments.length > 0) {
          await Enrollment.insertMany(orphanEnrollments, { session });
          
          // Cập nhật classId cache cho Student nếu tìm được lớp
          for (const en of orphanEnrollments) {
            if (en.classId) {
              await Student.findByIdAndUpdate(en.studentId, { $set: { classId: en.classId } }).session(session);
            }
          }
        }
      }
    }

    await logAction({
      action: 'PUBLISH_ACADEMIC_YEAR',
      actorId: req.user.id,
      targetModel: 'AcademicYear',
      targetId: id,
      newData: { status: 'active' }
    }, req);

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
          title: 'Thông báo hoàn tất đánh giá cuối năm',
          body: `Kính gửi Giáo viên lớp ${cls.className}, hệ thống ghi nhận lớp vẫn còn ${cls.missingCount} học sinh chưa hoàn tất đánh giá Học kỳ 2. Vui lòng cập nhật đầy đủ kết quả để Nhà trường thực hiện tổng kết và kết thúc năm học. Trân trọng!`,
          type: 'evaluation_reminder',
          targetUserId: userId,
        });
      }
    }
    
    // Cập nhật timestamp vào năm học
    await AcademicYear.findByIdAndUpdate(id, { evaluationRemindersSentAt: new Date() });

    return res.status(200).json({ status: 'success', message: 'Đã gửi nhắc nhở đến giáo viên các lớp.' });
  } catch (error) {
    console.error('remindEvaluations error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi gửi nhắc nhở' });
  }
};

/**
 * POST /api/school-admin/academic-years/:id/finish-preview
 */
const getFinishYearPreview = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedStudentIds = [], dropoutStudentIds = [] } = req.body;

    const Enrollment = require('../../models/Enrollment');
    const totalStudents = await Enrollment.countDocuments({ academicYearId: id });
    const dropoutCount = dropoutStudentIds.length;
    const graduatedCount = selectedStudentIds.length;
    const promotedCount = Math.max(0, totalStudents - dropoutCount - graduatedCount);

    return res.status(200).json({
      status: 'success',
      data: {
        total: totalStudents,
        promoted: promotedCount,
        graduated: graduatedCount,
        dropped: dropoutCount
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * GET /api/school-admin/academic-years/:id/publish-preview
 */
const getPublishYearPreview = async (req, res) => {
  try {
    const { id } = req.params;
    const Enrollment = require('../../models/Enrollment');
    
    // 1. Số Enrollment draft sẽ kích hoạt
    const draftCount = await Enrollment.countDocuments({ academicYearId: id, status: 'draft' });
    const classCount = await Classes.countDocuments({ academicYearId: id });
    const placedStudentCount = await Enrollment.countDocuments({
      academicYearId: id,
      classId: { $exists: true, $ne: null },
    });

    // 2. Tìm học sinh mồ côi (promoted năm ngoái nhưng chưa có lớp năm nay)
    let orphanCount = 0;
    const prevYear = await AcademicYear.findOne({ status: 'inactive', _id: { $ne: id } }).sort({ endDate: -1 }).lean();
    
    if (prevYear) {
      const promotedIds = await Enrollment.find({ 
        academicYearId: prevYear._id, 
        status: 'promoted' 
      }).distinct('studentId');
      
      const enrolledIds = await Enrollment.find({ academicYearId: id }).distinct('studentId');
      const enrolledSet = new Set(enrolledIds.map(eid => eid.toString()));
      orphanCount = promotedIds.filter(pid => !enrolledSet.has(pid.toString())).length;
    }

    return res.status(200).json({
      status: 'success',
      data: {
        toActivate: draftCount,
        orphansToLink: orphanCount,
        counts: {
          classes: classCount,
          students: placedStudentCount,
          orphansToLink: orphanCount,
        },
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  patchCurrentTimetableSeason,
  finishAcademicYear,
  updateAcademicYear,
  publishAcademicYear,
  remindEvaluations,
  getFinishYearPreview,
  getPublishYearPreview
};
