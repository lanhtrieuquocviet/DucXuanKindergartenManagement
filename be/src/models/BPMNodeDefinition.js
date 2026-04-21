const mongoose = require('mongoose');

const BPMNodeDefinitionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  label: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#ffffff'
  },
  category: {
    type: String,
    enum: ['system', 'ai', 'logic', 'audit', 'action', 'Other'],
    default: 'Other'
  },
  configTemplate: {
    type: mongoose.Schema.Types.Mixed, // Chứa cấu hình mẫu cho từng loại node
    default: {}
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('BPMNodeDefinition', BPMNodeDefinitionSchema);
