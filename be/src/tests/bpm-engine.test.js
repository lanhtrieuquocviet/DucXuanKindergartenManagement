const BPMExecutionService = require('../services/bpmExecution.service');
const Attendances = require('../models/Attendances');
const BPMWorkflow = require('../models/BPMWorkflow');
const { createSystemLog } = require('../utils/systemLog');

// 1. Mock các module phụ thuộc
jest.mock('../models/Attendances');
jest.mock('../models/BPMWorkflow');
jest.mock('../utils/systemLog');

describe('BPM Execution Engine Unit Tests', () => {
  let mockRecord;
  let mockWorkflow;
  let mockReq;

  beforeEach(() => {
    jest.clearAllMocks();

    // Giả lập bản ghi Attendance
    mockRecord = {
      _id: 'att_001',
      bpmWorkflowId: 'flow_001',
      currentBpmNode: 'node_start',
      bpmStatus: 'in_progress',
      bpmRuntimeData: new Map(),
      save: jest.fn().mockResolvedValue(true),
      toObject: function() { return { ...this }; }
    };

    // Giả lập Workflow sơ đồ
    mockWorkflow = {
      _id: 'flow_001',
      name: 'Test Flow',
      nodes: [
        { id: 'node_start', type: 'input', data: { label: 'Bắt đầu' } },
        { id: 'node_audit', type: 'audit_photo_proof', data: { label: 'Kiểm tra ảnh' } },
        { id: 'node_save', type: 'save_record', data: { label: 'Lưu bản ghi' } },
        { id: 'node_end', type: 'output', data: { label: 'Kết thúc' } }
      ],
      edges: [
        { id: 'e1', source: 'node_start', target: 'node_audit' },
        { id: 'e2_true', source: 'node_audit', target: 'node_save', sourceHandle: 'true' },
        { id: 'e2_false', source: 'node_audit', target: 'node_end', sourceHandle: 'false' },
        { id: 'e3', source: 'node_save', target: 'node_end' }
      ]
    };

    mockReq = {
      user: { _id: 'user_001', username: 'teacher_test' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Jest' }
    };

    // Mock hàm tìm kiếm
    Attendances.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockRecord)
    });
    BPMWorkflow.findById.mockResolvedValue(mockWorkflow);
  });

  test('TC-01: Chuyển tiếp cơ bản từ Node Input sang Node tiếp theo', async () => {
    const result = await BPMExecutionService.executeNext('att_001', {}, mockReq);

    expect(result.success).toBe(true);
    expect(result.currentNode).toBe('node_audit');
    expect(mockRecord.save).toHaveBeenCalled();
  });

  test('TC-02: Rẽ nhánh đúng (True) khi Audit Photo đạt yêu cầu', async () => {
    // Giả lập đang đứng ở node_audit
    mockRecord.currentBpmNode = 'node_audit';
    
    // Gửi dữ liệu có ảnh
    const result = await BPMExecutionService.executeNext('att_001', { photo: 'link_anh.jpg' }, mockReq);

    expect(result.success).toBe(true);
    expect(result.currentNode).toBe('node_save');
    expect(result.message).toContain('[Đạt]');
  });

  test('TC-03: Rẽ nhánh đúng (False) khi Audit Photo thiếu dữ liệu', async () => {
    mockRecord.currentBpmNode = 'node_audit';
    
    // Gửi dữ liệu TRỐNG
    const result = await BPMExecutionService.executeNext('att_001', {}, mockReq);

    expect(result.success).toBe(true);
    expect(result.currentNode).toBe('node_end'); // Nhảy về node_end (cạnh false)
    expect(result.message).toContain('[Không đạt]');
  });

  test('TC-04: Kiểm tra hành động save_record cập nhật trạng thái bản ghi', async () => {
    mockRecord.currentBpmNode = 'node_save';
    mockRecord.type = 'checkin';

    const result = await BPMExecutionService.executeNext('att_001', {}, mockReq);

    expect(result.success).toBe(true);
    expect(mockRecord.status).toBe('present'); // Đã được cập nhật bởi runNodeAction
    expect(mockRecord.bpmStatus).toBe('completed'); // Vì node tiếp theo là output
  });

  test('TC-05: Ghi log hệ thống cho mỗi bước thực thi', async () => {
    await BPMExecutionService.executeNext('att_001', {}, mockReq);

    // Kiểm tra xem hàm createSystemLog có được gọi không
    expect(createSystemLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'BPM_STEP_TRACE'
    }));
  });
});
