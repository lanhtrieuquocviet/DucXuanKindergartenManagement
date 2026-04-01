const BPMWorkflow = require('../models/BPMWorkflow');
const SystemLog = require('../models/SystemLog');

/**
 * BPM Engine - Bộ máy thực thi và so khớp quy trình cho toàn trường
 */
class BPMEngine {
  /**
   * Kiểm tra xem một hành động chuyển bước có hợp lệ theo quy trình đã lưu không
   * @param {string} module - Module muốn kiểm tra (ví dụ: 'attendance')
   * @param {string} fromStepLabel - Tên bước hiện tại
   * @param {string} toStepLabel - Tên bước muốn chuyển tới
   * @param {object} user - Thông tin người đang thực hiện (để ghi log)
   */
  /**
   * Kiểm tra xem một hành động chuyển bước có hợp lệ theo quy trình đã lưu không
   * @param {string} module - Module muốn kiểm tra (ví dụ: 'attendance')
   * @param {string} workflowName - Tên quy trình cụ thể (không bắt buộc)
   * @param {string} fromStepLabel - Tên bước hiện tại
   * @param {string} toStepLabel - Tên bước muốn chuyển tới
   * @param {object} user - Thông tin người đang thực hiện (để ghi log)
   */
  static async validateTransition(module, workflowName, fromStepLabel, toStepLabel, user = null) {
    try {
      // 1. Lấy quy trình Đang hoạt động (active) cho module và tên (nếu có)
      let query = { module, status: 'active' };
      if (workflowName) {
        query.name = workflowName;
      }

      let workflow = await BPMWorkflow.findOne(query);
      
      // Nếu không tìm thấy active theo tên, lấy cái mới nhất của module đó (fallback)
      if (!workflow) {
        let fallbackQuery = { module };
        if (workflowName) fallbackQuery.name = workflowName;
        workflow = await BPMWorkflow.findOne(fallbackQuery).sort({ updatedAt: -1 });
      }
      
      if (!workflow) {
        console.log(`⚠️ Không tìm thấy quy trình BPM cho module: ${module}${workflowName ? ` | Tên: ${workflowName}` : ''}. Bỏ qua kiểm tra.`);
        return { isValid: true, message: 'No workflow defined, proceeding as default.' };
      }

      const { nodes, edges } = workflow;

      // 2. Tìm ID của bước hiện tại và bước đích dựa trên tên (label)
      const fromNode = nodes.find(n => n.data.label.includes(fromStepLabel));
      const toNode = nodes.find(n => n.data.label.includes(toStepLabel));

      if (!fromNode || !toNode) {
        return { isValid: false, message: `Bước '${fromStepLabel}' hoặc '${toStepLabel}' không tồn tại trong sơ đồ BPM '${workflow.name}'.` };
      }

      // 3. Tìm xem có đường nối (Edge) nào từ From -> To không
      const hasConnection = edges.some(e => e.source === fromNode.id && e.target === toNode.id);

      // 4. GHI NHẬT KÝ ĐỐI SOÁT (BPM Trace)
      if (user) {
        await SystemLog.create({
          actorId: user._id,
          actorName: user.username,
          action: hasConnection ? 'BPM_MATCH_SUCCESS' : 'BPM_MATCH_FAILED',
          detail: `[BPM Trace] Luồng: ${module} | Quy trình: ${workflow.name} | Từ: [${fromStepLabel}] -> [${toStepLabel}] | Kết quả: ${hasConnection ? 'HỢP LỆ' : 'SAI QUY TRÌNH'}`,
          path: '/bpm/engine/trace',
          method: 'INTERNAL',
        });
      }

      if (hasConnection) {
        return { isValid: true, message: 'Hợp lệ theo quy trình.' };
      } else {
        return { isValid: false, message: `Hành động sai quy trình! Tại quy trình [${workflow.name}], từ [${fromStepLabel}] không được phép nhảy tới [${toStepLabel}].` };
      }
    } catch (err) {
      console.error('BPM Engine Error:', err);
      return { isValid: false, message: 'Lỗi bộ máy BPM.' };
    }
  }
}

module.exports = BPMEngine;
