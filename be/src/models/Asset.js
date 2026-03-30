const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    assetCode:        { type: String, required: true, trim: true, unique: true },
    name:             { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em',
        'Số bàn, ghế ngồi',
        'Khối phòng phục vụ học tập',
        'Phòng tổ chức ăn, nghỉ',
        'Công trình công cộng và khối phòng phục vụ khác',
        'Khối phòng hành chính quản trị',
        'Diện tích đất',
        'Thiết bị dạy học và CNTT',
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
    condition: {
      type: String,
      enum: ['Tốt', 'Hỏng', 'Cần sửa chữa'],
      default: 'Tốt',
    },
    notes:    { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'Assets',
  }
);

module.exports = mongoose.model('Asset', assetSchema);
