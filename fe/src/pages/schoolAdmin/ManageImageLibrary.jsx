import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { postFormData, ENDPOINTS } from '../../service/api';
import { SCHOOL_ADMIN_MENU_ITEMS, createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

const STORAGE_KEY = 'school-admin-image-library';

export default function ManageImageLibrary() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();

  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ title: '', file: null });

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const roles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) navigate('/', { replace: true });
  }, [navigate, user, isInitializing]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setImages(JSON.parse(raw));
      }
    } catch {
      setImages([]);
    }
  }, []);

  const saveImages = (next) => {
    setImages(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleAddImage = async () => {
    if (!form.file) {
      toast.error('Vui lòng chọn ảnh');
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', form.file);
      const resp = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_BLOG_IMAGE, fd);
      if (resp.status !== 'success' || !resp.data?.url) {
        throw new Error(resp.message || 'Upload ảnh thất bại');
      }

      const newImage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: form.title.trim() || `Ảnh ${images.length + 1}`,
        imageUrl: resp.data.url,
        createdAt: new Date().toISOString(),
      };
      const next = [newImage, ...images];
      saveImages(next);
      toast.success('Thêm ảnh thành công');
      setDialogOpen(false);
      setForm({ title: '', file: null });
    } catch (err) {
      setError(err.message || 'Lỗi thêm ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    const next = images.filter((item) => item.id !== confirmDelete.id);
    saveImages(next);
    setConfirmDelete(null);
    toast.success('Đã xóa ảnh');
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);
  const userName = user?.fullName || user?.username || 'School Admin';

  return (
    <RoleLayout
      title="Quản lý ảnh"
      description="Thêm, xem và xóa ảnh trong thư viện."
      menuItems={SCHOOL_ADMIN_MENU_ITEMS}
      activeKey="image-library"
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
          Quản lý ảnh
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
          Quản lý thư viện ảnh hiển thị trong hệ thống.
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Danh sách ảnh ({images.length})
          </Typography>
          <Button variant="contained" startIcon={<AddPhotoAlternateIcon />} onClick={() => setDialogOpen(true)}>
            Thêm ảnh mới
          </Button>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {images.map((item) => (
            <Card key={item.id} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardMedia component="img" height="180" image={item.imageUrl} alt={item.title} sx={{ objectFit: 'cover' }} />
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600}>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button size="small" startIcon={<VisibilityIcon />} onClick={() => { setPreviewImage(item); setPreviewOpen(true); }}>
                  Xem
                </Button>
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(item)}>
                  Xóa
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>

        {images.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Chưa có ảnh nào. Nhấn "Thêm ảnh mới" để bắt đầu.
          </Typography>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm ảnh mới</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              size="small"
              label="Tiêu đề ảnh"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
            <Button variant="outlined" component="label" startIcon={<AddPhotoAlternateIcon />} sx={{ alignSelf: 'flex-start' }}>
              Chọn ảnh
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
              />
            </Button>
            <Typography variant="body2" color="text.secondary">
              {form.file ? `Đã chọn: ${form.file.name}` : 'Chưa chọn ảnh'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleAddImage} disabled={uploading}>
            {uploading ? 'Đang tải...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{previewImage?.title || 'Xem ảnh'}</DialogTitle>
        <DialogContent dividers>
          {previewImage && (
            <Box component="img" src={previewImage.imageUrl} alt={previewImage.title} sx={{ width: '100%', borderRadius: 2 }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xóa ảnh"
        description={`Bạn có chắc muốn xóa ảnh "${confirmDelete?.title || ''}" không?`}
        confirmText="Xác nhận"
        cancelText="Hủy"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </RoleLayout>
  );
}
