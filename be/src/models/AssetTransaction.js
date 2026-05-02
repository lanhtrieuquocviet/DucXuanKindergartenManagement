const mongoose = require('mongoose');

const assetTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['ALLOCATE', 'TRANSFER', 'RECOVER', 'DISPOSE', 'UPDATE'],
      required: true,
    },
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    fromRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      default: null,
    },
    toRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
    },
    snapshot: {
      name: String,
      assetCode: String,
      unit: String,
      category: String,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'AssetTransactions',
  }
);

// Indexing for performance
assetTransactionSchema.index({ inventoryItemId: 1, date: -1 });
assetTransactionSchema.index({ fromRoomId: 1, date: -1 });
assetTransactionSchema.index({ toRoomId: 1, date: -1 });

module.exports = mongoose.model('AssetTransaction', assetTransactionSchema);
