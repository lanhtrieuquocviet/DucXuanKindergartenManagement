import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { del, get, post, put, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Layers as LayersIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const BLOCK_COLORS = [
  { header: '#0891b2', light: '#cffafe' },
  { header: '#2563eb', light: '#dbeafe' },
  { header: '#f59e0b', light: '#fef9c3' },
  { header: '#16a34a', light: '#dcfce7' },
  { header: '#dc2626', light: '#fee2e2' },
  { header: '#0284c7', light: '#e0f2fe' },
];

const EMPTY_FORM = {
  name: '',
  description: '',
  maxClasses: 10,
  minAge: '',
  maxAge: '',
  status: 'active',
};

function getAgeLabel(block) {
  if (block?.ageLabel) return block.ageLabel;
  const minAge = Number(block?.minAge || 0);
  const maxAge = Number(block?.maxAge || 0);

  if (minAge > 0 && maxAge > 0) return `${minAge} - ${maxAge}`;
  if (minAge > 0) return `${minAge}+`;
  if (maxAge > 0) return `0 - ${maxAge}`;
  return 'Chưa cập nhật';
}

function ManageStaticBlockCatalog() {
  const navigate = useNavigate();
  const { user, hasRole, logout, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
  }, [hasRole, isInitializing, navigate, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await get(ENDPOINTS.STATIC_BLOCKS.LIST);
      setBlocks(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh mục khối');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode, block = null) => {
    setFormErrors({});
    setDialog({ open: true, mode, data: block });
    setForm(
      block
        ? {
            name: block.name || '',
            description: block.description || '',
            maxClasses: block.maxClasses ?? 10,
            minAge: block.minAge || '',
            maxAge: block.maxAge || '',
            status: block.status || 'active',
          }
        : EMPTY_FORM
    );
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = 'Tên khối không được để trống';
    } else if (form.name.trim().length > 50) {
      nextErrors.name = 'Tên khối không được quá 50 ký tự';
    }

    if (!form.description.trim()) {
      nextErrors.description = 'Mô tả không được để trống';
    } else if (form.description.trim().length > 500) {
      nextErrors.description = 'Mô tả không được quá 500 ký tự';
    }

    const maxClasses = Number(form.maxClasses);
    if (!Number.isInteger(maxClasses) || maxClasses < 1 || maxClasses > 50) {
      nextErrors.maxClasses = 'Số lớp tối đa phải từ 1 đến 50';
    }

    const minAge = form.minAge !== '' ? Number(form.minAge) : null;
    const maxAge = form.maxAge !== '' ? Number(form.maxAge) : null;
    if (minAge === null) {
      nextErrors.minAge = 'Tuổi tối thiểu là bắt buộc';
    } else if (Number.isNaN(minAge) || minAge < 0 || minAge > 18) {
      nextErrors.minAge = 'Tuổi tối thiểu phải từ 0 đến 18';
    }
    if (maxAge === null) {
      nextErrors.maxAge = 'Tuổi tối đa là bắt buộc';
    } else if (Number.isNaN(maxAge) || maxAge < 0 || maxAge > 18) {
      nextErrors.maxAge = 'Tuổi tối đa phải từ 0 đến 18';
    }
    if (minAge !== null && maxAge !== null && minAge >= maxAge) {
      nextErrors.maxAge = 'Tuổi tối đa phải lớn hơn tuổi tối thiểu';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (dialog.mode === 'create') {
        await post(ENDPOINTS.STATIC_BLOCKS.CREATE, form);
      } else {
        await put(ENDPOINTS.STATIC_BLOCKS.UPDATE(dialog.data._id), form);
      }
      setDialog({ open: false, mode: 'create', data: null });
      setForm(EMPTY_FORM);
      await fetchData();
    } catch (err) {
      setFormErrors({
        submit: err.data?.message || err.message || 'Không thể lưu khối',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setSubmitting(true);
      await del(ENDPOINTS.STATIC_BLOCKS.DELETE(deleteConfirm._id));
      setDeleteConfirm(null);
      await fetchData();
    } catch (err) {
      setError(err.data?.message || err.message || 'Không thể xóa khối');
      setDeleteConfirm(null);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBlocks = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return blocks;

    return blocks.filter((item) =>
      [item.name, item.description, getAgeLabel(item)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [blocks, searchTerm]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  return (
    <RoleLayout
      title="Quản lý danh mục khối"
      description="Quản lý danh mục khối và cấu hình độ tuổi, số lớp tối đa cho từng khối."
      menuItems={menuItems}
      activeKey="classes"
      onLogout={handleLogout}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'Admin'}
      userAvatar={user?.avatar}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <LayersIcon sx={{ color: '#fff', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} color="#fff">
                Danh mục khối
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                {blocks.length} khối trong hệ thống
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/school-admin/classes')}
            sx={{
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.45)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
            }}
          >
            Quay lại quản lý lớp
          </Button>
        </Stack>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} mb={2.5}>
        <TextField
          placeholder="Tìm theo tên, mô tả, độ tuổi"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1, maxWidth: 320, bgcolor: '#fff', borderRadius: 1.5 }}
        />
        <Stack direction="row" spacing={1} ml="auto">
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 500 }}
          >
            Tải lại
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
            sx={{
              bgcolor: '#16a34a',
              '&:hover': { bgcolor: '#15803d' },
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Thêm khối mới
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Stack alignItems="center" py={8}>
          <CircularProgress size={32} sx={{ color: '#2563eb' }} />
          <Typography variant="body2" color="text.secondary" mt={1.5}>
            Đang tải...
          </Typography>
        </Stack>
      ) : filteredBlocks.length === 0 ? (
        <Stack alignItems="center" py={8} spacing={1}>
          <LayersIcon sx={{ fontSize: 48, color: 'grey.300' }} />
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Không tìm thấy khối phù hợp.' : 'Chưa có khối nào.'}
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
              size="small"
              sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, mt: 1, textTransform: 'none' }}
            >
              Tạo khối đầu tiên
            </Button>
          )}
        </Stack>
      ) : (
        <Grid container spacing={2.5}>
          {filteredBlocks.map((block, index) => {
            const color = BLOCK_COLORS[index % BLOCK_COLORS.length];
            const ageLabel = getAgeLabel(block);
            return (
              <Grid item xs={12} sm={6} md={4} key={block._id}>
                <Paper
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'transform 0.18s, box-shadow 0.18s',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
                  }}
                >
                  <Box sx={{ bgcolor: color.header, px: 2.5, py: 1.75 }}>
                    <Typography variant="h6" fontWeight={700} color="#fff" noWrap>
                      {block.name}
                    </Typography>
                  </Box>

                  <Box sx={{ px: 2.5, py: 2, bgcolor: '#fff' }}>
                    <Stack spacing={0.75}>
                      <Stack direction="row" spacing={0.5}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                          Độ tuổi:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {ageLabel}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                          Max lớp:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {block.maxClasses} lớp
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                          Trạng thái:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            color: block.status === 'active' ? '#16a34a' : '#dc2626',
                          }}
                        >
                          {block.status === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'}
                        </Typography>
                      </Stack>
                      {block.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5, wordWrap: 'break-word' }}>
                          {block.description}
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fff', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" alignItems="center" justifyContent="flex-end">
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('edit', block)}
                            sx={{ bgcolor: '#fef3c7', color: '#d97706', '&:hover': { bgcolor: '#fde68a' }, borderRadius: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteConfirm(block)}
                            sx={{ bgcolor: '#fee2e2', color: '#dc2626', '&:hover': { bgcolor: '#fecaca' }, borderRadius: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Dialog Thêm/Sửa */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, mode: 'create', data: null })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialog.mode === 'create' ? 'Thêm khối mới' : 'Chỉnh sửa khối'}
        </DialogTitle>
        <DialogContent dividers>
          {formErrors.submit && <Alert severity="error" sx={{ mb: 2 }}>{formErrors.submit}</Alert>}
          <Stack spacing={2.5} mt={0.5}>
            <TextField
              label="Tên khối"
              required
              fullWidth
              size="small"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              error={!!formErrors.name}
              helperText={formErrors.name || `${form.name.length}/50 ký tự`}
              inputProps={{ maxLength: 50 }}
            />
            <TextField
              label="Mô tả"
              required
              fullWidth
              size="small"
              multiline
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              error={!!formErrors.description}
              helperText={formErrors.description || `${form.description.length}/500 ký tự`}
              inputProps={{ maxLength: 500 }}
            />
            <TextField
              label="Số lớp tối đa"
              required
              fullWidth
              size="small"
              type="number"
              value={form.maxClasses}
              onChange={(e) => setForm((prev) => ({ ...prev, maxClasses: e.target.value }))}
              error={!!formErrors.maxClasses}
              helperText={formErrors.maxClasses || 'Từ 1 đến 50 lớp'}
              inputProps={{ min: 1, max: 50 }}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Tuổi tối thiểu"
                required
                fullWidth
                size="small"
                type="number"
                value={form.minAge}
                onChange={(e) => setForm((prev) => ({ ...prev, minAge: e.target.value }))}
                error={!!formErrors.minAge}
                helperText={formErrors.minAge || '0 - 18 tuổi'}
                inputProps={{ min: 0, max: 18 }}
              />
              <TextField
                label="Tuổi tối đa"
                required
                fullWidth
                size="small"
                type="number"
                value={form.maxAge}
                onChange={(e) => setForm((prev) => ({ ...prev, maxAge: e.target.value }))}
                error={!!formErrors.maxAge}
                helperText={formErrors.maxAge || '0 - 18 tuổi'}
                inputProps={{ min: 0, max: 18 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialog({ open: false, mode: 'create', data: null })} color="inherit" disabled={submitting}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, textTransform: 'none', fontWeight: 600 }}
          >
            {submitting ? <CircularProgress size={18} color="inherit" /> : dialog.mode === 'create' ? 'Tạo' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Xác nhận xóa */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa khối <strong>{deleteConfirm?.name}</strong>? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} color="inherit" disabled={submitting}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            disabled={submitting}
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, textTransform: 'none', fontWeight: 600 }}
          >
            {submitting ? <CircularProgress size={18} color="inherit" /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}

export default ManageStaticBlockCatalog;
