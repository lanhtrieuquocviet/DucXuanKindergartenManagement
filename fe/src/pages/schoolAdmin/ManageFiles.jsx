import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { get, del, ENDPOINTS } from '../../service/api';
import { SCHOOL_ADMIN_MENU_ITEMS, createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';

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

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '' });

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

  return (
    <RoleLayout
      title="Quản lý file"
      description="Quản lý các file đính kèm trong mục tài liệu."
      menuItems={SCHOOL_ADMIN_MENU_ITEMS}
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
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} sx={{ mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Tìm theo tên tài liệu..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadFiles();
            }}
          />
          <Button variant="contained" startIcon={<SearchIcon />} onClick={loadFiles}>
            Tìm kiếm
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
        </Stack>

        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
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
                {items.map((item) => (
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

            {items.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Chưa có file nào.
              </Typography>
            )}
          </Box>
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
    </RoleLayout>
  );
}
