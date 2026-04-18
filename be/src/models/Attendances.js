const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Students',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classes',
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'leave'],
      default: 'present',
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Ghi chú tối đa 300 ký tự'],
    },
    // Ảnh check-in và check-out riêng biệt
    checkinImageName: {
      type: String,
      trim: true,
      default: '',
    },
    checkoutImageName: {
      type: String,
      trim: true,
      default: '',
    },
    time: {
      checkIn: { type: Date, default: null },
      checkOut: { type: Date, default: null },
    },
    timeString: {
      checkIn: {
        type: String,
        trim: true,
        default: '',
        validate: {
          validator: (v) => !v || /^\d{2}:\d{2}$/.test(v),
          message: 'Giờ check-in phải theo định dạng HH:mm',
        },
      },
      checkOut: {
        type: String,
        trim: true,
        default: '',
        validate: {
          validator: (v) => !v || /^\d{2}:\d{2}$/.test(v),
          message: 'Giờ check-out phải theo định dạng HH:mm',
        },
      },
    },
    isTakeOff: {
      type: Boolean,
      default: false,
    },
    // Thông tin người đưa (check-in)
    delivererType: {
      type: String,
      trim: true,
      default: '',
    },
    delivererOtherInfo: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Thông tin người đưa tối đa 100 ký tự'],
    },
    delivererOtherImageName: {
      type: String,
      trim: true,
      default: '',
    },
    // Thông tin người đón (check-out)
    receiverType: {
      type: String,
      trim: true,
      default: '',
    },
    receiverOtherInfo: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Thông tin người đón tối đa 100 ký tự'],
    },
    receiverOtherImageName: {
      type: String,
      trim: true,
      default: '',
    },
    // Ghi chú đồ mang về (check-out)
    checkoutBelongingsNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Ghi chú đồ mang về tối đa 200 ký tự'],
    },
    // Đồ mang đến (ghi nhận khi check-in)
    checkinBelongings: {
      type: [String],
      default: [],
    },
    // Đồ mang về (ghi nhận khi check-in)
    checkoutBelongings: {
      type: [String],
      default: [],
    },
    // Điểm danh bằng AI (nhận diện khuôn mặt)
    checkedInByAI: {
      type: Boolean,
      default: false,
    },
    checkedOutByAI: {
      type: Boolean,
      default: false,
    },
    // Giáo viên xác nhận trực tiếp khi đón trẻ (bỏ qua xác nhận PH)
    teacherConfirmedCheckout: {
      type: Boolean,
      default: false,
    },
    // Phương thức xác nhận checkout: 'teacher' | 'parent_confirm' | ''
    checkoutConfirmMethod: {
      type: String,
      trim: true,
      default: '',
      enum: {
        values: ['teacher', 'parent_confirm', ''],
        message: 'Phương thức xác nhận không hợp lệ: {VALUE}',
      },
    },
    // Trạng thái xác nhận của phụ huynh: '' | 'pending' | 'confirmed'
    checkoutStatus: {
      type: String,
      enum: ['', 'pending', 'confirmed'],
      default: '',
    },
    // Dữ liệu tạm khi GV gửi thông tin chờ PH xác nhận
    pendingCheckoutData: {
      receiverType: { type: String, default: '' },
      receiverOtherInfo: { type: String, default: '' },
      receiverOtherImageName: { type: String, default: '' },
      checkoutImageName: { type: String, default: '' },
      sentAt: { type: Date, default: null },
    },
    // Lý do vắng mặt (nếu status = 'absent')
    absentReason: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Lý do vắng mặt tối đa 100 ký tự'],
    },
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
    timestamps: true,
    collection: 'Attendances',
  }
);

// 1 học sinh chỉ nên có 1 bản ghi điểm danh cho 1 ngày
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

const Attendances = mongoose.model('Attendances', attendanceSchema);

module.exports = Attendances;

