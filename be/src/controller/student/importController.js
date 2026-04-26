const importService = require('../../services/student/importService');
const Student = require('../../models/Student');
const User = require('../../models/User');
const ExcelJS = require('exceljs');
const { 
  normalizePhone, 
  normalizeGender, 
  normalizeHeaderKey, 
  extractCellText, 
  parseExcelDateValue,
} = require('./helpers');

/**
 * API: Thêm 1 học sinh kèm tạo tài khoản phụ huynh
 */
const createStudentWithParent = async (req, res) => {
  try {
    const { parent, student: studentData } = req.body;
    if (!parent || !parent.fullName || !parent.phone) {
      return res.status(400).json({ status: 'error', message: 'Thiếu thông tin phụ huynh' });
    }
    if (!studentData || !studentData.fullName || !studentData.dateOfBirth) {
      return res.status(400).json({ status: 'error', message: 'Thiếu thông tin học sinh' });
    }

    const result = await importService.createStudentWithParentCore({ parent, studentData });
    if (result.duplicateDetected) {
      return res.status(200).json({ status: 'warning', duplicateDetected: true, message: 'Học sinh đã tồn tại' });
    }

    const populatedStudent = await Student.findById(result.student._id)
      .populate('classId', 'className')
      .populate('parentId', 'fullName email username avatar phone')
      .populate('academicYearId', 'yearName');

    return res.status(201).json({ 
      status: 'success', 
      isNewParent: result.isNewParent,
      generatedPassword: result.generatedPassword,
      parentUser: result.parentUser,
      data: populatedStudent 
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * API: Import hàng loạt từ Excel
 */
const importStudentsWithParents = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn file Excel' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return res.status(400).json({ status: 'error', message: 'File không có dữ liệu' });

    const requiredHeaders = ['Họ tên phụ huynh', 'Email phụ huynh', 'Số điện thoại phụ huynh', 'Họ tên học sinh', 'Ngày sinh', 'Giới tính'];
    const headers = {};
    let headerRowIndex = 1;
    for (let i = 1; i <= Math.min(worksheet.rowCount, 20); i++) {
      const row = worksheet.getRow(i);
      const localHeaders = {};
      row.eachCell((cell, col) => { 
        localHeaders[normalizeHeaderKey(extractCellText(cell.value))] = col; 
      });
      if (requiredHeaders.every(h => !!localHeaders[normalizeHeaderKey(h)])) {
        Object.assign(headers, localHeaders);
        headerRowIndex = i;
        break;
      }
    }

    if (!Object.keys(headers).length) {
      return res.status(400).json({ status: 'error', message: 'Không tìm thấy dòng tiêu đề hợp lệ' });
    }

    const getCellValue = (row, keys) => {
      for (const k of keys) {
        const idx = headers[normalizeHeaderKey(k)];
        if (idx) return extractCellText(row.getCell(idx).value);
      }
      return '';
    };

    const getCellDateValue = (row, keys) => {
      for (const k of keys) {
        const idx = headers[normalizeHeaderKey(k)];
        if (idx) {
          const d = parseExcelDateValue(row.getCell(idx).value);
          if (d) return d;
        }
      }
      return null;
    };

    const dryRun = req.body.dryRun === 'true' || req.body.dryRun === true;
    const forceUpdate = req.body.forceUpdate === 'true' || req.body.forceUpdate === true;
    const skipDuplicates = req.body.skipDuplicates === 'true' || req.body.skipDuplicates === true;
    const allowUnassignedClass = req.body.allowUnassignedClass === 'true' || req.body.allowUnassignedClass === true;
    
    let selectedRowIndexes = null;
    if (req.body.selectedRowIndexes) {
      try {
        selectedRowIndexes = JSON.parse(req.body.selectedRowIndexes);
      } catch (e) {
        selectedRowIndexes = null;
      }
    }

    const errors = [];
    const duplicates = [];
    const previewData = [];
    const importResults = [];
    let createdStudents = 0, createdParents = 0, linkedExistingParents = 0;

    for (let i = headerRowIndex + 1; i <= worksheet.rowCount; i++) {
      if (!dryRun && selectedRowIndexes && !selectedRowIndexes.includes(i)) {
        continue; // Bỏ qua nếu người dùng không tick chọn dòng này trên giao diện
      }

      const row = worksheet.getRow(i);
      const pName = getCellValue(row, ['Họ tên phụ huynh']);
      const pEmail = getCellValue(row, ['Email phụ huynh']);
      const pPhone = getCellValue(row, ['Số điện thoại phụ huynh']);
      const sName = getCellValue(row, ['Họ tên học sinh']);
      const sDob = getCellDateValue(row, ['Ngày sinh']);
      const sGender = getCellValue(row, ['Giới tính']);
      const sAddr = getCellValue(row, ['Địa chỉ']);
      const sClassName = getCellValue(row, ['Lớp']);

      if (!pName && !sName) continue;
      if (!pName || !pPhone || !sName || !sDob) {
        errors.push(`Dòng ${i}: Thiếu thông tin bắt buộc`);
        if (dryRun) previewData.push({ rowIndex: i, studentName: sName || '(Thiếu)', parentName: pName || '', phone: pPhone || '', dob: sDob, gender: normalizeGender(sGender), className: sClassName, status: 'error', message: 'Thiếu thông tin' });
        continue;
      }

      try {
        const classId = await importService.findTargetClass(sClassName, allowUnassignedClass);

        const existingParent = await User.findOne({ phone: normalizePhone(pPhone) }).lean();
        
        let emailError = null;
        if (pEmail) {
          const emailUser = await User.findOne({ email: pEmail.toLowerCase().trim() }).lean();
          if (emailUser && (!existingParent || emailUser._id.toString() !== existingParent._id.toString())) {
             emailError = `Email ${pEmail} đã được sử dụng bởi người khác`;
          }
        }

        if (emailError) {
          errors.push(`Dòng ${i}: ${emailError}`);
          if (dryRun) previewData.push({ rowIndex: i, studentName: sName, parentName: pName, phone: pPhone, email: pEmail, dob: sDob, gender: normalizeGender(sGender), className: sClassName, status: 'error', message: emailError });
          continue;
        }

        let isDup = false;
        if (existingParent) {
          const dupStudent = await Student.findOne({ 
            fullName: { $regex: new RegExp(`^${sName.trim()}$`, 'i') }, 
            dateOfBirth: new Date(sDob), 
            parentId: existingParent._id 
          }).lean();
          if (dupStudent) isDup = true;
        }

        if (dryRun) {
          if (isDup) duplicates.push({ rowIndex: i, studentName: sName, parentName: pName, phone: pPhone });
          previewData.push({
            rowIndex: i, studentName: sName, parentName: pName, phone: pPhone, email: pEmail, dob: sDob,
            gender: normalizeGender(sGender), className: sClassName || 'Chưa xếp lớp',
            status: isDup ? 'duplicate' : 'new',
            message: isDup ? 'Trùng Tên học sinh, Ngày sinh và SĐT phụ huynh' : (existingParent ? 'Tạo HS mới (Gán vào PH/GV hiện tại)' : 'Sẵn sàng')
          });
          continue;
        }

        const resCore = await importService.createStudentWithParentCore({
          parent: { fullName: pName, email: pEmail, phone: pPhone, address: sAddr },
          studentData: { fullName: sName, dateOfBirth: sDob, gender: normalizeGender(sGender), address: sAddr, classId, forceUpdate: true }
        });

        if (resCore.duplicateDetected) {
          if (skipDuplicates) continue;
          duplicates.push({ rowIndex: i, studentName: sName, parentName: pName, phone: pPhone });
          continue;
        }

        if (resCore.isNewStudent) createdStudents++;
        if (resCore.isNewParent) createdParents++; else linkedExistingParents++;

        importResults.push({
          studentName: sName, parentName: pName, phone: pPhone,
          username: resCore.parentUser.username,
          password: resCore.generatedPassword || '********',
          status: `${resCore.isNewStudent ? 'Mới' : 'Cập nhật'} - ${resCore.isNewParent ? 'PH mới' : 'PH cũ'}`
        });
      } catch (err) {
        errors.push(`Dòng ${i}: ${err.message}`);
        if (dryRun) previewData.push({ rowIndex: i, studentName: sName, status: 'error', message: err.message });
      }
    }

    if (dryRun) {
      return res.status(200).json({ status: 'success', data: { previewData, duplicateCount: duplicates.length, errors } });
    }
    
    if (duplicates.length > 0 && !forceUpdate) return res.status(200).json({ status: 'warning', data: { duplicates, errors } });

    return res.status(200).json({ 
      status: 'success', 
      message: 'Import hoàn tất',
      data: { createdStudents, createdParents, linkedExistingParents, errors, importResults } 
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  createStudentWithParent,
  importStudentsWithParents
};
