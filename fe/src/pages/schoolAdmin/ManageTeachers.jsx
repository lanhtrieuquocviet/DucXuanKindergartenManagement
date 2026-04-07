import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, post, put, del, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import {
  Box, Paper, Typography, Button, Stack, TextField, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, TablePagination,
  IconButton, Tooltip, Chip, CircularProgress, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import SyncIcon from '@mui/icons-material/Sync';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AutorenewIcon from '@mui/icons-material/Autorenew';

const EMPLOYMENT_OPTIONS = [
  { value: 'contract', label: 'Giáo viên hợp đồng' },
  { value: 'permanent', label: 'Giáo viên biên chế' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
];

const EMPTY_CREATE = {
  username: '', password: '', fullName: '', email: '', phone: '',
  degree: '', hireDate: '', employmentType: 'contract', gender: 'male',
};

const EMPTY_EDIT = {
  fullName: '', email: '', phone: '',
  degree: '', hireDate: '', employmentType: 'contract', status: 'active', gender: 'male',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Tính số năm kinh nghiệm từ ngày vào làm đến hôm nay */
function calcExperienceYears(hireDate) {
  if (!hireDate) return null;
  const hire = new Date(hireDate);
  if (isNaN(hire.getTime())) return null;
  const now = new Date();
  const years = (now - hire) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, Math.floor(years));
}

function ExperienceBadge({ hireDate }) {
  const years = calcExperienceYears(hireDate);
  if (years === null) return null;
  return (
    <Stack spacing={0.5} mt={0.75}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="caption" color="text.secondary">Kinh nghiệm tính được:</Typography>
        <Chip
          label={years === 0 ? 'Dưới 1 năm' : `${years} năm`}
          size="small"
          sx={{ bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 700, fontSize: '0.75rem' }}
        />
      </Stack>
      {years >= 5 && (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <WarningAmberIcon sx={{ fontSize: 15, color: '#d97706' }} />
          <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600 }}>
            Giáo viên đã công tác tại trường trên 5 năm
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

export default function ManageTeachers() {
  const navigate = useNavigate();
  const { user, hasRole, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createErrors, setCreateErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [usernameGenerating, setUsernameGenerating] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
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
      await post(ENDPOINTS.SCHOOL_ADMIN.TEACHER_MIGRATE, {});
      await fetchTeachers();
    } catch (err) {
      setError(err.data?.message || err.message || 'Lỗi khi đồng bộ giáo viên');
    }
  };

  const filtered = useMemo(() => {
    setPage(0);
    return teachers.filter(t =>
      !search ||
      t.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.phone?.includes(search)
    );
  }, [teachers, search]);

  const paginated = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // ── Generate username ─────────────────────────────────────────────────────────
  const handleGenerateUsername = async () => {
    setUsernameGenerating(true);
    setCreateErrors(prev => { const n = { ...prev }; delete n.username; return n; });
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.TEACHER_GENERATE_USERNAME);
      setCreateForm(p => ({ ...p, username: res.username }));
    } catch (err) {
      setCreateErrors(prev => ({ ...prev, username: err.data?.message || 'Lỗi khi tạo username' }));
    } finally {
      setUsernameGenerating(false);
    }
  };

  // ── Create ────────────────────────────────────────────────────────────────────
  const validateCreate = () => {
    const e = {};
    if (!createForm.username.trim()) e.username = 'Vui lòng tạo tài khoản đăng nhập';
    if (!createForm.password || createForm.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (!createForm.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (!createForm.email.trim()) e.email = 'Vui lòng nhập email';
    else if (!EMAIL_RE.test(createForm.email)) e.email = 'Email không hợp lệ';
    if (createForm.phone && !/^[0-9]{10,11}$/.test(createForm.phone.replace(/\s/g, ''))) e.phone = 'Số điện thoại phải 10–11 chữ số';
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
        experienceYears: calcExperienceYears(createForm.hireDate) ?? 0,
      });
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE);
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
      degree: t.degree || '',
      hireDate: t.hireDate ? t.hireDate.split('T')[0] : '',
      employmentType: t.employmentType || 'contract',
      status: t.status || 'active',
      gender: t.gender || 'male',
    });
    setEditErrors({});
    setEditError(null);
    setEditOpen(true);
  };

  const validateEdit = () => {
    const e = {};
    if (!editForm.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (!editForm.email.trim()) e.email = 'Vui lòng nhập email';
    else if (!EMAIL_RE.test(editForm.email)) e.email = 'Email không hợp lệ';
    if (editForm.phone && !/^[0-9]{10,11}$/.test(editForm.phone.replace(/\s/g, ''))) e.phone = 'Số điện thoại phải 10–11 chữ số';
    return e;
  };

  const handleEdit = async () => {
    const e = validateEdit();
    if (Object.keys(e).length) { setEditErrors(e); return; }
    setEditLoading(true);
    setEditError(null);
    try {
      const payload = { ...editForm, experienceYears: calcExperienceYears(editForm.hireDate) ?? 0 };
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

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

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
              onClick={() => { setCreateForm(EMPTY_CREATE); setCreateErrors({}); setCreateError(null); setCreateOpen(true); handleGenerateUsername(); }}
              sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, whiteSpace: 'nowrap' }}
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
            <>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#eff6ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Giáo viên</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Điện thoại</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Bằng cấp</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Loại hình</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Kinh nghiệm</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Ngày vào</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map(t => (
                    <TableRow key={t._id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 700, fontSize: '0.9rem' }}>
                            {t.fullName?.charAt(0)?.toUpperCase() || <PersonIcon />}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{t.fullName}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="body2">{t.email || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{t.phone || '—'}</Typography></TableCell>
                      <TableCell>
                        {t.degree
                          ? <Chip label={t.degree} size="small" sx={{ bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 600 }} />
                          : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t.employmentType === 'permanent' ? 'Biên chế' : 'Hợp đồng'}
                          size="small"
                          sx={{
                            fontWeight: 600, fontSize: '0.7rem',
                            bgcolor: t.employmentType === 'permanent' ? '#dcfce7' : '#fef9c3',
                            color: t.employmentType === 'permanent' ? '#16a34a' : '#b45309',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const yrs = calcExperienceYears(t.hireDate);
                          if (yrs === null) return <Typography variant="body2" color="text.disabled">—</Typography>;
                          return (
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              <Typography variant="body2">{yrs === 0 ? 'Dưới 1 năm' : `${yrs} năm`}</Typography>
                              {yrs >= 5 && (
                                <Tooltip title="Giáo viên đã công tác tại trường trên 5 năm" arrow>
                                  <WarningAmberIcon sx={{ fontSize: 16, color: '#d97706' }} />
                                </Tooltip>
                              )}
                            </Stack>
                          );
                        })()}
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
                            <IconButton size="small" onClick={() => openEdit(t)} sx={{ color: '#2563eb' }}>
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
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count} giáo viên`}
              sx={{ borderTop: '1px solid', borderColor: 'divider' }}
            />
            </>
          )}
        </Paper>
      </Box>

      {/* ── Create dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onClose={() => !createLoading && setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Thêm giáo viên mới</DialogTitle>
        <DialogContent dividers>
          {createError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCreateError(null)}>{createError}</Alert>}

          <Typography variant="subtitle2" color="primary" gutterBottom>Thông tin tài khoản</Typography>
          <Stack spacing={1.5} mb={2}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                size="small" label="Tài khoản đăng nhập" required
                sx={{ flex: 1 }}
                value={createForm.username}
                InputProps={{ readOnly: true }}
                error={!!createErrors.username}
                helperText={createErrors.username || 'Được tạo tự động'}
              />
              <Tooltip title="Tạo lại">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleGenerateUsername()}
                    disabled={usernameGenerating}
                    sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                  >
                    {usernameGenerating
                      ? <CircularProgress size={18} />
                      : <AutorenewIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
            <TextField
              size="small" label="Mật khẩu" type="password" required fullWidth
              value={createForm.password}
              onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
              error={!!createErrors.password} helperText={createErrors.password}
            />
            <TextField
              size="small" label="Email" required fullWidth
              value={createForm.email}
              onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
              error={!!createErrors.email} helperText={createErrors.email}
            />
            <TextField
              size="small" label="Số điện thoại" fullWidth
              value={createForm.phone}
              onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
              error={!!createErrors.phone} helperText={createErrors.phone}
              inputProps={{ inputMode: 'numeric', maxLength: 11 }}
              placeholder="10–11 chữ số"
            />
          </Stack>

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle2" color="primary" gutterBottom>Thông tin giáo viên</Typography>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small" label="Họ tên" required fullWidth
                value={createForm.fullName}
                onChange={e => setCreateForm(p => ({ ...p, fullName: e.target.value }))}
                error={!!createErrors.fullName} helperText={createErrors.fullName}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Giới tính</InputLabel>
                <Select
                  label="Giới tính"
                  value={createForm.gender}
                  onChange={e => setCreateForm(p => ({ ...p, gender: e.target.value }))}
                >
                  {GENDER_OPTIONS.map(o => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small" label="Bằng cấp" fullWidth
                value={createForm.degree}
                onChange={e => setCreateForm(p => ({ ...p, degree: e.target.value }))}
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Loại hình</InputLabel>
                <Select
                  label="Loại hình"
                  value={createForm.employmentType}
                  onChange={e => setCreateForm(p => ({ ...p, employmentType: e.target.value }))}
                >
                  {EMPLOYMENT_OPTIONS.map(o => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Box>
              <TextField
                size="small" label="Ngày vào làm" type="date" fullWidth
                value={createForm.hireDate}
                onChange={e => setCreateForm(p => ({ ...p, hireDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <ExperienceBadge hireDate={createForm.hireDate} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit" disabled={createLoading}>Hủy</Button>
          <Button
            variant="contained" onClick={handleCreate} disabled={createLoading}
            sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            {createLoading ? <CircularProgress size={18} color="inherit" /> : 'Tạo giáo viên'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit dialog ────────────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onClose={() => !editLoading && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Chỉnh sửa giáo viên</DialogTitle>
        <DialogContent dividers>
          {editError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEditError(null)}>{editError}</Alert>}

          <Typography variant="subtitle2" color="primary" gutterBottom>Thông tin tài khoản</Typography>
          <Stack spacing={1.5} mb={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small" label="Họ tên" required fullWidth
                value={editForm.fullName}
                onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))}
                error={!!editErrors.fullName} helperText={editErrors.fullName}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Giới tính</InputLabel>
                <Select
                  label="Giới tính"
                  value={editForm.gender}
                  onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}
                >
                  {GENDER_OPTIONS.map(o => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <TextField
              size="small" label="Email" required fullWidth
              value={editForm.email}
              onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
              error={!!editErrors.email} helperText={editErrors.email}
            />
            <TextField
              size="small" label="Số điện thoại" fullWidth
              value={editForm.phone}
              onChange={e => setEditForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
              error={!!editErrors.phone} helperText={editErrors.phone}
              inputProps={{ inputMode: 'numeric', maxLength: 11 }}
              placeholder="10–11 chữ số"
            />
          </Stack>

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle2" color="primary" gutterBottom>Thông tin giáo viên</Typography>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small" label="Bằng cấp" fullWidth
                value={editForm.degree}
                onChange={e => setEditForm(p => ({ ...p, degree: e.target.value }))}
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Loại hình</InputLabel>
                <Select
                  label="Loại hình"
                  value={editForm.employmentType}
                  onChange={e => setEditForm(p => ({ ...p, employmentType: e.target.value }))}
                >
                  {EMPLOYMENT_OPTIONS.map(o => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Box>
              <TextField
                size="small" label="Ngày vào làm" type="date" fullWidth
                value={editForm.hireDate}
                onChange={e => setEditForm(p => ({ ...p, hireDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <ExperienceBadge hireDate={editForm.hireDate} />
            </Box>
            <FormControl size="small" fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                label="Trạng thái"
                value={editForm.status}
                onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
              >
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Ngừng hoạt động</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit" disabled={editLoading}>Hủy</Button>
          <Button
            variant="contained" onClick={handleEdit} disabled={editLoading}
            sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            {editLoading ? <CircularProgress size={18} color="inherit" /> : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => !deleteLoading && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Xóa giáo viên</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setDeleteError(null)}>{deleteError}</Alert>}
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
