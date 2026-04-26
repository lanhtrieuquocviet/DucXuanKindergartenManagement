const mongoose = require('mongoose');
const AcademicYear = require('../../models/AcademicYear');
const Classes = require('../../models/Classes');
const Student = require('../../models/Student');
const Grade = require('../../models/Grade');
const Enrollment = require('../../models/Enrollment');
const StaticBlock = require('../../models/StaticBlock');
const { isGraduationEligibleBand } = require('./core');
const GeneralCategory = require('../../models/GeneralCategory');

const getTeacherHistory = async (session = null) => {
  const history = {}; // teacherId -> { className: count }
  const pastYears = await AcademicYear.find({ status: { $ne: 'draft' } }).session(session).lean();
  const pastYearIds = pastYears.map(y => y._id);
  
  const pastClasses = await Classes.find({ academicYearId: { $in: pastYearIds } }).session(session).lean();
  
  for (const cls of pastClasses) {
    if (!cls.teacherIds) continue;
    for (const tid of cls.teacherIds) {
      const tidStr = String(tid);
      if (!history[tidStr]) history[tidStr] = {};
      history[tidStr][cls.className] = (history[tidStr][cls.className] || 0) + 1;
    }
  }
  return history;
};

/**
 * POST /api/school-admin/academic-years/wizard-setup
 */
const setupNewAcademicYearWizard = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    await Promise.allSettled([
      db.collection('Grades').dropIndex('gradeName_1'),
      db.collection('Classes').dropIndex('className_1')
    ]);
  } catch (err) { /* ignore */ }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { yearInfo, grades = [], classes = [], studentPlacements = [], importedStudents = [] } = req.body;

    if (!yearInfo?.yearName?.trim()) throw new Error('Tên năm học không được để trống');
    
    // Step 1: Tạo năm học mới ở trạng thái DRAFT
    const [newYear] = await AcademicYear.create([{
      ...yearInfo,
      yearName: yearInfo.yearName.trim(),
      termCount: 2,
      status: 'draft',
    }], { session });

    // Step 3: Tạo Grade Snapshot
    const gradeIdMap = new Map();
    for (const g of grades) {
      const sb = await StaticBlock.findById(g.staticBlockId).session(session).lean();
      if (!sb) throw new Error(`Không tìm thấy Khối mẫu: ${g.staticBlockId}`);
      
      const [newGrade] = await Grade.create([{
        gradeName: sb.name,
        staticBlockId: sb._id,
        academicYearId: newYear._id,
        minAge: sb.minAge,
        maxAge: sb.maxAge,
        maxClasses: sb.maxClasses,
        headTeacherId: g.headTeacherId || null,
      }], { session });
      gradeIdMap.set(g.tempId, newGrade._id);
    }

    // Step 4: Tạo Lớp & Kiểm tra giáo viên
    const classIdMap = new Map();
    const allTeachersAssigned = new Set();
    const teacherPastHistory = {}; // Để check quy tắc 2 năm nếu cần

    // Fetch lịch sử 2 năm gần nhất để validate trên backend
    const recentYears = await AcademicYear.find().sort({ startDate: -1 }).limit(2).lean();
    const yearIds = recentYears.map(y => y._id);
    const allPastClasses = await Classes.find({ academicYearId: { $in: yearIds } }).lean();
    allPastClasses.forEach(cls => {
      (cls.teacherIds || []).forEach(tId => {
        const tidStr = String(tId);
        if (!teacherPastHistory[tidStr]) teacherPastHistory[tidStr] = {};
        teacherPastHistory[tidStr][cls.className] = (teacherPastHistory[tidStr][cls.className] || 0) + 1;
      });
    });

    const classDocs = classes.map(c => {
      const tIds = c.teacherIds || [];
      // 1. Quy tắc tối đa 2 GV/lớp
      if (tIds.length > 2) throw new Error(`Lớp ${c.className} có quá 2 giáo viên.`);
      
      tIds.forEach(tid => {
        const tidStr = String(tid);
        // 2. Quy tắc trùng lớp
        if (allTeachersAssigned.has(tidStr)) throw new Error(`Giáo viên ${tidStr} được gán cho nhiều hơn 1 lớp.`);
        allTeachersAssigned.add(tidStr);

        // 3. Quy tắc 2 năm liên tiếp
        if ((teacherPastHistory[tidStr]?.[c.className.trim()] || 0) >= 2) {
          throw new Error(`Giáo viên ${tidStr} đã dạy lớp ${c.className} 2 năm liên tiếp.`);
        }
      });

      return {
        className: c.className.trim(),
        gradeId: gradeIdMap.get(c.gradeTempId),
        academicYearId: newYear._id,
        teacherIds: tIds,
        maxStudents: Number(c.maxStudents) || 25,
        capacity: 0,
      };
    });

    const insertedClasses = await Classes.insertMany(classDocs, { session });
    insertedClasses.forEach((cls, idx) => {
      classIdMap.set(classes[idx].tempId, cls._id);
    });

    // Step 5: Học sinh mới (Import)
    const importedStudentIdMap = new Map();
    if (importedStudents.length > 0) {
      const studentDocs = importedStudents.map(s => ({
        fullName: s.fullName.trim(),
        dateOfBirth: s.dateOfBirth,
        gender: s.gender || 'other',
        status: 'active',
        academicYearId: [newYear._id],
      }));
      const insertedStudents = await Student.insertMany(studentDocs, { session });
      insertedStudents.forEach((st, idx) => {
        importedStudentIdMap.set(importedStudents[idx].tempId, st._id);
      });
    }

    // Step 6: Tạo Enrollment (ở trạng thái chờ kích hoạt)
    const enrollmentDocs = [];
    const allPlacements = [
        ...studentPlacements.map(p => ({ studentId: p.studentId, classTempId: p.classTempId })),
        ...importedStudents.map(s => ({ studentId: importedStudentIdMap.get(s.tempId), classTempId: s.classId }))
    ];

    for (const p of allPlacements) {
      const realClassId = classIdMap.get(p.classTempId);
      if (!realClassId) continue;

      const targetClass = insertedClasses.find(c => String(c._id) === String(realClassId));
      
      // LƯU Ý: Không cập nhật Student.classId ngay lúc này
      // vì Năm học đang là DRAFT. Việc cập nhật sẽ diễn ra khi Publish.

      enrollmentDocs.push({
        studentId: p.studentId,
        classId: realClassId,
        gradeId: targetClass.gradeId,
        academicYearId: newYear._id,
        enrollmentDate: new Date(),
      });
    }
    if (enrollmentDocs.length > 0) await Enrollment.insertMany(enrollmentDocs, { session });

    await session.commitTransaction();
    return res.status(201).json({ status: 'success', message: 'Thiết lập thành công', data: { yearId: newYear._id } });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally { session.endSession(); }
};

