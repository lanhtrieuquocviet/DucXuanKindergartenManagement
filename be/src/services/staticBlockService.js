const StaticBlock = require('../models/StaticBlock');

class StaticBlockService {
  /**
   * Get all static blocks with optional filtering
   */
  async getAllStaticBlocks(filter = {}) {
    try {
      const query = {};
      
      if (filter.status) {
        query.status = filter.status;
      }
      
      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } },
        ];
      }

      const blocks = await StaticBlock.find(query).sort({ createdAt: -1 });

      return blocks.map((block) => ({
        _id: block._id,
        name: block.name,
        description: block.description,
        maxClasses: block.maxClasses,
        minAge: block.minAge,
        maxAge: block.maxAge,
        status: block.status,
        ageLabel: `${block.minAge} - ${block.maxAge} tuổi`,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
      }));
    } catch (error) {
      throw new Error(`Failed to get static blocks: ${error.message}`);
    }
  }

  /**
   * Get static block by ID
   */
  async getStaticBlockById(id) {
    try {
      const block = await StaticBlock.findById(id);
      
      if (!block) {
        throw new Error('Khối không tồn tại');
      }

      return {
        _id: block._id,
        name: block.name,
        description: block.description,
        maxClasses: block.maxClasses,
        minAge: block.minAge,
        maxAge: block.maxAge,
        status: block.status,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to get static block: ${error.message}`);
    }
  }

  /**
   * Create new static block
   */
  async createStaticBlock(data) {
    try {
      // Validate required fields
      if (!data.name || !data.description || !data.maxClasses || data.minAge === undefined || data.maxAge === undefined) {
        throw new Error('Tất cả các trường bắt buộc phải được cung cấp');
      }

      // Validate age range
      if (data.minAge >= data.maxAge) {
        throw new Error('Tuổi tối thiểu phải nhỏ hơn tuổi tối đa');
      }

      // Check if name already exists
      const existingBlock = await StaticBlock.findOne({ name: data.name });
      if (existingBlock) {
        throw new Error(`Tên khối "${data.name}" đã tồn tại`);
      }

      const newBlock = new StaticBlock({
        name: data.name.trim(),
        description: data.description.trim(),
        maxClasses: data.maxClasses,
        minAge: data.minAge,
        maxAge: data.maxAge,
        status: data.status || 'active',
      });

      const savedBlock = await newBlock.save();

      return {
        _id: savedBlock._id,
        name: savedBlock.name,
        description: savedBlock.description,
        maxClasses: savedBlock.maxClasses,
        minAge: savedBlock.minAge,
        maxAge: savedBlock.maxAge,
        status: savedBlock.status,
        ageLabel: `${savedBlock.minAge} - ${savedBlock.maxAge} tuổi`,
        createdAt: savedBlock.createdAt,
        updatedAt: savedBlock.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to create static block: ${error.message}`);
    }
  }

  /**
   * Update static block
   */
  async updateStaticBlock(id, data) {
    try {
      const block = await StaticBlock.findById(id);
      
      if (!block) {
        throw new Error('Khối không tồn tại');
      }

      // Validate age range if provided
      const minAge = data.minAge !== undefined ? data.minAge : block.minAge;
      const maxAge = data.maxAge !== undefined ? data.maxAge : block.maxAge;
      
      if (minAge >= maxAge) {
        throw new Error('Tuổi tối thiểu phải nhỏ hơn tuổi tối đa');
      }

      // Check if new name conflicts with other blocks
      if (data.name && data.name !== block.name) {
        const existingBlock = await StaticBlock.findOne({ name: data.name });
        if (existingBlock) {
          throw new Error(`Tên khối "${data.name}" đã tồn tại`);
        }
      }

      // Update fields
      if (data.name) block.name = data.name.trim();
      if (data.description) block.description = data.description.trim();
      if (data.maxClasses) block.maxClasses = data.maxClasses;
      if (data.minAge !== undefined) block.minAge = data.minAge;
      if (data.maxAge !== undefined) block.maxAge = data.maxAge;
      if (data.status) block.status = data.status;

      const updatedBlock = await block.save();

      return {
        _id: updatedBlock._id,
        name: updatedBlock.name,
        description: updatedBlock.description,
        maxClasses: updatedBlock.maxClasses,
        minAge: updatedBlock.minAge,
        maxAge: updatedBlock.maxAge,
        status: updatedBlock.status,
        ageLabel: `${updatedBlock.minAge} - ${updatedBlock.maxAge} tuổi`,
        createdAt: updatedBlock.createdAt,
        updatedAt: updatedBlock.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to update static block: ${error.message}`);
    }
  }

  /**
   * Delete static block
   */
  async deleteStaticBlock(id) {
    try {
      const block = await StaticBlock.findById(id);
      
      if (!block) {
        throw new Error('Khối không tồn tại');
      }

      // Check if any grades reference this block
      const Grade = require('../models/Grade');
      const gradeCount = await Grade.countDocuments({ staticBlockId: id });
      
      if (gradeCount > 0) {
        throw new Error(`Không thể xóa khối này vì có ${gradeCount} lớp đang sử dụng`);
      }

      await StaticBlock.findByIdAndDelete(id);

      return { message: 'Khối đã được xóa thành công' };
    } catch (error) {
      throw new Error(`Failed to delete static block: ${error.message}`);
    }
  }

  /**
   * Get all active static blocks (for dropdown/selection)
   */
  async getActiveStaticBlocks() {
    try {
      const blocks = await StaticBlock.find({ status: 'active' }).sort({ createdAt: -1 });

      return blocks.map((block) => ({
        _id: block._id,
        name: block.name,
        description: block.description,
        maxClasses: block.maxClasses,
        minAge: block.minAge,
        maxAge: block.maxAge,
        ageLabel: `${block.minAge} - ${block.maxAge} tuổi`,
      }));
    } catch (error) {
      throw new Error(`Failed to get active static blocks: ${error.message}`);
    }
  }
}

module.exports = new StaticBlockService();
