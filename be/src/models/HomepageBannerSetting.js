const mongoose = require('mongoose');

const bannerItemSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true, trim: true },
    altText: { type: String, default: 'Banner trường mầm non', trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const homepageBannerSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'homepage' },
    banners: { type: [bannerItemSchema], default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HomepageBannerSetting', homepageBannerSettingSchema);