/**
 * GET /api/school-admin/academic-years/wizard-clone-data
 */
const getWizardCloneData = async (req, res) => {
  try {
    let sourceYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 }).lean();
    if (!sourceYear) sourceYear = await AcademicYear.findOne({ status: 'inactive' }).sort({ endDate: -1 }).lean();

    const staticBlocks = await StaticBlock.find({ status: 'active' }).sort({ minAge: 1 }).lean();

    let cloneClasses = [];
    let carryOverStudents = [];
    let graduationEligibleStudents = [];
    const teacherHistory = await getTeacherHistory();

    if (sourceYear) {
      const oldClasses = await Classes.find({ academicYearId: sourceYear._id })
        .populate('gradeId', 'gradeName staticBlockId minAge maxAge')
        .lean();

      cloneClasses = oldClasses.map(cls => ({
        className: cls.className,
        maxStudents: cls.maxStudents || 25,
        staticBlockId: cls.gradeId?.staticBlockId || null,
        teacherIds: cls.teacherIds || [],
      }));

      // 1. Học sinh thuộc năm học nguồn
      const studentsFromSource = await Student.find({ academicYearId: sourceYear._id, status: 'active' })
        .populate({ path: 'classId', populate: { path: 'gradeId' } })
        .lean();

      // 2. Học sinh "mồ côi" (Active nhưng chưa từng được gán năm học nào)
      const orphanStudents = await Student.find({
        status: 'active',
        $or: [
          { academicYearId: { $size: 0 } },
          { academicYearId: { $exists: false } },
          { classId: { $exists: false } },
          { classId: null }
        ],
        _id: { $nin: studentsFromSource.map(s => s._id) } // Tránh trùng lặp
      })
      .populate({ path: 'classId', populate: { path: 'gradeId' } })
      .lean();

      const allRelevantStudents = [...studentsFromSource, ...orphanStudents];

      allRelevantStudents.forEach(st => {
        if (st.classId && isGraduationEligibleBand(st.classId?.gradeId)) {
          graduationEligibleStudents.push(st);
        } else {
          carryOverStudents.push(st);
        }
      });
    } else {
      // Trường hợp hệ thống chưa có năm học nào, lấy toàn bộ học sinh active
      carryOverStudents = await Student.find({ status: 'active' }).lean();
    }

    return res.status(200).json({
      status: 'success',
      data: { 
        staticBlocks, 
        cloneClasses, 
        carryOverStudents, 
        graduationEligibleStudents,
        teacherHistory // Thêm lịch sử để frontend validate
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const smartPlacementService = require('./smartPlacementService');

/**
 * POST /api/school-admin/academic-years/wizard-suggestions
 */
const getSmartSuggestions = async (req, res) => {
  try {
    const { sourceYearId, nextYearClasses, importedStudents = [] } = req.body;
    if (!sourceYearId || !nextYearClasses) {
      throw new Error('Thiếu thông tin năm học nguồn hoặc danh sách lớp mới');
    }

    const suggestions = await smartPlacementService.generateSuggestions(sourceYearId, nextYearClasses, importedStudents);
    
    return res.status(200).json({
      status: 'success',
      data: suggestions
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const expressSetupNewAcademicYear = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // 0. Tính lịch sử dạy học
    const teacherHistory = await getTeacherHistory(session);

    const { yearInfo } = req.body;
    if (!yearInfo?.yearName?.trim()) throw new Error('Tên năm học không được để trống');

    // 1. Tìm năm học đang hoạt động để làm mẫu
    const sourceYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 }).session(session).lean();
    if (!sourceYear) throw new Error('Không tìm thấy năm học đang hoạt động để làm mẫu thiết lập nhanh');

    // 2. Tạo Năm học mới (Draft)
    const [newYear] = await AcademicYear.create([{
      ...yearInfo,
      yearName: yearInfo.yearName.trim(),
      termCount: 2,
      status: 'draft',
    }], { session });

    // 3. Nhân bản Khối (Grade)
    const oldGrades = await Grade.find({ academicYearId: sourceYear._id }).session(session).lean();
    const gradeIdMap = new Map(); // oldGradeId -> newGradeId
    for (const og of oldGrades) {
      const [ng] = await Grade.create([{
        gradeName: og.gradeName,
        staticBlockId: og.staticBlockId,
        academicYearId: newYear._id,
        minAge: og.minAge,
        maxAge: og.maxAge,
        maxClasses: og.maxClasses,
        headTeacherId: og.headTeacherId
      }], { session });
      gradeIdMap.set(String(og._id), ng._id);
    }

    // 4. Nhân bản Lớp (Classes)
    const oldClasses = await Classes.find({ academicYearId: sourceYear._id }).session(session).lean();
    const classInfoForSuggestions = []; 
    const newClasses = [];
    
    // Tạo map để tìm lớp nhanh
    const oldClassMap = new Map(); // oldClassId -> object

    for (const oc of oldClasses) {
      const targetGradeId = gradeIdMap.get(String(oc.gradeId));
      if (!targetGradeId) continue;

      const [nc] = await Classes.create([{
        className: oc.className,
        gradeId: targetGradeId,
        academicYearId: newYear._id,
        // Tạm thời chưa gán GV, sẽ gán theo logic "đi theo học sinh" ở bước sau
        teacherIds: [], 
        maxStudents: oc.maxStudents || 25,
        capacity: 0,
      }], { session });
      
      const gradeObj = oldGrades.find(g => String(g._id) === String(oc.gradeId));
      const classData = {
        _id: nc._id,
        className: nc.className,
        gradeName: gradeObj?.gradeName,
        minAge: gradeObj?.minAge,
        maxAge: gradeObj?.maxAge,
        oldTeacherIds: oc.teacherIds // Lưu lại để gán sau
      };
      classInfoForSuggestions.push(classData);
      newClasses.push(nc);
      oldClassMap.set(String(oc._id), classData);
    }

    // 5. Tự động xếp lớp & Gán giáo viên theo học sinh
    const suggestions = await smartPlacementService.generateSuggestions(sourceYear._id, classInfoForSuggestions);
    const enrollmentDocs = [];
    const classTeacherAssignments = new Map(); // newClassId -> Set of teacherIds

    for (const sug of suggestions) {
      let targetClassId = sug.targetClassId;
      
      // Nghiệp vụ bổ sung: Nếu "Ở lại lớp" -> Tìm lớp cùng tên ở năm học mới
      if (sug.status === 'manual_review' && sug.reason.includes('Ở lại lớp')) {
        const repeaterClass = newClasses.find(nc => nc.className === sug.currentClassName);
        if (repeaterClass) targetClassId = repeaterClass._id;
      }

      if (targetClassId) {
        enrollmentDocs.push({
          studentId: sug.studentId,
          classId: targetClassId,
          academicYearId: newYear._id,
          enrollmentDate: new Date(),
        });

        // Logic GV đi theo học sinh:
        if (sug.suggestedTeacherIds && sug.suggestedTeacherIds.length > 0) {
          if (!classTeacherAssignments.has(String(targetClassId))) {
            classTeacherAssignments.set(String(targetClassId), new Set());
          }
          
          const targetClassObj = newClasses.find(nc => String(nc._id) === String(targetClassId));
          
          sug.suggestedTeacherIds.forEach(tid => {
            // Kiểm tra quy tắc 2 năm
            const historyCount = teacherHistory[String(tid)]?.[targetClassObj.className] || 0;
            if (historyCount < 2) {
              classTeacherAssignments.get(String(targetClassId)).add(String(tid));
            }
          });
        }
      }
    }

    // Cập nhật giáo viên cho các lớp mới
    for (const [classId, teacherSet] of classTeacherAssignments) {
      await Classes.findByIdAndUpdate(classId, { 
        $set: { teacherIds: Array.from(teacherSet).slice(0, 2) } // Tối đa 2 GV/lớp
      }).session(session);
    }

    if (enrollmentDocs.length > 0) {
      await Enrollment.insertMany(enrollmentDocs, { session });
    }

    await session.commitTransaction();
    return res.status(201).json({
      status: 'success',
      message: 'Thiết lập nhanh thành công!',
      data: {
        yearId: newYear._id,
        classesCreated: newClasses.length,
        studentsPlaced: enrollmentDocs.length
      }
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = {
  setupNewAcademicYearWizard,
  getWizardCloneData,
  getSmartSuggestions,
  expressSetupNewAcademicYear,
};
