const mongoose = require('mongoose');

const staticBlockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên khối là bắt buộc'],
      unique: true,
      trim: true,
      maxlength: [50, 'Tên khối không được vượt quá 50 ký tự'],
    },
    description: {
      type: String,
      required: [true, 'Mô tả là bắt buộc'],
      maxlength: [500, 'Mô tả không được vượt quá 500 ký tự'],
    },
    maxClasses: {
      type: Number,
      required: [true, 'Số lớp tối đa là bắt buộc'],
      min: [1, 'Số lớp tối đa phải từ 1 trở lên'],
      max: [50, 'Số lớp tối đa không được vượt quá 50'],
    },
    minAge: {
      type: Number,
      required: [true, 'Tuổi tối thiểu là bắt buộc'],
      min: [0, 'Tuổi tối thiểu không được âm'],
      max: [18, 'Tuổi tối thiểu không được vượt quá 18'],
    },
    maxAge: {
      type: Number,
      required: [true, 'Tuổi tối đa là bắt buộc'],
      min: [0, 'Tuổi tối đa không được âm'],
      max: [18, 'Tuổi tối đa không được vượt quá 18'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: 'Trạng thái phải là active hoặc inactive',
      },
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Validation: minAge must be less than maxAge
staticBlockSchema.pre('save', function (next) {
  if (this.minAge >= this.maxAge) {
    throw new Error('Tuổi tối thiểu phải nhỏ hơn tuổi tối đa');
  }
  next();
});

staticBlockSchema.pre('findByIdAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.minAge && update.maxAge && update.minAge >= update.maxAge) {
    throw new Error('Tuổi tối thiểu phải nhỏ hơn tuổi tối đa');
  }
  if (update.minAge && !update.maxAge) {
    // minAge must be less than existing maxAge
    this.model.findById(this.getFilter()._id).then((doc) => {
      if (doc && update.minAge >= doc.maxAge) {
        throw new Error('Tuổi tối thiểu phải nhỏ hơn tuổi tối đa');
      }
    });
  }
  if (update.maxAge && !update.minAge) {
    // maxAge must be greater than existing minAge
    this.model.findById(this.getFilter()._id).then((doc) => {
      if (doc && update.maxAge <= doc.minAge) {
        throw new Error('Tuổi tối đa phải lớn hơn tuổi tối thiểu');
      }
    });
  }
  next();
});

module.exports = mongoose.model('StaticBlock', staticBlockSchema);
