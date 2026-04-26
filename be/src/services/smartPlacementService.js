const Student = require('../../models/Student');
const StudentAssessment = require('../../models/StudentAssessment');
const Class = require('../../models/Class');
const mongoose = require('mongoose');

/**
 * Service xử lý logic xếp lớp thông minh khi chuyển giao năm học
 */
const smartPlacementService = {
  /**
   * Tạo gợi ý xếp lớp dựa trên:
   * - Độ tuổi (Birth year)
   * - Lớp cũ (Mầm 1 -> Chồi 1)
   * - Kết quả đánh giá (Chỉ Đạt mới lên lớp)
   */
  generateSuggestions: async (currentYearId, nextYearId) => {
    // 1. Lấy danh sách học sinh của năm học hiện tại
    const students = await Student.find({ academicYearId: currentYearId, status: 'active' })
      .populate('classId');

    // 2. Lấy kết quả đánh giá kỳ 2 của các học sinh này
    const assessments = await StudentAssessment.find({
      academicYearId: currentYearId,
      term: 2
    });

    const assessmentMap = assessments.reduce((acc, curr) => {
      acc[curr.studentId.toString()] = curr.overallResult;
      return acc;
    }, {});

    // 3. Lấy danh sách các lớp đã tạo ở năm học mới (Draft)
    const nextYearClasses = await Class.find({ academicYearId: nextYearId });

    const suggestions = students.map(student => {
      const result = assessmentMap[student._id.toString()] || 'Chưa đánh giá';
      const currentClass = student.classId;
      
      let suggestion = {
        studentId: student._id,
        fullName: student.fullName,
        currentClassName: currentClass?.className || 'N/A',
        result,
        targetClassId: null,
        targetClassName: '',
        reason: '',
        status: 'pending' // pending, suggested, manual_review
      };

      // Logic: Nếu chưa đạt hoặc chưa đánh giá -> Cần xem xét thủ công (ở lại lớp hoặc khác)
      if (result !== 'Đạt') {
        suggestion.status = 'manual_review';
        suggestion.reason = result === 'Chưa đạt' ? 'Kết quả đánh giá không đạt' : 'Chưa có kết quả đánh giá cuối năm';
        return suggestion;
      }

      // Logic nối tiếp: Tìm lớp tương ứng ở khối cao hơn
      // VD: Mầm 1 -> Chồi 1, Chồi 2 -> Lá 2
      if (currentClass) {
        const nextGradeName = getNextGrade(currentClass.grade); // Hàm phụ trợ
        const targetClass = nextYearClasses.find(c => 
          c.grade === nextGradeName && extractClassNumber(c.className) === extractClassNumber(currentClass.className)
        );

        if (targetClass) {
          suggestion.targetClassId = targetClass._id;
          suggestion.targetClassName = targetClass.className;
          suggestion.status = 'suggested';
          suggestion.reason = `Chuyển tiếp từ ${currentClass.className} lên ${targetClass.className}`;
        } else {
          suggestion.status = 'manual_review';
          suggestion.reason = `Không tìm thấy lớp tương ứng ở khối ${nextGradeName}`;
        }
      }

      return suggestion;
    });

    return suggestions;
  }
};

// Hàm phụ trợ xác định khối tiếp theo
function getNextGrade(currentGrade) {
  const flow = { 'Nhà trẻ': 'Mầm', 'Mầm': 'Chồi', 'Chồi': 'Lá', 'Lá': 'Ra trường' };
  return flow[currentGrade] || null;
}

// Hàm phụ trợ lấy số của lớp (VD: "Mầm 1" -> 1)
function extractClassNumber(className) {
  const match = className.match(/\d+/);
  return match ? match[0] : className;
}

module.exports = smartPlacementService;
