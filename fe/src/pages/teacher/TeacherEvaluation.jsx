import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, put, ENDPOINTS } from '../../service/api';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, Avatar, Chip, Skeleton, Alert, Stack,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  TablePagination, TextField, InputAdornment, FormControl, InputLabel,
  Select, MenuItem, Button, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Radio, FormControlLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Grading as EvaluationIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

const PAGE_SIZE = 20;

function genderLabel(g) {
  if (g === 'male') return 'Nam';
  if (g === 'female') return 'Nữ';
  return 'Khác';
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
    { key: 'evaluation', label: 'Đánh giá học sinh' },
    { key: 'attendance', label: 'Điểm danh', permission: 'MANAGE_ATTENDANCE' },
    { key: 'pickup-approval', label: 'Đơn đăng ký đưa đón', permission: 'MANAGE_PICKUP' },
    { key: 'leave-requests', label: 'Danh sách đơn xin nghỉ', permission: 'MANAGE_ATTENDANCE' },
    { key: 'contact-book', label: 'Sổ liên lạc' },
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

export default function TeacherEvaluation() {
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

  // Evaluation dialog
  const [evalDialog, setEvalDialog] = useState(null); // student object
  const [evalData, setEvalData]     = useState({ academicEvaluation: null, evaluationNote: '' });
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalSubmitting, setEvalSubmitting] = useState(false);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    fetchStudents();
  }, [isInitializing, user]); // eslint-disable-line

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

  const openEvalDialog = async (student) => {
    setEvalDialog(student);
    setEvalData({ academicEvaluation: null, evaluationNote: '' });
    setEvalLoading(true);
    try {
      const res = await get(ENDPOINTS.TEACHER.STUDENT_EVALUATION(student._id));
      if (res.data?.evaluation) {
        setEvalData({
          academicEvaluation: res.data.evaluation.academicEvaluation,
          evaluationNote: res.data.evaluation.evaluationNote || ''
        });
      }
    } catch (err) {
      toast.error('Không thể tải thông tin đánh giá');
    } finally {
      setEvalLoading(false);
    }
  };

  const closeEvalDialog = () => { setEvalDialog(null); };

  const submitEvaluation = async () => {
    if (!evalData.academicEvaluation) {
      toast.error('Vui lòng chọn kết quả đánh giá');
      return;
    }
    setEvalSubmitting(true);
    try {
      await put(ENDPOINTS.TEACHER.STUDENT_EVALUATION(evalDialog._id), {
        academicEvaluation: evalData.academicEvaluation,
        evaluationNote: evalData.evaluationNote.trim(),
      });
      toast.success('Đã cập nhật đánh giá học tập');
      closeEvalDialog();
      fetchStudents(classFilter);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Cập nhật thất bại');
    } finally {
      setEvalSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter(s =>
      (!q || s.fullName.toLowerCase().includes(q) ||
        (s.classId?.className || '').toLowerCase().includes(q))
    );
  }, [students, search]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const menuItems = useMemo(
    () => getTeacherMenuItems(hasPermission, hasRole),
    [hasPermission, hasRole]
  );

  const activeKey = 'evaluation';

  const handleMenuSelect = (key) => {
    const MAP = {
      classes: '/teacher',
      students: '/teacher/students',
      evaluation: '/teacher/evaluation',
      'contact-book': '/teacher/contact-book',
      attendance: '/teacher/attendance',
      'pickup-approval': '/teacher/pickup-approval',
      'leave-requests': '/teacher/leave-requests',
      'purchase-request': '/teacher/purchase-request',
      'class-assets': '/teacher/class-assets',
      'asset-inspection': '/teacher/asset-inspection',
    };
    if (MAP[key]) navigate(MAP[key]);
  };

  const userName = user?.fullName || user?.username || 'Teacher';

  return (
    <Box>
      <Paper elevation={0} sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <EvaluationIcon sx={{ color: 'white', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} color="white">Đánh giá học tập</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {classes.length} lớp · {students.length} học sinh
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper elevation={1} sx={{ borderRadius: 2, p: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2} alignItems={{ sm: 'center' }}>
          <TextField
            size="small" placeholder="Tìm tên học sinh, lớp..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            sx={{ minWidth: 240 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Lọc theo lớp</InputLabel>
            <Select
              label="Lọc theo lớp"
              value={classFilter}
              onChange={e => { setClassFilter(e.target.value); setPage(0); fetchStudents(e.target.value); }}
            >
              <MenuItem value="">Tất cả lớp</MenuItem>
              {classes.map(c => <MenuItem key={c._id} value={c._id}>{c.className}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" color="text.secondary">{filtered.length} học sinh</Typography>
        </Stack>

        {loading ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Stack spacing={1}>
              {[1,2,3,4,5].map(i => <Skeleton key={i} variant="rounded" height={52} />)}
            </Stack>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>STT</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Học sinh</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Lớp</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Kết quả đánh giá</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Ghi chú</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                        Không có dữ liệu học sinh
                      </TableCell>
                    </TableRow>
                  ) : paginated.map((s, idx) => (
                    <TableRow key={s._id} hover>
                      <TableCell>{page * PAGE_SIZE + idx + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar src={s.avatar} sx={{ width: 32, height: 32, bgcolor: '#0891b2', fontSize: 13 }}>{s.fullName?.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{s.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary">{genderLabel(s.gender)} · {calcAge(s.dateOfBirth)}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={s.classId?.className || '—'} size="small" sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        {s.evaluation?.academicEvaluation ? (
                          <Chip
                            label={s.evaluation.academicEvaluation === 'đạt' ? 'Đạt' : 'Chưa đạt'}
                            color={s.evaluation.academicEvaluation === 'đạt' ? 'success' : 'error'}
                            size="small"
                            icon={s.evaluation.academicEvaluation === 'đạt' ? <CheckIcon sx={{ fontSize: '14px !important' }} /> : <CancelIcon sx={{ fontSize: '14px !important' }} />}
                            sx={{ fontWeight: 600 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.disabled">Chưa đánh giá</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.evaluation?.evaluationNote ? (
                          <Tooltip title={s.evaluation.evaluationNote}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography variant="caption" noWrap sx={{ maxWidth: 200 }}>{s.evaluation.evaluationNote}</Typography>
                              <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                            </Stack>
                          </Tooltip>
                        ) : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small" variant="contained"
                          disableElevation
                          onClick={() => openEvalDialog(s)}
                          sx={{ borderRadius: 1.5, textTransform: 'none', px: 2, bgcolor: '#0891b2', '&:hover': { bgcolor: '#0e7490' } }}
                        >
                          {s.evaluation?.academicEvaluation ? 'Cập nhật' : 'Đánh giá'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div" count={filtered.length} page={page} rowsPerPage={PAGE_SIZE} rowsPerPageOptions={[PAGE_SIZE]}
              onPageChange={(_, p) => setPage(p)}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count} học sinh`}
            />
          </>
        )}
      </Paper>

      {/* Evaluation Dialog */}
      <Dialog open={!!evalDialog} onClose={closeEvalDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Đánh giá học tập tổng quan</DialogTitle>
        <DialogContent dividers>
          {evalDialog && (
            <Stack spacing={0.5} mb={3} direction="row" alignItems="center">
              <Avatar src={evalDialog.avatar} sx={{ width: 36, height: 36, bgcolor: '#0891b2' }}>{evalDialog.fullName?.charAt(0)}</Avatar>
              <Box sx={{ ml: 1.5 }}>
                <Typography variant="body2" fontWeight={700}>{evalDialog.fullName}</Typography>
                <Typography variant="caption" color="text.secondary">Lớp: {evalDialog.classId?.className || '—'}</Typography>
              </Box>
            </Stack>
          )}
          {evalLoading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">Đang tải...</Typography></Box>
          ) : (
            <Stack spacing={3}>
              <FormControl component="fieldset">
                <Typography variant="body2" fontWeight={700} gutterBottom>Kết quả đánh giá học tập *</Typography>
                <Stack direction="row" spacing={3}>
                  <FormControlLabel
                    control={<Radio checked={evalData.academicEvaluation === 'đạt'} onChange={() => setEvalData(p => ({ ...p, academicEvaluation: 'đạt' }))} color="success" />}
                    label={<Typography variant="body2" fontWeight={600} color="success.main">Đạt</Typography>}
                  />
                  <FormControlLabel
                    control={<Radio checked={evalData.academicEvaluation === 'chưa đạt'} onChange={() => setEvalData(p => ({ ...p, academicEvaluation: 'chưa đạt' }))} color="error" />}
                    label={<Typography variant="body2" fontWeight={600} color="error.main">Chưa đạt</Typography>}
                  />
                </Stack>
              </FormControl>
              <TextField
                label="Ghi chú đánh giá" fullWidth multiline minRows={4}
                value={evalData.evaluationNote} onChange={e => setEvalData(p => ({ ...p, evaluationNote: e.target.value }))}
                placeholder="Nhập nhận xét chi tiết về kết quả học tập, rèn luyện..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeEvalDialog} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>Hủy</Button>
          <Button
            variant="contained" onClick={submitEvaluation}
            disabled={evalSubmitting || evalLoading || !evalData.academicEvaluation}
            sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 700, bgcolor: '#0891b2', '&:hover': { bgcolor: '#0e7490' } }}
          >
            {evalSubmitting ? 'Đang lưu...' : 'Lưu đánh giá'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
