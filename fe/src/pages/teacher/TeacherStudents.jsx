import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, post, ENDPOINTS } from '../../service/api';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, Avatar, Chip, Skeleton, Alert, Stack,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  TablePagination, TextField, InputAdornment, FormControl, InputLabel,
  Select, MenuItem, Button, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Badge, List, ListItem, ListItemText, Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  People as PeopleIcon,
  MenuBook as ContactIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  ArrowForward as ArrowIcon,
  School as SchoolIcon,
  EditNote as RequestIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

const PAGE_SIZE = 20;

function genderLabel(g) {
  if (g === 'male') return 'Nam';
  if (g === 'female') return 'Nữ';
  return 'Khác';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years--;
  return years > 0 ? `${years} tuổi` : null;
}

function getTeacherMenuItems(hasPermission, hasRole) {
  const ALL_TEACHER_MENU = [
    { key: 'classes', label: 'Lớp phụ trách' },
    { key: 'students', label: 'Danh sách học sinh' },
    { key: 'attendance', label: 'Điểm danh', permission: 'MANAGE_ATTENDANCE' },
    { key: 'pickup-approval', label: 'Đơn đăng ký đưa đón', permission: 'MANAGE_PICKUP' },
    { key: 'schedule', label: 'Lịch dạy & hoạt động' },
    { key: 'purchase-request', label: 'Cơ sở vật chất', permission: 'MANAGE_PURCHASE_REQUEST' },
    { key: 'class-assets', label: 'Tài sản lớp', permission: 'MANAGE_ASSET' },
    { key: 'asset-inspection', label: 'Kiểm kê tài sản', role: 'InventoryStaff' },
  ];
  return ALL_TEACHER_MENU.filter((item) => {
    if (item.permission) return hasPermission(item.permission);
    if (item.role) return hasRole(item.role);
    return true;
  });
}

