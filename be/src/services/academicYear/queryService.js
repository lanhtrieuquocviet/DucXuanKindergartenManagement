const mongoose = require('mongoose');
const AcademicYear = require('../../models/AcademicYear');
const Classes = require('../../models/Classes');
const Student = require('../../models/Student');
const Enrollment = require('../../models/Enrollment');
const StudentAssessment = require('../../models/StudentAssessment');
const { autoFinishExpiredAcademicYears, isGraduationEligibleBand } = require('./core');

const getCurrentAcademicYear = async (req, res) => {
  try {
    await autoFinishExpiredAcademicYears();
    const currentYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 }).lean();
    if (!currentYear) {
      return res.status(200).json({ status: 'success', data: null });
    }

    const classCount = await Classes.countDocuments({ academicYearId: currentYear._id });
    const studentCount = await Enrollment.countDocuments({ academicYearId: currentYear._id });

    return res.status(200).json({
      status: 'success',
      data: {
        ...currentYear,
        classCount,
        studentCount
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy năm học hiện tại' });
  }
};

const listAcademicYears = async (req, res) => {
  try {
    await autoFinishExpiredAcademicYears();
    const years = await AcademicYear.find().sort({ startDate: -1 }).lean();
    
    const data = await Promise.all(years.map(async (year) => {
      const classCount = await Classes.countDocuments({ academicYearId: year._id });
      const studentCount = await Enrollment.countDocuments({ academicYearId: year._id });
      return {
        ...year,
        classCount,
        studentCount
      };
    }));

    return res.status(200).json({ status: 'success', data: data || [] });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách năm học' });
  }
};

const getStudentsByAcademicYear = async (req, res) => {
  try {
    const { yearId } = req.params;
    const classes = await Classes.find({ academicYearId: yearId })
      .populate('gradeId', 'gradeName minAge maxAge')
      .populate({ path: 'teacherIds', populate: { path: 'userId', select: 'fullName' } })
      .lean();

    const classIds = classes.map(c => c._id);
    const students = await Student.find({ classId: { $in: classIds } }).lean();

    const oYearId = new mongoose.Types.ObjectId(yearId);
    const data = await Promise.all(students.map(async (s) => {
      const cls = classes.find(c => String(c._id) === String(s.classId));
      const oStudentId = new mongoose.Types.ObjectId(s._id);
      
      // 1. Tìm đánh giá ở hệ thống mới
      let assessment = await StudentAssessment.findOne({ 
        studentId: oStudentId, 
        academicYearId: oYearId,
        period: 'semester_2'
      }).lean();

      if (!assessment || !assessment.overallResult || assessment.overallResult === 'Chưa đánh giá') {
        const anyAssessment = await StudentAssessment.findOne({
          studentId: oStudentId,
          academicYearId: oYearId,
          overallResult: { $exists: true, $nin: [null, '', 'Chưa đánh giá'] }
        }).sort({ createdAt: -1 }).lean();
        if (anyAssessment) assessment = anyAssessment;
      }

      const academicEvaluation = assessment?.overallResult || assessment?.academicEvaluation;
      const evaluationNote = assessment?.notes || assessment?.evaluationNote;

      return {
        ...s,
        className: cls?.className || '',
        classId: cls?._id,
        teacherNames: (cls?.teacherIds || []).map(t => t.userId?.fullName).filter(Boolean),
        teacherUserIds: (cls?.teacherIds || []).map(t => t.userId?._id).filter(Boolean),
        gradeName: cls?.gradeId?.gradeName || '',
        canChooseGraduation: isGraduationEligibleBand(cls?.gradeId),
        evaluation: academicEvaluation && academicEvaluation !== 'Chưa đánh giá' ? {
          academicEvaluation: academicEvaluation,
          evaluationNote: evaluationNote || ''
        } : null
      };
    }));

    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách học sinh' });
  }
};

const getAcademicYearHistory = async (req, res) => {
  try {
    await autoFinishExpiredAcademicYears();
    const { yearId } = req.query;
    const filter = yearId ? { _id: yearId } : { status: { $ne: 'active' } };

    const years = await AcademicYear.find(filter).sort({ startDate: -1 }).lean();
    
    const data = await Promise.all(years.map(async (year) => {
      const classCount = await Classes.countDocuments({ academicYearId: year._id });
      const studentCount = await Enrollment.countDocuments({ academicYearId: year._id });
      return {
        ...year,
        classCount,
        studentCount
      };
    }));

    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy lịch sử năm học' });
  }
};

const getClassesByAcademicYear = async (req, res) => {
  try {
    const { yearId } = req.params;
    const classes = await Classes.find({ academicYearId: yearId })
      .populate('gradeId', 'gradeName')
      .populate({ path: 'teacherIds', populate: { path: 'userId', select: 'fullName' } })
      .lean();

    const classIds = classes.map((cls) => cls._id);
    const studentCounts = await Student.aggregate([
      { $match: { classId: { $in: classIds }, status: 'active' } },
      { $group: { _id: '$classId', count: { $sum: 1 } } },
    ]);
    const studentCountMap = {};
    studentCounts.forEach((row) => {
      studentCountMap[String(row._id)] = Number(row.count || 0);
    });

    const result = classes.map(cls => ({
      _id: cls._id,
      className: cls.className,
      gradeId: cls.gradeId?._id || null,
      gradeName: cls.gradeId?.gradeName || '',
      studentCount: studentCountMap[String(cls._id)] || 0,
      teacherIds: (cls.teacherIds || [])
        .map(t => ({
          _id: t?._id || null,
          userId: t?.userId?._id || null,
          fullName: t?.userId?.fullName || '',
        }))
        .filter(t => t._id && t.fullName),
      teacherNames: (cls.teacherIds || []).map(t => t.userId?.fullName).join(', '),
    }));

    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách lớp học' });
  }
};

module.exports = {
  getCurrentAcademicYear,
  listAcademicYears,
  getStudentsByAcademicYear,
  getAcademicYearHistory,
  getClassesByAcademicYear,
};
