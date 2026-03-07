const Menu = require("../models/Menu");

const mongoose = require("mongoose");
const DailyMenu = require("../models/DailyMenu");

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

    const menus = await Menu.find(filter)
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: menus,
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

    dailyMenus.forEach((day) => {
      result[day.weekType][day.dayOfWeek] = day;

      totalCalories += day.totalCalories || 0;
      totalProtein += day.totalProtein || 0;
      totalFat += day.totalFat || 0;
      totalCarb += day.totalCarb || 0;
    });

    res.json({
      success: true,
      data: {
        ...menu.toObject(),
        nutrition: {
          calories: totalCalories,
          protein: totalProtein,
          fat: totalFat,
          carb: totalCarb,
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
