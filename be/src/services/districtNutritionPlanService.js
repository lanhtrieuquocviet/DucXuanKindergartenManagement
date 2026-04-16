const path = require("path");
const fs = require("fs").promises;
const DistrictNutritionPlan = require("../models/DistrictNutritionPlan");
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
  const today = todayVN();
  await DistrictNutritionPlan.updateMany(
    {
      status: "active",
      endDate: { $ne: null, $lt: today },
    },
    { $set: { status: "archived", archivedAt: new Date() } }
  );
};

exports.listDistrictNutritionPlans = async (req, res) => {
  try {
    await exports.autoArchiveExpiredDistrictPlans();
    const active = await DistrictNutritionPlan.find({ status: "active" })
      .sort({ startDate: -1 })
      .populate("createdBy", "fullName username")
      .lean();
    const history = await DistrictNutritionPlan.find({ status: "archived" })
      .sort({ archivedAt: -1, updatedAt: -1, endDate: -1, _id: -1 })
      .populate("createdBy", "fullName username")
      .lean();
    return res.json({
      success: true,
      data: { active, history },
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

    const existing = await DistrictNutritionPlan.findOne({ status: "active" });
    if (existing) {
      const today = todayVN();
      const prevStart = String(existing.startDate || "").trim();
      if (!DATE_RE.test(prevStart) || today <= prevStart) {
        return res.status(400).json({
          success: false,
          message:
            "Chưa thể tạo kế hoạch mới thay thế: ngày bắt đầu phiên bản hiện tại là hôm nay hoặc tương lai. Hãy dùng Cập nhật trên kế hoạch đang áp dụng hoặc thử lại vào ngày làm việc tiếp theo.",
        });
      }
      existing.status = "archived";
      existing.endDate = today;
      existing.archivedAt = new Date();
      await existing.save();
    }

    const startDate = String(req.body?.startDate || "").trim();
    if (!DATE_RE.test(startDate)) {
      return res.status(400).json({
        success: false,
        message: "Ngày bắt đầu áp dụng phải có định dạng YYYY-MM-DD",
      });
    }
    const endDateRaw = String(req.body?.endDate || "").trim();
    const endDate = endDateRaw || null;
    if (!endDate || !DATE_RE.test(endDate) || endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Ngày kết thúc áp dụng phải đúng định dạng YYYY-MM-DD và lớn hơn ngày bắt đầu",
      });
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

    let regulationFile = null;
    if (req.file) {
      await ensureUploadDir();
      regulationFile = {
        originalName: normalizeUploadedFileName(req.file.originalname),
        storedName: req.file.filename,
      };
    }

    const plan = await DistrictNutritionPlan.create({
      items,
      startDate,
      endDate,
      regulationFile,
      status: "active",
      createdBy: req.user?._id || null,
    });

    const populated = await DistrictNutritionPlan.findById(plan._id)
      .populate("createdBy", "fullName username")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Đã tạo kế hoạch dinh dưỡng theo sở",
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

    const scheduledEnd =
      req.body?.endDate != null
        ? String(req.body.endDate).trim()
        : String(plan.endDate || "").trim();
    if (
      !scheduledEnd ||
      !DATE_RE.test(scheduledEnd) ||
      scheduledEnd <= startDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Kế hoạch đang áp dụng không có ngày kết thúc hợp lệ. Vui lòng tạo kế hoạch mới (có khoảng ngày bắt đầu – kết thúc) để thay thế.",
      });
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

    const supersedeDay = todayVN();
    const prevStart = String(plan.startDate || "").trim();
    if (!DATE_RE.test(prevStart)) {
      return res.status(400).json({
        success: false,
        message: "Ngày bắt đầu của kế hoạch hiện tại không hợp lệ",
      });
    }

    // Nếu kế hoạch chưa bắt đầu (startDate hôm nay hoặc tương lai) thì cho sửa trực tiếp,
    // không tạo phiên bản lịch sử vì chưa có giai đoạn áp dụng thực tế.
    if (supersedeDay <= prevStart) {
      const oldName = plan.regulationFile?.storedName;
      plan.startDate = startDate;
      plan.endDate = scheduledEnd;
      plan.items = items;
      plan.regulationFile = regulationFile;
      await plan.save();
      if (req.file && oldName && oldName !== req.file.filename) {
        await safeUnlink(oldName);
      }

      const populated = await DistrictNutritionPlan.findById(plan._id)
        .populate("createdBy", "fullName username")
        .lean();
      return res.json({
        success: true,
        message: "Đã cập nhật kế hoạch",
        data: populated,
      });
    }

    plan.status = "archived";
    plan.endDate = supersedeDay;
    plan.archivedAt = new Date();
    await plan.save();

    const created = await DistrictNutritionPlan.create({
      items,
      startDate,
      endDate: scheduledEnd,
      regulationFile,
      status: "active",
      createdBy: req.user?._id || null,
    });

    const populated = await DistrictNutritionPlan.findById(created._id)
      .populate("createdBy", "fullName username")
      .lean();

    return res.json({
      success: true,
      message: "Đã cập nhật kế hoạch; phiên bản trước đó đã được lưu vào lịch sử",
      data: populated,
    });
  } catch (error) {
    if (req.file?.filename) {
      await safeUnlink(req.file.filename);
    }
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
