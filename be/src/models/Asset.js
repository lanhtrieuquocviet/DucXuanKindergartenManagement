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
      enum: [
        // CSVC — theo thông tư
        'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em',
        'Số bàn, ghế ngồi',
        'Khối phòng phục vụ học tập',
        'Phòng tổ chức ăn, nghỉ',
        'Công trình công cộng và khối phòng phục vụ khác',
        'Khối phòng hành chính quản trị',
        'Diện tích đất',
        'Thiết bị dạy học và CNTT',
        // Tài sản kho — phân bổ phòng/lớp
        'Đồ dùng',
        'Thiết bị dạy học, đồ chơi và học liệu',
        'Sách, tài liệu, băng đĩa',
        'Thiết bị ngoài thông tư',
      ],
      default: 'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em',
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
    brokenQuantity: { type: Number, min: 0, default: 0 }, // Số lượng không sử dụng được
    unit:     { type: String, trim: true, default: 'Cái' },  // ĐVT – dùng cho mục 7
    seats1:   { type: Number, min: 0, default: null },  // Trong đó: 1 chỗ ngồi (phần 2)
    seats2:   { type: Number, min: 0, default: null },  // Trong đó: 2 chỗ ngồi (phần 2)
    seats4:   { type: Number, min: 0, default: null },  // Trong đó: 4 chỗ ngồi (phần 2)
    notes:    { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'Assets',
  }
);

module.exports = mongoose.model('Asset', assetSchema);
