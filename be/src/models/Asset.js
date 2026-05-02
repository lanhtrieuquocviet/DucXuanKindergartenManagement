const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    assetCode:        { type: String, required: true, trim: true, unique: true },
    name:             { type: String, required: true, trim: true },
    // 'csvc' = cơ sở vật chất (báo cáo thông tư), 'asset' = tài sản kho (phân bổ phòng/lớp)
    type: {
      type: String,
      enum: ['csvc', 'asset'],
      default: 'csvc',  
    },
    category: {
      type: String,
      default: 'Đồ dùng',
    },
    assetClass: {
      type: String,
      enum: ['consumable', 'fixed'],
      default: 'fixed',
    },
    status: {
      type: String,
      enum: ['active', 'disposed', 'reserved', 'transferred', 'in_repair', 'lost', 'broken'],
      default: 'active',
    },
    room:             { type: String, trim: true, default: '' },
    requiredQuantity: { type: Number, min: 0, default: 0 },   // Nhu cầu theo quy định
    quantity:         { type: Number, required: true, min: 0, default: 1 }, // Số lượng thực tế
    area:             { type: Number, min: 0, default: null }, // Diện tích m² (cho phòng)
    constructionType: {
      type: String,
      enum: ['Kiên cố', 'Bán kiên cố', 'Tạm', 'Không áp dụng'],
      default: 'Không áp dụng',
    },
    condition: {
      type: String,
      // Keep old values for backward compatibility; new values are preferred.
      enum: ['Còn tốt', 'Đã hỏng', 'Tốt', 'Hỏng', 'Cần sửa chữa'],
      default: 'Còn tốt',
    },
    // Chỉ dùng cho type='asset' (tài sản kho)
    goodQuantity:   { type: Number, min: 0, default: null },
    brokenQuantity: { type: Number, min: 0, default: null },
    unit:     { type: String, trim: true, default: 'Cái' },  // ĐVT – dùng cho mục 7
    seats1:   { type: Number, min: 0, default: null },  // Trong đó: 1 chỗ ngồi (phần 2)
    seats2:   { type: Number, min: 0, default: null },  // Trong đó: 2 chỗ ngồi (phần 2)
    seats4:   { type: Number, min: 0, default: null },  // Trong đó: 4 chỗ ngồi (phần 2)
    linkedReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null }, // Liên kết tới mục báo cáo (type='csvc')
    notes:    { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'Assets',
  }
);

module.exports = mongoose.model('Asset', assetSchema);
