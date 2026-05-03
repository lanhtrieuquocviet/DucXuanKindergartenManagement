const StudentRequest = require('../models/StudentRequest');
const Student = require('../models/Student');
const mongoose = require('mongoose');

const createRequest = async (data) => {
  return await StudentRequest.create(data);
};

const getRequests = async (filter = {}) => {
  return await StudentRequest.find(filter)
    .populate('studentId', 'fullName studentCode')
    .populate('parentId', 'fullName phone')
    .populate('processedBy', 'fullName')
    .sort({ createdAt: -1 });
};

const updateRequestStatus = async (requestId, adminId, status, adminNote = '') => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const request = await StudentRequest.findById(requestId).session(session);
    if (!request) throw new Error('Không tìm thấy yêu cầu');
    if (request.status !== 'pending') throw new Error('Yêu cầu đã được xử lý');

    request.status = status;
    request.adminNote = adminNote;
    request.processedBy = adminId;
    request.processedAt = new Date();
    await request.save({ session });

    if (status === 'approved') {
      const studentStatus = request.type === 'transfer' ? 'transferred' : 'withdrawn';
      await Student.findByIdAndUpdate(request.studentId, { status: studentStatus }, { session });
    }

    await session.commitTransaction();
    return request;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  createRequest,
  getRequests,
  updateRequestStatus,
};
