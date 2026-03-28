const AssetIncident   = require('../models/AssetIncident');
const AssetAllocation = require('../models/AssetAllocation');
const Teacher         = require('../models/Teacher');
const Classes         = require('../models/Classes');

// ─── Helper: get teacher's assigned class IDs ─────────────────────────────
async function getTeacherClassIds(userId) {
  const teacher = await Teacher.findOne({ userId }).lean();
  if (!teacher) return [];
  const classes = await Classes.find({ teacherIds: teacher._id }).select('_id').lean();
  return classes.map((c) => c._id);
}

// ─── Teacher: get active allocation for my classes ────────────────────────
exports.getMyAllocation = async (req, res) => {
  try {
    const classIds = await getTeacherClassIds(req.user._id);
    if (!classIds.length)
      return res.json({ status: 'success', data: { allocation: null } });

    const allocation = await AssetAllocation.findOne({
      classId: { $in: classIds },
      status: 'active',
    })
      .populate('classId', 'className')
      .lean();

    return res.json({ status: 'success', data: { allocation } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Teacher: list my incidents ───────────────────────────────────────────
exports.listMyIncidents = async (req, res) => {
  try {
    const incidents = await AssetIncident.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ status: 'success', data: { incidents } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Teacher: create incident ─────────────────────────────────────────────
exports.createIncident = async (req, res) => {
  try {
    const { classId, className, allocationId, assetName, assetCode, type, description, images } = req.body;

    if (!assetName || !type) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn tài sản và loại sự cố.' });
    }

    const incident = await AssetIncident.create({
      classId:      classId      || undefined,
      className:    className    || '',
      allocationId: allocationId || undefined,
      assetName,
      assetCode:    assetCode    || '',
      type,
      description:  description  || '',
      images:       Array.isArray(images) ? images : [],
      status:       'pending',
      createdBy:    req.user._id,
    });

    return res.status(201).json({ status: 'success', data: { incident } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Teacher: get one incident ────────────────────────────────────────────
exports.getIncident = async (req, res) => {
  try {
    const incident = await AssetIncident.findOne({ _id: req.params.id, createdBy: req.user._id }).lean();
    if (!incident)
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy sự cố.' });
    return res.json({ status: 'success', data: { incident } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── SchoolAdmin: list all incidents ─────────────────────────────────────
exports.listAllIncidents = async (req, res) => {
  try {
    const { status, classId } = req.query;
    const filter = {};
    if (status)  filter.status  = status;
    if (classId) filter.classId = classId;

    const incidents = await AssetIncident.find(filter)
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ status: 'success', data: { incidents } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── SchoolAdmin: update incident status ─────────────────────────────────
exports.updateIncidentStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const allowed = ['pending', 'processing', 'fixed'];
    if (!allowed.includes(status))
      return res.status(400).json({ status: 'error', message: 'Trạng thái không hợp lệ.' });

    const incident = await AssetIncident.findById(req.params.id);
    if (!incident)
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy sự cố.' });

    incident.status = status;
    if (adminNotes !== undefined) incident.adminNotes = adminNotes;
    if (status === 'fixed' && !incident.resolvedAt) incident.resolvedAt = new Date();

    await incident.save();
    return res.json({ status: 'success', data: { incident } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
