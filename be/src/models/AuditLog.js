const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true,
    // e.g., 'CREATE_STUDENT', 'UPDATE_CLASS', 'FINISH_ACADEMIC_YEAR'
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  targetModel: {
    type: String,
    required: true,
    // e.g., 'Student', 'Classes', 'AcademicYear'
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  oldData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  newData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  }
}, {
  timestamps: true,
  collection: 'AuditLogs'
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
