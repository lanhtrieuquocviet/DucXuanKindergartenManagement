const Student = require('../../models/Student');
const StudentAssessment = require('../../models/StudentAssessment');
const Classes = require('../../models/Classes'); // Chú ý: Model của bạn là Classes (có 's')
const AcademicYear = require('../../models/AcademicYear');

/**
 * Service xử lý logic xếp lớp thông minh khi chuyển giao năm học
 */
const smartPlacementService = {
  /**
   * Tạo gợi ý xếp lớp dựa trên:
   * - Kết quả đánh giá (Chỉ Đạt mới lên lớp)
   * - Logic nối tiếp (Mầm 1 -> Chồi 1)
   * - Độ tuổi (Dành cho học sinh mới hoặc trường hợp đặc biệt)
   */
  generateSuggestions: async (sourceYearId, nextYearClasses, importedStudents = []) => {
    // 1. Lấy danh sách học sinh của năm học nguồn (Học sinh cũ)
    const students = await Student.find({ academicYearId: sourceYearId, status: 'active' })
      .populate({ path: 'classId', populate: { path: 'gradeId' } });

    // 2. Lấy kết quả đánh giá kỳ 2
    const assessments = await StudentAssessment.find({
      academicYearId: sourceYearId,
      term: 2
    });

    const assessmentMap = assessments.reduce((acc, curr) => {
      acc[curr.studentId.toString()] = curr.overallResult;
      return acc;
    }, {});

    // 3. Xử lý gợi ý cho học sinh cũ
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
        suggestedTeacherIds: [],
        reason: '',
        status: 'pending' 
      };

      if (result !== 'Đạt') {
        suggestion.status = 'manual_review';
        suggestion.reason = result === 'Chưa đạt' ? 'Kết quả đánh giá không đạt (Ở lại lớp)' : 'Chưa có kết quả đánh giá học kỳ 2';
        return suggestion;
      }

      if (currentClass && currentClass.gradeId) {
        const currentGrade = currentClass.gradeId;
        const targetGradeName = findNextGradeByAge(currentGrade, nextYearClasses);

        if (targetGradeName === 'GRADUATED') {
          suggestion.status = 'graduated';
          suggestion.reason = 'Đã hoàn thành khối cao nhất - Tốt nghiệp';
          return suggestion;
        }

        if (targetGradeName) {
          const currentClassNum = extractClassNumber(currentClass.className);
          const targetClass = nextYearClasses.find(c => 
            c.gradeName === targetGradeName && extractClassNumber(c.className) === currentClassNum
          );

          if (targetClass) {
            suggestion.targetClassId = targetClass.tempId || targetClass._id;
            suggestion.targetClassName = targetClass.className;
            suggestion.suggestedTeacherIds = currentClass.teacherIds || [];
            suggestion.status = 'suggested';
            suggestion.reason = `Tự động chuyển từ khối ${currentGrade.gradeName} lên ${targetGradeName} (+1 tuổi)`;
          } else {
            suggestion.status = 'manual_review';
            suggestion.reason = `Không tìm thấy lớp tương ứng ở khối ${targetGradeName}`;
          }
        } else {
          suggestion.status = 'manual_review';
          suggestion.reason = `Không xác định được khối tiếp theo dựa trên cấu hình độ tuổi`;
        }
      } else {
        const age = student.dateOfBirth ? calcAge(student.dateOfBirth) : null;
        if (age !== null) {
          const matchedClass = nextYearClasses.find(c => c.minAge <= age && c.maxAge >= age);
          if (matchedClass) {
            suggestion.targetClassId = matchedClass.tempId || matchedClass._id;
            suggestion.targetClassName = matchedClass.className;
            suggestion.status = 'suggested';
            suggestion.reason = `Xếp lớp dựa trên độ tuổi (${age} tuổi)`;
          }
        }
      }
      return suggestion;
    });

    // 4. Xử lý gợi ý cho học sinh mới (Imported)
    for (const s of importedStudents) {
      const age = s.dateOfBirth ? calcAge(s.dateOfBirth) : null;
      if (age !== null) {
        const matchedClass = nextYearClasses.find(c => c.minAge <= age && c.maxAge >= age);
        if (matchedClass) {
          suggestions.push({
            studentTempId: s.tempId, // Dùng tempId vì chưa có trong DB
            fullName: s.fullName,
            currentClassName: 'Học sinh mới',
            result: 'N/A',
            targetClassId: matchedClass.tempId || matchedClass._id,
            targetClassName: matchedClass.className,
            status: 'suggested',
            reason: `Học sinh mới - Xếp lớp theo tuổi (${age} tuổi)`
          });
        }
      }
    }

    return suggestions;
  }
};

/**
 * Tìm tên khối tiếp theo dựa trên logic: minAge_mới = minAge_cũ + 1
 */
function findNextGradeByAge(currentGrade, nextYearClasses) {
  const currentMinAge = currentGrade.minAge;
  
  // Lấy danh sách các khối duy nhất trong năm học mới
  const nextYearGrades = [...new Set(nextYearClasses.map(c => JSON.stringify({ name: c.gradeName, minAge: c.minAge })))].map(s => JSON.parse(s));
  
  const targetGrade = nextYearGrades.find(g => g.minAge === currentMinAge + 1);
  
  if (targetGrade) {
    return targetGrade.name;
  }

  // Nếu không tìm thấy khối nào có minAge lớn hơn 1, và khối hiện tại là khối lớn nhất (ví dụ minAge 5)
  // thì coi như học sinh tốt nghiệp
  if (currentMinAge >= 5) {
    return 'GRADUATED';
  }

  return null;
}

function extractClassNumber(className) {
  if (!className) return '';
  const match = className.match(/\d+/);
  return match ? match[0] : className;
}

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

module.exports = smartPlacementService;
