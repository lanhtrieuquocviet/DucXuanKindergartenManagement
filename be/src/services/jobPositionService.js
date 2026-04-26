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
