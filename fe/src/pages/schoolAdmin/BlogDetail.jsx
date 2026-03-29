import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import { SCHOOL_ADMIN_MENU_ITEMS, createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import ConfirmDialog from '../../components/ConfirmDialog';
import 'quill/dist/quill.snow.css';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Article as ArticleIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
} from '@mui/icons-material';

const STATUS_DISPLAY = {
  draft: { label: 'Nháp', color: 'warning' },
  published: { label: 'Đã xuất bản', color: 'success' },
  inactive: { label: 'Ngưng hiển thị', color: 'default' },
};

function BlogDetail() {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getBlogs, deleteBlog, setError } = useSchoolAdmin();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setLocalError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SchoolAdmin')) { navigate('/', { replace: true }); return; }
  }, [navigate, user, isInitializing]);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        setLocalError(null);
        const response = await getBlogs();
        const blogs = response?.data?.items || [];
        const found = blogs.find((b) => b._id === blogId);
        if (found) {
          setBlog(found);
        } else {
          setLocalError('Không tìm thấy bài viết');
        }
      } catch (err) {
        setLocalError(err.message || 'Lỗi khi tải bài viết');
      } finally {
        setLoading(false);
      }
    };
    if (blogId) fetchBlog();
  }, [blogId, getBlogs]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteBlog(blogId);
      navigate('/school-admin/blogs', { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Xóa bài viết thất bại');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleEdit = () => navigate(`/school-admin/blogs/${blogId}/edit`);
  const handleBack = () => navigate('/school-admin/blogs', { replace: true });

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  const userName = user?.fullName || user?.username || 'School Admin';
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <RoleLayout
        title="Chi tiết bài viết"
        menuItems={SCHOOL_ADMIN_MENU_ITEMS}
        activeKey="blogs"
        onLogout={() => { logout(); navigate('/login', { replace: true }); }}
        onViewProfile={() => navigate('/profile')}
        onMenuSelect={handleMenuSelect}
        userName={userName}
        userAvatar={user?.avatar}
      >
        <Stack alignItems="center" justifyContent="center" sx={{ height: 384 }} spacing={2}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary">Đang tải...</Typography>
        </Stack>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout
      title="Chi tiết bài viết"
      description={blog?.code || 'Xem thông tin chi tiết bài viết'}
      menuItems={SCHOOL_ADMIN_MENU_ITEMS}
      activeKey="blogs"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {blog ? (
        <Stack spacing={3}>
          {/* Header row */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              variant="text"
              color="inherit"
              sx={{ textTransform: 'none', fontWeight: 500, color: 'text.secondary' }}
            >
              Quay lại danh sách
            </Button>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
              >
                Sửa
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setConfirmDelete(true)}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
              >
                Xóa
              </Button>
            </Stack>
          </Stack>

          {/* Basic info */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8 }}>
                  Tiêu đề
                </Typography>
                <Typography variant="h6" fontWeight={700} mt={0.5} sx={{ fontFamily: 'monospace' }}>
                  {blog.code}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8 }}>
                  Danh mục
                </Typography>
                <Typography variant="h6" fontWeight={600} mt={0.5}>
                  {blog.category?.name || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8 }}>
                  Trạng thái
                </Typography>
                <Box mt={0.75}>
                  <Chip
                    label={STATUS_DISPLAY[blog.status]?.label || blog.status}
                    color={STATUS_DISPLAY[blog.status]?.color || 'default'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8 }}>
                  Tác giả
                </Typography>
                <Typography variant="h6" fontWeight={600} mt={0.5}>
                  {blog.author?.fullName || blog.author?.username || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8 }}>
                  Ngày tạo
                </Typography>
                <Typography variant="body2" mt={0.5}>{formatDate(blog.createdAt)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8 }}>
                  Ngày cập nhật
                </Typography>
                <Typography variant="body2" mt={0.5}>{formatDate(blog.updatedAt)}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Nội dung */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8 }}>
              Nội dung
            </Typography>
            <Box
              className="ql-editor"
              dangerouslySetInnerHTML={{ __html: blog.description || '' }}
              sx={{
                mt: 1.5,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                fontSize: 14,
                lineHeight: 1.7,
                color: 'text.primary',
              }}
            />
          </Paper>

          {/* Tệp đính kèm */}
          {blog.attachmentUrl && (
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8 }}>
                Tệp đính kèm ({blog.attachmentType === 'pdf' ? 'PDF' : 'Word'})
              </Typography>
              <Box mt={1.5}>
                <Box
                  component="iframe"
                  src={
                    blog.attachmentType === 'pdf'
                      ? blog.attachmentUrl
                      : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(blog.attachmentUrl)}`
                  }
                  title={blog.attachmentType === 'pdf' ? 'PDF Viewer' : 'Word Viewer'}
                  sx={{
                    width: '100%',
                    height: { xs: 320, sm: 480, md: 600 },
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                  }}
                />
              </Box>
              <Button
                component="a"
                href={blog.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="text"
                sx={{ mt: 1.5, textTransform: 'none', fontWeight: 500 }}
              >
                {blog.attachmentType === 'pdf' ? '📄' : '📝'} Tải xuống tệp {blog.attachmentType === 'pdf' ? 'PDF' : 'Word'}
              </Button>
            </Paper>
          )}

          {/* Hình ảnh */}
          {blog.images && blog.images.length > 0 && (
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8 }}>
                Danh sách hình ảnh ({blog.images.length})
              </Typography>

              {/* Main viewer */}
              <Box mt={2} mb={2}>
                {selectedImageIdx !== null ? (
                  <Box sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={blog.images[selectedImageIdx]}
                      alt={`Blog ${selectedImageIdx + 1}`}
                      sx={{
                        width: '100%',
                        maxHeight: 384,
                        objectFit: 'contain',
                        borderRadius: 1.5,
                        boxShadow: 2,
                        bgcolor: 'grey.50',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: 12,
                      }}
                    >
                      {selectedImageIdx + 1}/{blog.images.length}
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 8, left: 8 }}>
                      <Box
                        component="button"
                        onClick={() => setSelectedImageIdx(selectedImageIdx === 0 ? blog.images.length - 1 : selectedImageIdx - 1)}
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: 36,
                          height: 36,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                        }}
                      >
                        <PrevIcon />
                      </Box>
                      <Box
                        component="button"
                        onClick={() => setSelectedImageIdx((selectedImageIdx + 1) % blog.images.length)}
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: 36,
                          height: 36,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                        }}
                      >
                        <NextIcon />
                      </Box>
                    </Stack>
                  </Box>
                ) : (
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                      width: '100%',
                      height: 256,
                      bgcolor: 'grey.100',
                      borderRadius: 1.5,
                    }}
                  >
                    <Typography variant="body2" color="text.disabled">
                      Chọn ảnh từ danh sách bên dưới
                    </Typography>
                  </Stack>
                )}
              </Box>

              {/* Thumbnails */}
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Nhấp để xem
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
                {blog.images.map((url, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      border: '2px solid',
                      borderColor: selectedImageIdx === idx ? 'primary.main' : 'transparent',
                      transform: selectedImageIdx === idx ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.15s',
                      '&:hover': { transform: 'scale(1.05)' },
                    }}
                  >
                    <Box
                      component="img"
                      src={url}
                      alt={`Thumbnail ${idx + 1}`}
                      sx={{ width: 96, height: 96, objectFit: 'cover', display: 'block' }}
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      ) : (
        <Paper elevation={1} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Không tìm thấy bài viết
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            variant="text"
            sx={{ textTransform: 'none' }}
          >
            Quay lại danh sách
          </Button>
        </Paper>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn chắc chắn muốn xóa bài viết "${blog?.code}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
      />
    </RoleLayout>
  );
}

export default BlogDetail;
