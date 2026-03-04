const mongoose = require('mongoose');

const PUBLIC_INFO_CATEGORIES = [
  'Thông tin chung về cơ sở giáo dục',
  'Công khai thu chi tài chính',
  'Điều kiện đảm bảo chất lượng hoạt động giáo dục',
  'Kế hoạch và kết quả hoạt động giáo dục',
  'Báo cáo thường niên',
];

const publicInfoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: PUBLIC_INFO_CATEGORIES,
      required: true,
    },
    attachmentUrl: {
      type: String,
      trim: true,
      default: null,
    },
    attachmentType: {
      type: String,
      enum: ['pdf', 'word', null],
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'inactive'],
      default: 'draft',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'PublicInfos',
  }
);

const PublicInfo = mongoose.model('PublicInfo', publicInfoSchema);

module.exports = PublicInfo;
module.exports.PUBLIC_INFO_CATEGORIES = PUBLIC_INFO_CATEGORIES;
