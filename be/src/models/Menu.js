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
      default: null,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYears",
      index: true,
    },

    /** Trạng thái: active ~ dang_ap_dung, completed ~ lich_su */
    status: {
      type: String,
      enum: [
        "draft",
        "pending_headparent",
        "pending",
        "approved",
        "active",
        "completed",
        "rejected"
      ],
      default: "draft"
    },

    /** Cờ cho biết đây có phải thực đơn hiện hành hay không */
    isCurrent: {
      type: Boolean,
      default: false,
    },

    /** Phiên bản thực đơn (v1, v2, ...) */
    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    /** Lý do thay đổi phiên bản */
    changeReason: {
      type: String,
      default: "",
    },

    /** Menu cha dùng để đối soát khi clone phiên bản */
    parentMenuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menus",
      default: null,
    },

    /** Thời điểm thay đổi phiên bản để FE highlight ngày chỉnh sửa */
    changedAt: {
      type: Date,
      default: null,
    },
    /** Ý kiến / xét duyệt của Hội trưởng phụ huynh */
    headParentReview: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
      comment:    { type: String, default: '' },
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

    /** Thời điểm dự kiến bắt đầu tự động áp dụng */
    scheduledStartAt: {
      type: Date,
      default: null,
    },

    /** Thời điểm dự kiến tự động kết thúc */
    scheduledEndAt: {
      type: Date,
      default: null,
    },

    /** Thời điểm bấm "Kết thúc" (chuyển sang lịch sử / completed) */
    endedAt: {
      type: Date,
      default: null,
    },

    /** Nhật ký thao tác (duyệt, từ chối, yêu cầu sửa, áp dụng, kết thúc, gửi duyệt…) */
    statusHistory: {
      type: [
        {
          type: {
            type: String,
            enum: [
              "submitted",
              "headparent_reviewed",
              "headparent_rejected_approved",
              "approved",
              "rejected_pending",
              "request_edit_active",
              "applied",
              "ended",
            ],
            required: true,
          },
          at: { type: Date, default: Date.now },
          actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          presets: { type: [String], default: [] },
          detail: { type: String, default: "" },
        },
      ],
      default: [],
    },

    /** Snapshot lịch sử khi cần lưu bản cũ (vd: đang áp dụng -> yêu cầu chỉnh sửa) */
    historySnapshots: {
      type: [
        {
          reason: {
            type: String,
            enum: ["request_edit_active"],
            required: true,
          },
          capturedAt: { type: Date, default: Date.now },
          capturedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          menuSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
          dailyMenus: { type: [mongoose.Schema.Types.Mixed], default: [] },
        },
      ],
      default: [],
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
