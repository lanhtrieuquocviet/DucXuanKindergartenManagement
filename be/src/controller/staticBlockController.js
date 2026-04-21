const staticBlockService = require('../services/staticBlockService');

class StaticBlockController {
  /**
   * Get all static blocks
   * GET /api/school-admin/static-blocks
   */
  async getAllStaticBlocks(req, res) {
    try {
      const { status, search } = req.query;
      const filter = {};
      
      if (status) filter.status = status;
      if (search) filter.search = search;

      const blocks = await staticBlockService.getAllStaticBlocks(filter);
      
      res.status(200).json({
        status: 'success',
        data: blocks,
        total: blocks.length,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  /**
   * Get static block by ID
   * GET /api/school-admin/static-blocks/:id
   */
  async getStaticBlockById(req, res) {
    try {
      const { id } = req.params;
      const block = await staticBlockService.getStaticBlockById(id);
      
      res.status(200).json({
        status: 'success',
        data: block,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  /**
   * Create new static block
   * POST /api/school-admin/static-blocks
   */
  async createStaticBlock(req, res) {
    try {
      const { name, description, maxClasses, minAge, maxAge, status } = req.body;

      const block = await staticBlockService.createStaticBlock({
        name,
        description,
        maxClasses,
        minAge,
        maxAge,
        status,
      });

      res.status(201).json({
        status: 'success',
        message: 'Khối được tạo thành công',
        data: block,
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  /**
   * Update static block
   * PUT /api/school-admin/static-blocks/:id
   */
  async updateStaticBlock(req, res) {
    try {
      const { id } = req.params;
      const { name, description, maxClasses, minAge, maxAge, status } = req.body;

      const block = await staticBlockService.updateStaticBlock(id, {
        name,
        description,
        maxClasses,
        minAge,
        maxAge,
        status,
      });

      res.status(200).json({
        status: 'success',
        message: 'Khối được cập nhật thành công',
        data: block,
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  /**
   * Delete static block
   * DELETE /api/school-admin/static-blocks/:id
   */
  async deleteStaticBlock(req, res) {
    try {
      const { id } = req.params;
      await staticBlockService.deleteStaticBlock(id);

      res.status(200).json({
        status: 'success',
        message: 'Khối được xóa thành công',
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  /**
   * Get all active static blocks
   * GET /api/static-blocks/active
   */
  async getActiveStaticBlocks(req, res) {
    try {
      const blocks = await staticBlockService.getActiveStaticBlocks();

      res.status(200).json({
        status: 'success',
        data: blocks,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
}

module.exports = new StaticBlockController();
