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
  Link,
} from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function ManageVideoLibrary() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ title: '', videoUrl: '', file: null });
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');

  useEffect(() => {
    if (!form.file) {
      setCoverPreviewUrl('');
      return undefined;
    }
    const u = URL.createObjectURL(form.file);
    setCoverPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [form.file]);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const roles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) navigate('/', { replace: true });
  }, [navigate, user, isInitializing]);

  const loadItems = async () => {
    try {
      const resp = await get(ENDPOINTS.SCHOOL_ADMIN.VIDEO_LIBRARY);
      if (resp.status === 'success') {
        setItems(resp.data || []);
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách video');
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleAdd = async () => {
    if (!form.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    if (!form.file) {
      toast.error('Vui lòng chọn ảnh bìa');
      return;
    }
    const link = form.videoUrl.trim();
    if (!link) {
      toast.error('Vui lòng nhập link video (YouTube, Facebook, v.v.)');
      return;
    }
    try {
      new URL(link);
    } catch {
      toast.error('Link video không hợp lệ');
      return;
    }
    if (!/^https?:\/\//i.test(link)) {
      toast.error('Link video phải bắt đầu bằng http:// hoặc https://');
      return;
    }

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('image', form.file);
      const up = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_BLOG_IMAGE, fd);
      if (up.status !== 'success' || !up.data?.url) {
        throw new Error(up.message || 'Upload ảnh bìa thất bại');
      }

      await post(ENDPOINTS.SCHOOL_ADMIN.VIDEO_LIBRARY, {
        title: form.title.trim(),
        thumbnailUrl: up.data.url,
        videoUrl: link,
      });
      toast.success('Đã thêm video-clip');
      setDialogOpen(false);
      setForm({ title: '', videoUrl: '', file: null });
      await loadItems();
    } catch (err) {
      setError(err.message || 'Lỗi thêm video');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.VIDEO_LIBRARY_DETAIL(confirmDelete._id));
      toast.success('Đã xóa video');
      setConfirmDelete(null);
      await loadItems();
    } catch (err) {
      setError(err.message || 'Lỗi xóa video');
    }
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);
  const userName = user?.fullName || user?.username || 'School Admin';

  return (
    <RoleLayout
      title="Quản lý video-clip"
      description="Thêm ảnh bìa và link video — không upload file video lên hệ thống."
      menuItems={menuItems}
      activeKey="video-library"
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
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          borderRadius: 3,
          px: 4,
          py: 3,
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700} color="white">
          Quản lý video-clip
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
          Nhập tiêu đề, tải ảnh bìa và dán link video. Trang Thư viện video sẽ mở link khi khách bấm vào ảnh.
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Danh sách ({items.length})
          </Typography>
          <Button variant="contained" startIcon={<VideoLibraryIcon />} onClick={() => setDialogOpen(true)}>
            Thêm video-clip
          </Button>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {items.map((item) => (
            <Card key={item._id} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardMedia
                component="img"
                height="180"
                image={item.thumbnailUrl}
                alt={item.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600}>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </Typography>
                <Link
                  href={item.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="caption"
                  sx={{ wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                >
                  Mở link <OpenInNewIcon sx={{ fontSize: 14 }} />
                </Link>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(item)}>
                  Xóa
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>

        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Chưa có video-clip nào. Nhấn &quot;Thêm video-clip&quot; để bắt đầu.
          </Typography>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm video-clip mới</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              size="small"
              label="Tiêu đề"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              fullWidth
            />
            <TextField
              size="small"
              label="Link video (URL)"
              value={form.videoUrl}
              onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..."
              fullWidth
              helperText="Dán link YouTube, Facebook hoặc bất kỳ URL nào phát video."
            />
            <Button variant="outlined" component="label" startIcon={<AddPhotoAlternateIcon />} sx={{ alignSelf: 'flex-start' }}>
              Chọn ảnh bìa
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
              />
            </Button>
            <Typography variant="body2" color="text.secondary">
              {form.file ? form.file.name : 'Chưa chọn ảnh'}
            </Typography>
            {coverPreviewUrl && (
              <Box
                component="img"
                src={coverPreviewUrl}
                alt="preview"
                sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleAdd} disabled={uploading}>
            {uploading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xóa video-clip"
        description={`Bạn có chắc muốn xóa "${confirmDelete?.title || ''}" không?`}
        confirmText="Xác nhận"
        cancelText="Hủy"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </RoleLayout>
  );
}
