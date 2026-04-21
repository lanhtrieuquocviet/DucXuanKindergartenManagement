const path = require("path");
const fs = require("fs").promises;
const DistrictNutritionPlan = require("../models/DistrictNutritionPlan");
const AcademicYear = require("../models/AcademicYear");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "nutrition-plans");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeUploadedFileName(name) {
  const raw = String(name || "").trim();
  if (!raw) return "file.docx";
  // Multer/busboy sometimes delivers UTF-8 filename as latin1 bytes.
  // Recover readable Vietnamese names for UI/download display.
  try {
    return Buffer.from(raw, "latin1").toString("utf8");
  } catch {
    return raw;
  }
}

function todayVN() {
  return dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
}

function nowVN() {
  return dayjs().tz("Asia/Ho_Chi_Minh");
}

function toVNDateStart(startDate) {
  return dayjs.tz(`${startDate} 00:30`, "YYYY-MM-DD HH:mm", "Asia/Ho_Chi_Minh");
}

function parseItemsFromBody(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  return items
    .map((item) => {
      const name = String(item?.name || "").trim();
      const min = Number(item?.min);
      const max = Number(item?.max);
      if (!name || Number.isNaN(min) || Number.isNaN(max)) return null;
      return {
        name,
        min,
        max,
        actual: 0,
      };
    })
    .filter(Boolean);
}

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

async function safeUnlink(storedName) {
  if (!storedName || /[\\/]/.test(storedName)) return;
  const full = path.join(UPLOAD_DIR, storedName);
  try {
    await fs.unlink(full);
  } catch {
    /* ignore */
  }
}

exports.autoArchiveExpiredDistrictPlans = async () => {
  const now = nowVN();
  const today = now.format("YYYY-MM-DD");
  let active = await DistrictNutritionPlan.findOne({ status: "active" }).sort({ startAt: -1, _id: -1 });
  const duePlans = await DistrictNutritionPlan.find({
    status: "scheduled",
    startAt: { $ne: null, $lte: now.toDate() },
  }).sort({ startAt: 1, _id: 1 });

  for (const nextPlan of duePlans) {
    if (active && String(active._id) !== String(nextPlan._id)) {
      active.status = "archived";
      active.endDate = today;
      active.archivedAt = now.toDate();
      await active.save();
    }
    nextPlan.status = "active";
    await nextPlan.save();
    active = nextPlan;
  }
};

