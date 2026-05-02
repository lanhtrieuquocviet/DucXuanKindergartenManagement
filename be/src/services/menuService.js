const Menu = require("../models/Menu");
const User = require("../models/User");
const Role = require("../models/Role");
const NutritionPlanSetting = require("../models/NutritionPlanSetting");
const DistrictNutritionPlan = require("../models/DistrictNutritionPlan");
const AcademicYear = require("../models/AcademicYear");
const districtNutritionPlanService = require("./districtNutritionPlanService");
const { createNotification } = require("./notification.service");
const { sendHeadParentMenuReviewEmail } = require("../utils/email");

const mongoose = require("mongoose");
const DailyMenu = require("../models/DailyMenu");
const Food = require("../models/Food");


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

function buildChangeReasonText(presets, detail) {
  const text = buildRejectReasonText(presets, detail).trim();
  if (text) return text;
  return "Yêu cầu chỉnh sửa thực đơn đang áp dụng";
}

const HEADPARENT_REVIEW_HOURS = 48;

function getHeadParentReviewDeadline(fromDate = new Date()) {
  return new Date(fromDate.getTime() + HEADPARENT_REVIEW_HOURS * 60 * 60 * 1000);
}

async function getHeadParentUsers() {
  const headParentRole = await Role.findOne({ roleName: "HeadParent" }).lean();
  if (!headParentRole?._id) return [];
  const users = await User.find({
    roles: headParentRole._id,
    status: "active",
  })
    .select("_id fullName email")
    .lean();
  return Array.isArray(users) ? users : [];
}

