import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

// ─── Form Modal ───────────────────────────────────────────────────────────────
function CategoryFormModal({ open, onClose, initialData, onSubmit, loading }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        name: initialData?.name || '',
        description: initialData?.description || '',
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
      } else {
        await createBlogCategory(form);
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
      await loadCategories();
      setConfirmDelete(null);
    } catch {
      // error shown via context
    } finally {
      setSubmitting(false);
    }
  };

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
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

  const handleMenuSelect = (key) => {
    const routes = {
      overview: '/school-admin',
      classes: '/school-admin/classes',
      teachers: '/school-admin/teachers',
      contacts: '/school-admin/contacts',
      qa: '/school-admin/qa',
      blogs: '/school-admin/blogs',
      documents: '/school-admin/documents',
      'public-info': '/school-admin/public-info',
      attendance: '/school-admin/attendance/overview',
    };
    if (routes[key]) navigate(routes[key]);
  };

  const userName = user?.fullName || user?.username || 'School Admin';
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };
  const handleViewProfile = () => navigate('/profile');

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

  return (
    <RoleLayout
      title="Quản lý danh mục blog"
      description="Tạo, chỉnh sửa và xóa các danh mục phân loại bài viết."
      menuItems={menuItems}
      activeKey="blogs"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      {/* Page header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          borderRadius: 3,
          px: 4,
          py: 3,
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700} color="white">
          Quản lý danh mục blog
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
          Tạo, chỉnh sửa và xóa các danh mục phân loại bài viết.
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
                    Ngày tạo
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
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(cat.createdAt)}
                      </Typography>
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
    </RoleLayout>
  );
}

export default ManageBlogCategories;
