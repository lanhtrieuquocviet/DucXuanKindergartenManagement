import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { get, post, patch, del, postFormData, ENDPOINTS } from '../../service/api';
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
  Chip,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function ManageImageLibrary() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ title: '', files: [] });
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const roles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) navigate('/', { replace: true });
  }, [navigate, user, isInitializing]);

  const loadImages = async () => {
    try {
      const resp = await get(ENDPOINTS.SCHOOL_ADMIN.IMAGE_LIBRARY);
      if (resp.status === 'success') {
        setImages(resp.data || []);
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách ảnh');
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleAddImage = async () => {
    if (!form.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề ảnh');
      return;
    }
    if (!form.files || form.files.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 ảnh');
      return;
    }
    try {
      setUploading(true);
      const uploadResults = await Promise.all(
        form.files.map(async (file) => {
          const fd = new FormData();
          fd.append('image', file);
          const resp = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_BLOG_IMAGE, fd);
          if (resp.status !== 'success' || !resp.data?.url) {
            throw new Error(resp.message || `Upload ảnh "${file.name}" thất bại`);
          }
          return resp.data.url;
        })
      );

      await post(ENDPOINTS.SCHOOL_ADMIN.IMAGE_LIBRARY, {
        title: form.title.trim(),
        imageUrls: uploadResults,
      });
      toast.success('Thêm ảnh thành công');
      setDialogOpen(false);
      setForm({ title: '', files: [] });
      await loadImages();
    } catch (err) {
      setError(err.message || 'Lỗi thêm ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleTogglePublic = async (item, nextActive) => {
    const id = item._id;
    setStatusUpdatingId(id);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.IMAGE_LIBRARY_DETAIL(id), {
        status: nextActive ? 'active' : 'inactive',
      });
      toast.success(nextActive ? 'Đã bật hiển thị trên thư viện ảnh công khai' : 'Đã ẩn khỏi thư viện ảnh công khai');
      await loadImages();
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Không cập nhật được trạng thái');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.IMAGE_LIBRARY_DETAIL(confirmDelete._id));
      toast.success('Đã xóa ảnh');
      setConfirmDelete(null);
      await loadImages();
    } catch (err) {
      setError(err.message || 'Lỗi xóa ảnh');
    }
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);
  const userName = user?.fullName || user?.username || 'School Admin';

  return (
    <RoleLayout
      title="Quản lý ảnh"
      description="Thêm, xem và xóa ảnh trong thư viện."
      menuItems={menuItems}
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
          Bật/tắt hiển thị từng album trên trang Thư viện ảnh công khai.
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
          {images.map((item) => {
            const isPublic = item.status !== 'inactive';
            const busy = statusUpdatingId === item._id;
            return (
              <Card key={item._id} variant="outlined" sx={{ borderRadius: 2, opacity: isPublic ? 1 : 0.92 }}>
                <CardMedia
                  component="img"
                  height="180"
                  image={item.imageUrls?.[0] || item.imageUrl}
                  alt={item.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
                      {item.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={isPublic ? 'Đang hiển thị' : 'Đã ẩn'}
                      color={isPublic ? 'success' : 'default'}
                      variant={isPublic ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {item.imageUrls?.length || 1} ảnh
                  </Typography>
                  <FormControlLabel
                    sx={{ mt: 1, ml: 0, alignItems: 'center' }}
                    control={
                      busy ? (
                        <CircularProgress size={22} sx={{ mx: 1 }} />
                      ) : (
                        <Switch
                          size="small"
                          checked={isPublic}
                          onChange={(_, checked) => handleTogglePublic(item, checked)}
                          color="primary"
                        />
                      )
                    }
                    label={
                      <Typography variant="caption" color="text.secondary">
                        Hiển thị trên thư viện ảnh (công khai)
                      </Typography>
                    }
                  />
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 0.5 }}>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => {
                      setPreviewImage(item);
                      setPreviewIndex(0);
                      setPreviewOpen(true);
                    }}
                  >
                    Xem
                  </Button>
                  <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(item)}>
                    Xóa
                  </Button>
                </CardActions>
              </Card>
            );
          })}
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
              Chọn ảnh (nhiều ảnh)
              <input
                hidden
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setForm((p) => ({ ...p, files: Array.from(e.target.files || []) }))}
              />
            </Button>
            <Typography variant="body2" color="text.secondary">
              {form.files?.length > 0
                ? `Đã chọn ${form.files.length} ảnh`
                : 'Chưa chọn ảnh'}
            </Typography>
            {form.files?.length > 0 && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                  gap: 1,
                }}
              >
                {form.files.map((file, idx) => (
                  <Box key={`${file.name}-${idx}`} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.5 }}>
                    <Box
                      component="img"
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      sx={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 1 }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        mt: 0.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {file.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
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
            <>
              <Box
                component="img"
                src={previewImage.imageUrls?.[previewIndex] || previewImage.imageUrl}
                alt={previewImage.title}
                sx={{ width: '100%', borderRadius: 2 }}
              />
              {(previewImage.imageUrls?.length || 0) > 1 && (
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Button
                    onClick={() =>
                      setPreviewIndex((prev) => (prev - 1 + previewImage.imageUrls.length) % previewImage.imageUrls.length)
                    }
                  >
                    {"<"}
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    {previewIndex + 1}/{previewImage.imageUrls.length}
                  </Typography>
                  <Button
                    onClick={() => setPreviewIndex((prev) => (prev + 1) % previewImage.imageUrls.length)}
                  >
                    {">"}
                  </Button>
                </Stack>
              )}
            </>
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
