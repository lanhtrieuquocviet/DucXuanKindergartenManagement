const MealPhoto = require('../models/MealPhoto');
const Attendance = require('../models/Attendances');
const Student = require('../models/Student');

/**
 * GET /api/meal-photos?date=YYYY-MM-DD
 * Lấy ảnh món ăn và mẫu thực phẩm của một ngày
 */
exports.getMealPhoto = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số date (YYYY-MM-DD)' });
    }

    const doc = await MealPhoto.findOne({ date })
      .populate('meals.uploadedBy', 'fullName')
      .lean();
    return res.json({ success: true, data: doc || null });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/meal-photos
 * Tạo hoặc cập nhật ảnh cho một ngày (upsert)
 * Body: { date, mealImages, sampleImages }
 */
exports.upsertMealPhoto = async (req, res) => {
  try {
    const { date, mealImages, sampleImages } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số date (YYYY-MM-DD)' });
    }

    const doc = await MealPhoto.findOneAndUpdate(
      { date },
      {
        $set: {
          ...(mealImages !== undefined && { mealImages }),
          ...(sampleImages !== undefined && { sampleImages }),
          uploadedBy: req.user?._id,
        },
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/meal-photos/meal-entry
 * Thêm hoặc cập nhật ảnh cho một bữa ăn (sang/trua/chieu/xe)
 * Body: { date, mealType, description, images[] }
 */
exports.upsertMealEntry = async (req, res) => {
  try {
    const { date, mealType, description, images } = req.body;

    if (!date || !mealType) {
      return res.status(400).json({ success: false, message: 'Thiếu date hoặc mealType' });
    }
    const validTypes = ['trua', 'chieu', 'sang', 'xe'];
    if (!validTypes.includes(mealType)) {
      return res.status(400).json({ success: false, message: 'mealType không hợp lệ' });
    }
    if (!images || !Array.isArray(images) || images.length < 3) {
      return res.status(400).json({ success: false, message: 'Cần ít nhất 3 ảnh' });
    }
    if (images.length > 5) {
      return res.status(400).json({ success: false, message: 'Tối đa 5 ảnh' });
    }

    // Thử cập nhật bữa đã tồn tại
    let doc = await MealPhoto.findOneAndUpdate(
      { date, 'meals.mealType': mealType },
      {
        $set: {
          'meals.$.images': images,
          'meals.$.description': description || '',
          'meals.$.uploadedAt': new Date(),
          'meals.$.uploadedBy': req.user?._id,
        },
      },
      { new: true }
    );

    if (!doc) {
      // Thêm bữa mới
      doc = await MealPhoto.findOneAndUpdate(
        { date },
        {
          $push: {
            meals: {
              mealType,
              description: description || '',
              images,
              uploadedAt: new Date(),
              uploadedBy: req.user?._id,
            },
          },
          $set: { uploadedBy: req.user?._id },
        },
        { upsert: true, new: true }
      );
    }

    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/meal-photos/meal-entry
 * Xóa một bữa ăn khỏi ngày
 * Body: { date, mealType }
 */
exports.deleteMealEntry = async (req, res) => {
  try {
    const { date, mealType } = req.query;
    if (!date || !mealType) {
      return res.status(400).json({ success: false, message: 'Thiếu date hoặc mealType' });
    }
    const doc = await MealPhoto.findOneAndUpdate(
      { date },
      { $pull: { meals: { mealType } } },
      { new: true }
    );
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu' });
    }
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/meal-photos/attendance-summary?date=YYYY-MM-DD
 * Tổng hợp sĩ số và suất cơm từ dữ liệu điểm danh
 */
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số date (YYYY-MM-DD)' });
    }

    // Tìm tất cả bản ghi điểm danh trong ngày
    // Dùng local timezone để khớp với cách upsertAttendance lưu (setHours(0,0,0,0))
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('studentId', 'fullName')
      .populate('classId', 'className')
      .lean();

    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const leave = records.filter((r) => r.status === 'leave').length;

    // Lấy sĩ số thực tế (tổng học sinh đang học) theo từng lớp
    const studentCountsByClass = await Student.aggregate([
      { $match: { status: { $ne: 'inactive' } } },
      { $group: { _id: '$classId', totalStudents: { $sum: 1 } } },
    ]);
    const studentCountMap = {};
    studentCountsByClass.forEach((c) => {
      if (c._id) studentCountMap[String(c._id)] = c.totalStudents;
    });

    // Gắn totalStudents vào từng record để frontend dùng
    const recordsWithTotal = records.map((r) => ({
      ...r,
      classTotalStudents: studentCountMap[String(r.classId?._id)] ?? null,
    }));

    // Tổng sĩ số = tổng học sinh đang học (không trùng lớp)
    const total = studentCountsByClass.reduce((s, c) => s + c.totalStudents, 0);

    return res.json({
      success: true,
      data: {
        date,
        total,
        present,
        absent,
        leave,
        mealCount: present, // Suất cơm = số học sinh có mặt
        records: recordsWithTotal,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