async function notifyHeadParentsForMenuReview(menu, reviewDeadlineAt) {
  const headParents = await getHeadParentUsers();
  if (!headParents.length) return;

  const title = `Cần review thực đơn Tháng ${menu.month}/${menu.year}`;
  const body = `Ban giám hiệu đã duyệt thực đơn và chờ Hội trưởng phụ huynh review trong 48 giờ.`;

  // Thông báo trong hệ thống
  await Promise.all(
    headParents.map((hp) =>
      createNotification({
        title,
        body,
        type: "menu_review",
        targetUserId: hp._id,
        extra: {
          menuId: menu._id,
          month: menu.month,
          year: menu.year,
          reviewDeadlineAt,
        },
      })
    )
  );

  // Gửi email (best-effort)
  const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
  await Promise.all(
    headParents
      .filter((hp) => hp.email)
      .map(async (hp) => {
        try {
          await sendHeadParentMenuReviewEmail({
            to: hp.email,
            fullName: hp.fullName,
            month: menu.month,
            year: menu.year,
            reviewDeadlineAt,
            menuUrl: `${frontend}/head-parent/menus/${menu._id}`,
          });
        } catch (err) {
          console.warn("sendHeadParentMenuReviewEmail error:", err?.message || err);
        }
      })
  );
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

function toPlainObject(doc) {
  if (!doc) return null;
  if (typeof doc.toObject === "function") return doc.toObject();
  return { ...doc };
}

function mapDailyMenuOverrideByDay(overrides) {
  if (!Array.isArray(overrides)) return {};
  const map = {};
  for (const item of overrides) {
    const weekType = String(item?.weekType || "").trim();
    const dayOfWeek = String(item?.dayOfWeek || "").trim();
    if (!weekType || !dayOfWeek) continue;
    map[`${weekType}_${dayOfWeek}`] = item;
  }
  return map;
}

function toValidDate(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseDateTimeParts(dateStr, timeStr) {
  const date = String(dateStr || "").trim();
  if (!date) return null;
  const time = String(timeStr || "").trim() || "00:00";
  return toValidDate(`${date}T${time}:00`);
}

function getNextMonthFirstDay(year, month) {
  return new Date(year, month, 1, 0, 29, 59, 999);
}

function buildMenuScheduleFromBody(payload) {
  const month = Number(payload?.month);
  const year = Number(payload?.year);
  const startAt =
    toValidDate(payload?.scheduledStartAt) ||
    parseDateTimeParts(payload?.startDate, payload?.startTime) ||
    new Date(year, month - 1, 1, 0, 30, 0, 0);
  const endAt =
    toValidDate(payload?.scheduledEndAt) ||
    parseDateTimeParts(payload?.endDate, payload?.endTime) ||
    getNextMonthFirstDay(year, month);

  if (!startAt || !endAt) return null;
  if (endAt <= startAt) return null;
  return { startAt, endAt };
}

async function resolveQueryToArray(query, sortSpec = null) {
  if (!query) return [];
  let q = query;
  if (sortSpec && typeof q.sort === "function") {
    q = q.sort(sortSpec);
  }
  const rows = await q;
  if (!Array.isArray(rows)) return [];
  if (!sortSpec || typeof query.sort === "function") return rows;
  const keys = Object.keys(sortSpec);
  return rows.slice().sort((a, b) => {
    for (const key of keys) {
      const dir = Number(sortSpec[key]) >= 0 ? 1 : -1;
      const av = a?.[key];
      const bv = b?.[key];
      if (av === bv) continue;
      return av > bv ? dir : -dir;
    }
    return 0;
  });
}

async function autoSyncMenuLifecycle(actorId = null) {
  try {
    const now = new Date();

    const expiringActiveMenus = await resolveQueryToArray(
      Menu.find({
        status: "active",
        scheduledEndAt: { $ne: null, $lte: now },
      })
    );
    for (const menu of expiringActiveMenus) {
      await captureMenuHistorySnapshot(menu, "auto_ended", actorId, now);
      menu.status = "completed";
      menu.isCurrent = false;
      menu.endedAt = now;
      pushMenuHistory(menu, {
        type: "ended",
        actorId,
        detail: "Tự động kết thúc theo thời gian đã cài đặt",
      });
      await menu.save();
    }

    const dueApprovedMenus = await resolveQueryToArray(
      Menu.find({
        status: "approved",
        scheduledStartAt: { $ne: null, $lte: now },
      }),
      { scheduledStartAt: 1, _id: 1 }
    );

    for (const dueMenu of dueApprovedMenus) {
      const activeMenus = await resolveQueryToArray(
        Menu.find({
          status: "active",
          _id: { $ne: dueMenu._id },
        })
      );
      for (const active of activeMenus) {
        await captureMenuHistorySnapshot(active, "replaced_by_apply", actorId, now);
        active.status = "completed";
        active.isCurrent = false;
        active.endedAt = now;
        pushMenuHistory(active, {
          type: "ended",
          actorId,
          detail: "Tự động kết thúc do áp dụng thực đơn đã tới lịch",
        });
        await active.save();
      }

      dueMenu.status = "active";
      dueMenu.isCurrent = true;
      dueMenu.appliedAt = dueMenu.appliedAt || now;
      pushMenuHistory(dueMenu, {
        type: "applied",
        actorId,
        detail: "Tự động áp dụng theo thời gian đã cài đặt",
      });

      if (dueMenu.scheduledEndAt && dueMenu.scheduledEndAt <= now) {
        await captureMenuHistorySnapshot(dueMenu, "auto_ended", actorId, now);
        dueMenu.status = "completed";
        dueMenu.isCurrent = false;
        dueMenu.endedAt = now;
        pushMenuHistory(dueMenu, {
          type: "ended",
          actorId,
          detail: "Tự động kết thúc do quá thời gian áp dụng",
        });
      }
      await dueMenu.save();
    }
  } catch (error) {
    console.error("autoSyncMenuLifecycle error:", error?.message || error);
  }
}

async function captureMenuHistorySnapshot(menu, reason, actorId = null, capturedAt = new Date()) {
  if (!menu || !menu._id) return null;
  if (!Array.isArray(menu.historySnapshots)) menu.historySnapshots = [];

  const dailyMenus = await DailyMenu.find({ menuId: menu._id })
    .populate("lunchFoods")
    .populate("afternoonFoods")
    .populate("lunchMealSlots.food")
    .populate("afternoonMealSlots.food")
    .lean();

  menu.historySnapshots.push({
    reason,
    capturedAt,
    capturedBy: actorId || null,
    menuSnapshot: {
      month: menu.month,
      year: menu.year,
      status: menu.status,
      isCurrent: menu.isCurrent,
      version: menu.version || 1,
      changeReason: menu.changeReason || "",
      parentMenuId: menu.parentMenuId || null,
      changedAt: menu.changedAt || null,
      scheduledStartAt: menu.scheduledStartAt || null,
      scheduledEndAt: menu.scheduledEndAt || null,
      appliedAt: menu.appliedAt || null,
      endedAt: menu.endedAt || null,
      nutrition: menu.nutrition || {},
      nutritionPlan: Array.isArray(menu.nutritionPlan) ? menu.nutritionPlan : [],
      academicYearId: menu.academicYearId || null,
    },
    dailyMenus: Array.isArray(dailyMenus) ? dailyMenus : [],
  });

  return menu.historySnapshots[menu.historySnapshots.length - 1];
}

function buildWeeksFromSnapshotDailyMenus(dailyMenus) {
  const result = { odd: {}, even: {} };
  (dailyMenus || []).forEach((day) => {
    if (!day?.weekType || !day?.dayOfWeek) return;
    if (!result[day.weekType]) result[day.weekType] = {};
    result[day.weekType][day.dayOfWeek] = day;
  });
  return result;
}

function normalizeFoodId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof mongoose.Types.ObjectId) return String(value);
  if (typeof value === "object") {
    if (value.$oid && typeof value.$oid === "string") return value.$oid;
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
    if (value.food) {
      const nested = normalizeFoodId(value.food);
      if (nested) return nested;
    }
    if (typeof value.toString === "function") {
      const asString = String(value.toString());
      if (mongoose.Types.ObjectId.isValid(asString)) return asString;
    }
  }
  return "";
}

