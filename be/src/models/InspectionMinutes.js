const mongoose = require('mongoose');

const assetRowSchema = new mongoose.Schema(
  {
    category: { type: String, trim: true, default: '' }, // nhóm (ĐỒ DÙNG, THIẾT BỊ...)
    assetCode: { type: String, trim: true, default: '' }, // Mã số
    name: { type: String, trim: true, default: '' },     // Tên thiết bị
    unit: { type: String, trim: true, default: '' },     // ĐVT
    quantity: { type: Number, default: 0 },              // SL
    targetUser: { type: String, trim: true, default: '' }, // Đối tượng sử dụng
    notes: { type: String, trim: true, default: '' },    // Ghi chú
  },
  { _id: true }
);

const inspectionMinutesSchema = new mongoose.Schema(
  {
    minutesNumber: { type: String, trim: true },
    location: { type: String, trim: true, default: 'Đức Xuân' },
    scope: { type: String, trim: true, default: '' },     // Lớp/Phạm vi
    inspectionDate: { type: Date, required: true },
    inspectionTime: { type: String, trim: true, default: '' }, // Giờ bắt đầu (VD: "14h")
    endTime: { type: String, trim: true, default: '' },        // Giờ kết thúc
    reason: { type: String, trim: true, default: '' },         // II - Lí do kiểm kê
    inspectionMethod: { type: String, trim: true, default: '' }, // IV - Hình thức
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    committeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'InspectionCommittee', default: null },
    assets: [assetRowSchema],
    conclusion: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    collection: 'InspectionMinutes',
  }
);

inspectionMinutesSchema.pre('save', async function (next) {
  if (!this.minutesNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.minutesNumber = `BBKK-${year}${String(count + 1).padStart(2, '0')}`;
  }
  next();
});

module.exports = mongoose.model('InspectionMinutes', inspectionMinutesSchema);
