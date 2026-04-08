const Menu = require("../models/Menu");
const NutritionPlanSetting = require("../models/NutritionPlanSetting");

const mongoose = require("mongoose");
const DailyMenu = require("../models/DailyMenu");

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

    const existed = await Menu.findOne({ month, year });

    if (existed) {
      return res.status(400).json({
        success: false,
        message: "Thực đơn tháng này đã tồn tại",
      });
    }

    const menu = new Menu({
      month,
      year,
      createdBy: req.user?._id,
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

    // Phụ huynh / học sinh: chỉ menu đã duyệt
    if (roleName === "Student") {
      filter = { status: { $in: ["approved", "active", "completed"] } };
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 20, 1);

    const total = await Menu.countDocuments(filter);
    const menus = await Menu.find(filter)
      .populate("createdBy", "fullName email")
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

    const dailyMenus = await DailyMenu.find({ menuId: menu._id })
      .populate("lunchFoods")
      .populate("afternoonFoods");

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

    menu.status = "pending";

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

    menu.status = "approved";

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

    menu.status = "rejected";
    menu.rejectReason = req.body.reason;

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

exports.getNutritionPlanSetting = async (req, res) => {
  try {
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
