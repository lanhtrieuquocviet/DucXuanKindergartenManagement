const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

  status: {
  type: String,
  enum: [
    "draft",
    "pending",
    "approved",
    "active",
    "completed",
    "rejected"
  ],
  default: "draft"
  },

    rejectReason: {
      type: String,
      default: "",
    },

    /** Mã lý do gợi ý (vd: nutrition, other, ...) */
    rejectPresets: {
      type: [String],
      default: [],
    },

    /** Chi tiết phản hồi của ban giám hiệu */
    rejectDetail: {
      type: String,
      default: "",
    },

    /** Thời điểm bấm "Áp dụng" (chuyển sang đang áp dụng) */
    appliedAt: {
      type: Date,
      default: null,
    },

    /** Thời điểm bấm "Kết thúc" (chuyển sang lịch sử / completed) */
    endedAt: {
      type: Date,
      default: null,
    },
    nutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      carb: { type: Number, default: 0 },
      avgCalories: { type: Number, default: 0 },
      proteinPercent: { type: Number, default: 0 },
      fatPercent: { type: Number, default: 0 },
      carbPercent: { type: Number, default: 0 },
    },
    nutritionPlan: [
      {
        label: { type: String, required: true },
        target: { type: Number, required: true, default: 0 },
        actual: { type: Number, required: true, default: 0 },
      }
    ],
  },
  {
    timestamps: true,
    collection: "Menus",
  }
);

module.exports = mongoose.model("Menus", menuSchema);
