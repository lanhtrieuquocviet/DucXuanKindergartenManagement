import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { get, postFormData, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  Chip,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import CategoryIcon from '@mui/icons-material/Category';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'draft', label: 'Nháp' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'inactive', label: 'Ngưng hiển thị' },
];

const LAYOUTS = [
  {
    id: 'layout1',
    label: 'Layout 1',
    sectionCount: 3,
    preview: ['Tiêu đề', 'Ảnh', 'Nội dung 1', 'Ảnh', 'Nội dung 2', 'Ảnh', 'Nội dung 3'],
  },
  {
    id: 'layout2',
    label: 'Layout 2',
    sectionCount: 5,
    preview: ['Tiêu đề', 'Ảnh', 'Nội dung 1', 'Ảnh', 'Nội dung 2', 'Ảnh', 'Nội dung 3', 'Ảnh', 'Nội dung 4', 'Ảnh', 'Nội dung 5'],
  },
];

function makeEmptySections(count) {
  return Array.from({ length: count }, () => ({ image: '', content: '' }));
}

function BlogFormModal({ open, onClose, initialData, categories, onSubmit, loading }) {
  const [form, setForm] = useState({
    code: '',
    category: '',
    images: [],
    layout: 'layout1',
    sections: makeEmptySections(3),
    status: 'draft',
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingSection, setUploadingSection] = useState([false, false, false, false, false]);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        code: initialData?.code || '',
        category:
          (initialData?.category && (initialData.category._id || initialData.category)) ||
          (categories[0]?._id || ''),
        images: initialData?.images || [],
        layout: initialData?.layout || 'layout1',
        sections: (() => {
          const layoutId = initialData?.layout || 'layout1';
          const count = LAYOUTS.find(l => l.id === layoutId)?.sectionCount || 3;
          const saved = initialData?.sections || [];
          return saved.length === count
            ? saved.map(s => ({ image: s.image || '', content: s.content || '' }))
            : makeEmptySections(count);
        })(),
        status: initialData?.status || 'draft',
      });
      setFormErrors({});
    }
  }, [open, initialData, categories]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleLayoutChange = (layoutId) => {
    const count = LAYOUTS.find(l => l.id === layoutId)?.sectionCount || 3;
    setForm(prev => ({ ...prev, layout: layoutId, sections: makeEmptySections(count) }));
  };

  const handleUploadCoverImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_BLOG_IMAGE, fd);
      if (res.status === 'success' && res.data?.url) {
        setForm(prev => ({ ...prev, images: [res.data.url] }));
      } else throw new Error(res.message || 'Upload thất bại');
    } catch (err) {
      toast.error(`Upload ảnh bìa thất bại: ${err.message}`);
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleUploadSectionImage = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingSection(prev => { const n = [...prev]; n[idx] = true; return n; });
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_BLOG_IMAGE, fd);
      if (res.status === 'success' && res.data?.url) {
        setForm(prev => {
          const sections = prev.sections.map((s, i) => i === idx ? { ...s, image: res.data.url } : s);
          return { ...prev, sections };
        });
      } else throw new Error(res.message || 'Upload thất bại');
    } catch (err) {
      toast.error(`Upload ảnh thất bại: ${err.message}`);
    } finally {
      setUploadingSection(prev => { const n = [...prev]; n[idx] = false; return n; });
      e.target.value = '';
    }
  };

  const handleSectionContent = (idx, value) => {
    setForm(prev => {
      const sections = prev.sections.map((s, i) => i === idx ? { ...s, content: value } : s);
      return { ...prev, sections };
    });
    if (formErrors.sections) setFormErrors(prev => ({ ...prev, sections: null }));
  };

  const handleRemoveSectionImage = (idx) => {
    setForm(prev => {
      const sections = prev.sections.map((s, i) => i === idx ? { ...s, image: '' } : s);
      return { ...prev, sections };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.code.trim()) errs.code = 'Tiêu đề không được để trống';
    else if (form.code.length > 100) errs.code = 'Tiêu đề quá dài (tối đa 100 ký tự)';
    if (!form.category) errs.category = 'Vui lòng chọn danh mục';
    const hasContent = form.sections.some(s => s.content.trim());
    if (!hasContent) errs.sections = 'Vui lòng nhập ít nhất một nội dung';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    onSubmit(form);
  };

  const anyUploading = uploadingCover || uploadingSection.some(Boolean);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '92vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', py: 1.5, px: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {initialData ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2, py: 2 }}>
        <Box component="form" id="blog-form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>

            {/* Tiêu đề */}
            <Box>
              <TextField
                fullWidth size="small" label="Tiêu đề *" name="code"
                value={form.code} onChange={handleChange}
                inputProps={{ maxLength: 100 }}
                error={!!formErrors.code} helperText={formErrors.code}
              />
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', color: form.code.length > 100 ? 'error.main' : 'text.secondary', mt: 0.5 }}>
                {form.code.length}/100
              </Typography>
            </Box>

            {/* Danh mục */}
            <FormControl fullWidth size="small" error={!!formErrors.category} disabled={categories.length === 0}>
              <InputLabel>Danh mục *</InputLabel>
              <Select name="category" value={form.category} onChange={handleChange} label="Danh mục *">
                {categories.length === 0
                  ? <MenuItem value="">Đang tải danh mục...</MenuItem>
                  : [
                      <MenuItem key="" value="">-- Chọn danh mục --</MenuItem>,
                      ...categories.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>),
                    ]}
              </Select>
              {formErrors.category && <FormHelperText>{formErrors.category}</FormHelperText>}
            </FormControl>

            {/* Ảnh bìa */}
            <Box>
              <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Ảnh bìa</Typography>
              {form.images[0] ? (
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Box component="img" src={form.images[0]} alt="Ảnh bìa" sx={{ height: 112, borderRadius: 1, objectFit: 'cover', display: 'block' }} />
                  <IconButton size="small" onClick={() => setForm(p => ({ ...p, images: [] }))} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'error.main', color: 'white', width: 20, height: 20, '&:hover': { bgcolor: 'error.dark' } }}>
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              ) : (
                <Button component="label" variant="outlined" size="small" disabled={uploadingCover} sx={{ fontSize: '0.75rem' }}>
                  {uploadingCover ? 'Đang tải...' : 'Chọn ảnh bìa'}
                  <input type="file" accept="image/*" hidden onChange={handleUploadCoverImage} />
                </Button>
              )}
            </Box>

            {/* Chọn layout */}
            <Box>
              <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 1, display: 'block' }}>Chọn layout nội dung *</Typography>
              <Stack direction="row" spacing={1.5}>
                {LAYOUTS.map(l => (
                  <Box
                    key={l.id}
                    onClick={() => handleLayoutChange(l.id)}
                    sx={{
                      border: '2px solid',
                      borderColor: form.layout === l.id ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      p: 1.5,
                      cursor: 'pointer',
                      minWidth: 130,
                      bgcolor: form.layout === l.id ? 'rgba(37,99,235,0.06)' : 'background.paper',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Typography variant="caption" fontWeight={700} color={form.layout === l.id ? 'primary.main' : 'text.secondary'}>{l.label}</Typography>
                    <Stack spacing={0.4} mt={0.8}>
                      {l.preview.map((item, i) => (
                        <Box key={i} sx={{
                          height: item === 'Ảnh' ? 10 : 5,
                          bgcolor: item === 'Ảnh' ? '#93c5fd' : (item === 'Tiêu đề' ? '#6366f1' : '#e5e7eb'),
                          borderRadius: 0.5,
                          opacity: 0.85,
                        }} />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Nội dung theo layout */}
            {(form.layout === 'layout1' || form.layout === 'layout2') && (
              <Box>
                <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Nội dung *
                </Typography>
                {formErrors.sections && (
                  <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>{formErrors.sections}</Typography>
                )}
                <Stack spacing={2}>
                  {form.sections.map((section, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 1.5, borderColor: 'divider' }}>
                      <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ mb: 1.5, display: 'block' }}>
                        Phần {idx + 1}
                      </Typography>

                      {/* Section image */}
                      <Box mb={1.5}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Ảnh</Typography>
                        {section.image ? (
                          <Box sx={{ position: 'relative', display: 'inline-block' }}>
                            <Box component="img" src={section.image} alt={`section-${idx}`} sx={{ height: 90, borderRadius: 1, objectFit: 'cover', display: 'block' }} />
                            <IconButton size="small" onClick={() => handleRemoveSectionImage(idx)} sx={{ position: 'absolute', top: 3, right: 3, bgcolor: 'error.main', color: 'white', width: 18, height: 18, '&:hover': { bgcolor: 'error.dark' } }}>
                              <CloseIcon sx={{ fontSize: 11 }} />
                            </IconButton>
                          </Box>
                        ) : (
                          <Button component="label" variant="outlined" size="small" disabled={uploadingSection[idx]} sx={{ fontSize: '0.72rem' }}>
                            {uploadingSection[idx] ? 'Đang tải...' : 'Chọn ảnh'}
                            <input type="file" accept="image/*" hidden onChange={e => handleUploadSectionImage(e, idx)} />
                          </Button>
                        )}
                      </Box>

                      {/* Section content */}
                      <TextField
                        size="small" fullWidth multiline minRows={3}
                        label={`Nội dung ${idx + 1}`}
                        value={section.content}
                        onChange={e => handleSectionContent(idx, e.target.value)}
                      />
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Trạng thái — chỉ hiện khi chỉnh sửa */}
            {initialData && (
              <FormControl fullWidth size="small">
                <InputLabel>Trạng thái</InputLabel>
                <Select name="status" value={form.status} onChange={handleChange} label="Trạng thái">
                  <MenuItem value="draft">Nháp</MenuItem>
                  <MenuItem value="published">Đã xuất bản</MenuItem>
                  <MenuItem value="inactive">Ngưng hiển thị</MenuItem>
                </Select>
              </FormControl>
            )}

          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ flex: 1 }} disabled={loading}>Hủy</Button>
        <Button type="submit" form="blog-form" variant="contained" color="success" disabled={loading || anyUploading} sx={{ flex: 1, fontWeight: 600 }}>
          {loading ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ManageBlogs() {
  const {
    loading,
    error,
    getBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
    setError,
  } = useSchoolAdmin();

  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Auth check
  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SchoolAdmin')) {
      navigate('/', { replace: true });
      return;
    }
  }, [navigate, user, isInitializing]);

  const canShowEmptyState = useMemo(
    () => !loading && blogs.length === 0,
    [loading, blogs.length]
  );

  const loadData = async (override = {}) => {
    try {
      const params = {
        page: override.page || pagination.page,
        limit: pagination.limit,
        status: filters.status,
        search: filters.search,
      };
      const res = await getBlogs(params);
      const data = res.data || res;
      setBlogs(data.items || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      // error handled in context
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  // fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resp = await get('/blogs/categories');
        setCategories(resp.data || resp);
      } catch (err) {
        // ignore, categories are not critical
        console.error('Failed to load blog categories', err);
      }
    };
    fetchCategories();
  }, []);

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData({ page: 1 });
  };

  const handleStatusChange = (e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value }));
  };

  const openCreateModal = () => {
    setSelectedBlog(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (blog) => {
    setSelectedBlog(blog);
    setError(null);
    setModalOpen(true);
  };

  const handleDelete = async (blog) => {
    setConfirmDelete(blog);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      setSubmitting(true);
      await deleteBlog(confirmDelete._id);
      await loadData();
      setConfirmDelete(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForm = async (form) => {
    try {
      setSubmitting(true);
      if (selectedBlog) {
        const oldCode = selectedBlog.code;
        await updateBlog(selectedBlog._id, form);
        // after editing we always reset search filter so the updated item
        // remains visible (code might have changed and not match previous query)
        if (filters.search) {
          setFilters((prev) => ({ ...prev, search: '' }));
          await loadData({ page: 1, search: '' });
        } else {
          await loadData();
        }
      } else {
        await createBlog(form);
        await loadData();
      }
      setModalOpen(false);
    } catch (err) {
      // error handled in context; nothing special here
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = async (newPage) => {
    if (newPage === pagination.page) return;
    const next = { ...pagination, page: newPage };
    setPagination(next);
    await loadData({ page: newPage });
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  const userName = user?.fullName || user?.username || 'School Admin';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const statusChip = (status) => {
    if (status === 'published') return <Chip label="Đã xuất bản" size="small" color="success" variant="outlined" sx={{ fontSize: '0.68rem', fontWeight: 600 }} />;
    if (status === 'draft') return <Chip label="Nháp" size="small" color="warning" variant="outlined" sx={{ fontSize: '0.68rem', fontWeight: 600 }} />;
    if (status === 'inactive') return <Chip label="Ngưng hiển thị" size="small" color="default" variant="outlined" sx={{ fontSize: '0.68rem', fontWeight: 600 }} />;
    return null;
  };

  return (
    <RoleLayout
      title="Quản lý bài viết (Blog)"
      description="Tạo, chỉnh sửa, xóa và quản lý các bài viết, tin tức của trường."
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
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          borderRadius: 3,
          px: 4,
          py: 3,
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700} color="white">
          Quản lý bài viết (Blog)
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
          Tạo, chỉnh sửa, xóa và quản lý các bài viết, tin tức của trường.
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        {/* Header + bộ lọc */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              Danh sách bài viết
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Tổng bài:{' '}
              <Box component="span" fontWeight={600}>
                {pagination.total}
              </Box>
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="success"
              startIcon={<CategoryIcon />}
              onClick={() => navigate('/school-admin/blog-categories')}
              size="small"
              sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              Quản lý danh mục
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={openCreateModal}
              size="small"
              sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              Tạo bài viết mới
            </Button>
          </Stack>
        </Stack>

        {/* Bộ lọc và tìm kiếm */}
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { md: 'center' },
            justifyContent: 'space-between',
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 2,
            mb: 2,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Tìm theo mã, nội dung..."
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />,
              }}
            />
            <Button
              type="submit"
              variant="contained"
              color="inherit"
              size="small"
              sx={{ display: { xs: 'none', md: 'inline-flex' }, bgcolor: 'grey.800', color: 'white', '&:hover': { bgcolor: 'grey.900' }, whiteSpace: 'nowrap' }}
            >
              Tìm kiếm
            </Button>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select value={filters.status} onChange={handleStatusChange} displayEmpty>
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              color="inherit"
              size="small"
              sx={{ display: { xs: 'inline-flex', md: 'none' }, bgcolor: 'grey.800', color: 'white', '&:hover': { bgcolor: 'grey.900' } }}
            >
              Lọc
            </Button>
          </Stack>
        </Box>

        {/* Bảng danh sách */}
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead sx={{ bgcolor: '#f0f0ff' }}>
              <TableRow>
                {['Mã', 'Danh mục', 'Nội dung', 'Ảnh', 'Tệp đính kèm', 'Trạng thái', 'Tác giả', 'Hành động'].map((col) => (
                  <TableCell
                    key={col}
                    align={col === 'Hành động' ? 'right' : 'left'}
                    sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', py: 1 }}
                  >
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {blogs.map((blog) => (
                <TableRow key={blog._id} hover>
                  <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'text.primary' }}>
                    {blog.code}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.primary' }}>
                    {blog.category?.name || '-'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography
                      variant="caption"
                      color="text.primary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {blog.description?.replace(/<[^>]*>/g, '') || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {blog.images && blog.images.length > 0 ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {blog.images.slice(0, 2).map((img, idx) => (
                          <Box
                            key={idx}
                            component="img"
                            src={img}
                            alt={`img-${idx}`}
                            sx={{ width: 32, height: 32, borderRadius: 0.5, objectFit: 'cover' }}
                          />
                        ))}
                        {blog.images.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{blog.images.length - 2}
                          </Typography>
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {blog.attachmentUrl ? (
                      <Box
                        component="a"
                        href={blog.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'primary.main', fontSize: '0.75rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {blog.attachmentType === 'pdf' ? (
                          <><PictureAsPdfIcon fontSize="inherit" /> PDF</>
                        ) : (
                          <><DescriptionIcon fontSize="inherit" /> Word</>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {statusChip(blog.status)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.primary' }}>
                    {blog.author?.fullName || blog.author?.username || '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/school-admin/blogs/${blog._id}`)}
                        title="Xem"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => openEditModal(blog)}
                        title="Sửa"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(blog)}
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

          {canShowEmptyState && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Chưa có bài viết nào. Hãy nhấn &quot;Tạo bài viết mới&quot; để bắt đầu.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Phân trang */}
        {pagination.totalPages > 1 && (
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Trang {pagination.page}/{pagination.totalPages} · Tổng{' '}
              {pagination.total} bài viết
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                disabled={pagination.page === 1 || loading}
                onClick={() => handlePageChange(pagination.page - 1)}
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <NavigateBeforeIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                disabled={pagination.page === pagination.totalPages || loading}
                onClick={() => handlePageChange(pagination.page + 1)}
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <NavigateNextIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        )}
      </Paper>

      <BlogFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selectedBlog}
        categories={categories}
        onSubmit={handleSubmitForm}
        loading={submitting}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn chắc chắn muốn xóa bài viết "${confirmDelete?.title}"?`}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
        loading={submitting}
      />
    </RoleLayout>
  );
}

export default ManageBlogs;
