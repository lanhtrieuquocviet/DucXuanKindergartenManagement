const AssessmentTemplate = require('../models/AssessmentTemplate');
const StudentAssessment = require('../models/StudentAssessment');
const Student = require('../models/Student');
const Classes = require('../models/Classes');

/**
 * Lấy danh sách template
 */
const getTemplates = async (req, res) => {
  try {
    const { academicYearId } = req.query;
    const filter = academicYearId ? { academicYearId } : {};
    const templates = await AssessmentTemplate.find(filter)
      .populate('academicYearId', 'yearName')
      .populate('gradeId', 'gradeName')
      .sort({ createdAt: -1 });
    res.json({ status: 'success', data: templates });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Tạo hoặc cập nhật template
 */
const upsertTemplate = async (req, res) => {
  try {
    const { _id, templateName, academicYearId, gradeId, period, criteria } = req.body;
    
    if (_id) {
      const updated = await AssessmentTemplate.findByIdAndUpdate(_id, {
        templateName, academicYearId, gradeId, period, criteria
      }, { new: true });
      return res.json({ status: 'success', data: updated });
    }

    const created = await AssessmentTemplate.create({
      templateName, academicYearId, gradeId, period, criteria,
      createdBy: req.user?._id
    });
    res.status(201).json({ status: 'success', data: created });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Lấy học sinh kèm kết quả đánh giá của lớp
 */
const getClassAssessments = async (req, res) => {
  try {
    const { classId, period, academicYearId } = req.query;
    
    if (!classId || !period || !academicYearId) {
      return res.status(400).json({ status: 'error', message: 'Thiếu thông tin truy vấn' });
    }

    // 1. Tìm template phù hợp (theo lớp -> khối + kỳ đánh giá)
    const cls = await Classes.findById(classId).populate('gradeId');
    let template = await AssessmentTemplate.findOne({ 
      academicYearId, 
      gradeId: cls.gradeId?._id,
      period,
      status: 'active'
    });

    // Nếu không có template riêng cho khối, tìm template chung của năm học + kỳ đó
    if (!template) {
      template = await AssessmentTemplate.findOne({ 
        academicYearId, 
        gradeId: null,
        period,
        status: 'active'
      });
    }

    if (!template) {
      return res.json({ status: 'no_template', message: 'Chưa có form đánh giá cho kỳ này' });
    }

    // 2. Lấy danh sách học sinh
    const students = await Student.find({ classId, status: 'active' }).sort({ fullName: 1 }).lean();

    // 3. Lấy các bản đánh giá đã có
    const assessments = await StudentAssessment.find({
      classId, period, academicYearId
    }).lean();

    // 4. Map kết quả
    const data = students.map(st => {
      const assessment = assessments.find(a => String(a.studentId) === String(st._id));
      return {
        ...st,
        assessment: assessment || null
      };
    });

    res.json({ 
      status: 'success', 
      data: {
        template,
        students: data
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Lưu đánh giá hàng loạt
 */
const saveBulkAssessments = async (req, res) => {
  try {
    const { assessments } = req.body; // Array of assessment objects
    
    const operations = assessments.map(item => ({
      updateOne: {
        filter: { 
          studentId: item.studentId, 
          academicYearId: item.academicYearId, 
          period: item.period 
        },
        update: { 
          $set: {
            ...item,
            assessedBy: req.user?._id,
            assessedAt: new Date()
          } 
        },
        upsert: true
      }
    }));

    await StudentAssessment.bulkWrite(operations);
    res.json({ status: 'success', message: 'Đã lưu đánh giá thành công' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Lấy đánh giá của 1 học sinh cụ thể (dùng cho Dialog)
 */
const getStudentAssessment = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { period, academicYearId } = req.query;

    if (!studentId || !period || !academicYearId) {
      return res.status(400).json({ status: 'error', message: 'Thiếu thông tin truy vấn' });
    }

    const student = await Student.findById(studentId).populate('classId');
    if (!student) return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh' });

    const cls = student.classId;
    if (!cls) return res.status(400).json({ status: 'error', message: 'Học sinh chưa vào lớp' });

    // 1. Tìm template
    let template = await AssessmentTemplate.findOne({ 
      academicYearId, 
      gradeId: cls.gradeId,
      period,
      status: 'active'
    });

    if (!template) {
      template = await AssessmentTemplate.findOne({ 
        academicYearId, 
        gradeId: null,
        period,
        status: 'active'
      });
    }

    if (!template) {
      return res.json({ status: 'no_template', message: 'Chưa có form đánh giá cho kỳ này' });
    }

    // 2. Lấy bản đánh giá đã có
    const assessment = await StudentAssessment.findOne({
      studentId, period, academicYearId
    }).lean();

    res.json({ 
      status: 'success', 
      data: {
        template,
        assessment: assessment || null
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getTemplates,
  upsertTemplate,
  getClassAssessments,
  saveBulkAssessments,
  getStudentAssessment
};
