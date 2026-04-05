import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { get, post, del, postFormData, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Chip,
  CircularProgress,
  Link,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'draft', label: 'Nháp' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'inactive', label: 'Ngưng hiển thị' },
];

const getFileIcon = (type) => {
  if (type === 'pdf') return <PictureAsPdfIcon sx={{ fontSize: 16, color: '#dc2626' }} />;
  if (type === 'word') return <DescriptionIcon sx={{ fontSize: 16, color: '#2563eb' }} />;
  return <DescriptionIcon sx={{ fontSize: 16, color: '#64748b' }} />;
};

export default function ManageFiles() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [importOpen, setImportOpen] = useState(false);
  const [importCategory, setImportCategory] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const roles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) navigate('/', { replace: true });
  }, [navigate, user, isInitializing]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', 1);
      params.append('limit', 100);
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);

      const resp = await get(`${ENDPOINTS.SCHOOL_ADMIN.DOCUMENTS}?${params.toString()}`);
      if (resp.status === 'success') {
        const list = (resp.data?.items || []).filter((item) => item.attachmentUrl);
        setItems(list);
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách file');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [filters.status]); // eslint-disable-line

  useEffect(() => {
    const loadCategoryOptions = async () => {
      try {
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.BLOG_CATEGORIES);
        if (resp.status === 'success') {
          const categories = (resp.data || [])
            .filter((item) => item?.name)
            .map((item) => ({ value: item.name, label: item.name }));
          setCategoryOptions(categories);
        }
      } catch (err) {
        setError(err.message || 'Lỗi tải danh mục');
      }
    };
    loadCategoryOptions();
  }, []);

  const handleDelete = async () => {
    if (!confirmDelete?._id) return;
    try {
      setSubmitting(true);
      await del(ENDPOINTS.SCHOOL_ADMIN.DOCUMENT_DETAIL(confirmDelete._id));
      toast.success('Đã xóa file thành công');
      setConfirmDelete(null);
      await loadFiles();
    } catch (err) {
      setError(err.message || 'Lỗi xóa file');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);
  const userName = user?.fullName || user?.username || 'School Admin';

  const getStatusChip = (status) => {
    if (status === 'published') return <Chip label="Đã xuất bản" size="small" color="success" variant="outlined" />;
    if (status === 'draft') return <Chip label="Nháp" size="small" color="warning" variant="outlined" />;
    if (status === 'inactive') return <Chip label="Ngưng hiển thị" size="small" variant="outlined" />;
    return null;
  };

  const groupedItems = items.reduce((acc, item) => {
    const key = item.category || 'Chưa phân loại';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const handleImport = async () => {
    if (!importCategory) {
      toast.error('Vui lòng chọn loại danh mục');
      return;
    }
    if (!importFile) {
      toast.error('Vui lòng chọn file để import');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', importFile);
      const uploadResp = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_BLOG_FILE, formData);

      if (uploadResp.status !== 'success' || !uploadResp.data?.url) {
        throw new Error(uploadResp.message || 'Upload file thất bại');
      }

      const titleFromFileName = importFile.name.replace(/\.[^/.]+$/, '');
      await post(ENDPOINTS.SCHOOL_ADMIN.DOCUMENTS, {
        title: titleFromFileName || `Tài liệu ${new Date().toLocaleDateString('vi-VN')}`,
        description: `Import từ Quản lý file (${importCategory})`,
        category: importCategory,
        status: 'published',
        attachmentUrl: uploadResp.data.url,
        attachmentType: uploadResp.data.type || null,
      });

      toast.success(`Import file "${importFile.name}" thành công`);
      handleCloseImportDialog();
      await loadFiles();
    } catch (err) {
      setError(err.message || 'Import file thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseImportDialog = () => {
    setImportOpen(false);
    setImportCategory('');
    setImportFile(null);
  };

  return (
    <RoleLayout
      title="Quản lý file"
      description="Quản lý các file đính kèm trong mục tài liệu."
      menuItems={menuItems}
      activeKey="files-management"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
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

      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          borderRadius: 3,
          px: 4,
          py: 3,
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700} color="white">
          Quản lý file
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
          Theo dõi, tìm kiếm và xóa các file đính kèm trong hệ thống tài liệu.
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ md: 'center' }}
          sx={{ mb: 2 }}
        >
          <TextField
            size="small"
            placeholder="Tìm theo tên tài liệu..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadFiles();
            }}
            sx={{ flex: { md: 1 }, minWidth: { xs: '100%', md: 320 }, maxWidth: { md: 560 } }}
          />
          <Button variant="contained" startIcon={<SearchIcon />} onClick={loadFiles}>
            Tìm kiếm
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => setImportOpen(true)}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Import file
          </Button>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={filters.status}
              label="Trạng thái"
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            color="success"
            onClick={() => navigate('/school-admin/blog-categories')}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Quản lý danh mục
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Stack spacing={2}>
            {Object.entries(groupedItems).map(([categoryName, files]) => (
              <Paper key={categoryName} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {categoryName}
                  </Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 760 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Tài liệu</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>File</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Ngày tạo</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Hành động
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {files.map((item) => (
                        <TableRow key={item._id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{item.title}</TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              {getFileIcon(item.attachmentType)}
                              <Link href={item.attachmentUrl} target="_blank" rel="noopener noreferrer" underline="hover">
                                Xem file
                              </Link>
                            </Stack>
                          </TableCell>
                          <TableCell>{getStatusChip(item.status)}</TableCell>
                          <TableCell>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <IconButton
                                size="small"
                                component={Link}
                                href={item.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: '#0284c7' }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => setConfirmDelete(item)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            ))}

            {items.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Chưa có file nào.
              </Typography>
            )}
          </Stack>
        )}
      </Paper>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xóa file"
        description={`Bạn có muốn xóa file của tài liệu "${confirmDelete?.title || ''}" không?`}
        confirmText="Xác nhận"
        cancelText="Hủy"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={submitting}
      />

      <Dialog open={importOpen} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Import file</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Loại danh mục</InputLabel>
              <Select
                value={importCategory}
                label="Loại danh mục"
                onChange={(e) => setImportCategory(e.target.value)}
              >
                {categoryOptions.length === 0 && (
                  <MenuItem value="" disabled>
                    Chưa có danh mục
                  </MenuItem>
                )}
                {categoryOptions.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ alignSelf: 'flex-start' }}>
              Chọn file
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </Button>

            <Typography variant="body2" color="text.secondary">
              {importFile ? `Đã chọn: ${importFile.name}` : 'Chưa chọn file nào'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={handleCloseImportDialog}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleImport} disabled={submitting}>
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}
