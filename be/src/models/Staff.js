const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  position: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
}, {
  timestamps: true,
  collection: 'Staff',
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
