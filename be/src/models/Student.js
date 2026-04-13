const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentCode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  // stored parent contact number; some existing docs may use parentPhone field
  parentPhone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classes'
  },
  academicYearId: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYears' }],
    default: [],
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // parentId: tham chiếu đến tài khoản User của phụ huynh
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  parentProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParentProfiles',
    default: null,
  },
  avatar: {
    type: String,
    trim: true,
    default: ''
  },
  needsSpecialAttention: {
    type: Boolean,
    default: false
  },
  specialNote: {
    type: String,
    trim: true,
    default: ''
  },
  // Embedding khuôn mặt (128 chiều từ face-api.js) - giữ lại để backward compat
  faceEmbedding: {
    type: [Number],
    default: []
  },
  // Nhiều góc mặt (tối đa 5 embedding, mỗi cái là mảng 128 số)
  faceEmbeddings: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  // Ảnh preview cho từng góc (tương ứng theo index với faceEmbeddings)
  faceImageUrls: {
    type: [String],
    default: []
  },
  faceRegisteredAt: {
    type: Date,
    default: null
  },
  faceImageUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'Students'
});

const Student = mongoose.model('Students', studentSchema);

module.exports = Student;
