import { useEffect, useState, useCallback, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { get, post, patch, del, postFormData, ENDPOINTS } from '../../service/api';
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
  Chip,
  Switch,
  FormControlLabel,
  CircularProgress,
  InputAdornment,
  IconButton,
  TablePagination,
} from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export default function ManageVideoLibrary() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();

  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ title: '', videoUrl: '', file: null });
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useLayoutEffect(() => {
    setPage(0);
  }, [debouncedSearch, rowsPerPage]);

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

  const loadItems = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    const requestedApiPage = page + 1;
    try {
      setListLoading(true);
      const qs = new URLSearchParams();
      if (debouncedSearch) qs.set('search', debouncedSearch);
      qs.set('page', String(requestedApiPage));
      qs.set('limit', String(rowsPerPage));
      const resp = await get(`${ENDPOINTS.SCHOOL_ADMIN.VIDEO_LIBRARY}?${qs.toString()}`);
      if (seq !== loadSeqRef.current) return;
      if (resp.status === 'success' && resp.data?.items) {
        setItems(resp.data.items);
        const p = resp.data.pagination;
        setTotal(typeof p?.total === 'number' ? p.total : 0);
        if (p && typeof p.page === 'number' && p.page >= 1 && p.page !== requestedApiPage) {
          setPage(Math.max(0, p.page - 1));
        }
      }
    } catch (err) {
      if (seq === loadSeqRef.current) {
        setError(err.message || 'Lỗi tải danh sách video');
      }
    } finally {
      if (seq === loadSeqRef.current) {
        setListLoading(false);
      }
    }
  }, [debouncedSearch, page, rowsPerPage]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

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

  const handleTogglePublic = async (item, nextActive) => {
    const id = item._id;
    setStatusUpdatingId(id);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.VIDEO_LIBRARY_DETAIL(id), {
        status: nextActive ? 'active' : 'inactive',
      });
      toast.success(
        nextActive ? 'Đã bật hiển thị trên thư viện video công khai' : 'Đã ẩn khỏi thư viện video công khai'
      );
      await loadItems();
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Không cập nhật được trạng thái');
    } finally {
      setStatusUpdatingId(null);
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

  // const handleMenuSelect = createSchoolAdminMenuSelect(navigate);
  const userName = user?.fullName || user?.username || 'School Admin';
  const hasSearch = !!search.trim();

  const clearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setPage(0);
  };

  return (
    <Box>
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
          Nhập tiêu đề, tải ảnh bìa và dán link video. Tắt công tắc để ẩn clip khỏi trang công khai — không upload file video lên hệ thống.
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
          <Typography variant="subtitle1" fontWeight={700}>
            Danh sách ({total})
          </Typography>
          <Button variant="contained" startIcon={<VideoLibraryIcon />} onClick={() => setDialogOpen(true)}>
            Thêm video-clip
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            label="Tìm theo tiêu đề hoặc ngày tạo"
            placeholder="VD: lễ hội, 19/04/2026, 2026-04-19"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          {hasSearch && (
            <IconButton aria-label="Xóa tìm kiếm" onClick={clearSearch} color="inherit" sx={{ flexShrink: 0 }}>
              <ClearIcon />
            </IconButton>
          )}
        </Stack>

        <Box sx={{ position: 'relative', minHeight: listLoading ? 200 : undefined }}>
          {listLoading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.6)',
                zIndex: 1,
                borderRadius: 1,
              }}
            >
              <CircularProgress size={36} />
            </Box>
          )}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {items.map((item) => {
            const isPublic = item.status !== 'inactive';
            const busy = statusUpdatingId === item._id;
            return (
              <Card key={item._id} variant="outlined" sx={{ borderRadius: 2, opacity: isPublic ? 1 : 0.92 }}>
                <CardMedia
                  component="img"
                  height="180"
                  image={item.thumbnailUrl}
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
                        Hiển thị trên thư viện video (công khai)
                      </Typography>
                    }
                  />
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 0.5 }}>
                  <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(item)}>
                    Xóa
                  </Button>
                </CardActions>
              </Card>
            );
          })}
          </Box>
        </Box>

        {total > 0 && (
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[9, 12, 24, 48]}
            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            labelRowsPerPage="Mục mỗi trang"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count !== -1 ? count : `nhiều hơn ${to}`}`}
            sx={{ borderTop: 1, borderColor: 'divider', mt: 2, '.MuiTablePagination-toolbar': { flexWrap: 'wrap', gap: 1 } }}
          />
        )}

        {!listLoading && items.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {debouncedSearch
              ? 'Không có video-clip nào khớp từ khóa tìm kiếm.'
              : 'Chưa có video-clip nào. Nhấn "Thêm video-clip" để bắt đầu.'}
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
    </Box>
  );
}