exports.listDistrictNutritionPlans = async (req, res) => {
  try {
    await exports.autoArchiveExpiredDistrictPlans();
    const filter = {};
    if (req.query.academicYearId) {
      filter.academicYearId = req.query.academicYearId;
    }

    const active = await DistrictNutritionPlan.find({ ...filter, status: "active" })
      .sort({ startDate: -1 })
      .populate("createdBy", "fullName username")
      .lean();
    const upcoming = await DistrictNutritionPlan.find({ ...filter, status: "scheduled" })
      .sort({ startAt: 1, _id: 1 })
      .populate("createdBy", "fullName username")
      .lean();
    const history = await DistrictNutritionPlan.find({ ...filter, status: "archived" })
      .sort({ archivedAt: -1, updatedAt: -1, endDate: -1, _id: -1 })
      .populate("createdBy", "fullName username")
      .lean();
    return res.json({
      success: true,
      data: { active, upcoming, history },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDistrictNutritionPlanDetail = async (req, res) => {
  try {
    await exports.autoArchiveExpiredDistrictPlans();
    const plan = await DistrictNutritionPlan.findById(req.params.id)
      .populate("createdBy", "fullName username")
      .lean();
    if (!plan) {
      return res.status(404).json({ success: false, message: "Không tìm thấy kế hoạch" });
    }
    return res.json({ success: true, data: plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDistrictNutritionPlan = async (req, res) => {
  try {
    await exports.autoArchiveExpiredDistrictPlans();

    const startDate = String(req.body?.startDate || "").trim();
    if (!DATE_RE.test(startDate)) {
      return res.status(400).json({
        success: false,
        message: "Ngày bắt đầu áp dụng phải có định dạng YYYY-MM-DD",
      });
    }
    const startAt = toVNDateStart(startDate);
    if (!startAt.isValid()) {
      return res.status(400).json({ success: false, message: "Thời điểm áp dụng không hợp lệ" });
    }
    const duplicateDate = await DistrictNutritionPlan.findOne({
      status: { $in: ["active", "scheduled"] },
      startDate,
    }).lean();
    if (duplicateDate) {
      return res.status(400).json({ success: false, message: "Ngày này đã tồn tại" });
    }

    const items = normalizeItems(parseItemsFromBody(req.body?.items));
    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: "Danh sách chỉ tiêu dinh dưỡng không hợp lệ",
      });
    }

    for (const item of items) {
      if (item.min < 0 || item.max < 0 || item.max <= item.min) {
        return res.status(400).json({
          success: false,
          message: `Chỉ tiêu "${item.name}" có min/max không hợp lệ`,
        });
      }
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng tải lên tệp Word quy định sở",
      });
    }

    await ensureUploadDir();
    const regulationFile = {
      originalName: normalizeUploadedFileName(req.file.originalname),
      storedName: req.file.filename,
    };

    const now = nowVN();
    const existing = await DistrictNutritionPlan.findOne({ status: "active" }).sort({ startAt: -1, _id: -1 });
    if (existing && !startAt.isAfter(now)) {
      return res.status(400).json({
        success: false,
        message: "Kế hoạch sắp tới phải có thời điểm bắt đầu trong tương lai",
      });
    }
    const nextStatus = existing
      ? "scheduled"
      : (startAt.isAfter(now) ? "scheduled" : "active");

    const academicYear = await AcademicYear.findOne({
      startDate: { $lte: startAt.toDate() },
      endDate: { $gte: startAt.toDate() }
    }).lean();

    const plan = await DistrictNutritionPlan.create({
      items,
      startDate,
      startTime: "00:30",
      startAt: startAt.toDate(),
      endDate: null,
      regulationFile,
      status: nextStatus,
      createdBy: req.user?._id || null,
      academicYearId: academicYear?._id || null,
    });

    const populated = await DistrictNutritionPlan.findById(plan._id)
      .populate("createdBy", "fullName username")
      .lean();

    return res.status(201).json({
      success: true,
      message: nextStatus === "scheduled" ? "Đã tạo kế hoạch sắp tới" : "Đã tạo kế hoạch dinh dưỡng theo sở",
      data: populated,
    });
  } catch (error) {
    if (req.file?.filename) {
      await safeUnlink(req.file.filename);
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDistrictNutritionPlan = async (req, res) => {
  try {
    await exports.autoArchiveExpiredDistrictPlans();

    const plan = await DistrictNutritionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Không tìm thấy kế hoạch" });
    }
    if (plan.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể chỉnh sửa kế hoạch đang áp dụng",
      });
    }

    const startDate =
      req.body?.startDate != null
        ? String(req.body.startDate).trim()
        : plan.startDate;

    if (!DATE_RE.test(startDate)) {
      return res.status(400).json({
        success: false,
        message: "Ngày bắt đầu áp dụng phải có định dạng YYYY-MM-DD",
      });
    }

    let items =
      req.body?.items != null
        ? null
        : (plan.items || []).map((it) => ({
            name: it.name,
            min: it.min,
            max: it.max,
            actual: it.actual ?? 0,
          }));
    if (req.body?.items != null) {
      const next = normalizeItems(parseItemsFromBody(req.body.items));
      if (!next.length) {
        return res.status(400).json({
          success: false,
          message: "Danh sách chỉ tiêu dinh dưỡng không hợp lệ",
        });
      }
      for (const item of next) {
        if (item.min < 0 || item.max < 0 || item.max <= item.min) {
          return res.status(400).json({
            success: false,
            message: `Chỉ tiêu "${item.name}" có min/max không hợp lệ`,
          });
        }
      }
      items = next;
    }

    let regulationFile = plan.regulationFile?.storedName
      ? {
          originalName: plan.regulationFile.originalName || "",
          storedName: plan.regulationFile.storedName,
        }
      : null;
    if (req.file) {
      await ensureUploadDir();
      regulationFile = {
        originalName: normalizeUploadedFileName(req.file.originalname),
        storedName: req.file.filename,
      };
    }

    const now = nowVN();
    plan.status = "archived";
    plan.endDate = now.format("YYYY-MM-DD");
    plan.archivedAt = now.toDate();
    await plan.save();

    const academicYear = await AcademicYear.findOne({
      startDate: { $lte: now.toDate() },
      endDate: { $gte: now.toDate() }
    }).lean();

    const created = await DistrictNutritionPlan.create({
      items,
      startDate,
      startTime: plan.startTime || "00:30",
      startAt: now.toDate(),
      endDate: null,
      regulationFile,
      status: "active",
      createdBy: req.user?._id || null,
      academicYearId: academicYear?._id || null,
    });

    const populated = await DistrictNutritionPlan.findById(created._id)
      .populate("createdBy", "fullName username")
      .lean();

    return res.json({
      success: true,
      message: "Đã cập nhật kế hoạch; phiên bản trước đã được lưu vào lịch sử",
      data: populated,
    });
  } catch (error) {
    if (req.file?.filename) {
      await safeUnlink(req.file.filename);
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.applyScheduledDistrictPlanNow = async (req, res) => {
  try {
    await exports.autoArchiveExpiredDistrictPlans();
    const scheduled = await DistrictNutritionPlan.findById(req.params.id);
    if (!scheduled) return res.status(404).json({ success: false, message: "Không tìm thấy kế hoạch" });
    if (scheduled.status !== "scheduled") {
      return res.status(400).json({ success: false, message: "Chỉ áp dụng ngay cho kế hoạch sắp tới" });
    }

    const now = nowVN();
    const active = await DistrictNutritionPlan.findOne({ status: "active" }).sort({ startAt: -1, _id: -1 });
    if (active && String(active._id) !== String(scheduled._id)) {
      active.status = "archived";
      active.endDate = now.format("YYYY-MM-DD");
      active.archivedAt = now.toDate();
      await active.save();
    }

    scheduled.status = "active";
    scheduled.startDate = now.format("YYYY-MM-DD");
    scheduled.startTime = now.format("HH:mm");
    scheduled.startAt = now.toDate();
    await scheduled.save();

    const populated = await DistrictNutritionPlan.findById(scheduled._id)
      .populate("createdBy", "fullName username")
      .lean();
    return res.json({ success: true, message: "Đã áp dụng kế hoạch ngay lập tức", data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateScheduledDistrictPlan = async (req, res) => {
  try {
    await exports.autoArchiveExpiredDistrictPlans();
    const plan = await DistrictNutritionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Không tìm thấy kế hoạch" });
    if (plan.status !== "scheduled") {
      return res.status(400).json({ success: false, message: "Chỉ có thể chỉnh sửa kế hoạch sắp tới" });
    }

    const startDate = req.body?.startDate != null ? String(req.body.startDate).trim() : plan.startDate;
    if (!DATE_RE.test(startDate)) {
      return res.status(400).json({ success: false, message: "Ngày bắt đầu áp dụng phải có định dạng YYYY-MM-DD" });
    }
    const startAt = toVNDateStart(startDate);
    if (!startAt.isValid()) return res.status(400).json({ success: false, message: "Thời điểm áp dụng không hợp lệ" });
    if (!startAt.isAfter(nowVN())) {
      return res.status(400).json({ success: false, message: "Kế hoạch sắp tới phải có thời điểm bắt đầu trong tương lai" });
    }
    const duplicateDate = await DistrictNutritionPlan.findOne({
      _id: { $ne: plan._id },
      status: { $in: ["active", "scheduled"] },
      startDate,
    }).lean();
    if (duplicateDate) {
      return res.status(400).json({ success: false, message: "Ngày này đã tồn tại" });
    }

    let items = plan.items;
    if (req.body?.items != null) {
      const next = normalizeItems(parseItemsFromBody(req.body.items));
      if (!next.length) {
        return res.status(400).json({ success: false, message: "Danh sách chỉ tiêu dinh dưỡng không hợp lệ" });
      }
      for (const item of next) {
        if (item.min < 0 || item.max < 0 || item.max <= item.min) {
          return res.status(400).json({ success: false, message: `Chỉ tiêu "${item.name}" có min/max không hợp lệ` });
        }
      }
      items = next;
    }

    const oldName = plan.regulationFile?.storedName;
    const academicYear = await AcademicYear.findOne({
      startDate: { $lte: startAt.toDate() },
      endDate: { $gte: startAt.toDate() }
    }).lean();

    plan.startDate = startDate;
    plan.startTime = "00:30";
    plan.startAt = startAt.toDate();
    plan.items = items;
    plan.academicYearId = academicYear?._id || null;
    if (req.file) {
      await ensureUploadDir();
      plan.regulationFile = {
        originalName: normalizeUploadedFileName(req.file.originalname),
        storedName: req.file.filename,
      };
    }
    await plan.save();
    if (req.file && oldName && oldName !== req.file.filename) await safeUnlink(oldName);

    const populated = await DistrictNutritionPlan.findById(plan._id)
      .populate("createdBy", "fullName username")
      .lean();
    return res.json({ success: true, message: "Đã cập nhật kế hoạch sắp tới", data: populated });
  } catch (error) {
    if (req.file?.filename) await safeUnlink(req.file.filename);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteScheduledDistrictPlan = async (req, res) => {
  try {
    await exports.autoArchiveExpiredDistrictPlans();
    const plan = await DistrictNutritionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Không tìm thấy kế hoạch" });
    if (plan.status !== "scheduled") {
      return res.status(400).json({ success: false, message: "Chỉ có thể xóa kế hoạch sắp tới" });
    }
    const oldName = plan.regulationFile?.storedName;
    await DistrictNutritionPlan.deleteOne({ _id: plan._id });
    if (oldName) await safeUnlink(oldName);
    return res.json({ success: true, message: "Đã xóa kế hoạch sắp tới" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.endDistrictNutritionPlan = async (req, res) => {
  try {
    const plan = await DistrictNutritionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Không tìm thấy kế hoạch" });
    }
    if (plan.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Kế hoạch này đã được lưu vào lịch sử",
      });
    }

    const endStr = todayVN();
    const startStr = String(plan.startDate || "").trim();
    if (!DATE_RE.test(startStr) || endStr <= startStr) {
      return res.status(400).json({
        success: false,
        message: "Kết thúc kế hoạch không hợp lệ",
      });
    }

    plan.status = "archived";
    plan.endDate = endStr;
    plan.archivedAt = new Date();
    await plan.save();

    const populated = await DistrictNutritionPlan.findById(plan._id)
      .populate("createdBy", "fullName username")
      .lean();

    return res.json({
      success: true,
      message: "Đã kết thúc kế hoạch và lưu vào lịch sử",
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadRegulationFile = async (req, res) => {
  try {
    const plan = await DistrictNutritionPlan.findById(req.params.id).lean();
    if (!plan?.regulationFile?.storedName) {
      return res.status(404).json({ success: false, message: "Không có file đính kèm" });
    }

    const stored = plan.regulationFile.storedName;
    if (/[\\/]/.test(stored)) {
      return res.status(400).json({ success: false, message: "Tên file không hợp lệ" });
    }

    const fullPath = path.join(UPLOAD_DIR, stored);
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({ success: false, message: "File không còn trên máy chủ" });
    }

    const original = plan.regulationFile.originalName || "ke-hoach.docx";
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(original)}`
    );
    return res.sendFile(fullPath);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
