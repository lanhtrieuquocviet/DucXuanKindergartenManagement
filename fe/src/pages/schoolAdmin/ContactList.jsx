import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  Chip,
  TextField,
  CircularProgress,
} from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

function ContactList() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState(''); // '' | 'pending' | 'replied'
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [message, setMessage] = useState({ type: null, text: null });
  const [confirmClearId, setConfirmClearId] = useState(null);
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const {
    getContacts,
    replyContact,
    clearReplyContact,
    resendReplyEmail,
    loading,
    error,
    setError,
  } = useSchoolAdmin();
  const [actioningId, setActioningId] = useState(null); // id đang xóa hoặc gửi lại email

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

    const fetchData = async () => {
      try {
        const params = filter ? { status: filter } : {};
        const response = await getContacts(params);
        setData(response);
      } catch (_) {}
    };
    fetchData();
  }, [navigate, user, isInitializing, filter]);

  const handleReply = (item) => {
    setReplyingId(item._id);
    setReplyText(item.reply || '');
  };

  const handleCancelReply = () => {
    setReplyingId(null);
    setReplyText('');
    setMessage({ type: null, text: null });
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập nội dung phản hồi.' });
      return;
    }
    try {
      setError(null);
      setMessage({ type: null, text: null });
      await replyContact(replyingId, replyText.trim());
      setMessage({ type: 'success', text: 'Đã phản hồi thành công.' });
      const params = filter ? { status: filter } : {};
      const response = await getContacts(params);
      setData(response);
      setReplyingId(null);
      setReplyText('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Phản hồi thất bại.' });
    }
  };

  const clearReplyConfirmed = async (contactId) => {
    try {
      setActioningId(contactId);
      setError(null);
      setMessage({ type: null, text: null });
      await clearReplyContact(contactId);
      setMessage({ type: 'success', text: 'Đã xóa phản hồi.' });
      const params = filter ? { status: filter } : {};
      const response = await getContacts(params);
      setData(response);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Xóa phản hồi thất bại.' });
    } finally {
      setActioningId(null);
      setConfirmClearId(null);
    }
  };

  const handleResendEmail = async (contactId) => {
    try {
      setActioningId(contactId);
      setError(null);
      setMessage({ type: null, text: null });
      await resendReplyEmail(contactId);
      setMessage({ type: 'success', text: 'Đã gửi lại email phản hồi.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gửi lại email thất bại.' });
    } finally {
      setActioningId(null);
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
        { key: 'academic-students', label: 'Danh sách trẻ' },
        { key: 'academic-curriculum', label: 'Chương trình giáo dục' },
        { key: 'academic-schedule', label: 'Thời khóa biểu' },
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

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'academic-year-setup') {
      navigate('/school-admin/academic-years');
      return;
    }
    if (key === 'academic-plan' || key === 'classes') {
      navigate('/school-admin/classes');
      return;
    }
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
    if (key === 'documents') {
      navigate('/school-admin/documents');
      return;
    }
    if (key === 'public-info') {
      navigate('/school-admin/public-info');
      return;
    }
    if (key === 'attendance') {
      navigate('/school-admin/attendance/overview');
      return;
    }
  };

  const userName = user?.fullName || user?.username || 'School Admin';
  const contacts = data?.data?.contacts || [];
  const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

  return (
    <RoleLayout
      title="Quản lý liên hệ"
      description="Xem và phản hồi các liên hệ từ phụ huynh/khách."
      menuItems={menuItems}
      activeKey="contacts"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {/* Page header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          borderRadius: 3,
          px: 4,
          py: 3,
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700} color="white">
          Quản lý liên hệ
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
          Xem và phản hồi các liên hệ từ phụ huynh / khách.
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {message.text && (
        <Alert severity={message.type === 'success' ? 'success' : 'error'} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* Filter bar */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={500} color="text.secondary">
          Lọc:
        </Typography>
        <Button
          size="small"
          variant={!filter ? 'contained' : 'outlined'}
          onClick={() => setFilter('')}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Tất cả
        </Button>
        <Button
          size="small"
          variant={filter === 'pending' ? 'contained' : 'outlined'}
          onClick={() => setFilter('pending')}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Chưa phản hồi
        </Button>
        <Button
          size="small"
          variant={filter === 'replied' ? 'contained' : 'outlined'}
          onClick={() => setFilter('replied')}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Đã phản hồi
        </Button>
      </Stack>

      {/* Contact list */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading && (
          <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Đang tải...
            </Typography>
          </Box>
        )}

        {!loading && contacts.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Chưa có liên hệ nào.
            </Typography>
          </Box>
        )}

        {!loading && contacts.length > 0 && (
          <Box>
            {contacts.map((item, index) => (
              <Box
                key={item._id}
                sx={{
                  p: 3,
                  borderBottom: index < contacts.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'grey.50' },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  {/* Contact info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                        {item.fullName}
                      </Typography>
                      <Chip
                        label={item.status === 'replied' ? 'Đã phản hồi' : 'Chưa phản hồi'}
                        size="small"
                        color={item.status === 'replied' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                      {item.email}
                      {item.phone && ` • ${item.phone}`}
                    </Typography>

                    {item.address && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                        Địa chỉ: {item.address}
                      </Typography>
                    )}

                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                    >
                      {item.content}
                    </Typography>

                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                      Gửi lúc: {formatDate(item.createdAt)}
                    </Typography>

                    {/* Replied block */}
                    {item.status === 'replied' && (
                      <Paper
                        variant="outlined"
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: 'success.50',
                          borderColor: 'success.200',
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color="success.dark"
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          Phản hồi:
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {item.reply}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {formatDate(item.repliedAt)}
                          {item.repliedBy?.fullName && ` • ${item.repliedBy.fullName}`}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<SendIcon />}
                            onClick={() => handleResendEmail(item._id)}
                            disabled={actioningId === item._id}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                          >
                            {actioningId === item._id ? 'Đang gửi...' : 'Gửi lại email'}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => setConfirmClearId(item._id)}
                            disabled={actioningId === item._id}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                          >
                            Xóa phản hồi
                          </Button>
                        </Stack>
                      </Paper>
                    )}
                  </Box>

                  {/* Reply button for pending */}
                  <Box sx={{ flexShrink: 0 }}>
                    {item.status === 'pending' && replyingId !== item._id && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<ReplyIcon />}
                        onClick={() => handleReply(item)}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        Phản hồi
                      </Button>
                    )}
                  </Box>
                </Stack>

                {/* Inline reply form */}
                {replyingId === item._id && (
                  <Paper
                    variant="outlined"
                    sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}
                  >
                    <Typography variant="body2" fontWeight={500} color="text.primary" sx={{ mb: 1 }}>
                      Nội dung phản hồi
                    </Typography>
                    <TextField
                      multiline
                      rows={4}
                      fullWidth
                      size="small"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Nhập nội dung phản hồi..."
                      sx={{ mb: 1.5 }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={handleSubmitReply}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        Gửi phản hồi
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        onClick={handleCancelReply}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        Hủy
                      </Button>
                    </Stack>
                  </Paper>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <ConfirmDialog
        open={!!confirmClearId}
        title="Xác nhận xóa phản hồi"
        message="Bạn có chắc muốn xóa phản hồi này? Liên hệ sẽ chuyển về trạng thái chưa phản hồi."
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={() => clearReplyConfirmed(confirmClearId)}
        onCancel={() => setConfirmClearId(null)}
      />
    </RoleLayout>
  );
}

export default ContactList;
