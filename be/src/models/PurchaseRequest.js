const mongoose = require('mongoose');

const purchaseRequestSchema = new mongoose.Schema(
  {
    requestCode: { type: String, trim: true },
    assetName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unit: { type: String, trim: true, default: 'Cái' },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classes', required: true },
    estimatedCost: { type: Number, default: 0 },
    reason: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    images: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    collection: 'PurchaseRequests',
  }
);

purchaseRequestSchema.pre('save', async function (next) {
  if (!this.requestCode) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.requestCode = `YCM-${year}${String(count + 1).padStart(2, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PurchaseRequest', purchaseRequestSchema);
