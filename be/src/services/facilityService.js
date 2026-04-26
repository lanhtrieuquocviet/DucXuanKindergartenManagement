const FacilityItem = require('../models/FacilityItem');
const FacilityHandover = require('../models/FacilityHandover');
const FacilityInventory = require('../models/FacilityInventory');
const FacilityIssue = require('../models/FacilityIssue');
const mongoose = require('mongoose');

const facilityService = {
  // --- Asset Management ---
  async getAssetsByLocation(locationId) {
    return await FacilityItem.find({ currentLocationId: locationId })
      .populate({
        path: 'typeId',
        populate: { path: 'categoryId' }
      });
  },

  // --- Handover Workflow ---
  async signHandover(handoverId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const handover = await FacilityHandover.findById(handoverId).session(session);
      if (!handover) throw new Error('Không tìm thấy biên bản bàn giao');
      if (String(handover.receiverId) !== String(userId)) {
        throw new Error('Chỉ người nhận mới có quyền ký xác nhận');
      }

      handover.status = 'signed';
      handover.handoverDate = new Date();
      await handover.save({ session });

      // Cập nhật vị trí mới cho toàn bộ tài sản trong biên bản
      for (const item of handover.items) {
        await FacilityItem.findByIdAndUpdate(item.itemId, {
          $set: { currentLocationId: handover.toLocationId }
        }, { session });
      }

      await session.commitTransaction();
      return handover;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  // --- Issue Workflow ---
  async updateIssueStatus(issueId, newStatus, resolution = '') {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const issue = await FacilityIssue.findById(issueId).session(session);
      if (!issue) throw new Error('Không tìm thấy báo cáo sự cố');

      issue.status = newStatus;
      if (resolution) issue.resolution = resolution;
      if (newStatus === 'fixed' || newStatus === 'liquidated') {
        issue.resolvedAt = new Date();
      }
      await issue.save({ session });

      // Cập nhật trạng thái tài sản tương ứng
      let assetStatus = 'good';
      if (newStatus === 'approved' || newStatus === 'repairing') assetStatus = 'repairing';
      if (newStatus === 'fixed') assetStatus = 'good';
      if (newStatus === 'liquidated') assetStatus = 'liquidated';

      await FacilityItem.findByIdAndUpdate(issue.itemId, {
        $set: { status: assetStatus }
      }, { session });

      await session.commitTransaction();
      return issue;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  // --- Inventory Workflow ---
  async approveInventory(inventoryId, chairmanId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const inventory = await FacilityInventory.findById(inventoryId).session(session);
      if (!inventory) throw new Error('Không tìm thấy biên bản kiểm kê');
      if (String(inventory.chairmanId) !== String(chairmanId)) {
        throw new Error('Chỉ Trưởng ban mới có quyền phê duyệt báo cáo kiểm kê');
      }

      inventory.status = 'approved';
      inventory.approvedAt = new Date();
      await inventory.save({ session });

      // Cập nhật trạng thái thực tế cho tài sản sau khi kiểm kê
      for (const detail of inventory.details) {
        await FacilityItem.findByIdAndUpdate(detail.itemId, {
          $set: { 
            status: detail.actualStatus,
            lastInventoryDate: new Date()
          }
        }, { session });
      }

      await session.commitTransaction();
      return inventory;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
};

module.exports = facilityService;
