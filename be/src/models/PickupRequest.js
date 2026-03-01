const mongoose = require("mongoose");

const pickupRequestSchema = new mongoose.Schema(
  {
    // Học sinh liên quan (bắt buộc)
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Students", // khớp với collection Students của bạn
      required: true,
      index: true, // tăng tốc độ query theo học sinh
    },

    // Phụ huynh đăng ký (người tạo request)
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Thông tin người được phép đưa/đón
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    relation: {
      type: String,
      enum: ["Bố", "Mẹ", "Ông", "Bà", "Anh/Chị", "Khác"],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      // validate số điện thoại Việt Nam cơ bản
      match: [/^(0|\+84)[3|5|7|8|9]\d{8}$/, "Số điện thoại không hợp lệ"],
    },

    // Ảnh người đưa/đón (URL từ Cloudinary)
    imageUrl: {
      type: String,
      default: "",
    },

    // Trạng thái duyệt
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true, // hay query theo trạng thái
    },

    // Giáo viên xử lý (duyệt/từ chối)
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },

    // Lý do từ chối (nếu giáo viên từ chối)
    rejectedReason: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // Thời gian
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // tự động cập nhật createdAt/updatedAt
    collection: "pickuprequests",
  }
);

// Tự động cập nhật updatedAt trước khi save
pickupRequestSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("PickupRequest", pickupRequestSchema);
