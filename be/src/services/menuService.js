const Menu = require("../models/Menu");
const NutritionPlanSetting = require("../models/NutritionPlanSetting");
const DistrictNutritionPlan = require("../models/DistrictNutritionPlan");
const districtNutritionPlanService = require("./districtNutritionPlanService");

const mongoose = require("mongoose");
const DailyMenu = require("../models/DailyMenu");
const AcademicYear = require("../models/AcademicYear");

const REJECT_PRESET_LABELS = {
  nutrition: "Chưa cân đối dinh dưỡng / chưa đạt chuẩn",
  regulation: "Chưa đạt tiêu chí theo quy định sở",
  duplicate: "Trùng lặp món ăn giữa các ngày",
  variety: "Thiếu đa dạng món",
  portion: "Khẩu phần / định lượng chưa phù hợp",
  other: "Khác",
};

function buildRejectReasonText(presets, detail) {
  const lines = [];
  (presets || []).forEach((key) => {
    const label = REJECT_PRESET_LABELS[key];
    if (label) lines.push(`• ${label}`);
  });
  const d = String(detail || "").trim();
  if (d) lines.push(`Chi tiết: ${d}`);
  return lines.join("\n");
}

function pushMenuHistory(menu, entry) {
  if (!Array.isArray(menu.statusHistory)) menu.statusHistory = [];
  menu.statusHistory.push({
    type: entry.type,
    at: entry.at || new Date(),
    actorId: entry.actorId || null,
    presets: entry.presets || [],
    detail: entry.detail != null ? String(entry.detail) : "",
  });
}

const DEFAULT_NUTRITION_PLAN = [
  { name: "Calo trung bình/ngày", min: 615, max: 726, actual: 0 },
  { name: "Đạm (g)", min: 13, max: 20, actual: 0 },
  { name: "Béo (g)", min: 25, max: 35, actual: 0 },
  { name: "Tinh bột (g)", min: 52, max: 60, actual: 0 },
];

const normalizeNutritionPlan = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return DEFAULT_NUTRITION_PLAN;
  }

  return items
    .map((item) => {
      const name = String(item?.name || "").trim();
      const min = Number(item?.min);
      const max = Number(item?.max);
      const actual = Number(item?.actual || 0);
      if (!name || Number.isNaN(min) || Number.isNaN(max)) return null;
      return { name, min, max, actual: Number.isNaN(actual) ? 0 : actual };
    })
    .filter(Boolean);
};

// Tạo thực đơn

