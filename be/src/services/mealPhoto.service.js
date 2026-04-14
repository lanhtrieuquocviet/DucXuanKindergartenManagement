const MealPhoto = require('../models/MealPhoto');
const Attendance = require('../models/Attendances');
const Student = require('../models/Student');
const { createNotification } = require('../controller/notification.controller');

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
      .populate('sampleEntries.uploadedBy', 'fullName')
      .populate('sampleEntries.reviewedBy', 'fullName')
      .populate('editRequests.requestedBy', 'fullName')
      .populate('editRequests.approvedBy', 'fullName')
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
    const validTypes = ['trua', 'chieu', 'sang', 'xe', 'khac'];
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
 * POST /api/meal-photos/sample-entry
 * Thêm hoặc cập nhật mẫu thực phẩm cho một bữa ăn cụ thể
 * Body: { date, mealType, description, images[] }
 */
exports.upsertSampleEntry = async (req, res) => {
  try {
    const { date, mealType, description, images } = req.body;

    if (!date || !mealType) {
      return res.status(400).json({ success: false, message: 'Thiếu date hoặc mealType' });
    }
    const validTypes = ['trua', 'chieu', 'sang', 'xe', 'khac'];
    if (!validTypes.includes(mealType)) {
      return res.status(400).json({ success: false, message: 'mealType không hợp lệ' });
    }
    if (!images || !Array.isArray(images) || images.length < 1) {
      return res.status(400).json({ success: false, message: 'Cần ít nhất 1 ảnh' });
    }
    if (images.length > 10) {
      return res.status(400).json({ success: false, message: 'Tối đa 10 ảnh' });
    }

    // Thử cập nhật mẫu đã tồn tại
    let doc = await MealPhoto.findOneAndUpdate(
      { date, 'sampleEntries.mealType': mealType },
      {
        $set: {
          'sampleEntries.$.images': images,
          'sampleEntries.$.description': description || '',
          'sampleEntries.$.status': 'cho_kiem_tra',
          'sampleEntries.$.uploadedAt': new Date(),
          'sampleEntries.$.uploadedBy': req.user?._id,
        },
      },
      { new: true }
    );

    if (!doc) {
      // Thêm mẫu mới
      doc = await MealPhoto.findOneAndUpdate(
        { date },
        {
          $push: {
            sampleEntries: {
              mealType,
              description: description || '',
              images,
              status: 'cho_kiem_tra',
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
 * DELETE /api/meal-photos/sample-entry
 * Xóa một mẫu thực phẩm khỏi ngày
 * Query: { date, mealType }
 */
exports.deleteSampleEntry = async (req, res) => {
  try {
    const { date, mealType } = req.query;
    if (!date || !mealType) {
      return res.status(400).json({ success: false, message: 'Thiếu date hoặc mealType' });
    }
    const doc = await MealPhoto.findOneAndUpdate(
      { date },
      { $pull: { sampleEntries: { mealType } } },
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
 * PUT /api/meal-photos/sample-entry/review
 * School admin duyệt mẫu thực phẩm (chuyển trạng thái)
 * Body: { date, mealType, status: 'khong_co_van_de'|'khong_dat', reviewNote? }
 */
exports.reviewSampleEntry = async (req, res) => {
  try {
    const { date, mealType, status, reviewNote } = req.body;
    if (!date || !mealType || !status) {
      return res.status(400).json({ success: false, message: 'Thiếu date, mealType hoặc status' });
    }
    const validStatuses = ['khong_co_van_de', 'khong_dat'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'status không hợp lệ' });
    }

    const doc = await MealPhoto.findOneAndUpdate(
      { date, 'sampleEntries.mealType': mealType },
      {
        $set: {
          'sampleEntries.$.status': status,
          'sampleEntries.$.reviewNote': reviewNote || '',
          'sampleEntries.$.reviewedBy': req.user?._id,
          'sampleEntries.$.reviewedAt': new Date(),
        },
      },
      { new: true }
    )
      .populate('sampleEntries.uploadedBy', 'fullName')
      .populate('sampleEntries.reviewedBy', 'fullName');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu thực phẩm' });
    }

    // Gửi thông báo cho phụ huynh nếu mẫu có vấn đề
    if (status === 'khong_dat') {
      const MEAL_LABELS = { sang: 'bữa sáng', trua: 'bữa trưa', chieu: 'bữa chiều', xe: 'bữa xế' };
      const mealLabel = MEAL_LABELS[mealType] || mealType;
      const displayDate = date.split('-').reverse().join('/');
      await createNotification({
        title: `⚠️ Mẫu thực phẩm ${mealLabel} có vấn đề`,
        body: reviewNote
          ? `Ngày ${displayDate}: ${reviewNote}`
          : `Mẫu thực phẩm ${mealLabel} ngày ${displayDate} đã được kiểm tra và phát hiện có vấn đề.`,
        type: 'meal_issue',
        extra: { date, mealType, reviewNote },
      });
    }

    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/meal-photos/edit-request
 * Bếp trưởng gửi yêu cầu chỉnh sửa ảnh
 * Body: { date, requestType: 'meal'|'sample', mealType }
 */
exports.requestEdit = async (req, res) => {
  try {
    const { date, requestType, mealType, reason } = req.body;
    if (!date || !requestType || !mealType) {
      return res.status(400).json({ success: false, message: 'Thiếu date, requestType hoặc mealType' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do chỉnh sửa' });
    }
    const validTypes = ['trua', 'chieu', 'sang', 'xe', 'khac'];
    if (!validTypes.includes(mealType)) {
      return res.status(400).json({ success: false, message: 'mealType không hợp lệ' });
    }
    if (!['meal', 'sample'].includes(requestType)) {
      return res.status(400).json({ success: false, message: 'requestType không hợp lệ' });
    }

    // Tìm document, xóa request cũ cùng requestType+mealType, thêm request mới
    let doc = await MealPhoto.findOne({ date });
    if (!doc) {
      doc = new MealPhoto({ date, editRequests: [] });
    }

    // Xóa request cũ (nếu có) và thêm mới
    doc.editRequests = doc.editRequests.filter(
      (r) => !(r.requestType === requestType && r.mealType === mealType)
    );
    doc.editRequests.push({
      requestType,
      mealType,
      reason: reason.trim(),
      status: 'pending',
      requestedBy: req.user?._id,
      requestedAt: new Date(),
    });
    await doc.save();

    await doc.populate('editRequests.requestedBy', 'fullName');
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/meal-photos/edit-request/approve
 * School admin duyệt yêu cầu chỉnh sửa
 * Body: { date, requestType: 'meal'|'sample', mealType, action: 'approved'|'rejected' }
 */
exports.approveEditRequest = async (req, res) => {
  try {
    const { date, requestType, mealType, action } = req.body;
    if (!date || !requestType || !mealType || !action) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số' });
    }
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action không hợp lệ' });
    }

    const doc = await MealPhoto.findOneAndUpdate(
      { date, 'editRequests.requestType': requestType, 'editRequests.mealType': mealType },
      {
        $set: {
          'editRequests.$[elem].status': action,
          'editRequests.$[elem].approvedBy': req.user?._id,
          'editRequests.$[elem].approvedAt': new Date(),
        },
      },
      {
        arrayFilters: [{ 'elem.requestType': requestType, 'elem.mealType': mealType }],
        new: true,
      }
    )
      .populate('editRequests.requestedBy', 'fullName')
      .populate('editRequests.approvedBy', 'fullName');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu chỉnh sửa' });
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
      .populate({ path: 'classId', select: 'className gradeId', populate: { path: 'gradeId', select: 'gradeName' } })
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

    // Lấy giờ chốt suất ăn từ biến môi trường (chỉ admin/dev mới được đổi)
    const cutoffTime = process.env.MEAL_CUTOFF_TIME || '08:30';
    const [cutoffH, cutoffM] = cutoffTime.split(':').map(Number);
    const cutoffMinutes = cutoffH * 60 + cutoffM;

    // Gắn totalStudents và isSupplementary vào từng record để frontend dùng
    const recordsWithTotal = records.map((r) => {
      let isSupplementary = false;
      if (r.status === 'present' && r.time?.checkIn) {
        const ci = new Date(r.time.checkIn);
        const ciMinutes = ci.getHours() * 60 + ci.getMinutes();
        isSupplementary = ciMinutes > cutoffMinutes;
      }
      return {
        ...r,
        classTotalStudents: studentCountMap[String(r.classId?._id)] ?? null,
        isSupplementary,
      };
    });

    const supplementaryCount = recordsWithTotal.filter((r) => r.isSupplementary).length;
    // Suất cơm chính = có mặt và đến TRƯỚC giờ chốt
    const mealCount = present - supplementaryCount;

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
        mealCount,         // Suất cơm chính = đến trước giờ chốt
        supplementaryCount, // Suất bổ sung = đến sau giờ chốt
        cutoffTime,
        records: recordsWithTotal,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

