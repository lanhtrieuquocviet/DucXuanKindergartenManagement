import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import { postFormData, ENDPOINTS, get, put, patch } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import { toast } from 'react-toastify';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Divider,
  Avatar,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  Badge,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  PeopleAlt as PeopleAltIcon,
  Visibility as VisibilityIcon,
  Autorenew as AutorenewIcon,
  HealthAndSafety as HealthIcon,
  NotificationsActive as RequestAlertIcon,
  CheckCircle as ResolveIcon,
} from '@mui/icons-material';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

const PHONE_REGEX = /^[0-9]{10,11}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidPhone(value) {
  if (!value || !value.trim()) return true;
  return PHONE_REGEX.test(value.trim().replace(/\s/g, ''));
}
function isValidEmail(value) {
  if (!value || !value.trim()) return false;
  return EMAIL_REGEX.test(value.trim());
}

function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Pending change requests: map studentId -> count
  const [pendingMap, setPendingMap] = useState({});
  // Dialog xem yêu cầu của 1 học sinh
  const [reqViewStudent, setReqViewStudent] = useState(null);
  const [reqViewData, setReqViewData]       = useState([]);
  const [reqViewLoading, setReqViewLoading] = useState(false);
  const [resolvingId, setResolvingId]       = useState(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailStudent, setDetailStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formAdd, setFormAdd] = useState({
    parent: { username: '', password: '', fullName: '', email: '', phone: '' },
    student: { fullName: '', dateOfBirth: '', gender: 'male', address: '', avatar: '' },
  });
  const [formAddErrors, setFormAddErrors] = useState({});
  const [addError, setAddError] = useState(null);
  const [usernameGenerating, setUsernameGenerating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const addImageInputRef = useRef(null);
  const [formEdit, setFormEdit] = useState({
    fullName: '', dateOfBirth: '', gender: 'male', classId: '', address: '', status: 'active',
    parentFullName: '', parentEmail: '', parentPhone: '',
    needsSpecialAttention: false, specialNote: '',
  });
  const [formEditErrors, setFormEditErrors] = useState({});
  const [editError, setEditError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const navigate = useNavigate();
  const { user, hasRole, logout, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();
  const {
    getAllStudents,
    getClasses,
    createStudentWithParent,
    updateStudent,
    deleteStudent,
    loading: ctxLoading,
    setError: setCtxError,
  } = useSchoolAdmin();

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) {
      navigate('/', { replace: true });
      return;
    }
    fetchData();
  }, [navigate, user, hasRole, isInitializing]);

  const fetchPendingMap = async () => {
    try {
      const res = await get(ENDPOINTS.STUDENTS.CHANGE_REQUESTS_PENDING_MAP);
      setPendingMap(res.data || {});
    } catch { /* silent */ }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, classesRes, yearRes] = await Promise.all([
        getAllStudents(classFilter ? { classId: classFilter } : {}),
        getClasses(),
        get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT).catch(() => null),
      ]);
      setStudents(studentsRes?.data || []);
      setClasses(classesRes?.data || []);
      if (yearRes?.status === 'success' && yearRes.data) setActiveAcademicYear(yearRes.data);
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
    fetchPendingMap();
  };

  const openReqView = async (student) => {
    setReqViewStudent(student);
    setReqViewData([]);
    setReqViewLoading(true);
    try {
      const res = await get(`${ENDPOINTS.STUDENTS.CHANGE_REQUESTS}?status=pending`);
      // Filter for this student
      const filtered = (res.data || []).filter(r => String(r.studentId?._id || r.studentId) === String(student._id));
      setReqViewData(filtered);
    } catch { setReqViewData([]); }
    finally { setReqViewLoading(false); }
  };

  const handleResolve = async (reqId) => {
    setResolvingId(reqId);
    try {
      await patch(ENDPOINTS.STUDENTS.CHANGE_REQUEST_RESOLVE(reqId), {});
      setReqViewData(prev => prev.filter(r => r._id !== reqId));
      setPendingMap(prev => {
        const sid = String(reqViewStudent._id);
        const newCount = (prev[sid] || 1) - 1;
        const next = { ...prev };
        if (newCount <= 0) delete next[sid]; else next[sid] = newCount;
        return next;
      });
      toast.success('Đã giải quyết yêu cầu');
    } catch (err) {
      toast.error(err.message || 'Thao tác thất bại');
    } finally {
      setResolvingId(null);
    }
  };

  useEffect(() => {
    if (user && !isInitializing && (hasRole('SchoolAdmin') || hasRole('SystemAdmin'))) {
      getAllStudents(classFilter ? { classId: classFilter } : {}).then((res) => setStudents(res?.data || [])).catch(() => {});
    }
  }, [classFilter]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  const handleViewProfile = () => navigate('/profile');

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  const filteredStudents = students.filter((s) => {
    const matchSearch = !searchTerm || (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
      || (s.parentId?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const handleGenerateUsername = async () => {
    setUsernameGenerating(true);
    setFormAddErrors((prev) => { const n = { ...prev }; delete n.parentUsername; return n; });
    try {
      const res = await get(ENDPOINTS.STUDENTS.GENERATE_USERNAME);
      setFormAdd((prev) => ({ ...prev, parent: { ...prev.parent, username: res.username } }));
    } catch (err) {
      setFormAddErrors((prev) => ({ ...prev, parentUsername: err.data?.message || 'Lỗi khi tạo username' }));
    } finally {
      setUsernameGenerating(false);
    }
  };

  const handleOpenAdd = () => {
    setFormAdd({
      parent: { username: '', password: '', fullName: '', email: '', phone: '' },
      student: { fullName: '', dateOfBirth: '', gender: 'male', address: '', avatar: '' },
    });
    setFormAddErrors({});
    setAddError(null);
    setOpenAdd(true);
    handleGenerateUsername();
  };

  const handleAddImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingImage(true);
    setCtxError(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_AVATAR, formData);
      const url = response?.data?.url;
      if (url) {
        setFormAdd((prev) => ({ ...prev, student: { ...prev.student, avatar: url } }));
      }
    } catch (err) {
      setCtxError(err?.data?.message || err.message || 'Tải ảnh lên thất bại');
    } finally {
      setUploadingImage(false);
      if (addImageInputRef.current) addImageInputRef.current.value = '';
    }
  };

  const handleSubmitAdd = async () => {
    setCtxError(null);
    const errs = {};
    if (!(formAdd.parent.username || '').trim()) errs.parentUsername = 'Vui lòng tạo tài khoản đăng nhập';
    if (!(formAdd.parent.password || '').trim()) errs.parentPassword = 'Vui lòng nhập mật khẩu';
    else if (formAdd.parent.password.trim().length < 6) errs.parentPassword = 'Mật khẩu tối thiểu 6 ký tự';
    if (!(formAdd.parent.fullName || '').trim()) errs.parentFullName = 'Vui lòng nhập họ tên phụ huynh';
    if (!isValidEmail(formAdd.parent.email)) errs.parentEmail = 'Email không hợp lệ';
    if (formAdd.parent.phone && !isValidPhone(formAdd.parent.phone)) errs.parentPhone = 'Số điện thoại phải 10–11 chữ số';
    if (!(formAdd.student.fullName || '').trim()) errs.studentFullName = 'Vui lòng nhập họ tên học sinh';
    if (!formAdd.student.dateOfBirth) errs.studentDateOfBirth = 'Vui lòng chọn ngày sinh';
    else if (new Date(formAdd.student.dateOfBirth) >= new Date()) errs.studentDateOfBirth = 'Ngày sinh phải nhỏ hơn ngày hiện tại';
    if (Object.keys(errs).length) {
      setFormAddErrors(errs);
      return;
    }
    setFormAddErrors({});
    setAddError(null);
    try {
      await createStudentWithParent(formAdd);
      setOpenAdd(false);
      fetchData();
    } catch (err) {
      setAddError(err?.message || 'Tạo học sinh thất bại');
    }
  };

  const handleOpenEdit = (row) => {
    setSelectedStudent(row);
    const d = row.dateOfBirth ? new Date(row.dateOfBirth) : null;
    setFormEdit({
      fullName: row.fullName || '',
      dateOfBirth: d ? d.toISOString().slice(0, 10) : '',
      gender: row.gender || 'male',
      classId: row.classId?._id || row.classId || '',
      address: row.address || '',
      status: row.status || 'active',
      parentFullName: row.parentId?.fullName || '',
      parentEmail: row.parentId?.email || '',
      parentPhone: row.parentId?.phone || row.parentPhone || row.phone || '',
      needsSpecialAttention: row.needsSpecialAttention || false,
      specialNote: row.specialNote || '',
    });
    setFormEditErrors({});
    setEditError(null);
    setOpenEdit(true);
  };

  const handleSubmitEdit = async () => {
    if (!selectedStudent?._id) return;
    setCtxError(null);
    const err = {};
    if (!(formEdit.fullName || '').trim()) err.fullName = 'Vui lòng nhập họ tên học sinh';
    if (!formEdit.dateOfBirth) err.dateOfBirth = 'Vui lòng chọn ngày sinh';
    else if (new Date(formEdit.dateOfBirth) >= new Date()) err.dateOfBirth = 'Ngày sinh phải nhỏ hơn ngày hiện tại';
    if (formEdit.parentEmail && !isValidEmail(formEdit.parentEmail)) err.parentEmail = 'Email không hợp lệ';
    if (formEdit.parentPhone && !isValidPhone(formEdit.parentPhone)) err.parentPhone = 'SĐT phụ huynh 10–11 chữ số';
    if (Object.keys(err).length) {
      setFormEditErrors(err);
      return;
    }
    setFormEditErrors({});
    setEditError(null);
    try {
      const payload = {
        fullName: formEdit.fullName,
        dateOfBirth: formEdit.dateOfBirth,
        gender: formEdit.gender,
        address: formEdit.address,
        status: formEdit.status,
        parentFullName: formEdit.parentFullName,
        parentPhone: formEdit.parentPhone,
        needsSpecialAttention: formEdit.needsSpecialAttention,
        specialNote: formEdit.specialNote,
      };
      if (formEdit.parentEmail) payload.parentEmail = formEdit.parentEmail;
      await updateStudent(selectedStudent._id, payload);
      setOpenEdit(false);
      setSelectedStudent(null);
      fetchData();
    } catch (err) {
      setEditError(err?.message || 'Lỗi khi cập nhật học sinh');
    }
  };

  const handleOpenDelete = (row) => {
    setSelectedStudent(row);
    setDeleteError(null);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedStudent?._id) return;
    setCtxError(null);
    setDeleteError(null);
    try {
      await deleteStudent(selectedStudent._id);
      setOpenDelete(false);
      setSelectedStudent(null);
      fetchData();
    } catch (err) {
      setDeleteError(err?.message || 'Xóa học sinh thất bại');
    }
  };

  const handleViewStudentsInClass = (classId) => {
    navigate(`/school-admin/classes/${classId}/students`);
  };

  const handleOpenDetail = (row) => {
    setDetailStudent(row);
    setOpenDetail(true);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? '—' : x.toLocaleDateString('vi-VN');
  };

  return (
    <RoleLayout
      title="Học sinh & phụ huynh"
      description="Quản lý danh sách học sinh và tài khoản phụ huynh. parentId của học sinh là _id tài khoản User phụ huynh."
      menuItems={menuItems}
      activeKey="students"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'Admin'}
      userAvatar={user?.avatar}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <PeopleIcon sx={{ color: 'white', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} color="white">
              Danh sách học sinh & phụ huynh
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Tab navigation */}
      <Paper elevation={0} sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={0}
          onChange={(_, v) => { if (v === 1) navigate('/school-admin/students/health-report'); }}
          sx={{ px: 1, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13 }, '& .Mui-selected': { color: '#6366f1' }, '& .MuiTabs-indicator': { bgcolor: '#6366f1' } }}
        >
          <Tab icon={<PeopleAltIcon fontSize="small" />} iconPosition="start" label="Danh sách học sinh" />
          <Tab icon={<HealthIcon fontSize="small" />} iconPosition="start" label="Báo cáo sức khỏe" />
        </Tabs>
      </Paper>

      <Paper elevation={1} sx={{ borderRadius: 2, p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Typography variant="subtitle2" fontWeight={600}>
            Tổng: {filteredStudents.length} học sinh
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              size="small"
              placeholder="Tìm theo tên học sinh / phụ huynh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Lớp</InputLabel>
              <Select
                value={classFilter}
                label="Lớp"
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {classes.map((c) => (
                  <MenuItem key={c._id} value={c._id}>{c.className || c._id}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} disabled={loading}>
              Tải lại
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} disabled={ctxLoading}>
              Thêm học sinh
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Stack alignItems="center" py={4}><CircularProgress /></Stack>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Họ tên</strong></TableCell>
                  <TableCell><strong>Ngày sinh</strong></TableCell>
                  <TableCell><strong>Giới tính</strong></TableCell>
                  <TableCell><strong>Năm học</strong></TableCell>
                  {/* <TableCell><strong>Lớp</strong></TableCell> */}
                  <TableCell><strong>Phụ huynh</strong></TableCell>
                  <TableCell><strong>SĐT</strong></TableCell>
                  <TableCell align="center"><strong>Cần chú ý</strong></TableCell>
                  <TableCell align="center"><strong>Yêu cầu GV</strong></TableCell>
                  <TableCell><strong>Ghi chú đặc biệt</strong></TableCell>
                  <TableCell align="right"><strong>Thao tác</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((row) => {
                  const pendingCount = pendingMap[String(row._id)] || 0;
                  return (
                  <TableRow key={row._id} sx={pendingCount > 0 ? { bgcolor: '#fffbeb' } : {}}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        {pendingCount > 0 && (
                          <Tooltip title={`${pendingCount} yêu cầu chờ xử lý từ giáo viên`}>
                            <RequestAlertIcon sx={{ fontSize: 16, color: '#d97706', flexShrink: 0 }} />
                          </Tooltip>
                        )}
                        <span>{row.fullName || '—'}</span>
                      </Stack>
                    </TableCell>
                    <TableCell>{formatDate(row.dateOfBirth)}</TableCell>
                    <TableCell>{GENDER_OPTIONS.find((g) => g.value === row.gender)?.label || row.gender || '—'}</TableCell>
                    <TableCell>
                      {row.academicYearId?.yearName
                        ? <Chip label={row.academicYearId.yearName} size="small" sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 600, fontSize: '0.72rem' }} />
                        : <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>
                    {/* <TableCell>{row.classId?.className || '—'}</TableCell> */}
                    <TableCell>{row.parentId?.fullName || '—'}</TableCell>
                    <TableCell>{row.phone || row.parentPhone || row.parentId?.phone || '—'}</TableCell>
                    <TableCell align="center">
                      {row.needsSpecialAttention
                        ? <Chip label="Có" color="warning" size="small" />
                        : <Chip label="Không" size="small" variant="outlined" />}
                    </TableCell>
                    <TableCell align="center">
                      {pendingCount > 0 ? (
                        <Tooltip title="Xem các yêu cầu từ giáo viên">
                          <Chip
                            label={`${pendingCount} chờ xử lý`}
                            size="small"
                            color="warning"
                            icon={<RequestAlertIcon sx={{ fontSize: 13 }} />}
                            onClick={() => openReqView(row)}
                            sx={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.specialNote
                        ? <Tooltip title={row.specialNote}><Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>{row.specialNote}</Typography></Tooltip>
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleOpenDetail(row)} sx={{ mr: 0.5 }}>
                        Xem
                      </Button>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenEdit(row)} sx={{ mr: 0.5 }}>
                        Sửa
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleOpenDelete(row)}>
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                );})}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {!loading && filteredStudents.length === 0 && (
          <Typography color="text.secondary" align="center" py={3}>Chưa có học sinh nào.</Typography>
        )}
      </Paper>

      {/* Modal Thêm: Tài khoản phụ huynh + Học sinh */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm học sinh và tài khoản phụ huynh</DialogTitle>
        <DialogContent dividers>
          {addError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAddError(null)}>
              {addError}
            </Alert>
          )}
          <Typography variant="subtitle2" color="primary" gutterBottom>Thông tin tài khoản phụ huynh</Typography>
          <Stack spacing={1.5} mb={2}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                size="small"
                label="Tài khoản đăng nhập"
                value={formAdd.parent.username}
                InputProps={{ readOnly: true }}
                sx={{ flex: 1 }}
                required
                error={!!formAddErrors.parentUsername}
                helperText={formAddErrors.parentUsername || 'Được tạo tự động'}
              />
              <Tooltip title="Tạo lại">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleGenerateUsername}
                    disabled={usernameGenerating}
                    sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                  >
                    {usernameGenerating ? <CircularProgress size={18} /> : <AutorenewIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
            <TextField size="small" type="password" label="Mật khẩu" value={formAdd.parent.password} onChange={(e) => setFormAdd((prev) => ({ ...prev, parent: { ...prev.parent, password: e.target.value } }))} fullWidth required error={!!formAddErrors.parentPassword} helperText={formAddErrors.parentPassword} />
            <TextField size="small" label="Họ tên phụ huynh" value={formAdd.parent.fullName} onChange={(e) => setFormAdd((prev) => ({ ...prev, parent: { ...prev.parent, fullName: e.target.value } }))} fullWidth required error={!!formAddErrors.parentFullName} helperText={formAddErrors.parentFullName} />
            <TextField size="small" type="email" label="Email" value={formAdd.parent.email} onChange={(e) => setFormAdd((prev) => ({ ...prev, parent: { ...prev.parent, email: e.target.value } }))} fullWidth required error={!!formAddErrors.parentEmail} helperText={formAddErrors.parentEmail} />
            <TextField size="small" label="Số điện thoại" value={formAdd.parent.phone} onChange={(e) => setFormAdd((prev) => ({ ...prev, parent: { ...prev.parent, phone: e.target.value.replace(/\D/g, '') } }))} fullWidth error={!!formAddErrors.parentPhone} helperText={formAddErrors.parentPhone} placeholder="10–11 chữ số" inputProps={{ inputMode: 'numeric', maxLength: 11 }} />
          </Stack>
          <Typography variant="subtitle2" color="primary" gutterBottom>Thông tin học sinh</Typography>
          <Stack spacing={1.5}>
            <Box sx={{ p: 1.5, bgcolor: '#e0f2fe', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="#0284c7" fontWeight={600}>Năm học sẽ được gán:</Typography>
              <Chip
                label={activeAcademicYear?.yearName || 'Chưa có năm học đang hoạt động'}
                size="small"
                sx={{ bgcolor: activeAcademicYear ? '#0284c7' : '#9e9e9e', color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}
              />
            </Box>
            <TextField size="small" label="Họ tên học sinh" value={formAdd.student.fullName} onChange={(e) => setFormAdd((prev) => ({ ...prev, student: { ...prev.student, fullName: e.target.value } }))} fullWidth required error={!!formAddErrors.studentFullName} helperText={formAddErrors.studentFullName} />
            <TextField size="small" type="date" label="Ngày sinh" InputLabelProps={{ shrink: true }} value={formAdd.student.dateOfBirth} onChange={(e) => setFormAdd((prev) => ({ ...prev, student: { ...prev.student, dateOfBirth: e.target.value } }))} fullWidth required error={!!formAddErrors.studentDateOfBirth} helperText={formAddErrors.studentDateOfBirth} />
            <FormControl size="small" fullWidth>
              <InputLabel>Giới tính</InputLabel>
              <Select value={formAdd.student.gender} label="Giới tính" onChange={(e) => setFormAdd((prev) => ({ ...prev, student: { ...prev.student, gender: e.target.value } }))}>
                {GENDER_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Ảnh học sinh</Typography>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                ref={addImageInputRef}
                onChange={handleAddImageChange}
                style={{ display: 'none' }}
              />
              <Stack direction="row" alignItems="center" spacing={2}>
                <Button variant="outlined" size="small" component="span" disabled={uploadingImage} onClick={() => addImageInputRef.current?.click()}>
                  {uploadingImage ? <CircularProgress size={20} /> : 'Chọn ảnh'}
                </Button>
                {formAdd.student.avatar && (
                  <>
                    <Box component="img" src={formAdd.student.avatar} alt="Preview" sx={{ width: 56, height: 56, borderRadius: 1, objectFit: 'cover' }} />
                    <Button size="small" color="error" onClick={() => setFormAdd((prev) => ({ ...prev, student: { ...prev.student, avatar: '' } }))}>Xóa ảnh</Button>
                  </>
                )}
              </Stack>
            </Box>
            <TextField size="small" label="Địa chỉ" value={formAdd.student.address} onChange={(e) => setFormAdd((prev) => ({ ...prev, student: { ...prev.student, address: e.target.value } }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmitAdd} disabled={ctxLoading}>
            {ctxLoading ? <CircularProgress size={24} /> : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Sửa */}
      <Dialog open={openEdit} onClose={() => { setOpenEdit(false); setEditError(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Cập nhật học sinh và phụ huynh</DialogTitle>
        <DialogContent dividers>
          {editError && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setEditError(null)}>{editError}</Alert>}
          <Stack spacing={1.5}>
            <TextField size="small" label="Họ tên học sinh" value={formEdit.fullName} onChange={(e) => setFormEdit((p) => ({ ...p, fullName: e.target.value }))} fullWidth required error={!!formEditErrors.fullName} helperText={formEditErrors.fullName} />
            <TextField size="small" type="date" label="Ngày sinh" InputLabelProps={{ shrink: true }} value={formEdit.dateOfBirth} onChange={(e) => setFormEdit((p) => ({ ...p, dateOfBirth: e.target.value }))} fullWidth required error={!!formEditErrors.dateOfBirth} helperText={formEditErrors.dateOfBirth} />
            <FormControl size="small" fullWidth>
              <InputLabel>Giới tính</InputLabel>
              <Select value={formEdit.gender} label="Giới tính" onChange={(e) => setFormEdit((p) => ({ ...p, gender: e.target.value }))}>
                {GENDER_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Địa chỉ" value={formEdit.address} onChange={(e) => setFormEdit((p) => ({ ...p, address: e.target.value }))} fullWidth />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Thông tin phụ huynh (tài khoản User)</Typography>
            <TextField size="small" label="Họ tên phụ huynh" value={formEdit.parentFullName} onChange={(e) => setFormEdit((p) => ({ ...p, parentFullName: e.target.value }))} fullWidth />
            <TextField size="small" type="email" label="Email phụ huynh" value={formEdit.parentEmail} onChange={(e) => setFormEdit((p) => ({ ...p, parentEmail: e.target.value }))} fullWidth error={!!formEditErrors.parentEmail} helperText={formEditErrors.parentEmail} />
            <TextField size="small" label="SĐT phụ huynh" value={formEdit.parentPhone} onChange={(e) => setFormEdit((p) => ({ ...p, parentPhone: e.target.value.replace(/\D/g, '') }))} fullWidth error={!!formEditErrors.parentPhone} helperText={formEditErrors.parentPhone} placeholder="10–11 chữ số" inputProps={{ inputMode: 'numeric', maxLength: 11 }} />
            <Divider />
            <FormControlLabel
              control={
                <Switch
                  checked={formEdit.needsSpecialAttention}
                  onChange={(e) => setFormEdit((p) => ({ ...p, needsSpecialAttention: e.target.checked }))}
                  color="warning"
                />
              }
              label="Cần chú ý đặc biệt"
            />
            <TextField
              size="small"
              label="Ghi chú đặc biệt"
              value={formEdit.specialNote}
              onChange={(e) => setFormEdit((p) => ({ ...p, specialNote: e.target.value }))}
              fullWidth
              multiline
              rows={2}
              placeholder="Dị ứng, bệnh nền, yêu cầu đặc biệt..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmitEdit} disabled={ctxLoading}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Xem chi tiết */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết học sinh & phụ huynh</DialogTitle>
        <DialogContent dividers>
          {detailStudent && (
            <Stack spacing={2}>
              {/* Thông tin học sinh */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={detailStudent.avatar || ''}
                  alt={detailStudent.fullName}
                  sx={{ width: 64, height: 64, fontSize: 28 }}
                >
                  {(detailStudent.fullName || '?')[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{detailStudent.fullName || '—'}</Typography>
                  <Chip
                    size="small"
                    label={detailStudent.status === 'active' ? 'Đang học' : 'Nghỉ học'}
                    color={detailStudent.status === 'active' ? 'success' : 'default'}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Stack>

              <Divider />
              <Typography variant="subtitle2" color="primary" fontWeight={700}>Thông tin học sinh</Typography>
              <Stack spacing={0.75}>
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>Ngày sinh:</Typography>
                  <Typography variant="body2">{formatDate(detailStudent.dateOfBirth)}</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>Giới tính:</Typography>
                  <Typography variant="body2">{GENDER_OPTIONS.find((g) => g.value === detailStudent.gender)?.label || detailStudent.gender || '—'}</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>Lớp:</Typography>
                  <Typography variant="body2">{detailStudent.classId?.className || '— Chưa có lớp —'}</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>Địa chỉ:</Typography>
                  <Typography variant="body2">{detailStudent.address || '—'}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>Cần chú ý:</Typography>
                  {detailStudent.needsSpecialAttention
                    ? <Chip label="Có" color="warning" size="small" />
                    : <Chip label="Không" size="small" variant="outlined" />}
                </Stack>
                {detailStudent.needsSpecialAttention && detailStudent.specialNote && (
                  <Stack direction="row" spacing={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>Ghi chú:</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{detailStudent.specialNote}</Typography>
                  </Stack>
                )}
              </Stack>

              <Divider />
              <Typography variant="subtitle2" color="primary" fontWeight={700}>Tài khoản phụ huynh</Typography>
              {detailStudent.parentId ? (
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>Họ tên:</Typography>
                    <Typography variant="body2">{detailStudent.parentId.fullName || '—'}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>Tài khoản:</Typography>
                    <Typography variant="body2">{detailStudent.parentId.username || '—'}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>Email:</Typography>
                    <Typography variant="body2">{detailStudent.parentId.email || '—'}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>Số điện thoại:</Typography>
                    <Typography variant="body2">{detailStudent.parentId.phone || '—'}</Typography>
                  </Stack>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">Chưa có tài khoản phụ huynh.</Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Đóng</Button>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => { setOpenDetail(false); handleOpenEdit(detailStudent); }}>
            Sửa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Xác nhận xóa */}
      <Dialog open={openDelete} onClose={() => { setOpenDelete(false); setDeleteError(null); }}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setDeleteError(null)}>{deleteError}</Alert>}
          Bạn có chắc muốn xóa học sinh &quot;{selectedStudent?.fullName}&quot;? Tài khoản phụ huynh vẫn được giữ nguyên.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete} disabled={ctxLoading}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xem & giải quyết yêu cầu từ giáo viên */}
      <Dialog open={!!reqViewStudent} onClose={() => setReqViewStudent(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Yêu cầu thay đổi thông tin từ giáo viên
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {reqViewStudent && (
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 2.5, py: 1.5, bgcolor: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
              <RequestAlertIcon sx={{ color: '#d97706', fontSize: 18 }} />
              <Typography variant="body2" fontWeight={700}>{reqViewStudent.fullName}</Typography>
            </Stack>
          )}
          {reqViewLoading ? (
            <Box sx={{ py: 5, textAlign: 'center' }}><CircularProgress size={28} /></Box>
          ) : reqViewData.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <ResolveIcon sx={{ fontSize: 36, color: '#22c55e', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Không còn yêu cầu nào đang chờ xử lý</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {reqViewData.map((r, idx) => (
                <Box key={r._id}>
                  <ListItem alignItems="flex-start" sx={{ py: 1.5, px: 2.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={700} mb={0.5}>{r.title}</Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 0.75 }}>{r.content}</Typography>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="caption" color="text.disabled">
                              {new Date(r.createdAt).toLocaleString('vi-VN')}
                              {r.teacherId?.userId?.fullName ? ` · GV: ${r.teacherId.userId.fullName}` : ''}
                            </Typography>
                            <Button
                              size="small" variant="contained"
                              startIcon={<ResolveIcon sx={{ fontSize: 14 }} />}
                              disabled={!!resolvingId}
                              onClick={() => handleResolve(r._id)}
                              sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontSize: '0.72rem', py: 0.4, px: 1.2, borderRadius: 1.5 }}
                            >
                              {resolvingId === r._id ? 'Đang xử lý...' : 'Giải quyết'}
                            </Button>
                          </Stack>
                        </>
                      }
                    />
                  </ListItem>
                  {idx < reqViewData.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => setReqViewStudent(null)} color="inherit">Đóng</Button>
        </DialogActions>
      </Dialog>

    </RoleLayout>
  );
}

export default ManageStudents;