function buildFoodSnapshotFromSlot(slot) {
  const lines = Array.isArray(slot?.ingredientLines) ? slot.ingredientLines : [];
  const fromLines = lines.reduce(
    (acc, line) => {
      const grams = Number(line?.grams) || 0;
      const ratio = grams / 100;
      acc.calories += (Number(line?.caloriesPer100g) || 0) * ratio;
      acc.protein += (Number(line?.proteinPer100g) || 0) * ratio;
      acc.fat += (Number(line?.fatPer100g) || 0) * ratio;
      acc.carb += (Number(line?.carbPer100g) || 0) * ratio;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carb: 0 }
  );
  const hasLineNutrition =
    fromLines.calories > 0 || fromLines.protein > 0 || fromLines.fat > 0 || fromLines.carb > 0;
  if (hasLineNutrition) return fromLines;
  return {
    calories: Number(slot?.foodSnapshot?.calories) || 0,
    protein: Number(slot?.foodSnapshot?.protein) || 0,
    fat: Number(slot?.foodSnapshot?.fat) || 0,
    carb: Number(slot?.foodSnapshot?.carb) || 0,
  };
}

function buildFrozenDailyMenusView(dailyMenus) {
  const rows = Array.isArray(dailyMenus) ? dailyMenus : [];
  return rows.map((day) => {
    const mapSlotToFood = (slot) => {
      const fid = normalizeFoodId(slot?.food);
      const foodLike = typeof slot?.food === "object" && slot?.food ? slot.food : null;
      const snap = buildFoodSnapshotFromSlot(slot);
      return {
        _id: fid || "",
        name: String(slot?.foodName || foodLike?.name || "").trim(),
        calories: Number(snap.calories || foodLike?.calories || 0),
        protein: Number(snap.protein || foodLike?.protein || 0),
        fat: Number(snap.fat || foodLike?.fat || 0),
        carb: Number(snap.carb || foodLike?.carb || 0),
      };
    };

    const lunchSlots = Array.isArray(day?.lunchMealSlots) ? day.lunchMealSlots : [];
    const afternoonSlots = Array.isArray(day?.afternoonMealSlots) ? day.afternoonMealSlots : [];
    const existingLunchFoods = Array.isArray(day?.lunchFoods) ? day.lunchFoods : [];
    const existingAfternoonFoods = Array.isArray(day?.afternoonFoods) ? day.afternoonFoods : [];
    const lunchFromSlots = lunchSlots.length ? lunchSlots.map(mapSlotToFood) : [];
    const afternoonFromSlots = afternoonSlots.length ? afternoonSlots.map(mapSlotToFood) : [];
    const hasNamedLunch = lunchFromSlots.some((f) => String(f?.name || "").trim());
    const hasNamedAfternoon = afternoonFromSlots.some((f) => String(f?.name || "").trim());

    return {
      ...day,
      lunchFoods: hasNamedLunch ? lunchFromSlots : existingLunchFoods,
      afternoonFoods: hasNamedAfternoon ? afternoonFromSlots : existingAfternoonFoods,
    };
  });
}

