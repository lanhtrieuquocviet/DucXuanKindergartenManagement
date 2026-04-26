const JobPosition = require('../models/JobPosition');

exports.listJobPositions = async (req, res) => {
  try {
    const positions = await JobPosition.find().sort({ createdAt: 1 }).lean();
    return res.status(200).json({ status: 'success', data: positions });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createJobPosition = async (req, res) => {
  try {
    const { title, roleName, description } = req.body;
    if (!title) return res.status(400).json({ status: 'error', message: 'Tên chức vụ là bắt buộc' });

    const existing = await JobPosition.findOne({ title: title.trim() });
    if (existing) return res.status(400).json({ status: 'error', message: 'Chức vụ này đã tồn tại' });

    const newPos = await JobPosition.create({
      title: title.trim(),
      roleName: roleName || null,
      description: description || '',
    });

    return res.status(201).json({ status: 'success', data: newPos });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateJobPosition = async (req, res) => {
  try {
    const { title, roleName, description } = req.body;
    const pos = await JobPosition.findById(req.params.id);
    if (!pos) return res.status(404).json({ status: 'error', message: 'Không tìm thấy chức vụ' });

    if (title) pos.title = title.trim();
    pos.roleName = roleName !== undefined ? roleName : pos.roleName;
    if (description !== undefined) pos.description = description;

    await pos.save();
    return res.status(200).json({ status: 'success', data: pos });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteJobPosition = async (req, res) => {
  try {
    const pos = await JobPosition.findById(req.params.id);
    if (!pos) return res.status(404).json({ status: 'error', message: 'Không tìm thấy chức vụ' });

    if (pos.isDefault) {
      return res.status(400).json({ status: 'error', message: 'Không thể xóa chức vụ mặc định của hệ thống' });
    }

    await JobPosition.findByIdAndDelete(req.params.id);
    return res.status(200).json({ status: 'success', message: 'Đã xóa chức vụ' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const ExcelJS = require('exceljs');
exports.importJobPositions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng tải lên file Excel' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);
    
    const positions = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      
      const title = row.getCell(1).text?.trim();
      const roleName = row.getCell(2).text?.trim();
      const description = row.getCell(3).text?.trim();
      
      if (title) {
        positions.push({ title, roleName: roleName || null, description: description || '' });
      }
    });

    let importedCount = 0;
    for (const pos of positions) {
      await JobPosition.findOneAndUpdate(
        { title: pos.title },
        { $set: pos },
        { upsert: true }
      );
      importedCount++;
    }

    return res.status(200).json({ 
      status: 'success', 
      message: `Đã nhập thành công ${importedCount} chức vụ`,
      data: { importedCount }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const Staff = require('../models/Staff');
exports.syncFromStaffPositions = async (req, res) => {
  try {
    // 1. Lấy tất cả các chức danh duy nhất đang có trong bảng Staff
    const uniquePositions = await Staff.distinct('position');
    
    let addedCount = 0;
    for (const title of uniquePositions) {
      if (!title) continue;
      
      // 2. Kiểm tra xem chức danh này đã có trong JobPosition chưa
      const existing = await JobPosition.findOne({ title: title.trim() });
      
      if (!existing) {
        // 3. Nếu chưa có, tự động tạo mới
        await JobPosition.create({
          title: title.trim(),
          description: 'Tự động đồng bộ từ hồ sơ nhân sự',
          isDefault: false
        });
        addedCount++;
      }
    }

    return res.status(200).json({ 
      status: 'success', 
      message: `Đồng bộ thành công. Đã thêm mới ${addedCount} chức vụ từ hồ sơ nhân sự.`,
      data: { addedCount }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