exports.createMenu = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month và year là bắt buộc",
      });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "month phải từ 1 đến 12",
      });
    }

    const now = new Date();
    const selectedPeriod = Number(year) * 12 + Number(month);
    const currentPeriod = now.getFullYear() * 12 + (now.getMonth() + 1);
    if (selectedPeriod < currentPeriod) {
      return res.status(400).json({
        success: false,
        message:
          "Chỉ được tạo thực đơn cho tháng hiện tại hoặc trong tương lai",
      });
    }

    const existed = await Menu.findOne({ month, year });

    if (existed) {
      return res.status(400).json({
        success: false,
        message: "Thực đơn tháng này đã tồn tại",
      });
    }

    const menuDate = new Date(year, month - 1, 15);
    const academicYear = await AcademicYear.findOne({
      startDate: { $lte: menuDate },
      endDate: { $gte: menuDate }
    }).lean();

    const menu = new Menu({
      month,
      year,
      createdBy: req.user?._id,
      academicYearId: academicYear?._id || null,
    });

    await menu.save();

    // tạo 10 daily menu
    const days = ["mon", "tue", "wed", "thu", "fri"];
    const weeks = ["odd", "even"];

    const dailyMenus = [];

    for (const week of weeks) {
      for (const day of days) {
        dailyMenus.push({
          menuId: menu._id,
          weekType: week,
          dayOfWeek: day,
        });
      }
    }

    await DailyMenu.insertMany(dailyMenus);

    res.status(201).json({
      success: true,
      message: "Tạo thực đơn thành công",
      data: menu,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Public: trả về thực đơn đã duyệt (không cần auth)
exports.getPublicMenus = async (req, res) => {
  try {
    const filter = { status: { $in: ["approved", "active", "completed"] } };
    if (req.query.month) filter.month = Number(req.query.month);
    if (req.query.year)  filter.year  = Number(req.query.year);

    const menus = await Menu.find(filter)
      .select("month year status createdAt")
      .sort({ year: -1, month: -1 });

    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách thực đơn theo role
exports.getMenus = async (req, res) => {
  try {
    const user = req.user;

    // Lấy role
    const roleName = user?.roles?.[0]?.roleName || user?.roles?.[0];

    let filter = {};

    // KitchenStaff: thấy tất cả
    if (roleName === "KitchenStaff") {
      filter = {};
    }

    // Ban giám hiệu: không thấy draft
    if (roleName === "SchoolAdmin") {
      filter = { status: { $ne: "draft" } };
    }

    // Học sinh: chỉ thực đơn đang áp dụng hoặc đã kết thúc (không hiện chỉ mới duyệt)
    if (roleName === "Student") {
      filter = { status: { $in: ["active", "completed"] } };
    }

    if (req.query.academicYearId) {
      filter.academicYearId = req.query.academicYearId;
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 20, 1);

    const total = await Menu.countDocuments(filter);
    const menus = await Menu.find(filter)
      .populate("createdBy", "fullName email")
      .populate("academicYearId", "yearName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: menus,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getMenus error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Public: chi tiết menu (không cần auth, chỉ menu đã duyệt)
exports.getPublicMenuDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const menu = await Menu.findOne({
      _id: id,
      status: { $in: ["approved", "active", "completed"] },
    });
    if (!menu) {
      return res.status(404).json({ message: "Không tìm thấy thực đơn" });
    }
    const dailyMenus = await DailyMenu.find({ menuId: menu._id })
      .populate("lunchFoods")
      .populate("afternoonFoods")
      .populate("lunchMealSlots.food")
      .populate("afternoonMealSlots.food");

    const result = { odd: {}, even: {} };
    dailyMenus.forEach((day) => {
      result[day.weekType][day.dayOfWeek] = day;
    });

    const menuData = menu.toObject();
    res.json({ success: true, data: { ...menuData, weeks: result } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Chi tiết menu

exports.getMenuDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "ID không hợp lệ",
      });
    }

    const menu = await Menu.findById(id).populate("createdBy", "fullName");

    if (!menu) {
      return res.status(404).json({
        message: "Menu không tồn tại",
      });
    }

    const roleName = req.user?.roles?.[0]?.roleName || req.user?.roles?.[0];
    if (roleName === "Student" && !["active", "completed"].includes(menu.status)) {
      return res.status(404).json({
        message: "Không tìm thấy thực đơn",
      });
    }

    const dailyMenus = await DailyMenu.find({ menuId: menu._id })
      .populate("lunchFoods")
      .populate("afternoonFoods")
      .populate("lunchMealSlots.food")
      .populate("afternoonMealSlots.food");

    const result = {
      odd: {},
      even: {},
    };

    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarb = 0;

    const validDays = dailyMenus.filter((day) => {
      const hasFood = (day.lunchFoods && day.lunchFoods.length > 0) || (day.afternoonFoods && day.afternoonFoods.length > 0);
      const hasNutrition = (day.totalCalories || 0) > 0 || (day.totalProtein || 0) > 0 || (day.totalFat || 0) > 0 || (day.totalCarb || 0) > 0;
      return Boolean(day && (hasFood || hasNutrition));
    });

    dailyMenus.forEach((day) => {
      result[day.weekType][day.dayOfWeek] = day;

      totalCalories += day.totalCalories || 0;
      totalProtein += day.totalProtein || 0;
      totalFat += day.totalFat || 0;
      totalCarb += day.totalCarb || 0;
    });

    const dayCount = validDays.length || 1;
    const avgCalories = Number((totalCalories / dayCount).toFixed(2));

    const kcalFromProtein = totalProtein * 4;
    const kcalFromFat = totalFat * 9;
    const kcalFromCarb = totalCarb * 4;
    const totalMacroKcal = kcalFromProtein + kcalFromFat + kcalFromCarb;

    const proteinPercent = totalMacroKcal > 0 ? Number(((kcalFromProtein / totalMacroKcal) * 100).toFixed(2)) : 0;
    const fatPercent = totalMacroKcal > 0 ? Number(((kcalFromFat / totalMacroKcal) * 100).toFixed(2)) : 0;
    const carbPercent = totalMacroKcal > 0 ? Number(((kcalFromCarb / totalMacroKcal) * 100).toFixed(2)) : 0;

    const menuData = menu.toObject();

    res.json({
      success: true,
      data: {
        ...menuData,
        nutritionPlan: Array.isArray(menuData.nutritionPlan) ? menuData.nutritionPlan : [],
        nutrition: {
          calories: totalCalories,
          protein: totalProtein,
          fat: totalFat,
          carb: totalCarb,
          avgCalories,
          proteinPercent,
          fatPercent,
          carbPercent,
        },
        weeks: result,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Cập nhật menu
exports.updateMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        message: "Menu không tồn tại",
      });
    }

    Object.assign(menu, req.body);

    await menu.save();

    res.json({
      success: true,
      message: "Cập nhật menu thành công",
      data: menu,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Gửi duyệt
exports.submitMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        message: "Menu không tồn tại",
      });
    }

    if (!["draft", "rejected"].includes(menu.status)) {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể gửi duyệt khi thực đơn ở trạng thái nháp hoặc bị từ chối",
      });
    }

    menu.status = "pending";
    menu.rejectReason = "";
    menu.rejectPresets = [];
    menu.rejectDetail = "";

    pushMenuHistory(menu, {
      type: "submitted",
      actorId: req.user?._id,
    });

    await menu.save();

    res.json({
      success: true,
      message: "Đã gửi thực đơn để duyệt",
      data: menu,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Duyệt thực đơn
exports.approveMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        message: "Menu không tồn tại",
      });
    }

    if (menu.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể duyệt thực đơn đang chờ duyệt",
      });
    }

    menu.status = "approved";

    pushMenuHistory(menu, {
      type: "approved",
      actorId: req.user?._id,
    });

    await menu.save();

    res.json({
      success: true,
      message: "Thực đơn đã được duyệt",
      data: menu,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Từ chối
exports.rejectMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        message: "Menu không tồn tại",
      });
    }

    if (menu.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể từ chối thực đơn đang chờ duyệt",
      });
    }

    const presets = Array.isArray(req.body.presets)
      ? [...new Set(req.body.presets.map((p) => String(p).trim()).filter(Boolean))]
      : [];
    const detail = String(req.body.detail || "").trim();

    if (presets.length === 0 && detail.length < 5) {
      return res.status(400).json({
        success: false,
        message:
          "Chọn ít nhất một lý do gợi ý hoặc nhập chi tiết từ chối (tối thiểu 5 ký tự)",
      });
    }

    menu.status = "rejected";
    menu.rejectPresets = presets;
    menu.rejectDetail = detail;
    menu.rejectReason = buildRejectReasonText(presets, detail);

    pushMenuHistory(menu, {
      type: "rejected_pending",
      actorId: req.user?._id,
      presets,
      detail,
    });

    await menu.save();

    res.json({
      success: true,
      message: "Thực đơn bị từ chối",
      data: menu,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Ban giám hiệu yêu cầu chỉnh sửa khi thực đơn đang áp dụng → trả về bếp (rejected), ghi lịch sử */
exports.requestEditFromActiveMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu không tồn tại",
      });
    }

    if (menu.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể yêu cầu chỉnh sửa khi thực đơn đang áp dụng",
      });
    }

    const presets = Array.isArray(req.body.presets)
      ? [...new Set(req.body.presets.map((p) => String(p).trim()).filter(Boolean))]
      : [];
    const detail = String(req.body.detail || "").trim();

    if (presets.length === 0 && detail.length < 5) {
      return res.status(400).json({
        success: false,
        message:
          "Chọn ít nhất một lý do gợi ý hoặc nhập chi tiết (tối thiểu 5 ký tự)",
      });
    }

    menu.status = "rejected";
    menu.rejectPresets = presets;
    menu.rejectDetail = detail;
    menu.rejectReason = buildRejectReasonText(presets, detail);
    menu.appliedAt = null;

    pushMenuHistory(menu, {
      type: "request_edit_active",
      actorId: req.user?._id,
      presets,
      detail,
    });

    await menu.save();

    const populated = await Menu.findById(menu._id).populate("createdBy", "fullName email");

    return res.json({
      success: true,
      message: "Đã gửi yêu cầu chỉnh sửa cho bộ phận bếp",
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Áp dụng thực đơn đã duyệt (trở thành đang dùng; thực đơn đang áp dụng trước đó chuyển sang lịch sử) */
exports.applyMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu không tồn tại",
      });
    }

    if (menu.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể áp dụng thực đơn đã được duyệt",
      });
    }

    const now = new Date();

    const previouslyActive = await Menu.find({ status: "active" });
    for (const prev of previouslyActive) {
      prev.status = "completed";
      prev.endedAt = now;
      pushMenuHistory(prev, {
        type: "ended",
        actorId: req.user?._id,
        detail: "Kết thúc do áp dụng thực đơn khác",
      });
      await prev.save();
    }

    menu.status = "active";
    menu.appliedAt = now;

    pushMenuHistory(menu, {
      type: "applied",
      actorId: req.user?._id,
    });

    await menu.save();

    const populated = await Menu.findById(menu._id).populate("createdBy", "fullName email");

    return res.json({
      success: true,
      message: "Đã áp dụng thực đơn",
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Kết thúc thực đơn đang áp dụng → lưu vào lịch sử (completed) */
exports.endMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu không tồn tại",
      });
    }

    if (menu.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể kết thúc thực đơn đang áp dụng",
      });
    }

    const endedAt = new Date();
    menu.status = "completed";
    menu.endedAt = endedAt;

    pushMenuHistory(menu, {
      type: "ended",
      actorId: req.user?._id,
    });

    await menu.save();

    const populated = await Menu.findById(menu._id).populate("createdBy", "fullName email");

    return res.json({
      success: true,
      message: "Đã kết thúc và lưu vào lịch sử thực đơn",
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNutritionPlanSetting = async (req, res) => {
  try {
    await districtNutritionPlanService.autoArchiveExpiredDistrictPlans();
    const activeDistrict = await DistrictNutritionPlan.findOne({ status: "active" })
      .sort({ endDate: -1 })
      .lean();
    if (activeDistrict?.items?.length) {
      return res.json({
        success: true,
        data: activeDistrict.items,
      });
    }

    let setting = await NutritionPlanSetting.findOne({});
    if (!setting) {
      setting = await NutritionPlanSetting.create({
        items: DEFAULT_NUTRITION_PLAN,
      });
    }

    return res.json({
      success: true,
      data: setting.items,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateNutritionPlanSetting = async (req, res) => {
  try {
    const items = normalizeNutritionPlan(req.body?.items);
    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: "Kế hoạch dinh dưỡng không hợp lệ",
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

    await districtNutritionPlanService.autoArchiveExpiredDistrictPlans();
    const activeDistrict = await DistrictNutritionPlan.findOne({ status: "active" });
    if (activeDistrict) {
      activeDistrict.items = items;
      await activeDistrict.save();
      return res.json({
        success: true,
        message: "Cập nhật kế hoạch dinh dưỡng thành công",
        data: activeDistrict.items,
      });
    }

    const setting = await NutritionPlanSetting.findOneAndUpdate(
      {},
      { items },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: "Cập nhật kế hoạch dinh dưỡng thành công",
      data: setting.items,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
