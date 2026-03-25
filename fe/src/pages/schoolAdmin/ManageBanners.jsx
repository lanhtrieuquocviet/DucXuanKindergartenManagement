import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import EditIcon from '@mui/icons-material/Edit';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { del, get, post, patch, put, postFormData, ENDPOINTS } from '../../service/api';

const createBanner = (index = 0) => ({
  imageUrl: '',
  altText: '',
  isActive: true,
  order: index + 1,
});

export default function ManageBanners() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploadingIndex, setUploadingIndex] = useState(-1);
  const [banners, setBanners] = useState([createBanner(0)]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [creatingBanner, setCreatingBanner] = useState(createBanner(0));
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingBanner, setEditingBanner] = useState(createBanner(0));
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    index: -1,
    deleting: false,
  });

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
    const load = async () => {
      setLoading(true);
      try {
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.BANNERS);
        const list = resp?.data?.banners || [];
        setBanners(list);
      } catch (err) {
        toast.error(err?.message || 'Không tải được banner.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isInitializing, navigate, user]);

  const handleAddBanner = () => {
    setCreatingBanner(createBanner(banners.length));
    setOpenCreateDialog(true);
  };

  const handleUploadCreateBanner = async (file) => {
    if (!file) return;
    setUploadingIndex(-2);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const resp = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_BLOG_IMAGE, formData);
      if (resp?.status === 'success' && resp?.data?.url) {
        setCreatingBanner((prev) => ({ ...prev, imageUrl: resp.data.url }));
        toast.success('Tải ảnh banner thành công.');
      } else {
        throw new Error(resp?.message || 'Upload ảnh thất bại.');
      }
    } catch (err) {
      toast.error(err?.message || 'Upload ảnh thất bại.');
    } finally {
      setUploadingIndex(-1);
    }
  };

  const handleConfirmCreateBanner = () => {
    const imageUrl = String(creatingBanner.imageUrl || '').trim();
    const altText = String(creatingBanner.altText || '').trim();
    if (!imageUrl) {
      toast.error('Vui lòng tải ảnh banner.');
      return;
    }
    if (!altText) {
      toast.error('Vui lòng nhập tiêu đề banner.');
      return;
    }
    post(ENDPOINTS.SCHOOL_ADMIN.BANNERS, {
      imageUrl,
      altText,
      isActive: creatingBanner.isActive !== false,
    })
      .then((resp) => {
        const list = resp?.data?.banners;
        if (Array.isArray(list)) {
          setBanners(list);
        } else if (resp?.data?.banner) {
          setBanners((prev) => [...prev, resp.data.banner]);
        }
        setOpenCreateDialog(false);
        setCreatingBanner(createBanner(0));
        toast.success('Đã thêm banner mới.');
      })
      .catch((err) => {
        toast.error(err?.message || 'Thêm banner thất bại.');
      });
  };

  const handleRemoveBanner = async (index) => {
    const target = banners[index];
    const removeLocal = () =>
      setBanners((prev) => {
        const next = prev.filter((_, i) => i !== index);
        return next.map((item, i) => ({ ...item, order: i + 1 }));
      });

    if (!target?._id) {
      removeLocal();
      const normalized = banners
        .filter((_, i) => i !== index)
        .map((item, idx) => ({
          imageUrl: String(item.imageUrl || '').trim(),
          altText: String(item.altText || `Banner ${idx + 1}`).trim() || `Banner ${idx + 1}`,
          isActive: item.isActive !== false,
          order: idx + 1,
        }))
        .filter((item) => item.imageUrl);
      if (normalized.length > 0) {
        try {
          const resp = await put(ENDPOINTS.SCHOOL_ADMIN.BANNERS, { banners: normalized });
          setBanners(resp?.data?.banners || normalized);
        } catch (_) {
          // ignore to keep UX smooth when local temp rows exist
        }
      }
      toast.success('Xóa banner thành công.');
      return;
    }

    try {
      const resp = await del(ENDPOINTS.SCHOOL_ADMIN.BANNER_DETAIL(target._id));
      const next = resp?.data?.banners;
      if (Array.isArray(next)) setBanners(next);
      else removeLocal();
      toast.success('Xóa banner thành công.');
    } catch (err) {
      const message = err?.message || '';
      // Fallback: id cũ không còn khớp (thường do dữ liệu cũ), dùng PUT để đồng bộ lại danh sách.
      if (message.toLowerCase().includes('không tìm thấy banner')) {
        try {
          const normalized = banners
            .filter((_, i) => i !== index)
            .map((item, idx) => ({
              imageUrl: String(item.imageUrl || '').trim(),
              altText: String(item.altText || `Banner ${idx + 1}`).trim() || `Banner ${idx + 1}`,
              isActive: item.isActive !== false,
              order: idx + 1,
            }))
            .filter((item) => item.imageUrl);
          if (normalized.length === 0) {
            toast.error('Cần giữ ít nhất 1 banner.');
            return;
          }
          const syncResp = await put(ENDPOINTS.SCHOOL_ADMIN.BANNERS, { banners: normalized });
          setBanners(syncResp?.data?.banners || normalized);
          toast.success('Đã đồng bộ và xóa banner thành công.');
          return;
        } catch (syncErr) {
          toast.error(syncErr?.message || 'Xóa banner thất bại.');
          return;
        }
      }
      toast.error(message || 'Xóa banner thất bại.');
    }
  };

  const handleRequestDeleteBanner = (index) => {
    setDeleteConfirm({ open: true, index, deleting: false });
  };

  const handleCancelDeleteBanner = () => {
    if (deleteConfirm.deleting) return;
    setDeleteConfirm({ open: false, index: -1, deleting: false });
  };

  const handleConfirmDeleteBanner = async () => {
    const index = deleteConfirm.index;
    if (index < 0) return;
    setDeleteConfirm((prev) => ({ ...prev, deleting: true }));
    try {
      await handleRemoveBanner(index);
      setDeleteConfirm({ open: false, index: -1, deleting: false });
    } catch (_) {
      setDeleteConfirm((prev) => ({ ...prev, deleting: false }));
    }
  };

  const handleOpenEditDialog = (index) => {
    const target = banners[index];
    if (!target) return;
    setEditingIndex(index);
    setEditingBanner({
      _id: target._id,
      imageUrl: target.imageUrl || '',
      altText: target.altText || '',
      isActive: target.isActive !== false,
      order: target.order || index + 1,
    });
    setOpenEditDialog(true);
  };

  const handleUploadEditBanner = async (file) => {
    if (!file) return;
    setUploadingIndex(-3);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const resp = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_BLOG_IMAGE, formData);
      if (resp?.status === 'success' && resp?.data?.url) {
        setEditingBanner((prev) => ({ ...prev, imageUrl: resp.data.url }));
        toast.success('Tải ảnh banner thành công.');
      } else {
        throw new Error(resp?.message || 'Upload ảnh thất bại.');
      }
    } catch (err) {
      toast.error(err?.message || 'Upload ảnh thất bại.');
    } finally {
      setUploadingIndex(-1);
    }
  };

  const handleConfirmEditBanner = async () => {
    const imageUrl = String(editingBanner.imageUrl || '').trim();
    const altText = String(editingBanner.altText || '').trim();
    if (!imageUrl) {
      toast.error('Vui lòng tải ảnh banner.');
      return;
    }
    if (!altText) {
      toast.error('Vui lòng nhập tiêu đề banner.');
      return;
    }

    try {
      const resp = await patch(ENDPOINTS.SCHOOL_ADMIN.BANNER_DETAIL(editingBanner._id), {
        imageUrl,
        altText,
        isActive: editingBanner.isActive !== false,
        order: editingBanner.order || editingIndex + 1,
      });
      const list = resp?.data?.banners;
      if (Array.isArray(list)) {
        setBanners(list);
      } else if (resp?.data?.banner) {
        setBanners((prev) =>
          prev.map((item, i) => (i === editingIndex ? { ...item, ...resp.data.banner } : item))
        );
      } else {
        setBanners((prev) =>
          prev.map((item, i) => (i === editingIndex ? { ...item, ...editingBanner } : item))
        );
      }
      setOpenEditDialog(false);
      setEditingIndex(-1);
      setEditingBanner(createBanner(0));
      toast.success('Cập nhật banner thành công.');
    } catch (err) {
      toast.error(err?.message || 'Cập nhật banner thất bại.');
    }
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
    { key: 'menu', label: 'Quản lý thực đơn' },
    { key: 'meal-management', label: 'Quản lý bữa ăn' },
    { key: 'teachers', label: 'Giáo viên' },
    { key: 'students', label: 'Học sinh & phụ huynh' },
    { key: 'assets', label: 'Quản lý tài sản' },
    { key: 'reports', label: 'Báo cáo của trường' },
    { key: 'contacts', label: 'Liên hệ' },
    { key: 'qa', label: 'Câu hỏi' },
    { key: 'blogs', label: 'Quản lý blog' },
    { key: 'documents', label: 'Quản lý tài liệu' },
    { key: 'public-info', label: 'Thông tin công khai' },
    { key: 'banner-management', label: 'Quản lý banner' },
    { key: 'attendance', label: 'Quản lý điểm danh' },
  ];

  const handleMenuSelect = (key) => {
    if (key === 'overview') navigate('/school-admin');
    else if (key === 'academic-year-setup') navigate('/school-admin/academic-years');
    else if (key === 'academic-report') navigate('/school-admin/academic-years');
    else if (key === 'academic-schedule') navigate('/school-admin/timetable');
    else if (key === 'academic-plan') navigate('/school-admin/academic-plan');
    else if (key === 'classes') navigate('/school-admin/classes');
    else if (key === 'menu') navigate('/school-admin/menus');
    else if (key === 'meal-management') navigate('/school-admin/meal-management');
    else if (key === 'teachers') navigate('/school-admin/teachers');
    else if (key === 'contacts') navigate('/school-admin/contacts');
    else if (key === 'qa') navigate('/school-admin/qa');
    else if (key === 'blogs') navigate('/school-admin/blogs');
    else if (key === 'documents') navigate('/school-admin/documents');
    else if (key === 'public-info') navigate('/school-admin/public-info');
    else if (key === 'banner-management') navigate('/school-admin/banners');
    else if (key === 'attendance') navigate('/school-admin/attendance/overview');
  };

  return (
    <RoleLayout
      title="Quản lý banner"
      description="Kiểm soát banner hiển thị trên trang chủ."
      menuItems={menuItems}
      activeKey="banner-management"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={user?.fullName || user?.username || 'School Admin'}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 2, backgroundColor: '#f3f4f6' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" gap={1.5}>
          <Typography variant="h5" fontWeight={700}>
            Quản lý Banner
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddBanner}
              sx={{
                background: 'linear-gradient(90deg, #7c3aed, #9333ea)',
                borderRadius: 3,
                textTransform: 'none',
                px: 2.2,
                fontWeight: 600,
              }}
            >
              Thêm Banner Mới
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Stack alignItems="center" py={5}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          banners.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider',
                textAlign: 'center',
                bgcolor: 'white',
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Chưa có banner nào
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
              {banners.map((item, index) => (
              <Paper key={`${item.imageUrl}-${index}`} elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ position: 'relative', height: 190, bgcolor: '#e5e7eb' }}>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.altText || `Banner ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }} spacing={1}>
                      <Typography color="text.secondary">Chưa có ảnh banner</Typography>
                    </Stack>
                  )}
                </Box>

                <Stack spacing={1.2} sx={{ p: 2 }}>
                  <Typography variant="body1" fontWeight={500}>
                    {item.altText || `Banner ${index + 1}`}
                  </Typography>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Chip
                      label={item.isActive !== false ? 'Đang hiển thị' : 'Đang ẩn'}
                      size="small"
                      color={item.isActive !== false ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignSelf: 'flex-start' }}>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenEditDialog(index)}
                      sx={{ textTransform: 'none' }}
                    >
                      Cập nhật
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleRequestDeleteBanner(index)}
                      sx={{ textTransform: 'none' }}
                    >
                      Xóa
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
              ))}
            </Box>
          )
        )}
      </Paper>

      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm Banner Mới</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box sx={{ height: 200, borderRadius: 2, bgcolor: '#e5e7eb', overflow: 'hidden' }}>
              {creatingBanner.imageUrl ? (
                <img
                  src={creatingBanner.imageUrl}
                  alt={creatingBanner.altText || 'Banner mới'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Stack sx={{ height: '100%' }} alignItems="center" justifyContent="center" spacing={1}>
                  <Typography color="text.secondary">Mockup banner mới</Typography>
                  <Button
                    component="label"
                    variant="contained"
                    startIcon={<UploadIcon />}
                    disabled={uploadingIndex === -2}
                    sx={{ textTransform: 'none' }}
                  >
                    {uploadingIndex === -2 ? 'Đang tải...' : 'Tải ảnh lên'}
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadCreateBanner(e.target.files?.[0])}
                    />
                  </Button>
                </Stack>
              )}
            </Box>
            <TextField
              label="URL ảnh banner (tùy chọn)"
              fullWidth
              size="small"
              placeholder="https://example.com/banner.jpg"
              value={creatingBanner.imageUrl}
              onChange={(e) => setCreatingBanner((prev) => ({ ...prev, imageUrl: e.target.value }))}
              helperText="Bạn có thể dán URL ảnh hoặc dùng nút Tải ảnh lên."
            />
            {creatingBanner.imageUrl && (
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadIcon />}
                disabled={uploadingIndex === -2}
                sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
              >
                {uploadingIndex === -2 ? 'Đang tải...' : 'Đổi ảnh'}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadCreateBanner(e.target.files?.[0])}
                />
              </Button>
            )}
            <TextField
              label="Tiêu đề banner"
              fullWidth
              size="small"
              value={creatingBanner.altText}
              onChange={(e) => setCreatingBanner((prev) => ({ ...prev, altText: e.target.value }))}
            />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2">Hiển thị banner</Typography>
              <Switch
                checked={creatingBanner.isActive !== false}
                onChange={(e) => setCreatingBanner((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCreateDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleConfirmCreateBanner}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cập nhật banner</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box sx={{ height: 200, borderRadius: 2, bgcolor: '#e5e7eb', overflow: 'hidden' }}>
              {editingBanner.imageUrl ? (
                <img
                  src={editingBanner.imageUrl}
                  alt={editingBanner.altText || 'Banner'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Stack sx={{ height: '100%' }} alignItems="center" justifyContent="center">
                  <Typography color="text.secondary">Chưa có ảnh banner</Typography>
                </Stack>
              )}
            </Box>
            <TextField
              label="URL ảnh banner (tùy chọn)"
              fullWidth
              size="small"
              placeholder="https://example.com/banner.jpg"
              value={editingBanner.imageUrl}
              onChange={(e) => setEditingBanner((prev) => ({ ...prev, imageUrl: e.target.value }))}
              helperText="Bạn có thể dán URL ảnh hoặc dùng nút Đổi ảnh."
            />
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadIcon />}
              disabled={uploadingIndex === -3}
              sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
            >
              {uploadingIndex === -3 ? 'Đang tải...' : 'Đổi ảnh'}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadEditBanner(e.target.files?.[0])}
              />
            </Button>
            <TextField
              label="Tiêu đề banner"
              fullWidth
              size="small"
              value={editingBanner.altText}
              onChange={(e) => setEditingBanner((prev) => ({ ...prev, altText: e.target.value }))}
            />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2">Hiển thị banner</Typography>
              <Switch
                checked={editingBanner.isActive !== false}
                onChange={(e) => setEditingBanner((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenEditDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleConfirmEditBanner}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirm.open}
        onClose={handleCancelDeleteBanner}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Xác nhận xóa banner</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn có chắc chắn muốn xóa banner này không?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelDeleteBanner} disabled={deleteConfirm.deleting}>
            Hủy
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDeleteBanner}
            disabled={deleteConfirm.deleting}
          >
            {deleteConfirm.deleting ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}
