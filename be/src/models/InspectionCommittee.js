const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    position: { type: String, trim: true, default: '' },       // Chức vụ (e.g. Hiệu trưởng, Kế toán)
    role:     { type: String, trim: true, default: 'Thành viên' }, // Nhiệm vụ phân công
    notes:    { type: String, trim: true, default: '' },        // Ghi chú
  },
  { _id: true }
);

const inspectionCommitteeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    foundedDate: { type: Date, required: true },
    decisionNumber: { type: String, required: true, trim: true },
    members: [memberSchema],
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    endedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'InspectionCommittees',
  }
);

module.exports = mongoose.model('InspectionCommittee', inspectionCommitteeSchema);
