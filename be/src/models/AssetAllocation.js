const mongoose = require('mongoose');

const transferHistorySchema = new mongoose.Schema(
  {
    fromClassName:  { type: String, default: '' },
    toClassName:    { type: String, default: '' },
    fromTeacherName:{ type: String, default: '' },
    toTeacherName:  { type: String, default: '' },
    transferDate:   { type: Date, default: Date.now },
    note:           { type: String, default: '' },
    transferredBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const allocationAssetSchema = new mongoose.Schema(
  {
    category:   { type: String, trim: true, default: '' }, // VD: "I. ĐỒ DÙNG"
    assetCode:  { type: String, trim: true, default: '' },
    name:       { type: String, required: true, trim: true },
    unit:       { type: String, trim: true, default: 'Cái' },
    quantity:   { type: Number, min: 0, default: 1 },
    targetUser: {
      type: String,
      enum: ['Trẻ', 'Giáo viên', 'Dùng chung'],
      default: 'Trẻ',
    },
    notes: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const assetAllocationSchema = new mongoose.Schema(
  {
    documentCode: { type: String, trim: true, unique: true }, // BBGT-YYYY-##

    // Lớp nhận tài sản
    classId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Classes' },
    className: { type: String, trim: true, default: '' },

    // Giáo viên nhận bàn giao
    teacherName:     { type: String, trim: true, default: '' },
    teacherPosition: { type: String, trim: true, default: 'Giáo viên' },

    // Người bàn giao
    handoverByName:     { type: String, trim: true, default: '' },
    handoverByPosition: { type: String, trim: true, default: 'Hiệu trưởng' },

    // Thời gian & năm học
    handoverDate: { type: Date, default: Date.now },
    academicYear: { type: String, trim: true, default: '' }, // "2024-2025"

    // Danh sách tài sản theo thông tư
    assets: [allocationAssetSchema],

    // Danh sách thiết bị khác ngoài thông tư
    extraAssets: [allocationAssetSchema],

    // Trạng thái: chờ xác nhận / đang sử dụng / đã chuyển lớp / đã thu hồi
    status: {
      type: String,
      enum: ['pending_confirmation', 'active', 'transferred', 'returned'],
      default: 'pending_confirmation',
    },

    // Thông tin xác nhận bàn giao từ giáo viên
    confirmedAt: { type: Date, default: null },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Ghi chú chung
    notes: { type: String, trim: true, default: '' },

    // Lịch sử chuyển giao
    transferHistory: [transferHistorySchema],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'AssetAllocations',
  }
);

// Auto-generate documentCode trước khi lưu
assetAllocationSchema.pre('save', async function (next) {
  if (this.isNew && !this.documentCode) {
    const year = new Date().getFullYear();
    const prefix = `BBGT-${year}-`;
    const last = await this.constructor
      .findOne({ documentCode: { $regex: `^${prefix}` } })
      .sort({ documentCode: -1 });
    let seq = 1;
    if (last) {
      const parts = last.documentCode.split('-');
      seq = (parseInt(parts[parts.length - 1], 10) || 0) + 1;
    }
    this.documentCode = `${prefix}${String(seq).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AssetAllocation', assetAllocationSchema);
