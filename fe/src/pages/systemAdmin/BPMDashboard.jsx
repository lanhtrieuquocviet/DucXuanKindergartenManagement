import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GetAppIcon from '@mui/icons-material/GetApp';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import SaveIcon from '@mui/icons-material/Save';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem as MuiMenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import { API_BASE_URL, ENDPOINTS } from '../../service/api';
import { SCHOOL_ADMIN_MENU_ITEMS, createSchoolAdminMenuSelect } from '../schoolAdmin/schoolAdminMenuConfig';

// Các node mẫu ban đầu
const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Bắt đầu quy trình' }, type: 'input' },
];

const initialEdges = [];

export default function BPMDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { getBPMWorkflows, saveBPMWorkflow, getBPMHealth, generateBPMFromDocx, loading } = useSystemAdmin();
  const fileInputRef = useRef(null);
  const hasLoadedInitialRef = useRef(false); // Flag để tránh reset editor khi auto-refresh 30s

  // Xác định menu dựa trên role
  const userRoles = user?.roles?.map(r => r.roleName || r) || [];
  const isSchoolAdmin = userRoles.includes('SchoolAdmin');

  const menuItems = useMemo(() => {
    if (isSchoolAdmin) return SCHOOL_ADMIN_MENU_ITEMS;
    return [
      { key: 'overview', label: 'Tổng quan hệ thống' },
      { key: 'accounts', label: 'Quản lý tài khoản' },
      { key: 'bpm', label: 'Quản lý quy trình (BPM)' },
      { key: 'system-logs', label: 'Nhật ký hệ thống' },
    ];
  }, [isSchoolAdmin]);

  const handleMenuSelect = (key) => {
    if (isSchoolAdmin) {
      createSchoolAdminMenuSelect(navigate)(key);
    } else {
      const routes = {
        overview: '/system-admin',
        accounts: '/system-admin/manage-accounts',
        bpm: '/system-admin/bpm',
        'system-logs': '/system-admin/system-logs',
      };
      if (routes[key]) navigate(routes[key]);
    }
  };
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [health, setHealth] = useState(null);
  const [savedWorkflows, setSavedWorkflows] = useState([]); // Khai báo danh sách quy trình đã lưu
  const [currentWorkflowId, setCurrentWorkflowId] = useState(null);
  const [workflowName, setWorkflowName] = useState('Quy trình mới');
  const [selectedModule, setSelectedModule] = useState('general');

  // Danh mục Module mẫu
  const modules = [
    { value: 'attendance', label: 'Quản lý Điểm danh' },
    { value: 'food_sample', label: 'Quản lý Mẫu thực phẩm' },
    { value: 'purchase', label: 'Quản lý Mua sắm' },
    { value: 'leave', label: 'Quản lý Nghỉ học' },
    { value: 'general', label: 'Quy trình Chung' }
  ];

  // Load dữ liệu ban đầu
  const loadData = useCallback(async (isFirstLoad = false) => {
    try {
      const h = await getBPMHealth();
      setHealth(h);

      const w = await getBPMWorkflows();
      setSavedWorkflows(w || []); // Cập nhật danh sách quy trình để nạp vào table

      // Chỉ nạp dữ liệu vào editor ở lần đầu tiên truy cập hoặc khi được yêu cầu (tránh ghi đè khi đang sửa)
      if (isFirstLoad && w && w.length > 0 && !hasLoadedInitialRef.current) {
        setNodes(w[0].nodes || initialNodes);
        setEdges(w[0].edges || initialEdges);
        setWorkflowName(w[0].name);
        setSelectedModule(w[0].module || 'general');
        setCurrentWorkflowId(w[0]._id || w[0].id);
        hasLoadedInitialRef.current = true;
      }
    } catch (err) {
      console.error(err);
    }
  }, [getBPMHealth, getBPMWorkflows, setNodes, setEdges]);

  useEffect(() => {
    // Gọi nạp dữ liệu lần đầu tiên (có setup editor)
    loadData(true);
    
    // Setup interval tự động làm mới danh sách (không setup editor)
    const interval = setInterval(() => {
      loadData(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadData]);

  // Xử lý kết nối giữa các Node
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Nạp quy trình từ thư viện
  const handleSelectSavedWorkflow = (workflowId) => {
    const workflow = savedWorkflows.find(w => (w._id === workflowId || w.id === workflowId));
    if (workflow) {
      setNodes(workflow.nodes || initialNodes);
      setEdges(workflow.edges || initialEdges);
      setWorkflowName(workflow.name);
      setSelectedModule(workflow.module || 'general');
      setCurrentWorkflowId(workflow._id || workflow.id);
      toast.info(`Đã nạp quy trình: ${workflow.name}`);
      
      // Cuộn lên canvas editor
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Thêm Node mới
  const addNewNode = () => {
    const id = `${nodes.length + 1}`;
    const newNode = {
      id,
      data: { label: `Bước ${id}` },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // Xử lý khi chọn module từ dropdown
  const handleModuleChange = (newModule) => {
    setSelectedModule(newModule);
    
    // Tìm danh sách quy trình đang 'active' của module mới chọn
    const activeWorkflows = savedWorkflows.filter(w => w.module === newModule && w.status === 'active');
    
    if (activeWorkflows.length === 1) {
      // Nếu chỉ có đúng 1 cái active, tự động nạp
      const workflow = activeWorkflows[0];
      setNodes(workflow.nodes || initialNodes);
      setEdges(workflow.edges || initialEdges);
      setWorkflowName(workflow.name);
      setCurrentWorkflowId(workflow._id || workflow.id);
      toast.info(`Đã nạp quy trình đang chạy của ${modules.find(m => m.value === newModule)?.label}`);
    } else if (activeWorkflows.length > 1) {
      // Nếu có nhiều hơn 1, để người dùng tự chọn từ thư viện bên dưới
      toast.info(`${modules.find(m => m.value === newModule)?.label} có ${activeWorkflows.length} quy trình đang chạy. Vui lòng chọn bên dưới.`);
    } else {
      // Nếu chưa có quy trình active cho module này, cho phép tạo mới
      setNodes(initialNodes);
      setEdges(initialEdges);
      setWorkflowName(`Quy trình ${modules.find(m => m.value === newModule)?.label || ''}`);
      setCurrentWorkflowId(null);
    }
  };

  // Lưu Workflow
  const handleSave = async () => {
    try {
      const response = await saveBPMWorkflow({
        id: currentWorkflowId,
        name: workflowName,
        module: selectedModule,
        status: 'active', // Mặc định khi lưu từ dashboard là kích hoạt luôn
        nodes,
        edges,
      });
      
      if (response && response.data) {
        setCurrentWorkflowId(response.data._id || response.data.id);
      }
      
      toast.success('Đã lưu quy trình BPM thành công');
      loadData();
    } catch (err) {
      toast.error('Lỗi khi lưu quy trình');
    }
  };

  // Xử lý upload file Word
  const handleDocxUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Đang phân tích văn bản từ file Word...');
    try {
      const result = await generateBPMFromDocx(file);
      if (result) {
        setNodes(result.nodes);
        setEdges(result.edges);
        setWorkflowName(result.name);
        toast.update(toastId, { 
          render: `Tự động nhận diện xong: ${result.nodes.length} bước quy trình!`, 
          type: 'success', 
          isLoading: false,
          autoClose: 3000 
        });
        loadData(); // Tải lại nhật ký để thấy log vừa sinh
      }
    } catch (err) {
      toast.update(toastId, { 
        render: err.message || 'Lỗi khi xử lý file', 
        type: 'error', 
        isLoading: false,
        autoClose: 3000 
      });
    } finally {
      e.target.value = null;
    }
  };

  return (
    <RoleLayout
      title="Quản trị BPM & Monitoring"
      menuItems={menuItems}
      activeKey="bpm"
      onMenuSelect={handleMenuSelect}
      onLogout={() => { logout(); navigate('/login'); }}
      userName={user?.fullName}
    >
      <Stack spacing={3}>
        {/* TOP: Health Monitoring Widget */}
        <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <HealthAndSafetyIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>Trạng thái Hệ thống</Typography>
          </Stack>
          <Stack direction="row" spacing={3}>
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">Database</Typography>
              <Chip
                label={health?.database === 'healthy' ? 'Kết nối tốt' : 'Mất kết nối'}
                color={health?.database === 'healthy' ? 'success' : 'error'}
                size="small"
              />
            </Box>
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">Server Uptime</Typography>
              <Typography variant="body2" fontWeight={600}>{(health?.uptime / 60).toFixed(2)} phút</Typography>
            </Box>
          </Stack>
        </Paper>

        {/* MIDDLE: React Flow Canvas */}
        <Paper shadow="md" sx={{ height: 600, borderRadius: 2, position: 'relative', border: '1px solid #ddd', overflow: 'hidden' }}>
          {/* CONTROL BAR */}
          <Box sx={{
            p: 1.5,
            bgcolor: '#f8f9fa',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            zIndex: 10,
            position: 'absolute',
            width: '100%'
          }}>
            <TextField
              label="Tên quy trình"
              size="small"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              sx={{ bgcolor: 'white', width: 250 }}
            />
            <FormControl size="small" sx={{ width: 200, bgcolor: 'white' }}>
              <InputLabel>Module áp dụng</InputLabel>
              <Select
                value={selectedModule}
                label="Module áp dụng"
                onChange={(e) => handleModuleChange(e.target.value)}
              >
                {modules.map((m) => (
                  <MuiMenuItem key={m.value} value={m.value}>{m.label}</MuiMenuItem>
                ))}
              </Select>
            </FormControl>
            <input
              type="file"
              accept=".docx"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleDocxUpload}
            />
            <Button
              variant="outlined"
              size="small"
              color="info"
              startIcon={<GetAppIcon />}
              onClick={() => window.open(`${API_BASE_URL}${ENDPOINTS.SYSTEM_ADMIN.DOWNLOAD_BPM_TEMPLATE}`, '_blank')}
            >
              Tải File Mẫu (.docx)
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current.click()}
              disabled={loading}
            >
              Nhập từ Word (.docx)
            </Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addNewNode}>Thêm bước</Button>
            <Button variant="contained" color="success" size="small" startIcon={<SaveIcon />} onClick={handleSave} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu quy trình'}
            </Button>
          </Box>
          <Box sx={{ pt: 8, height: '100%' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </Box>
        </Paper>

        {/* Workflow Library */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Typography variant="subtitle1" fontWeight={700}>Thư viện Quy trình BPM</Typography>
              </Box>
              <TableContainer sx={{ maxHeight: 450 }}>
                <Table size="medium" stickyHeader sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow 
                      sx={{ 
                        '& th': { 
                          bgcolor: 'white', 
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: 'text.secondary',
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          py: 2
                        } 
                      }}
                    >
                      <TableCell sx={{ pl: 3 }}>Tên quy trình</TableCell>
                      <TableCell>Bộ phận áp dụng</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Người tạo</TableCell>
                      <TableCell align="right" sx={{ pr: 3 }}>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {savedWorkflows.map((w) => (
                      <TableRow key={w._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell sx={{ pl: 3 }}>
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            {w.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={modules.find(m => m.value === w.module)?.label || 'Chung'} 
                            variant="outlined" 
                            size="small"
                            sx={{ fontWeight: 600, bgcolor: 'rgba(0,0,0,0.02)' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={w.status === 'active' ? 'Đang chạy' : 'Lưu trữ'} 
                            color={w.status === 'active' ? 'success' : 'default'}
                            variant={w.status === 'active' ? 'filled' : 'outlined'}
                            size="small"
                            sx={{ fontWeight: 700, minWidth: 80, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {w.createdBy?.fullName || 'Hệ thống'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 3 }}>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button 
                              size="small" 
                              variant="outlined" 
                              onClick={() => handleSelectSavedWorkflow(w._id)}
                              sx={{ borderRadius: 1.5 }}
                            >
                              Nạp
                            </Button>
                            {w.status !== 'active' ? (
                              <Button 
                                size="small" 
                                variant="contained"
                                color="success" 
                                onClick={async () => {
                                  await saveBPMWorkflow({ ...w, id: w._id, status: 'active' });
                                  loadData();
                                  toast.success(`Đã kích hoạt quy trình: ${w.name}`);
                                }}
                                sx={{ borderRadius: 1.5 }}
                              >
                                Kích hoạt
                              </Button>
                            ) : (
                              <Button 
                                size="small" 
                                variant="outlined"
                                color="warning" 
                                onClick={async () => {
                                  await saveBPMWorkflow({ ...w, id: w._id, status: 'archived' });
                                  loadData();
                                  toast.info(`Đã chuyển quy trình ${w.name} vào kho lưu trữ`);
                                }}
                                sx={{ borderRadius: 1.5 }}
                              >
                                Lưu trữ
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {savedWorkflows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                          Chưa có quy trình nào trong thư viện.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </RoleLayout>
  );
}
