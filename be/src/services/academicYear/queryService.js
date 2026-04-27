const AcademicYear = require('../../models/AcademicYear');
const Classes = require('../../models/Classes');
const Student = require('../../models/Student');
const Enrollment = require('../../models/Enrollment');
const { autoFinishExpiredAcademicYears, isGraduationEligibleBand } = require('./core');

const getCurrentAcademicYear = async (req, res) => {
  try {
    await autoFinishExpiredAcademicYears();
    const currentYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 }).lean();
    return res.status(200).json({ status: 'success', data: currentYear || null });
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
      const studentCount = await Student.countDocuments({ 
        classId: { $in: await Classes.find({ academicYearId: year._id }).distinct('_id') },
        status: 'active'
      });
      return {
        ...year,
        classCount,
        totalStudents: studentCount
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

    const data = await Promise.all(students.map(async (s) => {
      const cls = classes.find(c => String(c._id) === String(s.classId));
      const enrollment = await Enrollment.findOne({ studentId: s._id, academicYearId: yearId }).lean();

      return {
        ...s,
        className: cls?.className || '',
        classId: cls?._id,
        teacherNames: (cls?.teacherIds || []).map(t => t.userId?.fullName).filter(Boolean),
        teacherUserIds: (cls?.teacherIds || []).map(t => t.userId?._id).filter(Boolean),
        gradeName: cls?.gradeId?.gradeName || '',
        canChooseGraduation: isGraduationEligibleBand(cls?.gradeId),
        evaluation: enrollment ? {
          academicEvaluation: enrollment.academicEvaluation,
          evaluationNote: enrollment.evaluationNote
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
    const filter = { status: { $ne: 'active' } };
    if (yearId) filter._id = yearId;

    const years = await AcademicYear.find(filter).sort({ startDate: -1 }).lean();
    
    const data = await Promise.all(years.map(async (year) => {
      const classCount = await Classes.countDocuments({ academicYearId: year._id });
      const studentCount = await Student.countDocuments({ 
        classId: { $in: await Classes.find({ academicYearId: year._id }).distinct('_id') },
        status: 'active'
      });
      return {
        ...year,
        classCount,
        totalStudents: studentCount
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

    const result = classes.map(cls => ({
      _id: cls._id,
      className: cls.className,
      gradeName: cls.gradeId?.gradeName || '',
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