async function refreshFrozenSlotsForMenu(menuId) {
  const dailyMenus = await DailyMenu.find({ menuId });
  if (!dailyMenus.length) return;

  const foodIds = new Set();
  dailyMenus.forEach((day) => {
    (day.lunchFoods || []).forEach((id) => {
      const fid = normalizeFoodId(id);
      if (fid) foodIds.add(fid);
    });
    (day.afternoonFoods || []).forEach((id) => {
      const fid = normalizeFoodId(id);
      if (fid) foodIds.add(fid);
    });
    (day.lunchMealSlots || []).forEach((slot) => {
      const fid = normalizeFoodId(slot?.food);
      if (fid) foodIds.add(fid);
    });
    (day.afternoonMealSlots || []).forEach((slot) => {
      const fid = normalizeFoodId(slot?.food);
      if (fid) foodIds.add(fid);
    });
  });

  const foods = await Food.find({ _id: { $in: Array.from(foodIds) } })
    .select("name calories protein fat carb")
    .lean();
  const foodMap = new Map(foods.map((f) => [String(f._id), f]));

  const updates = dailyMenus.map(async (day) => {
    const withSnapshots = (slots, fallbackIds = []) => {
      const next = Array.isArray(slots) ? slots.map((s) => ({ ...s })) : [];
      const byId = new Map(next.map((s) => [normalizeFoodId(s.food), s]));
      const orderedIdsFromFoods = Array.isArray(fallbackIds)
        ? fallbackIds.map((x) => normalizeFoodId(x)).filter(Boolean)
        : [];
      const orderedIds = orderedIdsFromFoods.length
        ? orderedIdsFromFoods
        : Array.from(byId.keys()).filter(Boolean);

      orderedIds.forEach((id) => {
        if (!byId.has(id)) byId.set(id, { food: id, ingredientLines: [] });
      });

      return orderedIds.map((id) => byId.get(id)).filter(Boolean).map((slot) => {
        const fid = normalizeFoodId(slot.food);
        const food = foodMap.get(fid);
        return {
          ...slot,
          food: fid || slot.food,
          foodName: String(slot.foodName || food?.name || "").trim(),
          foodSnapshot: {
            calories: Number(slot?.foodSnapshot?.calories ?? food?.calories ?? 0),
            protein: Number(slot?.foodSnapshot?.protein ?? food?.protein ?? 0),
            fat: Number(slot?.foodSnapshot?.fat ?? food?.fat ?? 0),
            carb: Number(slot?.foodSnapshot?.carb ?? food?.carb ?? 0),
          },
        };
      });
    };

    day.lunchMealSlots = withSnapshots(day.lunchMealSlots, day.lunchFoods || []);
    day.afternoonMealSlots = withSnapshots(day.afternoonMealSlots, day.afternoonFoods || []);
    await day.save();
  });

  await Promise.all(updates);
}

