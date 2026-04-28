const FacilityItem = require('../models/FacilityItem');
const FacilityHandover = require('../models/FacilityHandover');
const FacilityInventory = require('../models/FacilityInventory');
const FacilityIssue = require('../models/FacilityIssue');
const FacilityType = require('../models/FacilityType');
const Asset = require('../models/Asset');
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
      const inventory = await FacilityInventory.findById(inventoryId)
        .populate('locationId')
        .session(session);
      
      if (!inventory) throw new Error('Không tìm thấy biên bản kiểm kê');
      if (String(inventory.chairmanId) !== String(chairmanId)) {
        throw new Error('Chỉ Trưởng ban mới có quyền phê duyệt báo cáo kiểm kê');
      }

      inventory.status = 'approved';
      inventory.approvedAt = new Date();
      await inventory.save({ session });

      // 1. Cập nhật trạng thái thực tế cho từng tài sản sau khi kiểm kê
      const affectedTypeIds = new Set();
      for (const detail of inventory.details) {
        const item = await FacilityItem.findByIdAndUpdate(detail.itemId, {
          $set: { 
            status: detail.actualStatus,
            lastInventoryDate: new Date()
          }
        }, { session, new: true });
        
        if (item) affectedTypeIds.add(item.typeId.toString());
      }

      // 2. Cập nhật số lượng vào Báo cáo cuối năm (Asset type='csvc') và Kho (Asset type='asset')
      const locationName = inventory.locationId?.name;

      for (const typeId of affectedTypeIds) {
        const type = await FacilityType.findById(typeId).session(session);
        if (!type) continue;

        // Tính toán số lượng thực tế (tổng toàn trường) cho Báo cáo cuối năm
        const totalGood = await FacilityItem.countDocuments({ 
          typeId, 
          status: 'good' 
        }).session(session);
        
        const totalDamaged = await FacilityItem.countDocuments({ 
          typeId, 
          status: 'damaged' 
        }).session(session);

        // Cập nhật Báo cáo cuối năm (CSVC) - Thường là số liệu tổng hợp toàn trường
        await Asset.updateMany(
          { name: type.name, type: 'csvc' },
          { 
            $set: { 
              quantity: totalGood,
              brokenQuantity: totalDamaged
            } 
          },
          { session }
        );

        // Tính toán số lượng thực tế tại Vị trí/Kho vừa kiểm kê
        if (locationName) {
          const roomGood = await FacilityItem.countDocuments({ 
            typeId, 
            currentLocationId: inventory.locationId._id,
            status: 'good' 
          }).session(session);

          const roomDamaged = await FacilityItem.countDocuments({ 
            typeId, 
            currentLocationId: inventory.locationId._id,
            status: 'damaged' 
          }).session(session);

          // Cập nhật số lượng tại Kho/Phòng cụ thể (Asset type='asset')
          await Asset.updateMany(
            { name: type.name, type: 'asset', room: locationName },
            { 
              $set: { 
                quantity: roomGood,
                brokenQuantity: roomDamaged
              } 
            },
            { session }
          );
        }
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
