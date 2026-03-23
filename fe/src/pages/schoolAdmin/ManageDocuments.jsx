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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Link,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'draft', label: 'Nháp' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'inactive', label: 'Ngưng hiển thị' },
];

function DocumentFormModal({ open, onClose, initialData, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'draft',
    category: '',
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
        status: initialData?.status || 'draft',
        category: initialData?.category || '',
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
    if (!form.description.trim()) errs.description = 'Nội dung không được để trống';
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
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
          {initialData ? 'Chỉnh sửa tài liệu' : 'Tạo tài liệu mới'}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 2, py: 2 }}>
        <Box component="form" id="document-form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {/* Tiêu đề */}
            <Box>
              <TextField
                name="title"
                label="Tiêu đề *"
                value={form.title}
                onChange={handleChange}
                inputProps={{ maxLength: 200 }}
                fullWidth
                size="small"
                error={!!formErrors.title}
                helperText={formErrors.title}
                placeholder="Nhập tiêu đề tài liệu"
              />
              <Typography
                variant="caption"
                color={form.title.length > 200 ? 'error' : 'text.secondary'}
                sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}
              >
                {form.title.length}/200
              </Typography>
            </Box>

            {/* Nội dung (Rich Text) */}
            <Box>
              <Typography variant="caption" fontWeight={500} color="text.secondary" display="block" mb={0.5}>
                Nội dung *
              </Typography>
              <Box
                sx={
                  formErrors.description
                    ? { border: '1px solid', borderColor: 'error.main', borderRadius: 1 }
                    : {}
                }
              >
                <RichTextEditor
                  initialValue={form.description}
                  onChange={(html) => {
                    setForm((prev) => ({ ...prev, description: html }));
                    if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: null }));
                  }}
                  disabled={uploadingFile}
                  attachmentUrl={form.attachmentUrl}
                  attachmentType={form.attachmentType}
                  onAttachFile={handleAttachFile}
                  onRemoveFile={() => setForm((prev) => ({ ...prev, attachmentUrl: null, attachmentType: null }))}
                />
              </Box>
              {formErrors.description && (
                <Typography variant="caption" color="error" mt={0.5} display="block">
                  {formErrors.description}
                </Typography>
              )}
            </Box>

            {/* Danh mục */}
            <FormControl size="small" fullWidth>
              <InputLabel>Danh mục</InputLabel>
              <Select
                name="category"
                value={form.category}
                label="Danh mục"
                onChange={handleChange}
              >
                <MenuItem value="">-- Chọn danh mục --</MenuItem>
                <MenuItem value="văn bản pháp quy">Văn bản pháp quy</MenuItem>
                <MenuItem value="văn bản từ phòng">Văn bản từ phòng</MenuItem>
              </Select>
            </FormControl>

            {/* Trạng thái */}
            <FormControl size="small" fullWidth>
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
        <Button variant="outlined" onClick={onClose} fullWidth>
          Hủy
        </Button>
        <Button
          type="submit"
          form="document-form"
          variant="contained"
          color="success"
          disabled={loading || uploadingFile}
          fullWidth
        >
          {loading ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ManageDocuments() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

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
    }
  }, [navigate, user, isInitializing]);

  const canShowEmptyState = useMemo(
    () => !loading && documents.length === 0,
    [loading, documents.length]
  );

  const loadDocuments = async (override = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', override.page || pagination.page);
      params.append('limit', pagination.limit);
      if (override.status !== undefined ? override.status : filters.status)
        params.append('status', override.status !== undefined ? override.status : filters.status);
      if (override.search !== undefined ? override.search : filters.search)
        params.append('search', override.search !== undefined ? override.search : filters.search);

      const response = await get(`${ENDPOINTS.SCHOOL_ADMIN.DOCUMENTS}?${params.toString()}`);
      if (response.status === 'success') {
        setDocuments(response.data.items);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDocuments({ page: 1 });
  };

  const handleStatusChange = (e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value }));
  };

  const openCreateModal = () => {
    setSelectedDocument(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (doc) => {
    setSelectedDocument(doc);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmitForm = async (form) => {
    try {
      setSubmitting(true);
      let response;
      if (selectedDocument) {
        response = await put(ENDPOINTS.SCHOOL_ADMIN.DOCUMENT_DETAIL(selectedDocument._id), form);
      } else {
        response = await post(ENDPOINTS.SCHOOL_ADMIN.DOCUMENTS, form);
      }
      if (response.status === 'success') {
        await loadDocuments({ page: 1 });
        setModalOpen(false);
      } else {
        setError(response.message || 'Lỗi lưu tài liệu');
      }
    } catch (err) {
      setError(err.message || 'Lỗi lưu tài liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      setSubmitting(true);
      const response = await del(ENDPOINTS.SCHOOL_ADMIN.DOCUMENT_DETAIL(confirmDelete._id));
      if (response.status === 'success') {
        await loadDocuments({ page: 1 });
        setConfirmDelete(null);
      } else {
        setError(response.message || 'Lỗi xóa tài liệu');
      }
    } catch (err) {
      setError(err.message || 'Lỗi xóa tài liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = async (newPage) => {
    if (newPage === pagination.page) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
    await loadDocuments({ page: newPage });
  };

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
    {
      key: 'academic-years',
      label: 'Quản lý năm học',
      children: [
        { key: 'academic-year-setup', label: 'Thiết lập năm học' },
        { key: 'academic-plan', label: 'Thiết lập kế hoạch' },
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
    if (key === 'academic-report') {
      try {
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT);
        const yearId = resp?.status === 'success' ? resp?.data?._id : null;
        if (yearId) navigate(`/school-admin/academic-years/${yearId}/report`);
        else navigate('/school-admin/academic-years');
      } catch (_) {
        navigate('/school-admin/academic-years');
      }
      return;
    }

    const routes = {
      overview: '/school-admin',
      'academic-year-setup': '/school-admin/academic-years',
      'academic-curriculum': '/school-admin/curriculum',
      'academic-students': '/school-admin/class-list',
      'academic-schedule': '/school-admin/timetable',
      'academic-plan': '/school-admin/academic-plan',
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

  const getStatusChip = (status) => {
    if (status === 'published') return <Chip label="Đã xuất bản" color="success" size="small" />;
    if (status === 'draft') return <Chip label="Nháp" color="warning" size="small" />;
    if (status === 'inactive') return <Chip label="Ngưng hiển thị" color="default" size="small" />;
    return null;
  };

  return (
    <RoleLayout
      title="Quản lý tài liệu"
      description="Tạo, chỉnh sửa, xóa và quản lý tài liệu của trường."
      menuItems={menuItems}
      activeKey="documents"
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
          Quản lý tài liệu
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
          Tạo, chỉnh sửa, xóa và quản lý tài liệu của trường.
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          mb={2}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Danh sách tài liệu
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tổng: <strong>{pagination.total}</strong>
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={openCreateModal}
          >
            Tạo tài liệu mới
          </Button>
        </Stack>

        {/* Bộ lọc */}
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            alignItems: { md: 'center' },
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 2,
            mb: 2,
          }}
        >
          <Stack direction="row" spacing={1} flex={1}>
            <TextField
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Tìm theo tiêu đề, nội dung..."
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                ),
              }}
            />
            <Button
              type="submit"
              variant="contained"
              color="inherit"
              sx={{ display: { xs: 'none', md: 'inline-flex' }, whiteSpace: 'nowrap' }}
            >
              Tìm kiếm
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
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
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            >
              Lọc
            </Button>
          </Stack>
        </Box>

        {/* Bảng danh sách */}
        <Box sx={{ overflowX: 'auto' }}>
          {loading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#e0f2fe' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tiêu đề</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Danh mục</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nội dung</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tệp đính kèm</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tác giả</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc._id} hover>
                    <TableCell sx={{ maxWidth: 180 }}>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {doc.title}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {doc.category === 'văn bản pháp quy' && (
                        <Chip label="Pháp quy" color="primary" size="small" variant="outlined" />
                      )}
                      {doc.category === 'văn bản từ phòng' && (
                        <Chip label="Từ phòng" color="warning" size="small" variant="outlined" />
                      )}
                      {!doc.category && (
                        <Typography variant="caption" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {doc.description?.replace(/<[^>]*>/g, '') || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {doc.attachmentUrl ? (
                        <Link
                          href={doc.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                        >
                          {doc.attachmentType === 'pdf' ? (
                            <><PictureAsPdfIcon fontSize="small" /> PDF</>
                          ) : (
                            <><DescriptionIcon fontSize="small" /> Word</>
                          )}
                        </Link>
                      ) : (
                        <Typography variant="caption" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(doc.status)}</TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {doc.author?.fullName || doc.author?.username || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/school-admin/documents/${doc._id}`)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => openEditModal(doc)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmDelete(doc)}
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
          )}

          {canShowEmptyState && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Chưa có tài liệu nào. Hãy nhấn &quot;Tạo tài liệu mới&quot; để bắt đầu.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Phân trang */}
        {pagination.totalPages > 1 && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mt={2}
          >
            <Typography variant="caption" color="text.secondary">
              Trang {pagination.page}/{pagination.totalPages} · Tổng {pagination.total} tài liệu
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Button
                size="small"
                variant="outlined"
                disabled={pagination.page === 1 || loading}
                onClick={() => handlePageChange(pagination.page - 1)}
                sx={{ minWidth: 36 }}
              >
                «
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={pagination.page === pagination.totalPages || loading}
                onClick={() => handlePageChange(pagination.page + 1)}
                sx={{ minWidth: 36 }}
              >
                »
              </Button>
            </Stack>
          </Stack>
        )}
      </Paper>

      <DocumentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selectedDocument}
        onSubmit={handleSubmitForm}
        loading={submitting}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn chắc chắn muốn xóa tài liệu "${confirmDelete?.title}"?`}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
        loading={submitting}
      />
    </RoleLayout>
  );
}