async function enrichDailyMenusWithFoodData(dailyMenus) {
  const rows = Array.isArray(dailyMenus) ? dailyMenus : [];
  if (!rows.length) return rows;

  const foodIds = new Set();
  rows.forEach((day) => {
    (day?.lunchFoods || []).forEach((f) => {
      const id = normalizeFoodId(f);
      if (id) foodIds.add(id);
    });
    (day?.afternoonFoods || []).forEach((f) => {
      const id = normalizeFoodId(f);
      if (id) foodIds.add(id);
    });
    (day?.lunchMealSlots || []).forEach((slot) => {
      const id = normalizeFoodId(slot?.food);
      if (id) foodIds.add(id);
    });
    (day?.afternoonMealSlots || []).forEach((slot) => {
      const id = normalizeFoodId(slot?.food);
      if (id) foodIds.add(id);
    });
  });

  if (!foodIds.size) return rows;
  const foods = await Food.find({ _id: { $in: Array.from(foodIds) } })
    .select("name calories protein fat carb")
    .lean();
  const foodMap = new Map(foods.map((f) => [String(f._id), f]));

  const mapFoodLike = (value) => {
    const id = normalizeFoodId(value);
    if (!id) return value;
    const dbFood = foodMap.get(id);
    const base = typeof value === "object" && value ? value : {};
    if (!dbFood) return { ...base, _id: id };
    return {
      _id: id,
      name: base.name || dbFood.name || "",
      calories: Number(base.calories ?? dbFood.calories ?? 0),
      protein: Number(base.protein ?? dbFood.protein ?? 0),
      fat: Number(base.fat ?? dbFood.fat ?? 0),
      carb: Number(base.carb ?? dbFood.carb ?? 0),
    };
  };

  return rows.map((day) => ({
    ...day,
    lunchFoods: Array.isArray(day?.lunchFoods) ? day.lunchFoods.map(mapFoodLike) : [],
    afternoonFoods: Array.isArray(day?.afternoonFoods) ? day.afternoonFoods.map(mapFoodLike) : [],
    lunchMealSlots: Array.isArray(day?.lunchMealSlots)
      ? day.lunchMealSlots.map((slot) => {
          const foodLike = mapFoodLike(slot?.food);
          return {
            ...slot,
            food: foodLike,
            foodName: String(slot?.foodName || foodLike?.name || "").trim(),
            foodSnapshot: {
              calories: Number(slot?.foodSnapshot?.calories ?? foodLike?.calories ?? 0),
              protein: Number(slot?.foodSnapshot?.protein ?? foodLike?.protein ?? 0),
              fat: Number(slot?.foodSnapshot?.fat ?? foodLike?.fat ?? 0),
              carb: Number(slot?.foodSnapshot?.carb ?? foodLike?.carb ?? 0),
            },
          };
        })
      : [],
    afternoonMealSlots: Array.isArray(day?.afternoonMealSlots)
      ? day.afternoonMealSlots.map((slot) => {
          const foodLike = mapFoodLike(slot?.food);
          return {
            ...slot,
            food: foodLike,
            foodName: String(slot?.foodName || foodLike?.name || "").trim(),
            foodSnapshot: {
              calories: Number(slot?.foodSnapshot?.calories ?? foodLike?.calories ?? 0),
              protein: Number(slot?.foodSnapshot?.protein ?? foodLike?.protein ?? 0),
              fat: Number(slot?.foodSnapshot?.fat ?? foodLike?.fat ?? 0),
              carb: Number(slot?.foodSnapshot?.carb ?? foodLike?.carb ?? 0),
            },
          };
        })
      : [],
  }));
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

    const academicYear = await AcademicYear.findOne({ status: "active" }).sort({ startDate: -1 });
    const existed = await Menu.findOne({ month, year });

    if (existed) {
      return res.status(400).json({
        success: false,
        message: "Thực đơn tháng này đã tồn tại",
      });
    }

    const schedule = buildMenuScheduleFromBody(req.body);
    if (!schedule) {
      return res.status(400).json({
        success: false,
        message:
          "Thời gian bắt đầu/kết thúc không hợp lệ (end phải sau start).",
      });
    }

    const menu = new Menu({
      month,
      year,
      createdBy: req.user?._id,
      academicYearId: academicYear?._id || null,
      isCurrent: false,
      version: 1,
      changeReason: "",
      parentMenuId: null,
      changedAt: null,
      scheduledStartAt: schedule.startAt,
      scheduledEndAt: schedule.endAt,
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
    await autoSyncMenuLifecycle();
    const filter = { status: { $in: ["approved", "active", "completed"] } };
    if (req.query.month) filter.month = Number(req.query.month);
    if (req.query.year) filter.year = Number(req.query.year);

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
    await autoSyncMenuLifecycle();
    const user = req.user;

    // Lấy role
    const roleName = user?.roles?.[0]?.roleName || user?.roles?.[0];

    let filter = {};

    // KitchenStaff: thấy tất cả
    if (roleName === "KitchenStaff") {
      filter = {};
    }

    // Ban giám hiệu: không thấy draft, không thấy pending_headparent
    if (roleName === "SchoolAdmin") {
      filter = { status: { $nin: ["draft", "pending_headparent"] } };
    }

    // Hội trưởng phụ huynh: thấy pending_headparent + active + completed
    if (roleName === "HeadParent") {
      filter = { status: { $in: ["pending_headparent", "pending", "approved", "active", "completed"] } };
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
    await autoSyncMenuLifecycle();
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

    // Menu lịch sử: ưu tiên dùng snapshot để không bị thay đổi theo dữ liệu Food/Ingredient mới
    if (menu.status === "completed") {
      const lastSnap =
        Array.isArray(menu.historySnapshots) && menu.historySnapshots.length
          ? menu.historySnapshots[menu.historySnapshots.length - 1]
          : null;

      // Data cũ chưa có snapshot → tạo ngay tại thời điểm xem để “đóng băng” từ đây
      if (!lastSnap) {
        await captureMenuHistorySnapshot(menu, "ended", null, new Date());
        await menu.save();
      }

      const snap =
        Array.isArray(menu.historySnapshots) && menu.historySnapshots.length
          ? menu.historySnapshots[menu.historySnapshots.length - 1]
          : null;

      const snapshotRows = await enrichDailyMenusWithFoodData(snap?.dailyMenus || []);
      const frozenSnapshotDays = buildFrozenDailyMenusView(snapshotRows);
      const result = buildWeeksFromSnapshotDailyMenus(frozenSnapshotDays);
      const menuData = menu.toObject();
      return res.json({ success: true, data: { ...menuData, weeks: result } });
    }

    await refreshFrozenSlotsForMenu(menu._id);
    const dailyMenus = await DailyMenu.find({ menuId: menu._id }).lean();
    const enrichedDailyMenus = await enrichDailyMenusWithFoodData(dailyMenus);
    const frozenDailyMenus = buildFrozenDailyMenusView(enrichedDailyMenus);

    const result = { odd: {}, even: {} };
    frozenDailyMenus.forEach((day) => {
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
    await autoSyncMenuLifecycle();
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

    // Menu lịch sử: trả về theo snapshot để không bị thay đổi theo Food/Ingredient mới
    if (menu.status === "completed") {
      const lastSnap =
        Array.isArray(menu.historySnapshots) && menu.historySnapshots.length
          ? menu.historySnapshots[menu.historySnapshots.length - 1]
          : null;

      // Data cũ chưa có snapshot → tạo snapshot tại thời điểm xem để “đóng băng” từ đây
      if (!lastSnap) {
        await captureMenuHistorySnapshot(menu, "ended", req.user?._id || null, new Date());
        await menu.save();
      }

      const snap =
        Array.isArray(menu.historySnapshots) && menu.historySnapshots.length
          ? menu.historySnapshots[menu.historySnapshots.length - 1]
          : null;

      const snapshotRows = await enrichDailyMenusWithFoodData(
        Array.isArray(snap?.dailyMenus) ? snap.dailyMenus : []
      );
      const dm = buildFrozenDailyMenusView(snapshotRows);
      const result = buildWeeksFromSnapshotDailyMenus(dm);
      const menuData = menu.toObject();

      let totalCalories = 0;
      let totalProtein = 0;
      let totalFat = 0;
      let totalCarb = 0;

      const validDays = dm.filter((day) => {
        const hasFood = (day.lunchFoods && day.lunchFoods.length > 0) || (day.afternoonFoods && day.afternoonFoods.length > 0);
        const hasNutrition = (day.totalCalories || 0) > 0 || (day.totalProtein || 0) > 0 || (day.totalFat || 0) > 0 || (day.totalCarb || 0) > 0;
        return Boolean(day && (hasFood || hasNutrition));
      });

      dm.forEach((day) => {
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

      return res.json({
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
    }

    const readOnlyStatuses = ["pending_headparent", "pending", "approved", "active", "completed"];
    if (readOnlyStatuses.includes(menu.status)) {
      await refreshFrozenSlotsForMenu(menu._id);
    }

    const dailyMenus = await DailyMenu.find({ menuId: menu._id }).lean();
    const enrichedDailyMenus = await enrichDailyMenusWithFoodData(dailyMenus);
    const normalizedDailyMenus = readOnlyStatuses.includes(menu.status)
      ? buildFrozenDailyMenusView(enrichedDailyMenus)
      : enrichedDailyMenus;

    const result = {
      odd: {},
      even: {},
    };

    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarb = 0;

    const validDays = normalizedDailyMenus.filter((day) => {
      const hasFood = (day.lunchFoods && day.lunchFoods.length > 0) || (day.afternoonFoods && day.afternoonFoods.length > 0);
      const hasNutrition = (day.totalCalories || 0) > 0 || (day.totalProtein || 0) > 0 || (day.totalFat || 0) > 0 || (day.totalCarb || 0) > 0;
      return Boolean(day && (hasFood || hasNutrition));
    });

    normalizedDailyMenus.forEach((day) => {
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

    if (menu.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Thực đơn đã kết thúc và được lưu vào lịch sử, không thể chỉnh sửa",
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

    await refreshFrozenSlotsForMenu(menu._id);

    // KitchenStaff gửi thẳng lên SchoolAdmin duyệt.
    menu.status = "pending";
    menu.rejectReason = "";
    menu.rejectPresets = [];
    menu.rejectDetail = "";
    menu.headParentReview = {
      reviewedBy: null,
      reviewedAt: null,
      comment: "",
      reviewRequestedAt: null,
      reviewDeadlineAt: null,
      reviewNotifiedAt: null,
    };

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

// Hội trưởng phụ huynh xem xét:
// - pending_headparent: chuyển tiếp lên ban giám hiệu (pending) [luồng cũ]
// - approved: gửi lý do từ chối trong 48h, trả về bếp chỉnh sửa (rejected)
exports.headParentReviewMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) return res.status(404).json({ message: 'Menu không tồn tại' });

    if (!["pending_headparent", "approved"].includes(menu.status)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể thao tác khi thực đơn đang chờ hội trưởng phụ huynh hoặc đã duyệt',
      });
    }

    const comment = String(req.body.comment || "").trim();
    const now = new Date();

    menu.headParentReview = {
      reviewedBy: req.user?._id,
      reviewedAt: now,
      comment,
    };

    if (menu.status === "approved") {
      const deadline = menu.headParentReview?.reviewDeadlineAt
        ? new Date(menu.headParentReview.reviewDeadlineAt)
        : null;
      if (deadline && deadline < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Đã hết thời hạn review 48 giờ kể từ lúc ban giám hiệu duyệt thực đơn.",
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

      const rejectReason = buildRejectReasonText(presets, detail);
      menu.status = "rejected";
      menu.rejectPresets = presets;
      menu.rejectDetail = detail;
      menu.rejectReason = rejectReason;
      menu.changeReason = rejectReason;
      menu.changedAt = now;
      menu.headParentReview.comment = detail;

      pushMenuHistory(menu, {
        type: "headparent_rejected_approved",
        actorId: req.user?._id,
        presets,
        detail,
      });

      await menu.save();

      return res.json({
        success: true,
        message: "Đã từ chối thực đơn đã duyệt và gửi lại bếp để chỉnh sửa",
        data: menu,
      });
    }

    menu.status = 'pending';

    pushMenuHistory(menu, {
      type: 'headparent_reviewed',
      actorId: req.user?._id,
      detail: comment,
    });

    await menu.save();

    return res.json({
      success: true,
      message: comment
        ? 'Đã gửi ý kiến và chuyển thực đơn lên ban giám hiệu'
        : 'Đã chuyển thực đơn lên ban giám hiệu để duyệt',
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
    const now = new Date();
    const reviewDeadlineAt = getHeadParentReviewDeadline(now);
    menu.headParentReview = {
      reviewedBy: null,
      reviewedAt: null,
      comment: "",
      reviewRequestedAt: now,
      reviewDeadlineAt,
      reviewNotifiedAt: now,
    };

    pushMenuHistory(menu, {
      type: "approved",
      actorId: req.user?._id,
    });

    await menu.save();
    await notifyHeadParentsForMenuReview(menu, reviewDeadlineAt);

    res.json({
      success: true,
      message: "Thực đơn đã được duyệt và đã gửi yêu cầu review cho Hội trưởng phụ huynh (48 giờ)",
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

    const now = new Date();
    const changeReason = buildChangeReasonText(presets, detail);

    const dailyMenuQuery = DailyMenu.find({ menuId: menu._id });
    const dailyMenusRaw =
      dailyMenuQuery && typeof dailyMenuQuery.lean === "function"
        ? await dailyMenuQuery.lean()
        : await dailyMenuQuery;
    const dailyMenus = Array.isArray(dailyMenusRaw) ? dailyMenusRaw : [];

    // B1 + B2: chuyển menu đang áp dụng sang lịch sử và lưu đầy đủ lý do
    if (!Array.isArray(menu.historySnapshots)) menu.historySnapshots = [];
    menu.historySnapshots.push({
      reason: "request_edit_active",
      capturedAt: now,
      capturedBy: req.user?._id || null,
      menuSnapshot: {
        month: menu.month,
        year: menu.year,
        status: menu.status,
        isCurrent: menu.isCurrent,
        version: menu.version || 1,
        changeReason: menu.changeReason || "",
        parentMenuId: menu.parentMenuId || null,
        changedAt: menu.changedAt || null,
        scheduledStartAt: menu.scheduledStartAt || null,
        scheduledEndAt: menu.scheduledEndAt || null,
        appliedAt: menu.appliedAt || null,
        endedAt: menu.endedAt || null,
        nutrition: menu.nutrition || {},
        nutritionPlan: Array.isArray(menu.nutritionPlan) ? menu.nutritionPlan : [],
      },
      dailyMenus,
    });

    menu.status = "completed";
    menu.isCurrent = false;
    menu.rejectPresets = presets;
    menu.rejectDetail = detail;
    menu.rejectReason = changeReason;
    menu.changeReason = changeReason;
    menu.changedAt = now;
    menu.endedAt = now;

    pushMenuHistory(menu, {
      type: "ended",
      actorId: req.user?._id,
      detail: "Chuyển sang lịch sử do yêu cầu chỉnh sửa",
    });

    pushMenuHistory(menu, {
      type: "request_edit_active",
      actorId: req.user?._id,
      presets,
      detail: `Ngày thay đổi: ${now.toISOString()} | ${detail || "Không có chi tiết bổ sung"}`,
    });

    await menu.save();

    // B3: clone menu mới gửi lại cho KitchenStaff chỉnh sửa
    const source = toPlainObject(menu);
    const clonedMenu = new Menu({
      month: source.month,
      year: source.year,
      createdBy: source.createdBy || req.user?._id || null,
      academicYearId: source.academicYearId || menu.academicYearId || null,
      status: "rejected",
      isCurrent: false,
      version: Number(source.version || 1) + 1,
      changeReason,
      parentMenuId: source._id,
      changedAt: now,
      rejectReason: changeReason,
      rejectPresets: presets,
      rejectDetail: detail,
      appliedAt: null,
      endedAt: null,
      scheduledStartAt: source.scheduledStartAt || null,
      scheduledEndAt: source.scheduledEndAt || null,
      nutrition: source.nutrition || {},
      nutritionPlan: Array.isArray(source.nutritionPlan) ? source.nutritionPlan : [],
      statusHistory: [
        {
          type: "request_edit_active",
          at: now,
          actorId: req.user?._id || null,
          presets,
          detail: `Tạo phiên bản sửa từ menu ${source._id}. Ngày thay đổi: ${now.toISOString()}`,
        },
      ],
      historySnapshots: [],
    });
    await clonedMenu.save();

    const overrideMap = mapDailyMenuOverrideByDay(req.body?.dailyMenuOverrides);
    const dailyMenuClones = dailyMenus.map((day) => {
      const key = `${day.weekType}_${day.dayOfWeek}`;
      const ov = overrideMap[key] || {};
      return {
        menuId: clonedMenu._id,
        weekType: day.weekType,
        dayOfWeek: day.dayOfWeek,
        lunchFoods: Array.isArray(ov.lunchFoods) ? ov.lunchFoods : (day.lunchFoods || []),
        afternoonFoods: Array.isArray(ov.afternoonFoods) ? ov.afternoonFoods : (day.afternoonFoods || []),
        lunchMealSlots: Array.isArray(ov.lunchMealSlots) ? ov.lunchMealSlots : (day.lunchMealSlots || []),
        afternoonMealSlots: Array.isArray(ov.afternoonMealSlots) ? ov.afternoonMealSlots : (day.afternoonMealSlots || []),
        totalCalories: ov.totalCalories != null ? Number(ov.totalCalories) : (day.totalCalories || 0),
        totalProtein: ov.totalProtein != null ? Number(ov.totalProtein) : (day.totalProtein || 0),
        totalFat: ov.totalFat != null ? Number(ov.totalFat) : (day.totalFat || 0),
        totalCarb: ov.totalCarb != null ? Number(ov.totalCarb) : (day.totalCarb || 0),
        proteinPercentage: ov.proteinPercentage != null ? Number(ov.proteinPercentage) : (day.proteinPercentage || 0),
        fatPercentage: ov.fatPercentage != null ? Number(ov.fatPercentage) : (day.fatPercentage || 0),
        carbPercentage: ov.carbPercentage != null ? Number(ov.carbPercentage) : (day.carbPercentage || 0),
        nutritionDetails: ov.nutritionDetails || day.nutritionDetails || {
          kcalFromProtein: 0,
          kcalFromFat: 0,
          kcalFromCarb: 0,
          calculatedTotalKcal: 0,
        },
      };
    });
    if (dailyMenuClones.length > 0) {
      await DailyMenu.insertMany(dailyMenuClones);
    }

    const populated = await Menu.findById(clonedMenu._id).populate("createdBy", "fullName email");

    return res.json({
      success: true,
      message: "Đã lưu menu cũ vào lịch sử và gửi phiên bản mới cho KitchenStaff chỉnh sửa",
      data: populated,
      archivedMenuId: menu._id,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Áp dụng thực đơn đã duyệt (trở thành đang dùng; thực đơn đang áp dụng trước đó chuyển sang lịch sử) */
exports.applyMenu = async (req, res) => {
  try {
    await autoSyncMenuLifecycle(req.user?._id || null);
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
      await captureMenuHistorySnapshot(prev, "replaced_by_apply", req.user?._id || null, now);
      prev.status = "completed";
      prev.isCurrent = false;
      prev.endedAt = now;
      pushMenuHistory(prev, {
        type: "ended",
        actorId: req.user?._id,
        detail: "Kết thúc do áp dụng thực đơn khác",
      });
      await prev.save();
    }

    menu.status = "active";
    menu.isCurrent = true;
    menu.version = Math.max(Number(menu.version || 1), 1);
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
    await captureMenuHistorySnapshot(menu, "ended", req.user?._id || null, endedAt);
    menu.status = "completed";
    menu.isCurrent = false;
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

exports.getCurrentAcademicYearForMenu = async (req, res) => {
  try {
    const year = await AcademicYear.findOne({ status: "active" })
      .sort({ startDate: -1 })
      .lean();
    return res.json({
      success: true,
      data: year || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
