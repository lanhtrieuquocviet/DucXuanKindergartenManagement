import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GetAppIcon from '@mui/icons-material/GetApp';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CancelIcon from '@mui/icons-material/Cancel';
import TimeIcon from '@mui/icons-material/AccessTime';
import {
  Box, Button, Chip, Divider, FormControl, Grid, IconButton,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField,
  Typography, Tooltip, Alert, useTheme, useMediaQuery
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReactFlow, {
  Background, Controls, MiniMap, addEdge,
  useEdgesState, useNodesState, ReactFlowProvider,
  useReactFlow, Handle, Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import { API_BASE_URL, ENDPOINTS } from '../../service/api';
import { SCHOOL_ADMIN_MENU_ITEMS, createSchoolAdminMenuSelect } from '../schoolAdmin/schoolAdminMenuConfig';

// ─── CSS tuỳ chỉnh React Flow ─────────────────────────────────
const rfStyle = `
  .react-flow__node { border:none!important; background:transparent!important; padding:0!important; box-shadow:none!important; }
  .react-flow__handle { width:8px!important; height:8px!important; background:#475569!important; border:2px solid white!important; }
`;

// ─── Màu theo category ────────────────────────────────────────
const CAT_COLOR = {
  system: '#3b82f6', ai: '#8b5cf6', logic: '#f59e0b',
  audit:  '#ef4444', action: '#10b981', Other: '#6b7280',
};

// ─── Custom Node Component ────────────────────────────────────
const BPMNode = ({ id, data, selected }) => {
  const { setNodes } = useReactFlow();
  const bg = data.color || '#fff';
  return (
    <Box sx={{
      position: 'relative', px: 2.5, py: 1.5, borderRadius: 2,
      border: selected ? '2px solid #3b82f6' : '1.5px solid #cbd5e1',
      bgcolor: bg, minWidth: 140, textAlign: 'center',
      boxShadow: selected ? 4 : 1, transition: 'all .15s',
    }}>
      <IconButton size="small" onClick={e => { e.stopPropagation(); setNodes(n => n.filter(x => x.id !== id)); }}
        sx={{ position:'absolute', top:-10, right:-10, p:0, bgcolor:'#fff', color:'#ef4444', '&:hover':{ bgcolor:'#fef2f2' }, zIndex:10 }}>
        <CancelIcon sx={{ fontSize:18 }} />
      </IconButton>
      <Handle type="target" position={Position.Left} />
      <Typography variant="caption" fontWeight={700} sx={{ color:'#1e293b', lineHeight:1.3, display:'block' }}>
        {data.label}
      </Typography>
      <Handle type="source" position={Position.Right} />
    </Box>
  );
};

const NODE_TYPES_MAP = Object.fromEntries([
  'input','output','ai_student','ai_parent','condition_time','condition_deliverer',
  'condition_absence','notify_checkin','notify_checkout','notify_absence',
  'save_record','teacher_verify','audit_full_class','audit_photo_proof',
  'audit_medication','audit_belongings','audit_parent_auth','audit_anomaly','audit_service_status','default',
].map(t => [t, BPMNode]));

const MODULES = [
  { value:'attendance', label:'Điểm danh' },
  { value:'food_sample', label:'Mẫu thực phẩm' },
  { value:'leave', label:'Nghỉ học' },
  { value:'purchase', label:'Mua sắm' },
];

// ─── Main Content ─────────────────────────────────────────────
const BPMDashboardContent = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { getBPMWorkflows, saveBPMWorkflow, deleteBPMWorkflow,
          getBPMHealth, generateBPMFromDocx, getBPMNodeDefinitions, loading } = useSystemAdmin();
  const { project, deleteElements } = useReactFlow();
  const wrapperRef  = useRef(null);
  const fileRef     = useRef(null);
  const initialised = useRef(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [health, setHealth]           = useState(null);
  const [workflows, setWorkflows]     = useState([]);
  const [nodeDefs, setNodeDefs]       = useState([]);
  const [current, setCurrent]         = useState(null);
  const [wfName, setWfName]           = useState('Quy trình mới');
  const [wfModule, setWfModule]       = useState('attendance');
  const [wfType, setWfType]           = useState('checkin');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Menu
  const userRoles   = user?.roles?.map(r => r.roleName || r) || [];
  const isSchoolAdmin = userRoles.includes('SchoolAdmin');
  const menuItems   = useMemo(() => isSchoolAdmin ? SCHOOL_ADMIN_MENU_ITEMS : [
    { key: 'overview', label: 'Tổng quan hệ thống' },
    { key: 'accounts', label: 'Quản lý người dùng' },
    { key: 'roles', label: 'Quản lý vai trò' },
    { key: 'permissions', label: 'Quản lý phân quyền' },
    { key: 'bpm', label: 'Quản lý quy trình (BPM)' },
    { key: 'system-logs', label: 'Nhật ký hệ thống' },
  ], [isSchoolAdmin]);
  const handleMenu  = key => isSchoolAdmin
    ? createSchoolAdminMenuSelect(navigate)(key)
    : ({
      overview: '/system-admin',
      accounts: '/system-admin/manage-accounts',
      roles: '/system-admin/manage-roles',
      permissions: '/system-admin/manage-permissions',
      bpm: '/system-admin/bpm',
      'system-logs': '/system-admin/system-logs',
    })[key] && navigate(({
      overview: '/system-admin',
      accounts: '/system-admin/manage-accounts',
      roles: '/system-admin/manage-roles',
      permissions: '/system-admin/manage-permissions',
      bpm: '/system-admin/bpm',
      'system-logs': '/system-admin/system-logs',
    })[key]);

  // Load data
  const loadData = useCallback(async (first = false) => {
    try {
      const h = await getBPMHealth();
      setHealth(h);
      const [wfs, nds] = await Promise.all([getBPMWorkflows(), getBPMNodeDefinitions()]);
      setWorkflows(wfs || []);
      setNodeDefs(nds || []);
      if (first && wfs?.length && !initialised.current) {
        const active = wfs.find(f => f.status === 'active') || wfs[0];
        loadWorkflow(active);
        initialised.current = true;
      }
    } catch (e) { console.error(e); }
  }, [getBPMHealth, getBPMWorkflows, getBPMNodeDefinitions]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = rfStyle;
    document.head.appendChild(style);
    loadData(true);
    const t = setInterval(() => loadData(false), 30000);
    return () => { document.head.removeChild(style); clearInterval(t); };
  }, [loadData]);

  const loadWorkflow = (wf) => {
    setNodes(wf.nodes || []);
    setEdges(wf.edges || []);
    setCurrent(wf);
    setWfName(wf.name || '');
    setWfModule(wf.module || 'attendance');
    setWfType(wf.type || 'checkin');
  };

  const onConnect     = useCallback(p => setEdges(eds => addEdge({ ...p, animated:true }, eds)), [setEdges]);
  const onDragStart   = (e, type, label) => {
    e.dataTransfer.setData('rf/type', type);
    e.dataTransfer.setData('rf/label', label);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDrop        = useCallback(e => {
    e.preventDefault();
    const type  = e.dataTransfer.getData('rf/type');
    const label = e.dataTransfer.getData('rf/label');
    if (!type) return;
    const bounds = wrapperRef.current.getBoundingClientRect();
    const pos    = project({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
    const color  = nodeDefs.find(n => n.type === type)?.color || '#fff';
    setNodes(nds => nds.concat({ id:`${type}_${Date.now()}`, type, position:pos, data:{ label, color } }));
  }, [project, setNodes, nodeDefs]);
  const onDragOver    = useCallback(e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);

  const handleNodeClick = (type, label) => {
    const color = nodeDefs.find(n => n.type === type)?.color || '#fff';
    const id = `${type}_${Date.now()}`;
    // Lấy tọa độ trung tâm hoặc vị trí mặc định
    const pos = { x: 150, y: 150 };
    setNodes(nds => nds.concat({ id, type, position: pos, data: { label, color } }));
    toast.info(`Đã thêm bước: ${label}`);
  };

  const handleSave = async () => {
    try {
      const res = await saveBPMWorkflow({ id: current?._id || current?.id, name:wfName, module:wfModule, type:wfType, status:'active', nodes, edges });
      if (res?.data) setCurrent(res.data);
      toast.success('Đã lưu quy trình thành công');
      loadData();
    } catch { toast.error('Lỗi khi lưu quy trình'); }
  };

  const handleDelete = async () => {
    if (!current) return toast.warning('Chưa chọn quy trình');
    if (!window.confirm(`Xóa vĩnh viễn "${current.name}"?`)) return;
    await deleteBPMWorkflow(current._id || current.id);
    setNodes([]); setEdges([]); setCurrent(null);
    toast.success('Đã xóa'); loadData();
  };

  const handleDocxUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const tid = toast.loading('Đang phân tích file Word...');
    try {
      const r = await generateBPMFromDocx(file);
      if (r) { setNodes(r.nodes); setEdges(r.edges); setWfName(r.name); }
      toast.update(tid, { render:`Xong: ${r?.nodes?.length} bước`, type:'success', isLoading:false, autoClose:3000 });
    } catch (err) {
      toast.update(tid, { render: err.message || 'Lỗi', type:'error', isLoading:false, autoClose:3000 });
    } finally { e.target.value = null; }
  };

  const groupedDefs = useMemo(() => nodeDefs.reduce((acc, n) => {
    const cat = n.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(n);
    return acc;
  }, {}), [nodeDefs]);

  const dbOk = health?.database === 'healthy';

  return (
    <RoleLayout title="Quản trị BPM" menuItems={menuItems} activeKey="bpm"
      onMenuSelect={handleMenu} onLogout={() => { logout(); navigate('/login'); }}
      userName={user?.fullName}>
      <Stack spacing={2}>

        {/* ── ZONE 1: Premium Header & Toolbar ── */}
        <Box sx={{ mb: 3 }}>
          {/* Top Bar: System Status & Quick Info */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, px: 0.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: dbOk ? '#10b981' : '#ef4444', boxShadow: `0 0 8px ${dbOk ? '#10b981' : '#ef4444'}` }} />
                <Typography variant="caption" fontWeight={700} sx={{ color: '#475569', letterSpacing: 0.5 }}>
                  DATABASE: {dbOk ? 'CONNECTED' : 'DISCONNECTED'}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon sx={{ fontSize: 14, color: '#64748b' }} />
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Uptime: <strong>{(health?.uptime / 60).toFixed(1)}</strong> min
                </Typography>
              </Box>
            </Stack>

            <Typography variant="h5" fontWeight={900} sx={{
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: -0.5,
              display: { xs: 'none', sm: 'block' }
            }}>
              BPM Engine <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '1rem' }}>v2.0</span>
            </Typography>
          </Stack>

          {/* Action Bar: Workflow Configuration */}
          <Paper elevation={0} sx={{
            p: 2.5,
            borderRadius: 4,
            border: '1px solid #e2e8f0',
            bgcolor: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Trang trí nhẹ nhàng */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: '#6366f1' }} />

            <Grid container spacing={2.5} alignItems="flex-end">
              {/* Selector quy trình */}
              <Grid item xs={12} md={4}>
                <Typography variant="caption" fontWeight={800} color="primary" sx={{ display: 'block', mb: 0.5, ml: 0.5 }}>
                  QUY TRÌNH HIỆN TẠI
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={current?._id || ''}
                    onChange={e => { const f = workflows.find(w => w._id === e.target.value); if (f) loadWorkflow(f); }}
                    displayEmpty
                    sx={{
                      borderRadius: 2.5,
                      bgcolor: '#f8fafc',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                    }}
                  >
                    <MenuItem value="" disabled>--- Chọn quy trình đã lưu ---</MenuItem>
                    {workflows.map(f => (
                      <MenuItem key={f._id} value={f._id}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={f.status === 'active' ? 'Active' : f.status}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: 9,
                              fontWeight: 800,
                              bgcolor: f.status === 'active' ? '#dcfce7' : '#f1f5f9',
                              color: f.status === 'active' ? '#16a34a' : '#64748b',
                              border: 'none'
                            }}
                          />
                          <Typography variant="body2" fontWeight={600}>{f.name}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Tên quy trình */}
              <Grid item xs={12} md={3}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: 'block', mb: 0.5, ml: 0.5 }}>
                  TÊN HIỂN THỊ
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Nhập tên quy trình..."
                  value={wfName}
                  onChange={e => setWfName(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#fff' }
                  }}
                />
              </Grid>

              {/* Phân loại */}
              <Grid item xs={6} md={1.5}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: 'block', mb: 0.5, ml: 0.5 }}>
                  MODULE
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={wfModule}
                    onChange={e => setWfModule(e.target.value)}
                    sx={{ borderRadius: 2.5 }}
                  >
                    {MODULES.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} md={1.5}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: 'block', mb: 0.5, ml: 0.5 }}>
                  LOẠI
                </Typography>
                <FormControl fullWidth size="small" disabled={wfModule !== 'attendance'}>
                  <Select
                    value={wfType}
                    onChange={e => setWfType(e.target.value)}
                    sx={{ borderRadius: 2.5 }}
                  >
                    <MenuItem value="checkin">Đón trẻ</MenuItem>
                    <MenuItem value="checkout">Trả trẻ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Actions */}
              <Grid item xs={12} md={2}>
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                    sx={{
                      borderRadius: 2.5,
                      bgcolor: '#6366f1',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                      textTransform: 'none',
                      fontWeight: 700,
                      py: 1,
                      '&:hover': { bgcolor: '#4f46e5' }
                    }}
                  >
                    Lưu lại
                  </Button>
                  <Tooltip title="Xóa quy trình này">
                    <IconButton
                      onClick={handleDelete}
                      disabled={!current}
                      sx={{
                        borderRadius: 2.5,
                        bgcolor: '#fef2f2',
                        color: '#ef4444',
                        border: '1px solid #fee2e2',
                        '&:hover': { bgcolor: '#fee2e2' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* ── ZONE 2: Canvas Editor ── */}
        <Paper elevation={0} sx={{ borderRadius:2.5, border:'1px solid #e2e8f0', overflow:'hidden', height:580 }}>
          {/* Sub-toolbar */}
          <Box sx={{ px:2, py:1, borderBottom:'1px solid #e2e8f0', bgcolor:'#fff', display:'flex', gap:1, flexWrap:'wrap', alignItems:'center' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mr:1 }}>
              <AccountTreeIcon sx={{ fontSize:14, mr:0.5, verticalAlign:'middle' }} />CANVAS
            </Typography>
            <Tooltip title="Tải file mẫu .docx">
              <Button size="small" variant="outlined" color="info" startIcon={<GetAppIcon />}
                onClick={() => window.open(`${API_BASE_URL}${ENDPOINTS.SYSTEM_ADMIN.DOWNLOAD_BPM_TEMPLATE}`,'_blank')}>
                File mẫu
              </Button>
            </Tooltip>
            <input type="file" accept=".docx" style={{ display:'none' }} ref={fileRef} onChange={handleDocxUpload} />
            <Button size="small" variant="outlined" startIcon={<CloudUploadIcon />}
              onClick={() => fileRef.current.click()} disabled={loading}>
              Nhập Word
            </Button>
            <Button size="small" variant="outlined" color="warning"
              onClick={() => { const sel = nodes.filter(n=>n.selected); const sEdg = edges.filter(e=>e.selected);
                if (!sel.length && !sEdg.length) return toast.warn('Chọn node cần xóa');
                deleteElements({ nodes:sel, edges:sEdg }); }}>
              Xóa chọn
            </Button>
            <Button size="small" variant="outlined" color="error"
              onClick={() => { if (window.confirm('Xóa sạch canvas?')) { setNodes([]); setEdges([]); } }}>
              Xóa bảng
            </Button>
            <Button size="small" variant="contained" startIcon={<AddIcon />}
              onClick={() => setNodes(n => n.concat({ id:`step_${Date.now()}`, data:{ label:'Bước mới' }, position:{ x:200, y:200 } }))}>
              Thêm bước
            </Button>
          </Box>

          {/* Editor split pane */}
          <Box sx={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', height:'calc(100% - 49px)' }}>
            {/* Node Library Sidebar */}
            <Box sx={{
              width: isMobile ? '100%' : 200,
              height: isMobile ? '160px' : '100%',
              borderRight: isMobile ? 'none' : '1px solid #e2e8f0',
              borderBottom: isMobile ? '1px solid #e2e8f0' : 'none',
              overflowY: 'auto',
              bgcolor: '#fafafa',
              p: 1.5
            }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display:'block', mb:1 }}>
                THƯ VIỆN NODE {isMobile && '(Chạm để thêm)'}
              </Typography>
              <Stack direction={isMobile ? 'row' : 'column'} spacing={isMobile ? 1.5 : 0.5} sx={{ display: isMobile ? 'flex' : 'block' }}>
                {Object.entries(groupedDefs).map(([cat, items]) => (
                  <Box key={cat} sx={{ minWidth: isMobile ? 140 : 'auto' }}>
                    <Typography variant="caption" sx={{ color: CAT_COLOR[cat] || '#6b7280', fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:.5, display: 'block' }}>
                      {cat}
                    </Typography>
                    <Stack spacing={0.5} mt={0.5}>
                      {items.map(node => (
                        <Paper key={node.type} draggable onDragStart={e => onDragStart(e, node.type, node.label)}
                          onClick={() => handleNodeClick(node.type, node.label)}
                          elevation={0}
                          sx={{ p:'6px 10px', mb:0.5, cursor:'pointer', bgcolor: node.color || '#f8f9fa',
                            border:'1px solid #e2e8f0', borderLeft:`3px solid ${CAT_COLOR[node.category] || '#ddd'}`,
                            borderRadius:1.5, fontSize:'0.72rem', fontWeight:600, color:'#334155',
                            userSelect: 'none',
                            transition: 'all 0.1s',
                            '&:hover':{ boxShadow:2, bgcolor: '#fff', borderLeftColor: CAT_COLOR[node.category] || '#3b82f6' },
                            '&:active': { transform: 'scale(0.96)' } }}>
                          {node.label}
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* React Flow Canvas */}
            <Box ref={wrapperRef} sx={{ flex:1, position: 'relative' }} onDrop={onDrop} onDragOver={onDragOver}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={NODE_TYPES_MAP}
                fitView
                panOnScroll={!isMobile}
                zoomOnPinch={true}
                panOnDrag={true}
                touchZoom={true}
              >
                <Background variant="dots" gap={16} size={1} color="#e2e8f0" />
                <Controls showInteractive={false} />
                <MiniMap zoomable pannable nodeColor={n => nodeDefs.find(d=>d.type===n.type)?.color || '#e2e8f0'}
                  style={{ borderRadius:8, border:'1px solid #e2e8f0', display: isMobile ? 'none' : 'block' }} />
              </ReactFlow>
            </Box>
          </Box>
        </Paper>

        {/* ── ZONE 3: Workflow Library Table ── */}
        <Paper elevation={0} sx={{ borderRadius:2.5, border:'1px solid #e2e8f0', overflow:'hidden' }}>
          <Box sx={{ px:3, py:1.75, borderBottom:'1px solid #e2e8f0', bgcolor:'#f8fafc',
            display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Typography variant="subtitle2" fontWeight={700}>
              📋 Thư viện Quy trình ({workflows.length})
            </Typography>
          </Box>
          <TableContainer sx={{ maxHeight:300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th':{ bgcolor:'#f8fafc', fontWeight:700, fontSize:'0.78rem', color:'#64748b', py:1.5 } }}>
                  <TableCell sx={{ pl:3 }}>Tên quy trình</TableCell>
                  <TableCell>Module / Loại</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Người tạo</TableCell>
                  <TableCell align="right" sx={{ pr:3 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workflows.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py:4, color:'#94a3b8' }}>
                    Chưa có quy trình nào
                  </TableCell></TableRow>
                )}
                {workflows.map(w => (
                  <TableRow key={w._id} hover sx={{ '&:last-child td':{ border:0 },
                    bgcolor: current?._id === w._id ? '#eff6ff' : undefined }}>
                    <TableCell sx={{ pl:3 }}>
                      <Typography variant="body2" fontWeight={700} color="primary.main">{w.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{w.nodes?.length || 0} bước · {w.edges?.length || 0} kết nối</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Chip label={MODULES.find(m=>m.value===w.module)?.label || w.module} size="small" variant="outlined" sx={{ fontSize:10 }} />
                        {w.type && <Chip label={w.type} size="small" sx={{ fontSize:10, bgcolor:'#f1f5f9' }} />}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={w.status === 'active' ? '🟢 Đang chạy' : w.status === 'archived' ? '📦 Lưu trữ' : '📝 Nháp'}
                        size="small" color={w.status === 'active' ? 'success' : 'default'}
                        variant={w.status === 'active' ? 'filled' : 'outlined'}
                        sx={{ fontWeight:700, fontSize:'0.68rem' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{w.createdBy?.fullName || 'Hệ thống'}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr:2 }}>
                      <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                        <Button size="small" variant={current?._id === w._id ? 'contained' : 'outlined'}
                          onClick={() => loadWorkflow(w)} sx={{ fontSize:11 }}>
                          {current?._id === w._id ? 'Đang xem' : 'Nạp'}
                        </Button>
                        {w.status !== 'active' ? (
                          <Button size="small" variant="contained" color="success"
                            onClick={async () => { await saveBPMWorkflow({...w, id:w._id, status:'active'}); loadData(); toast.success(`Kích hoạt: ${w.name}`); }}
                            sx={{ fontSize:11 }}>Kích hoạt</Button>
                        ) : (
                          <Button size="small" variant="outlined" color="warning"
                            onClick={async () => { await saveBPMWorkflow({...w, id:w._id, status:'archived'}); loadData(); toast.info(`Lưu trữ: ${w.name}`); }}
                            sx={{ fontSize:11 }}>Lưu trữ</Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

      </Stack>
    </RoleLayout>
  );
};

export default function BPMDashboard() {
  return <ReactFlowProvider><BPMDashboardContent /></ReactFlowProvider>;
}
