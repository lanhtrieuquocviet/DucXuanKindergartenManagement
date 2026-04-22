const BPMExecutionService = require('../services/bpmExecution.service');
const Attendances = require('../models/Attendances');
const BPMWorkflow = require('../models/BPMWorkflow');

// Mock dependencies
jest.mock('../models/Attendances');
jest.mock('../models/BPMWorkflow');
jest.mock('../utils/systemLog');

describe('BPM Audit Belongings Check Unit Tests', () => {
  let mockRecord;
  let mockWorkflow;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRecord = {
      _id: 'att_001',
      bpmWorkflowId: 'flow_001',
      currentBpmNode: 'node_audit',
      bpmStatus: 'in_progress',
      bpmRuntimeData: {
        toObject: () => ({}),
        set: jest.fn()
      },
      save: jest.fn().mockResolvedValue(true),
      toObject: function() { 
        return { 
          _id: this._id,
          bpmWorkflowId: this.bpmWorkflowId,
          currentBpmNode: this.currentBpmNode,
          bpmStatus: this.bpmStatus,
          bpmRuntimeData: {}
        }; 
      }
    };

    mockWorkflow = {
      _id: 'flow_001',
      name: 'Test Flow',
      nodes: [
        { id: 'node_audit', type: 'audit_belongings', data: { label: 'Kiểm tra đồ dùng' } },
        { id: 'node_end', type: 'output', data: { label: 'Kết thúc' } }
      ],
      edges: [
        { id: 'e1_true', source: 'node_audit', target: 'node_end', sourceHandle: 'true' },
        { id: 'e1_false', source: 'node_audit', target: 'node_end', sourceHandle: 'false' }
      ]
    };

    Attendances.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockRecord)
    });
    BPMWorkflow.findById.mockResolvedValue(mockWorkflow);
  });

  test('PASS: Có dữ liệu đồ mang theo (Normal Case)', async () => {
    const inputData = { checkinBelongings: ['Balo', 'Sữa'] };
    const result = await BPMExecutionService.executeNext('att_001', inputData);

    expect(result.success).toBe(true);
    expect(result.message).toContain('Có thông tin đồ mang theo');
  });

  test('FAIL: Thiếu dữ liệu đồ mang theo (Normal Case)', async () => {
    const inputData = { checkinBelongings: [] };
    const result = await BPMExecutionService.executeNext('att_001', inputData);

    expect(result.success).toBe(true); // executeNext returns success: true if it ran, but branching info tells the story
    expect(result.message).toContain('[Không đạt]');
    expect(result.message).toContain('Học sinh chưa được kê khai');
  });

  test('PASS: Thiếu dữ liệu nhưng là tài khoản Audit (Audit Bypass)', async () => {
    const inputData = { 
      checkinBelongings: [],
      actorUsername: 'audit_admin',
      isAuditAccount: true 
    };
    const result = await BPMExecutionService.executeNext('att_001', inputData);

    expect(result.success).toBe(true);
    expect(result.message).toContain('[Đạt]');
    expect(result.message).toContain('Được xác nhận bởi tài khoản Audit');
  });

  test('PASS: Thiếu dữ liệu nhưng có role Auditor (Role Bypass)', async () => {
    const inputData = { 
      checkinBelongings: [],
      actorRole: 'Auditor' 
    };
    const result = await BPMExecutionService.executeNext('att_001', inputData);

    expect(result.success).toBe(true);
    expect(result.message).toContain('[Đạt]');
    expect(result.message).toContain('Được xác nhận bởi tài khoản Audit');
  });
});
