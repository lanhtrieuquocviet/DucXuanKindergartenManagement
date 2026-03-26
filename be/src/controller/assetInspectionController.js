const InspectionCommittee = require('../models/InspectionCommittee');
const InspectionMinutes = require('../models/InspectionMinutes');

// ===================== COMMITTEES =====================

exports.listCommittees = async (req, res) => {
  try {
    const committees = await InspectionCommittee.find()
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 });
    return res.json({ status: 'success', data: { committees } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getCommittee = async (req, res) => {
  try {
    const committee = await InspectionCommittee.findById(req.params.id).populate('createdBy', 'fullName username');
    if (!committee) return res.status(404).json({ status: 'error', message: 'Không tìm thấy ban kiểm kê.' });
    return res.json({ status: 'success', data: { committee } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.createCommittee = async (req, res) => {
  try {
    const { name, foundedDate, decisionNumber, members } = req.body;
    if (!name || !foundedDate || !decisionNumber) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng điền đầy đủ thông tin.' });
    }
    const committee = await InspectionCommittee.create({
      name,
      foundedDate,
      decisionNumber,
      members: members || [],
      createdBy: req.user._id,
    });
    return res.status(201).json({ status: 'success', data: { committee } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.updateCommittee = async (req, res) => {
  try {
    const { name, foundedDate, decisionNumber, members } = req.body;
    const committee = await InspectionCommittee.findByIdAndUpdate(
      req.params.id,
      { name, foundedDate, decisionNumber, members },
      { new: true, runValidators: true }
    );
    if (!committee) return res.status(404).json({ status: 'error', message: 'Không tìm thấy ban kiểm kê.' });
    return res.json({ status: 'success', data: { committee } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.deleteCommittee = async (req, res) => {
  try {
    const committee = await InspectionCommittee.findByIdAndDelete(req.params.id);
    if (!committee) return res.status(404).json({ status: 'error', message: 'Không tìm thấy ban kiểm kê.' });
    return res.json({ status: 'success', message: 'Xóa ban kiểm kê thành công.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ===================== MINUTES =====================

// Teacher: only their own minutes
exports.listMyMinutes = async (req, res) => {
  try {
    const minutes = await InspectionMinutes.find({ createdBy: req.user._id })
      .populate('createdBy', 'fullName username')
      .populate('committeeId', 'name members')
      .sort({ createdAt: -1 });
    return res.json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.listMinutes = async (req, res) => {
  try {
    const minutes = await InspectionMinutes.find()
      .populate('createdBy', 'fullName username')
      .populate('committeeId', 'name')
      .sort({ createdAt: -1 });
    return res.json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getMinutes = async (req, res) => {
  try {
    const minutes = await InspectionMinutes.findById(req.params.id)
      .populate('createdBy', 'fullName username')
      .populate('committeeId', 'name members');
    if (!minutes) return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });
    return res.json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.createMinutes = async (req, res) => {
  try {
    const { scope, location, inspectionDate, inspectionTime, endTime, reason, inspectionMethod, committeeId, assets, conclusion } = req.body;
    if (!inspectionDate) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn ngày kiểm kê.' });
    }
    const minutes = await InspectionMinutes.create({
      scope: scope || '',
      location: location || 'Đức Xuân',
      inspectionDate,
      inspectionTime: inspectionTime || '',
      endTime: endTime || '',
      reason: reason || '',
      inspectionMethod: inspectionMethod || '',
      committeeId: committeeId || null,
      assets: assets || [],
      conclusion: conclusion || '',
      createdBy: req.user._id,
      status: 'pending',
    });
    await minutes.populate('createdBy', 'fullName username');
    return res.status(201).json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.updateMinutes = async (req, res) => {
  try {
    const { scope, location, inspectionDate, inspectionTime, endTime, reason, inspectionMethod, committeeId, assets, conclusion } = req.body;
    const minutes = await InspectionMinutes.findById(req.params.id);
    if (!minutes) return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });
    if (minutes.status === 'approved') {
      return res.status(400).json({ status: 'error', message: 'Không thể chỉnh sửa biên bản đã duyệt.' });
    }
    Object.assign(minutes, { scope, location, inspectionDate, inspectionTime, endTime, reason, inspectionMethod, committeeId, assets, conclusion });
    await minutes.save();
    await minutes.populate('createdBy', 'fullName username');
    return res.json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.approveMinutes = async (req, res) => {
  try {
    const minutes = await InspectionMinutes.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    ).populate('createdBy', 'fullName username');
    if (!minutes) return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });
    return res.json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.rejectMinutes = async (req, res) => {
  try {
    const minutes = await InspectionMinutes.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).populate('createdBy', 'fullName username');
    if (!minutes) return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });
    return res.json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.deleteMinutes = async (req, res) => {
  try {
    const minutes = await InspectionMinutes.findByIdAndDelete(req.params.id);
    if (!minutes) return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });
    return res.json({ status: 'success', message: 'Xóa biên bản thành công.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