export default function TeacherStudents() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isInitializing, hasPermission, hasRole } = useAuth();

  const [students, setStudents] = useState([]);
  const [classes, setClasses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage]         = useState(0);

  // Change request dialog — tạo mới
  const [reqDialog, setReqDialog]   = useState(null); // student object
  const [reqTitle, setReqTitle]     = useState('');
  const [reqContent, setReqContent] = useState('');
  const [reqSubmitting, setReqSubmitting] = useState(false);

  // History dialog — xem đã gửi
  const [histDialog, setHistDialog] = useState(null); // student object
  const [histData, setHistData]     = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    fetchStudents();
  }, [isInitializing, user]); // eslint-disable-line

  const openReqDialog = (student) => { setReqDialog(student); setReqTitle(''); setReqContent(''); };
  const closeReqDialog = () => { setReqDialog(null); };

  const submitRequest = async () => {
    if (!reqTitle.trim() || !reqContent.trim()) return;
    setReqSubmitting(true);
    try {
      await post(ENDPOINTS.TEACHER.CHANGE_REQUESTS(reqDialog._id), { title: reqTitle.trim(), content: reqContent.trim() });
      toast.success('Đã gửi yêu cầu tới Ban Giám hiệu');
      closeReqDialog();
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Gửi thất bại');
    } finally {
      setReqSubmitting(false);
    }
  };

  const openHistDialog = async (student) => {
    setHistDialog(student);
    setHistData([]);
    setHistLoading(true);
    try {
      const res = await get(ENDPOINTS.TEACHER.CHANGE_REQUESTS(student._id));
      setHistData(res.data || []);
    } catch {
      setHistData([]);
    } finally {
      setHistLoading(false);
    }
  };

  const fetchStudents = async (cId = classFilter) => {
    setLoading(true);
    setError('');
    try {
      const params = cId ? `?classId=${cId}` : '';
      const res = await get(`${ENDPOINTS.TEACHER.MY_STUDENTS}${params}`);
      setStudents(res.data || []);
      if (res.classes) setClasses(res.classes);
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter(s =>
      (!q || s.fullName.toLowerCase().includes(q) ||
        (s.parentId?.fullName || '').toLowerCase().includes(q) ||
        (s.classId?.className || '').toLowerCase().includes(q))
    );
  }, [students, search]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const menuItems = useMemo(
    () => getTeacherMenuItems(hasPermission, hasRole),
    [hasPermission, hasRole]
  );

  const activeKey = useMemo(() => {
    const path = location.pathname || '';
    if (path === '/teacher/students') return 'students';
    if (path.startsWith('/teacher/contact-book')) return 'contact-book';
    if (path.startsWith('/teacher/attendance')) return 'attendance';
    return 'classes';
  }, [location.pathname]);

  const handleMenuSelect = (key) => {
    const MAP = {
      classes: '/teacher',
      students: '/teacher/students',
      'contact-book': '/teacher/contact-book',
      attendance: '/teacher/attendance',
      'pickup-approval': '/teacher/pickup-approval',
      'purchase-request': '/teacher/purchase-request',
      'class-assets': '/teacher/class-assets',
      'asset-inspection': '/teacher/asset-inspection',
    };
    if (MAP[key]) navigate(MAP[key]);
  };

  const userName = user?.fullName || user?.username || 'Teacher';

  const totalStudents = students.length;
  const totalClasses = classes.length;

  return (
    <RoleLayout
      title="Danh sách học sinh"
      description="Học sinh trong các lớp phụ trách"
      menuItems={menuItems}
      activeKey={activeKey}
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {/* Header */}
      <Paper elevation={0} sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <PeopleIcon sx={{ color: 'white', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} color="white">Danh sách học sinh</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {totalClasses} lớp · {totalStudents} học sinh
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper elevation={1} sx={{ borderRadius: 2, p: 2.5 }}>
        {/* Toolbar */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2} alignItems={{ sm: 'center' }}>
          <TextField
            size="small" placeholder="Tìm tên học sinh, phụ huynh, lớp..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            sx={{ minWidth: 240 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Lọc theo lớp</InputLabel>
            <Select
              label="Lọc theo lớp"
              value={classFilter}
              onChange={e => {
                const cId = e.target.value;
                setClassFilter(cId);
                setPage(0);
                fetchStudents(cId);
              }}
            >
              <MenuItem value="">Tất cả lớp</MenuItem>
              {classes.map(c => (
                <MenuItem key={c._id} value={c._id}>{c.className}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {filtered.length} học sinh
          </Typography>
        </Stack>

        {/* Class summary chips */}
        {!classFilter && classes.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
            {classes.map((c, idx) => {
              const count = students.filter(s => s.classId?._id === c._id || String(s.classId) === String(c._id)).length;
              const colors = ['#6366f1','#0891b2','#16a34a','#d97706','#be185d'];
              const color = colors[idx % colors.length];
              return (
                <Chip
                  key={c._id}
                  icon={<SchoolIcon style={{ color }} />}
                  label={`${c.className} · ${count} hs`}
                  size="small"
                  onClick={() => { setClassFilter(c._id); setPage(0); fetchStudents(c._id); }}
                  sx={{ bgcolor: '#f8fafc', border: `1px solid ${color}30`, fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer' }}
                />
              );
            })}
          </Stack>
        )}

        {/* Table */}
        {loading ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Stack spacing={1}>
              {[1,2,3,4].map(i => <Skeleton key={i} variant="rounded" height={48} sx={{ borderRadius: 1 }} />)}
            </Stack>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 820 }}>
                <TableHead sx={{ bgcolor: '#f5f3ff' }}>
                  <TableRow>
                    {['#', 'Học sinh', 'Lớp', 'Ngày sinh', 'Giới tính', 'Phụ huynh', 'Số điện thoại', 'Cần chú ý', ''].map(col => (
                      <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary', py: 1, whiteSpace: 'nowrap' }}>
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                        <PersonIcon sx={{ fontSize: 36, color: 'grey.300', display: 'block', mx: 'auto', mb: 1 }} />
                        Không có học sinh nào
                      </TableCell>
                    </TableRow>
                  ) : paginated.map((s, idx) => {
                    const age = calcAge(s.dateOfBirth);
                    const className = s.classId?.className || '—';
                    const classObj = classes.find(c => String(c._id) === String(s.classId?._id || s.classId));
                    const phone = s.parentId?.phone || s.parentPhone || s.phone || '—';

                    return (
                      <TableRow key={s._id} hover sx={{ '&:hover': { bgcolor: '#faf5ff' } }}>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                          {page * PAGE_SIZE + idx + 1}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.25}>
                            <Avatar
                              src={s.avatar || undefined}
                              sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: '#ede9fe', color: '#7c3aed' }}
                            >
                              {s.fullName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                                {s.fullName}
                              </Typography>
                              {age && (
                                <Typography variant="caption" color="text.secondary">{age}</Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={className}
                            size="small"
                            sx={{ bgcolor: '#f3f0ff', color: '#6d28d9', fontWeight: 600, fontSize: '0.72rem', height: 22 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {fmtDate(s.dateOfBirth)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>
                          {genderLabel(s.gender)}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <PersonIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {s.parentId?.fullName || '—'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <PhoneIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{phone}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {s.needsSpecialAttention
                            ? <Chip label="Có" color="warning" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                            : <Chip label="Không" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.75} justifyContent="flex-end" flexWrap="nowrap">
                            <Tooltip title="Lịch sử yêu cầu đã gửi">
                              <Button
                                size="small" variant="text"
                                startIcon={<HistoryIcon sx={{ fontSize: 14 }} />}
                                onClick={() => openHistDialog(s)}
                                sx={{ fontSize: '0.72rem', py: 0.4, px: 1, color: '#64748b', whiteSpace: 'nowrap' }}
                              >
                                Lịch sử
                              </Button>
                            </Tooltip>
                            <Tooltip title="Gửi yêu cầu thay đổi thông tin tới Ban Giám hiệu">
                              <Button
                                size="small" variant="outlined"
                                startIcon={<RequestIcon sx={{ fontSize: 14 }} />}
                                onClick={() => openReqDialog(s)}
                                sx={{
                                  fontSize: '0.72rem', py: 0.4, px: 1.2, borderRadius: 1.5,
                                  borderColor: '#e11d48', color: '#e11d48',
                                  '&:hover': { bgcolor: '#fff1f2', borderColor: '#be123c' },
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Gửi yêu cầu
                              </Button>
                            </Tooltip>
                            {classObj && (
                              <Tooltip title="Xem sổ liên lạc học sinh này">
                                <Button
                                  size="small" variant="outlined"
                                  endIcon={<ArrowIcon sx={{ fontSize: 14 }} />}
                                  onClick={() => navigate(`/teacher/contact-book/${classObj._id}`)}
                                  sx={{
                                    fontSize: '0.72rem', py: 0.4, px: 1.2, borderRadius: 1.5,
                                    borderColor: '#6366f1', color: '#6366f1',
                                    '&:hover': { bgcolor: '#f5f3ff', borderColor: '#4f46e5' },
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  Sổ liên lạc
                                </Button>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
              onPageChange={(_, p) => setPage(p)}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count} học sinh`}
              sx={{ borderTop: '1px solid', borderColor: 'divider' }}
            />
          </>
        )}
      </Paper>

      {/* Dialog gửi yêu cầu thay đổi */}
      <Dialog open={!!reqDialog} onClose={closeReqDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Gửi yêu cầu thay đổi thông tin
        </DialogTitle>
        <DialogContent dividers>
          {reqDialog && (
            <Stack spacing={0.5} mb={2} direction="row" alignItems="center">
              <Avatar src={reqDialog.avatar || undefined} sx={{ width: 32, height: 32, bgcolor: '#ede9fe', color: '#7c3aed', fontSize: '0.8rem' }}>
                {reqDialog.fullName?.charAt(0)}
              </Avatar>
              <Typography variant="body2" fontWeight={600}>{reqDialog.fullName}</Typography>
              <Typography variant="caption" color="text.secondary">· {reqDialog.classId?.className || ''}</Typography>
            </Stack>
          )}
          <Stack spacing={2}>
            <TextField
              label="Tiêu đề yêu cầu" size="small" fullWidth required
              value={reqTitle} onChange={e => setReqTitle(e.target.value)}
              placeholder="VD: Cập nhật số điện thoại phụ huynh"
            />
            <TextField
              label="Nội dung chi tiết" size="small" fullWidth required multiline minRows={4}
              value={reqContent} onChange={e => setReqContent(e.target.value)}
              placeholder="Mô tả thông tin cần thay đổi, lý do và thông tin mới..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={closeReqDialog} disabled={reqSubmitting} color="inherit">Huỷ</Button>
          <Button
            variant="contained" onClick={submitRequest}
            disabled={reqSubmitting || !reqTitle.trim() || !reqContent.trim()}
            sx={{ bgcolor: '#e11d48', '&:hover': { bgcolor: '#be123c' } }}
          >
            {reqSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog lịch sử yêu cầu */}
      <Dialog open={!!histDialog} onClose={() => setHistDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Lịch sử yêu cầu đã gửi
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {histLoading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">Đang tải...</Typography></Box>
          ) : histData.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <HistoryIcon sx={{ fontSize: 36, color: 'grey.300', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Chưa có yêu cầu nào được gửi</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {histData.map((r, idx) => (
                <Box key={r._id}>
                  <ListItem alignItems="flex-start" sx={{ py: 1.5, px: 2.5 }}>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.25}>
                          <Typography variant="body2" fontWeight={700}>{r.title}</Typography>
                          <Chip
                            label={r.status === 'pending' ? 'Chờ xử lý' : 'Đã giải quyết'}
                            size="small"
                            color={r.status === 'pending' ? 'warning' : 'success'}
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 0.5 }}>{r.content}</Typography>
                          <Typography variant="caption" color="text.disabled">
                            Gửi lúc {new Date(r.createdAt).toLocaleString('vi-VN')}
                            {r.resolvedAt ? ` · Giải quyết lúc ${new Date(r.resolvedAt).toLocaleString('vi-VN')}` : ''}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {idx < histData.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => setHistDialog(null)} color="inherit">Đóng</Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}
