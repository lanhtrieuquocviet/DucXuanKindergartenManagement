import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import ConfirmDialog from '../../components/ConfirmDialog';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

// ─── Form Modal ───────────────────────────────────────────────────────────────
function CategoryFormModal({ open, onClose, initialData, onSubmit, loading }) {
  const [form, setForm] = useState({ name: '', description: '', status: 'active' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        name: initialData?.name || '',
        description: initialData?.description || '',
        status: initialData?.status || 'active',
      });
      setFormErrors({});
    }
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Tên danh mục không được để trống';
    else if (form.name.length > 100) errs.name = 'Tên danh mục tối đa 100 ký tự';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          {initialData ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {/* Tên */}
            <Box>
              <TextField
                name="name"
                label="Tên danh mục *"
                value={form.name}
                onChange={handleChange}
                inputProps={{ maxLength: 100 }}
                fullWidth
                size="small"
                error={!!formErrors.name}
                helperText={formErrors.name || ' '}
                placeholder="vd: Bản tin trường"
              />
              <Typography
                variant="caption"
                color={form.name.length > 100 ? 'error' : 'text.secondary'}
                sx={{ display: 'block', textAlign: 'right', mt: -2 }}
              >
                {form.name.length}/100
              </Typography>
            </Box>

            {/* Mô tả */}
            <TextField
              name="description"
              label="Mô tả"
              value={form.description}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
              size="small"
              placeholder="Mô tả ngắn về danh mục (tuỳ chọn)"
            />

            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái</InputLabel>
              <Select
                name="status"
                value={form.status}
                label="Trạng thái"
                onChange={handleChange}
              >
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Không hoạt động</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            sx={{ flex: 1, textTransform: 'none', borderRadius: 2 }}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="success"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ flex: 1, textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function ManageBlogCategories() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const {
    loading,
    error,
    setError,
    getBlogCategoriesAdmin,
    createBlogCategory,
    updateBlogCategory,
    deleteBlogCategory,
  } = useSchoolAdmin();

  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [noPermission, setNoPermission] = useState(false);

  // Auth check
  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) { navigate('/', { replace: true }); }
  }, [navigate, user, isInitializing]);

  const loadCategories = async () => {
    try {
      const res = await getBlogCategoriesAdmin();
      setCategories(res.data || []);
      setNoPermission(false);
    } catch (err) {
      if (err.message?.includes('không có quyền') || err.status === 403) {
        setNoPermission(true);
      }
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const openCreate = () => { setSelected(null); setError(null); setModalOpen(true); };
  const openEdit = (cat) => { setSelected(cat); setError(null); setModalOpen(true); };

  const handleSubmit = async (form) => {
    try {
      setSubmitting(true);
      if (selected) {
        await updateBlogCategory(selected._id, form);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await createBlogCategory(form);
        toast.success('Tạo danh mục mới thành công');
      }
      await loadCategories();
      setModalOpen(false);
    } catch {
      // error shown via context
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setSubmitting(true);
      await deleteBlogCategory(confirmDelete._id);
      toast.success('Xóa danh mục thành công');
      await loadCategories();
      setConfirmDelete(null);
    } catch {
      // error shown via context
    } finally {
      setSubmitting(false);
    }
  };

  const userName = user?.fullName || user?.username || 'School Admin';

  const getStatusChip = (status) => {
    if (status === 'inactive') {
      return <Chip size="small" color="error" variant="outlined" label="Không hoạt động" />;
    }
    return <Chip size="small" color="success" variant="outlined" label="Hoạt động" />;
  };

  return (
    <Box>
      {/* Page header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          borderRadius: 3,
          px: 4,
          py: 3,
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700} color="white">
          Quản lý danh mục
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
          Tạo, chỉnh sửa và xóa các danh mục phân loại bài viết, file, tài liệu.
        </Typography>
      </Paper>

      {/* No permission */}
      {noPermission && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={500}>
            Bạn không có quyền quản lý danh mục blog.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Liên hệ quản trị viên để được cấp quyền{' '}
            <Box
              component="code"
              sx={{ bgcolor: 'warning.100', px: 0.75, py: 0.25, borderRadius: 1, fontSize: '0.8rem' }}
            >
              MANAGE_BLOG_CATEGORY
            </Box>
            .
          </Typography>
        </Alert>
      )}

      {!noPermission && (
        <Paper elevation={2} sx={{ borderRadius: 3, p: 3 }}>
          {/* Header row */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                Danh sách danh mục
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Tổng:{' '}
                <Box component="span" fontWeight={600}>
                  {categories.length}
                </Box>{' '}
                danh mục
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
            >
              Tạo danh mục mới
            </Button>
          </Stack>

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Table */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                    Tên danh mục
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                    Mô tả
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                    Trạng thái
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}
                  >
                    Hành động
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Stack direction="row" justifyContent="center" alignItems="center" spacing={1.5}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">
                          Đang tải...
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}

                {!loading && categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Chưa có danh mục nào. Nhấn &quot;Tạo danh mục mới&quot; để bắt đầu.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {categories.map((cat) => (
                  <TableRow
                    key={cat._id}
                    sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} color="text.primary">
                        {cat.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {cat.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(cat.status)}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => openEdit(cat)}
                          title="Chỉnh sửa"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmDelete(cat)}
                          disabled={submitting}
                          title="Xóa"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selected}
        onSubmit={handleSubmit}
        loading={submitting}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn chắc chắn muốn xóa danh mục "${confirmDelete?.name}"? Danh mục không thể xóa nếu còn bài viết đang dùng.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={submitting}
      />
    </Box>
  );
}

export default ManageBlogCategories;
