const PurchaseRequest = require('../models/PurchaseRequest');
const Teacher = require('../models/Teacher');
const Classes = require('../models/Classes');

// Helper: get teacher record and assigned classes for current user
async function getTeacherAndClasses(userId) {
  const teacher = await Teacher.findOne({ userId }).lean();
  if (!teacher) return { teacher: null, classes: [] };
  const classes = await Classes.find({ teacherIds: teacher._id })
    .select('className')
    .lean();
  return { teacher, classes };
}

// Teacher: get my assigned classes
exports.getMyClasses = async (req, res) => {
  try {
    const { classes } = await getTeacherAndClasses(req.user._id);
    return res.json({ status: 'success', data: { classes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// Teacher: list my purchase requests
exports.listMyRequests = async (req, res) => {
  try {
    const requests = await PurchaseRequest.find({ createdBy: req.user._id })
      .populate('classId', 'className')
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 });
    return res.json({ status: 'success', data: { requests } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// Teacher: create purchase request
exports.createRequest = async (req, res) => {
  try {
    const { assetName, quantity, unit, classId, estimatedCost, reason, notes, images, status } = req.body;
    if (!assetName || !classId) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng điền tên tài sản và chọn lớp.' });
    }
    const { teacher, classes } = await getTeacherAndClasses(req.user._id);
    if (!teacher) {
      return res.status(403).json({ status: 'error', message: 'Bạn không có hồ sơ giáo viên.' });
    }
    const isAssigned = classes.some(c => c._id.toString() === classId);
    if (!isAssigned) {
      return res.status(403).json({ status: 'error', message: 'Bạn không được phân công dạy lớp này.' });
    }
    const request = await PurchaseRequest.create({
      assetName,
      quantity: quantity || 1,
      unit: unit || 'Cái',
      classId,
      estimatedCost: estimatedCost || 0,
      reason: reason || '',
      notes: notes || '',
      images: Array.isArray(images) ? images : [],
      status: status === 'pending' ? 'pending' : 'draft',
      createdBy: req.user._id,
    });
    await request.populate('classId', 'className');
    await request.populate('createdBy', 'fullName username');
    return res.status(201).json({ status: 'success', data: { request } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// Teacher: get request detail
exports.getRequest = async (req, res) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id)
      .populate('classId', 'className')
      .populate('createdBy', 'fullName username')
      .populate('reviewedBy', 'fullName username');
    if (!request) return res.status(404).json({ status: 'error', message: 'Không tìm thấy yêu cầu.' });
    if (request.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Không có quyền xem yêu cầu này.' });
    }
    return res.json({ status: 'success', data: { request } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// Teacher: update request (only draft or rejected)
exports.updateRequest = async (req, res) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ status: 'error', message: 'Không tìm thấy yêu cầu.' });
    if (request.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Không có quyền chỉnh sửa yêu cầu này.' });
    }
    if (!['draft', 'rejected'].includes(request.status)) {
      return res.status(400).json({ status: 'error', message: 'Chỉ có thể chỉnh sửa yêu cầu ở trạng thái nháp hoặc bị từ chối.' });
    }
    const { assetName, quantity, unit, classId, estimatedCost, reason, notes, images, status } = req.body;
    if (classId && classId !== request.classId.toString()) {
      const { teacher, classes } = await getTeacherAndClasses(req.user._id);
      if (!teacher) return res.status(403).json({ status: 'error', message: 'Bạn không có hồ sơ giáo viên.' });
      const isAssigned = classes.some(c => c._id.toString() === classId);
      if (!isAssigned) return res.status(403).json({ status: 'error', message: 'Bạn không được phân công dạy lớp này.' });
    }
    Object.assign(request, {
      assetName: assetName ?? request.assetName,
      quantity: quantity ?? request.quantity,
      unit: unit ?? request.unit,
      classId: classId ?? request.classId,
      estimatedCost: estimatedCost ?? request.estimatedCost,
      reason: reason ?? request.reason,
      notes: notes ?? request.notes,
      images: Array.isArray(images) ? images : request.images,
      status: status === 'pending' ? 'pending' : (status === 'draft' ? 'draft' : request.status),
    });
    await request.save();
    await request.populate('classId', 'className');
    await request.populate('createdBy', 'fullName username');
    return res.json({ status: 'success', data: { request } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// Teacher: delete request (only draft)
exports.deleteRequest = async (req, res) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ status: 'error', message: 'Không tìm thấy yêu cầu.' });
    if (request.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Không có quyền xóa yêu cầu này.' });
    }
    if (request.status !== 'draft') {
      return res.status(400).json({ status: 'error', message: 'Chỉ có thể xóa yêu cầu ở trạng thái nháp.' });
    }
    await PurchaseRequest.findByIdAndDelete(req.params.id);
    return res.json({ status: 'success', message: 'Xóa yêu cầu thành công.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// SchoolAdmin: list all requests
exports.listAllRequests = async (req, res) => {
  try {
    const requests = await PurchaseRequest.find()
      .populate({ path: 'classId', select: 'className gradeId', populate: { path: 'gradeId', select: 'gradeName' } })
      .populate('createdBy', 'fullName username')
      .populate('reviewedBy', 'fullName username')
      .sort({ createdAt: -1 });
    return res.json({ status: 'success', data: { requests } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// SchoolAdmin: approve request
exports.approveRequest = async (req, res) => {
  try {
    const request = await PurchaseRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', reviewedBy: req.user._id, reviewNote: req.body.reviewNote || '' },
      { new: true }
    ).populate('classId', 'className').populate('createdBy', 'fullName username');
    if (!request) return res.status(404).json({ status: 'error', message: 'Không tìm thấy yêu cầu.' });
    return res.json({ status: 'success', data: { request } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// SchoolAdmin: reject request
exports.rejectRequest = async (req, res) => {
  try {
    const request = await PurchaseRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', reviewedBy: req.user._id, reviewNote: req.body.reviewNote || '' },
      { new: true }
    ).populate('classId', 'className').populate('createdBy', 'fullName username');
    if (!request) return res.status(404).json({ status: 'error', message: 'Không tìm thấy yêu cầu.' });
    return res.json({ status: 'success', data: { request } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
