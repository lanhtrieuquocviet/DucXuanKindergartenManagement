import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, post, put, del, ENDPOINTS } from '../../service/api';
import {
  Box, Paper, Typography, Button, Stack, TextField, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, Tooltip, Chip, CircularProgress, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import SyncIcon from '@mui/icons-material/Sync';

const EMPTY_FORM = {
  fullName: '', email: '', phone: '', password: '',
  degree: '', experienceYears: '', hireDate: '',
};

export default function ManageTeachers() {
  const navigate = useNavigate();
  const { user, hasRole, isInitializing } = useAuth();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) { navigate('/', { replace: true }); return; }
    fetchTeachers();
  }, [isInitializing, user]);

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS);
      setTeachers(res.data || []);
    } catch (err) {
      setError(err.data?.message || err.message || 'Lỗi khi tải danh sách giáo viên');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    try {
      const res = await post(ENDPOINTS.SCHOOL_ADMIN.TEACHER_MIGRATE, {});
      await fetchTeachers();
      if (res.created > 0) setError(null);
    } catch (err) {
      setError(err.data?.message || err.message || 'Lỗi khi đồng bộ giáo viên');
    }
  };

  const filtered = useMemo(() =>
    teachers.filter(t =>
      !search ||
      t.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.phone?.includes(search)
    ), [teachers, search]);

  // ── Create ────────────────────────────────────────────────────────────────────
  const validateCreate = () => {
    const e = {};
    if (!createForm.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (!createForm.email.trim()) e.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) e.email = 'Email không hợp lệ';
    if (!createForm.password || createForm.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (createForm.experienceYears && isNaN(Number(createForm.experienceYears))) e.experienceYears = 'Phải là số';
    return e;
  };

  const handleCreate = async () => {
    const e = validateCreate();
    if (Object.keys(e).length) { setCreateErrors(e); return; }
    setCreateLoading(true);
    setCreateError(null);
    try {
      await post(ENDPOINTS.SCHOOL_ADMIN.TEACHERS, {
        ...createForm,
        experienceYears: Number(createForm.experienceYears) || 0,
      });
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      fetchTeachers();
    } catch (err) {
      setCreateError(err.data?.message || err.message || 'Lỗi khi tạo giáo viên');
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────────
  const openEdit = (t) => {
    setEditTarget(t);
    setEditForm({
      fullName: t.fullName || '',
      email: t.email || '',
      phone: t.phone || '',
      password: '',
      degree: t.degree || '',
      experienceYears: t.experienceYears?.toString() || '',
      hireDate: t.hireDate ? t.hireDate.split('T')[0] : '',
    });
    setEditErrors({});
    setEditError(null);
    setEditOpen(true);
  };

  const validateEdit = () => {
    const e = {};
    if (!editForm.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (!editForm.email.trim()) e.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) e.email = 'Email không hợp lệ';
    if (editForm.password && editForm.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (editForm.experienceYears && isNaN(Number(editForm.experienceYears))) e.experienceYears = 'Phải là số';
    return e;
  };

  const handleEdit = async () => {
    const e = validateEdit();
    if (Object.keys(e).length) { setEditErrors(e); return; }
    setEditLoading(true);
    setEditError(null);
    try {
      const payload = { ...editForm, experienceYears: Number(editForm.experienceYears) || 0 };
      if (!payload.password) delete payload.password;
      await put(ENDPOINTS.SCHOOL_ADMIN.TEACHER_UPDATE(editTarget._id), payload);
      setEditOpen(false);
      fetchTeachers();
    } catch (err) {
      setEditError(err.data?.message || err.message || 'Lỗi khi cập nhật giáo viên');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.TEACHER_DELETE(deleteTarget._id));
      setDeleteTarget(null);
      fetchTeachers();
    } catch (err) {
      setDeleteError(err.data?.message || err.message || 'Lỗi khi xóa giáo viên');
    } finally {
      setDeleteLoading(false);
    }
  };

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
    {
      key: 'academic-years',
      label: 'Quản lý năm học',
      children: [
        { key: 'academic-year-setup', label: 'Thiết lập năm học' },
        { key: 'academic-plan', label: 'Thiết lập kế hoạch' },
        { key: 'academic-students', label: 'Danh sách lớp học' },
        { key: 'academic-curriculum', label: 'Chương trình giáo dục' },
        { key: 'academic-schedule', label: 'Thời gian biểu' },
        { key: 'academic-report', label: 'Báo cáo & thống kê' },
      ],
    },
    { key: 'classes', label: 'Lớp học' },
    { key: 'teachers', label: 'Giáo viên' },
    { key: 'students', label: 'Học sinh & phụ huynh' },
    { key: 'assets', label: 'Quản lý tài sản' },
    { key: 'reports', label: 'Báo cáo của trường' },
    { key: 'contacts', label: 'Liên hệ' },
    { key: 'qa', label: 'Câu hỏi' },
    { key: 'blogs', label: 'Quản lý blog' },
    { key: 'documents', label: 'Quản lý tài liệu' },
    { key: 'public-info', label: 'Thông tin công khai' },
    { key: 'attendance', label: 'Quản lý điểm danh' },
  ];

  const handleMenuSelect = async (key) => {
    if (key === 'overview') { navigate('/school-admin'); return; }
    if (key === 'academic-years' || key === 'academic-year-setup') { navigate('/school-admin/academic-years'); return; }
    if (key === 'academic-curriculum') { navigate('/school-admin/curriculum'); return; }
    if (key === 'academic-schedule') { navigate('/school-admin/timetable'); return; }
    if (key === 'academic-plan') { navigate('/school-admin/academic-plan'); return; }
    if (key === 'academic-report') { navigate('/school-admin/academic-years'); return; }
    if (key === 'academic-students') { navigate('/school-admin/class-list'); return; }
    if (key === 'classes') { navigate('/school-admin/classes'); return; }
    if (key === 'teachers') { navigate('/school-admin/teachers'); return; }
    if (key === 'students') { navigate('/school-admin/students'); return; }
    if (key === 'contacts') { navigate('/school-admin/contacts'); return; }
    if (key === 'qa') { navigate('/school-admin/qa'); return; }
    if (key === 'blogs') { navigate('/school-admin/manage-blogs'); return; }
    if (key === 'documents') { navigate('/school-admin/documents'); return; }
    if (key === 'public-info') { navigate('/school-admin/public-info'); return; }
    if (key === 'attendance') { navigate('/school-admin/attendance/overview'); return; }
  };

  return (
    <RoleLayout
      menuItems={menuItems}
      activeKey="teachers"
      onMenuSelect={handleMenuSelect}
      onLogout={() => {}}
      onViewProfile={() => navigate('/profile')}
      userName={user?.fullName || user?.username || 'Admin'}
      userRole="SchoolAdmin"
      pageTitle="Giáo viên"
    >
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Danh sách giáo viên</Typography>
            <Typography variant="body2" color="text.secondary">{teachers.length} giáo viên</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small" placeholder="Tìm theo tên, email..."
              value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ width: 240 }}
            />
            <Tooltip title="Đồng bộ giáo viên từ tài khoản có role Teacher">
              <Button variant="outlined" startIcon={<SyncIcon />} onClick={handleMigrate} sx={{ whiteSpace: 'nowrap' }}>
                Đồng bộ
              </Button>
            </Tooltip>
            <Button
              variant="contained" startIcon={<AddIcon />}
              onClick={() => { setCreateForm(EMPTY_FORM); setCreateErrors({}); setCreateError(null); setCreateOpen(true); }}
              sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, whiteSpace: 'nowrap' }}
            >
              Thêm giáo viên
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Table */}
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
              <Typography color="text.secondary">{search ? 'Không tìm thấy giáo viên phù hợp' : 'Chưa có giáo viên nào'}</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f3ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Giáo viên</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Điện thoại</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Bằng cấp</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Kinh nghiệm</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Ngày vào</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map(t => (
                    <TableRow key={t._id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 700, fontSize: '0.9rem' }}>
                            {t.fullName?.charAt(0)?.toUpperCase() || <PersonIcon />}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{t.fullName}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="body2">{t.email || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{t.phone || '—'}</Typography></TableCell>
                      <TableCell>
                        {t.degree
                          ? <Chip label={t.degree} size="small" sx={{ bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 600 }} />
                          : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        {t.experienceYears > 0
                          ? <Typography variant="body2">{t.experienceYears} năm</Typography>
                          : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {t.hireDate ? new Date(t.hireDate).toLocaleDateString('vi-VN') : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                          size="small"
                          sx={{
                            fontWeight: 600, fontSize: '0.7rem',
                            bgcolor: t.status === 'active' ? '#dcfce7' : '#fee2e2',
                            color: t.status === 'active' ? '#16a34a' : '#dc2626',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Chỉnh sửa">
                            <IconButton size="small" onClick={() => openEdit(t)} sx={{ color: '#7c3aed' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton size="small" onClick={() => { setDeleteTarget(t); setDeleteError(null); }} sx={{ color: 'error.main' }}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* ── Create dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onClose={() => !createLoading && setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Thêm giáo viên mới</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {createError && <Alert severity="error">{createError}</Alert>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField size="small" label="Họ tên *" fullWidth value={createForm.fullName}
                onChange={e => setCreateForm(p => ({ ...p, fullName: e.target.value }))}
                error={!!createErrors.fullName} helperText={createErrors.fullName} />
              <TextField size="small" label="Email *" fullWidth value={createForm.email}
                onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                error={!!createErrors.email} helperText={createErrors.email} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField size="small" label="Số điện thoại" fullWidth value={createForm.phone}
                onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} />
              <TextField size="small" label="Mật khẩu *" type="password" fullWidth value={createForm.password}
                onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                error={!!createErrors.password} helperText={createErrors.password} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField size="small" label="Bằng cấp" fullWidth value={createForm.degree}
                onChange={e => setCreateForm(p => ({ ...p, degree: e.target.value }))} />
              <TextField size="small" label="Kinh nghiệm (năm)" type="number" fullWidth value={createForm.experienceYears}
                onChange={e => setCreateForm(p => ({ ...p, experienceYears: e.target.value }))}
                error={!!createErrors.experienceYears} helperText={createErrors.experienceYears} />
            </Stack>
            <TextField size="small" label="Ngày vào làm" type="date" fullWidth value={createForm.hireDate}
              onChange={e => setCreateForm(p => ({ ...p, hireDate: e.target.value }))}
              InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit" disabled={createLoading}>Hủy</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createLoading}
            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}>
            {createLoading ? <CircularProgress size={18} color="inherit" /> : 'Tạo giáo viên'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit dialog ────────────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onClose={() => !editLoading && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Chỉnh sửa giáo viên</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editError && <Alert severity="error">{editError}</Alert>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField size="small" label="Họ tên *" fullWidth value={editForm.fullName}
                onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))}
                error={!!editErrors.fullName} helperText={editErrors.fullName} />
              <TextField size="small" label="Email *" fullWidth value={editForm.email}
                onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                error={!!editErrors.email} helperText={editErrors.email} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField size="small" label="Số điện thoại" fullWidth value={editForm.phone}
                onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
              <TextField size="small" label="Mật khẩu mới (bỏ trống nếu không đổi)" type="password" fullWidth value={editForm.password}
                onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                error={!!editErrors.password} helperText={editErrors.password} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField size="small" label="Bằng cấp" fullWidth value={editForm.degree}
                onChange={e => setEditForm(p => ({ ...p, degree: e.target.value }))} />
              <TextField size="small" label="Kinh nghiệm (năm)" type="number" fullWidth value={editForm.experienceYears}
                onChange={e => setEditForm(p => ({ ...p, experienceYears: e.target.value }))}
                error={!!editErrors.experienceYears} helperText={editErrors.experienceYears} />
            </Stack>
            <TextField size="small" label="Ngày vào làm" type="date" fullWidth value={editForm.hireDate}
              onChange={e => setEditForm(p => ({ ...p, hireDate: e.target.value }))}
              InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit" disabled={editLoading}>Hủy</Button>
          <Button variant="contained" onClick={handleEdit} disabled={editLoading}
            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}>
            {editLoading ? <CircularProgress size={18} color="inherit" /> : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => !deleteLoading && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Xóa giáo viên</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 1.5 }}>{deleteError}</Alert>}
          <Typography variant="body2">
            Bạn có chắc muốn xóa giáo viên <strong>{deleteTarget?.fullName}</strong>?
            Tài khoản sẽ bị vô hiệu hóa, không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit" disabled={deleteLoading}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={18} color="inherit" /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}
