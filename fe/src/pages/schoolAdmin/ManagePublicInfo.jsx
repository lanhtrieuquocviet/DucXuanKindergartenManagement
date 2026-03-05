import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import RichTextEditor from '../../components/RichTextEditor';
import { get, post, put, del, postFormData, ENDPOINTS } from '../../service/api';
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Link,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';

const CATEGORIES = [
  'Thông tin chung về cơ sở giáo dục',
  'Công khai thu chi tài chính',
  'Điều kiện đảm bảo chất lượng hoạt động giáo dục',
  'Kế hoạch và kết quả hoạt động giáo dục',
  'Báo cáo thường niên',
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'draft', label: 'Nháp' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'inactive', label: 'Ngưng hiển thị' },
];

function PublicInfoFormModal({ open, onClose, initialData, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    status: 'draft',
    attachmentUrl: null,
    attachmentType: null,
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        title: initialData?.title || '',
        description: initialData?.description || '',
        category: initialData?.category || CATEGORIES[0],
        status: initialData?.status || 'draft',
        attachmentUrl: initialData?.attachmentUrl || null,
        attachmentType: initialData?.attachmentType || null,
      });
      setFormErrors({});
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleAttachFile = async (file) => {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_BLOG_FILE, formData);
      if (response.status === 'success' && response.data?.url) {
        setForm((prev) => ({
          ...prev,
          attachmentUrl: response.data.url,
          attachmentType: response.data.type,
        }));
      } else {
        throw new Error(response.message || 'Upload thất bại');
      }
    } catch (err) {
      alert(`Upload file thất bại:\n${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Tiêu đề không được để trống';
    else if (form.title.length > 200) errs.title = 'Tiêu đề quá dài (tối đa 200 ký tự)';
    if (!form.category) errs.category = 'Vui lòng chọn danh mục';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 1.5,
          px: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          {initialData ? 'Chỉnh sửa thông tin công khai' : 'Tạo thông tin công khai mới'}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ overflowY: 'auto' }}>
        <Box component="form" id="public-info-form" onSubmit={handleSubmit}>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {/* Tiêu đề */}
            <Box>
              <TextField
                fullWidth
                size="small"
                label="Tiêu đề *"
                name="title"
                value={form.title}
                onChange={handleChange}
                inputProps={{ maxLength: 200 }}
                placeholder="Nhập tiêu đề"
                error={!!formErrors.title}
                helperText={formErrors.title || ' '}
              />
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'right',
                  color: form.title.length > 200 ? 'error.main' : 'text.secondary',
                  mt: -2,
                }}
              >
                {form.title.length}/200
              </Typography>
            </Box>

            {/* Danh mục */}
            <FormControl fullWidth size="small" error={!!formErrors.category}>
              <InputLabel>Danh mục *</InputLabel>
              <Select
                name="category"
                value={form.category}
                label="Danh mục *"
                onChange={handleChange}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
              {formErrors.category && <FormHelperText>{formErrors.category}</FormHelperText>}
            </FormControl>

            {/* Nội dung (Rich Text) */}
            <Box>
              <Typography variant="caption" fontWeight={500} color="text.secondary" display="block" mb={0.5}>
                Mô tả / Nội dung
              </Typography>
              <RichTextEditor
                initialValue={form.description}
                onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
                disabled={uploadingFile}
                attachmentUrl={form.attachmentUrl}
                attachmentType={form.attachmentType}
                onAttachFile={handleAttachFile}
                onRemoveFile={() => setForm((prev) => ({ ...prev, attachmentUrl: null, attachmentType: null }))}
              />
            </Box>

            {/* Trạng thái */}
            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái</InputLabel>
              <Select
                name="status"
                value={form.status}
                label="Trạng thái"
                onChange={handleChange}
              >
                <MenuItem value="draft">Nháp</MenuItem>
                <MenuItem value="published">Đã xuất bản</MenuItem>
                <MenuItem value="inactive">Ngưng hiển thị</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ flex: 1 }}>
          Hủy
        </Button>
        <Button
          type="submit"
          form="public-info-form"
          variant="contained"
          disabled={loading || uploadingFile}
          sx={{
            flex: 1,
            bgcolor: '#059669',
            '&:hover': { bgcolor: '#047857' },
            '&:disabled': { opacity: 0.6 },
          }}
        >
          {loading ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const menuItems = [
  { key: 'overview', label: 'Tổng quan trường' },
  { key: 'classes', label: 'Lớp học' },
  { key: 'contacts', label: 'Liên hệ' },
  { key: 'qa', label: 'Câu hỏi' },
  { key: 'blogs', label: 'Quản lý blog' },
  { key: 'documents', label: 'Quản lý tài liệu' },
  { key: 'public-info', label: 'Thông tin công khai' },
  { key: 'attendance', label: 'Quản lý điểm danh' },
];

export default function ManagePublicInfo() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', category: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) navigate('/', { replace: true });
  }, [navigate, user, isInitializing]);

  const canShowEmptyState = useMemo(() => !loading && items.length === 0, [loading, items.length]);

  const loadItems = async (override = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', override.page || pagination.page);
      params.append('limit', pagination.limit);
      const st = override.status !== undefined ? override.status : filters.status;
      const cat = override.category !== undefined ? override.category : filters.category;
      const sr = override.search !== undefined ? override.search : filters.search;
      if (st) params.append('status', st);
      if (cat) params.append('category', cat);
      if (sr) params.append('search', sr);

      const resp = await get(`${ENDPOINTS.SCHOOL_ADMIN.PUBLIC_INFOS}?${params.toString()}`);
      if (resp.status === 'success') {
        setItems(resp.data.items);
        setPagination(resp.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, [filters.status, filters.category]); // eslint-disable-line

  const handleSubmitForm = async (form) => {
    try {
      setSubmitting(true);
      let resp;
      if (selected) {
        resp = await put(ENDPOINTS.SCHOOL_ADMIN.PUBLIC_INFO_DETAIL(selected._id), form);
      } else {
        resp = await post(ENDPOINTS.SCHOOL_ADMIN.PUBLIC_INFOS, form);
      }
      if (resp.status === 'success') {
        await loadItems({ page: 1 });
        setModalOpen(false);
      } else {
        setError(resp.message || 'Lỗi lưu');
      }
    } catch (err) {
      setError(err.message || 'Lỗi lưu');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      setSubmitting(true);
      const resp = await del(ENDPOINTS.SCHOOL_ADMIN.PUBLIC_INFO_DETAIL(confirmDelete._id));
      if (resp.status === 'success') {
        await loadItems({ page: 1 });
        setConfirmDelete(null);
      } else {
        setError(resp.message || 'Lỗi xóa');
      }
    } catch (err) {
      setError(err.message || 'Lỗi xóa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuSelect = (key) => {
    const routes = {
      overview: '/school-admin',
      classes: '/school-admin/classes',
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

  const getStatusChip = (status) => {
    if (status === 'published') return <Chip label="Đã xuất bản" size="small" color="success" variant="outlined" sx={{ fontSize: '11px' }} />;
    if (status === 'draft') return <Chip label="Nháp" size="small" color="warning" variant="outlined" sx={{ fontSize: '11px' }} />;
    if (status === 'inactive') return <Chip label="Ngưng hiển thị" size="small" color="default" variant="outlined" sx={{ fontSize: '11px' }} />;
    return null;
  };

  return (
    <RoleLayout
      title="Thông tin công khai"
      description="Quản lý các thông tin công khai của trường."
      menuItems={menuItems}
      activeKey="public-info"
      onLogout={handleLogout}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
          mb={2}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              Danh sách thông tin công khai
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tổng: <strong>{pagination.total}</strong>
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setSelected(null); setError(null); setModalOpen(true); }}
            sx={{
              bgcolor: '#059669',
              '&:hover': { bgcolor: '#047857' },
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            Tạo mới
          </Button>
        </Stack>

        {/* Bộ lọc */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ md: 'center' }}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2, mb: 2 }}
        >
          <TextField
            size="small"
            placeholder="Tìm theo tiêu đề..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && loadItems({ page: 1 })}
            sx={{ flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Danh mục</InputLabel>
            <Select
              value={filters.category}
              label="Danh mục"
              onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
            >
              <MenuItem value="">Tất cả danh mục</MenuItem>
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={filters.status}
              label="Trạng thái"
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Bảng danh sách */}
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'text.secondary' }}>Tiêu đề</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'text.secondary' }}>Danh mục</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'text.secondary' }}>Tệp đính kèm</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'text.secondary' }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'text.secondary' }}>Tác giả</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'text.secondary' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell sx={{ maxWidth: 200, fontSize: '12px', fontWeight: 500 }}>
                    <Typography
                      variant="caption"
                      fontWeight={500}
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.title}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 160, fontSize: '12px' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.category}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '12px' }}>
                    {item.attachmentUrl ? (
                      <Link
                        href={item.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '12px' }}
                      >
                        {item.attachmentType === 'pdf'
                          ? <><PictureAsPdfIcon fontSize="inherit" /> PDF</>
                          : <><ArticleIcon fontSize="inherit" /> Word</>
                        }
                      </Link>
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(item.status)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '12px', color: 'text.secondary' }}>
                    {item.author?.fullName || item.author?.username || '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => { setSelected(item); setError(null); setModalOpen(true); }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setConfirmDelete(item)}
                        disabled={submitting}
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
                Chưa có thông tin nào. Hãy nhấn &quot;Tạo mới&quot; để bắt đầu.
              </Typography>
            </Box>
          )}

          {loading && (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          )}
        </Box>

        {/* Phân trang */}
        {pagination.totalPages > 1 && (
          <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2}>
            <Typography variant="caption" color="text.secondary">
              Trang {pagination.page}/{pagination.totalPages} · Tổng {pagination.total}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                disabled={pagination.page === 1 || loading}
                onClick={() => loadItems({ page: pagination.page - 1 })}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
              >
                <NavigateBeforeIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                disabled={pagination.page === pagination.totalPages || loading}
                onClick={() => loadItems({ page: pagination.page + 1 })}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
              >
                <NavigateNextIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        )}
      </Paper>

      <PublicInfoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selected}
        onSubmit={handleSubmitForm}
        loading={submitting}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn chắc chắn muốn xóa "${confirmDelete?.title}"?`}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
        loading={submitting}
      />
    </RoleLayout>
  );
}
