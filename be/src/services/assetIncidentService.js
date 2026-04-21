const AssetIncident   = require('../models/AssetIncident');
const AssetAllocation = require('../models/AssetAllocation');
const Teacher         = require('../models/Teacher');
const Classes         = require('../models/Classes');
const Asset           = require('../models/Asset');

// ─── Helper: get teacher's assigned class IDs ─────────────────────────────
async function getTeacherClassIds(userId) {
  const teacher = await Teacher.findOne({ userId }).lean();
  if (!teacher) return [];
  const classes = await Classes.find({ teacherIds: teacher._id }).select('_id').lean();
  return classes.map((c) => c._id);
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .filter((url) => typeof url === 'string')
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function validateType(type) {
  return ['broken', 'lost'].includes(type);
}

async function resolveTeacherAllocation({ userId, classId, allocationId }) {
  const classIds = await getTeacherClassIds(userId);
  const isAssigned = classIds.some((id) => String(id) === String(classId));
  if (!isAssigned) return { error: 'Bạn chỉ có thể báo cáo sự cố cho lớp được phân công.', status: 403 };

  const allocation = await AssetAllocation.findOne({
    _id: allocationId,
    classId,
    status: { $in: ['active', 'pending_confirmation'] },
  }).lean();
  if (!allocation) {
    return { error: 'Không tìm thấy biên bản bàn giao tài sản hợp lệ cho lớp này.', status: 400 };
  }

  return { allocation };
}

function resolveAssetFromAllocation(allocation, assetName, assetCode = '') {
  const allAssets = [...(allocation.assets || []), ...(allocation.extraAssets || [])];
  const normalizedName = String(assetName || '').trim();
  const normalizedCode = String(assetCode || '').trim();

  const byNameAndCode = allAssets.find(
    (asset) => String(asset?.name || '').trim() === normalizedName
      && String(asset?.assetCode || '').trim() === normalizedCode
  );
  if (byNameAndCode) return byNameAndCode;

  return allAssets.find((asset) => String(asset?.name || '').trim() === normalizedName) || null;
}

async function syncBrokenQuantityForIncidentAsset(incident) {
  if (!incident) return;
  const assetCode = String(incident.assetCode || '').trim();
  const assetName = String(incident.assetName || '').trim();
  if (!assetCode && !assetName) return;

  const incidentFilter = assetCode
    ? { assetCode }
    : { assetName };

  const processingCount = await AssetIncident.countDocuments({
    ...incidentFilter,
    status: 'processing',
  });

  const assetFilter = assetCode
    ? { type: 'asset', assetCode }
    : { type: 'asset', name: assetName };
  const assets = await Asset.find(assetFilter);
  if (!assets.length) return;

  await Promise.all(assets.map(async (asset) => {
    asset.brokenQuantity = Math.min(Number(asset.quantity) || 0, processingCount);
    await asset.save();
  }));
}

// ─── Teacher: get active allocation for my classes ────────────────────────
exports.getMyAllocation = async (req, res) => {
  try {
    const classIds = await getTeacherClassIds(req.user._id);
    if (!classIds.length)
      return res.json({ status: 'success', data: { allocation: null } });

    const allocation = await AssetAllocation.findOne({
      classId: { $in: classIds },
      status: { $in: ['active', 'pending_confirmation'] },
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
    if (!classId || !allocationId || !assetName || !type || !description?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập đầy đủ thông tin bắt buộc.' });
    }
    if (!validateType(type)) {
      return res.status(400).json({ status: 'error', message: 'Loại sự cố không hợp lệ.' });
    }
    if (String(description).trim().length < 10) {
      return res.status(400).json({ status: 'error', message: 'Mô tả sự cố cần ít nhất 10 ký tự.' });
    }

    const { allocation, error, status } = await resolveTeacherAllocation({
      userId: req.user._id,
      classId,
      allocationId,
    });
    if (error) {
      return res.status(status).json({ status: 'error', message: error });
    }

    const selectedAsset = resolveAssetFromAllocation(allocation, assetName, assetCode);
    if (!selectedAsset) {
      return res.status(400).json({ status: 'error', message: 'Tài sản báo cáo không thuộc danh sách bàn giao của lớp.' });
    }

    const incident = await AssetIncident.create({
      classId:      classId      || undefined,
      className:    className    || '',
      allocationId: allocationId || undefined,
      assetName:    selectedAsset.name,
      assetCode:    selectedAsset.assetCode || '',
      type,
      description:  String(description || '').trim(),
      images:       normalizeImages(images),
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

// ─── Teacher: update incident ─────────────────────────────────────────────
exports.updateIncident = async (req, res) => {
  try {
    const incident = await AssetIncident.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!incident) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy sự cố.' });
    }
    if (incident.status === 'fixed') {
      return res.status(400).json({ status: 'error', message: 'Sự cố đã khắc phục không thể chỉnh sửa.' });
    }

    const { classId, className, allocationId, assetName, assetCode, type, description, images } = req.body;
    if (!classId || !allocationId || !assetName || !type || !description?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập đầy đủ thông tin bắt buộc.' });
    }
    if (!validateType(type)) {
      return res.status(400).json({ status: 'error', message: 'Loại sự cố không hợp lệ.' });
    }
    if (String(description).trim().length < 10) {
      return res.status(400).json({ status: 'error', message: 'Mô tả sự cố cần ít nhất 10 ký tự.' });
    }

    const { allocation, error, status } = await resolveTeacherAllocation({
      userId: req.user._id,
      classId,
      allocationId,
    });
    if (error) {
      return res.status(status).json({ status: 'error', message: error });
    }

    const selectedAsset = resolveAssetFromAllocation(allocation, assetName, assetCode);
    if (!selectedAsset) {
      return res.status(400).json({ status: 'error', message: 'Tài sản báo cáo không thuộc danh sách bàn giao của lớp.' });
    }

    incident.classId = classId;
    incident.className = className || allocation.className || '';
    incident.allocationId = allocationId;
    incident.assetName = selectedAsset.name;
    incident.assetCode = selectedAsset.assetCode || '';
    incident.type = type;
    incident.description = String(description || '').trim();
    incident.images = normalizeImages(images);
    await incident.save();

    return res.json({ status: 'success', data: { incident } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Teacher: delete incident ─────────────────────────────────────────────
exports.deleteIncident = async (req, res) => {
  try {
    const incident = await AssetIncident.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!incident) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy sự cố.' });
    }
    if (incident.status !== 'pending') {
      return res.status(400).json({ status: 'error', message: 'Chỉ có thể xóa sự cố đang chờ tiếp nhận.' });
    }

    await incident.deleteOne();
    return res.json({ status: 'success', message: 'Xóa báo cáo sự cố thành công.' });
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
    await syncBrokenQuantityForIncidentAsset(incident);
    return res.json({ status: 'success', data: { incident } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
