import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { get, del, ENDPOINTS } from '../../service/api';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';

const STATUS_DISPLAY = {
  draft: { label: 'Nháp', color: 'warning' },
  published: { label: 'Đã xuất bản', color: 'success' },
  inactive: { label: 'Ngưng hiển thị', color: 'default' },
};

function DocumentDetail() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
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

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setLocalError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      return;
    }
  }, [navigate, user, isInitializing]);

  // load document
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setLoading(true);
        setLocalError(null);
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.DOCUMENT_DETAIL(documentId));
        if (resp.status === 'success' && resp.data) {
          setDocument(resp.data);
        } else {
          setLocalError('Không tìm thấy tài liệu');
        }
      } catch (err) {
        setLocalError(err.message || 'Lỗi khi tải tài liệu');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDoc();
    }
  }, [documentId]);

  const handleBack = () => {
    navigate('/school-admin/documents');
  };

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'classes') {
      navigate('/school-admin/classes');
      return;
    }
    if (key === 'teachers') { navigate('/school-admin/teachers'); return; }
    if (key === 'contacts') {
      navigate('/school-admin/contacts');
      return;
    }
    if (key === 'qa') {
      navigate('/school-admin/qa');
      return;
    }
    if (key === 'blogs') {
      navigate('/school-admin/blogs');
      return;
    }
    if (key === 'attendance') {
      navigate('/school-admin/attendance/overview');
      return;
    }
    if (key === 'documents') {
      navigate('/school-admin/documents');
      return;
    }
    if (key === 'public-info') {
      navigate('/school-admin/public-info');
      return;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await del(ENDPOINTS.SCHOOL_ADMIN.DOCUMENT_DETAIL(documentId));
      navigate('/school-admin/documents', { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Xóa tài liệu thất bại');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <RoleLayout
        title="Chi tiết tài liệu"
        menuItems={menuItems}
        activeKey="documents"
        onMenuSelect={handleMenuSelect}
        onLogout={handleLogout}
        onViewProfile={handleViewProfile}
        userName={user?.fullName || user?.username}
        userAvatar={user?.avatar}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 384 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">Đang tải...</Typography>
          </Stack>
        </Box>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout
      title="Chi tiết tài liệu"
      description={document?.title || 'Xem thông tin chi tiết tài liệu'}
      menuItems={menuItems}
      activeKey="documents"
      onMenuSelect={handleMenuSelect}
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      userName={user?.fullName || user?.username}
      userAvatar={user?.avatar}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {document ? (
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              variant="text"
              sx={{ color: 'text.secondary', fontWeight: 500 }}
            >
              Quay lại danh sách
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDelete(true)}
              variant="contained"
              color="error"
              sx={{ fontWeight: 600 }}
            >
              Xóa
            </Button>
          </Box>

          {/* Basic info */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Tiêu đề
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700, mt: 0.5 }}>
                  {document.title}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Trạng thái
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={STATUS_DISPLAY[document.status]?.label || document.status}
                    color={STATUS_DISPLAY[document.status]?.color || 'default'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Tác giả
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {document.author?.fullName || document.author?.username || '-'}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Ngày tạo
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.5 }}>
                  {formatDate(document.createdAt)}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Ngày cập nhật
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.5 }}>
                  {formatDate(document.updatedAt)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Description */}
          {document.description && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 2 }}
              >
                Nội dung
              </Typography>
              <Box
                sx={{
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  p: 2,
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  lineHeight: 1.75,
                }}
                className="ql-editor"
                dangerouslySetInnerHTML={{ __html: document.description }}
              />
            </Paper>
          )}

          {/* Attachment */}
          {document.attachmentUrl && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 2 }}
              >
                Tệp đính kèm ({document.attachmentType === 'pdf' ? 'PDF' : 'Word'})
              </Typography>

              <Box sx={{ mb: 2 }}>
                {document.attachmentType === 'pdf' ? (
                  <Box
                    component="iframe"
                    src={document.attachmentUrl}
                    sx={{ width: '100%', height: 600, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}
                    title="PDF Viewer"
                  />
                ) : (
                  <Box
                    component="iframe"
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(document.attachmentUrl)}`}
                    sx={{ width: '100%', height: 600, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}
                    title="Word Viewer"
                  />
                )}
              </Box>

              <Button
                component="a"
                href={document.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={document.attachmentType === 'pdf' ? <PictureAsPdfIcon /> : <DescriptionIcon />}
                variant="text"
                sx={{ fontWeight: 500, color: 'primary.main' }}
              >
                Tải xuống tệp {document.attachmentType === 'pdf' ? 'PDF' : 'Word'}
              </Button>
            </Paper>
          )}
        </Stack>
      ) : (
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Không tìm thấy tài liệu
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            variant="text"
            sx={{ fontWeight: 500 }}
          >
            Quay lại danh sách
          </Button>
        </Paper>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn chắc chắn muốn xóa tài liệu "${document?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
      />
    </RoleLayout>
  );
}

export default DocumentDetail;
