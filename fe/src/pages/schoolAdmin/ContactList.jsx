import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  TextField,
  CircularProgress,
} from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import { get, ENDPOINTS } from '../../service/api';

function ContactList() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState(''); // '' | 'pending' | 'replied'
  const [replyingId, setReplyingId] = useState(null);
  const [replyMode, setReplyMode] = useState('create'); // 'create' | 'edit'
  const [replyText, setReplyText] = useState('');
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
      } catch (err) {
        toast.error(err?.message || 'Không tải được danh sách liên hệ.');
      }
    };
    fetchData();
  }, [navigate, user, isInitializing, filter]);

  const handleReply = (item) => {
    setReplyingId(item._id);
    setReplyMode('create');
    setReplyText(item.reply || '');
  };

  const handleEditReply = (item) => {
    setReplyingId(item._id);
    setReplyMode('edit');
    setReplyText(item.reply || '');
  };

  const handleCancelReply = () => {
    setReplyingId(null);
    setReplyMode('create');
    setReplyText('');
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi.');
      return;
    }
    try {
      setError(null);
      if (replyMode === 'edit') {
        // Backend hiện không cho reply khi đã replied, nên cần clear rồi reply lại.
        // replyContact sẽ tự gửi email phản hồi cho phụ huynh/khách.
        await clearReplyContact(replyingId);
        await replyContact(replyingId, replyText.trim());
        toast.success('Đã cập nhật phản hồi và gửi lại email thành công.');
      } else {
        await replyContact(replyingId, replyText.trim());
        toast.success('Đã phản hồi thành công.');
      }
      const params = filter ? { status: filter } : {};
      const response = await getContacts(params);
      setData(response);
      setReplyingId(null);
      setReplyMode('create');
      setReplyText('');
    } catch (err) {
      toast.error(
        err?.message ||
          (replyMode === 'edit' ? 'Cập nhật phản hồi thất bại.' : 'Phản hồi thất bại.')
      );
    }
  };

  const clearReplyConfirmed = async (contactId) => {
    try {
      setActioningId(contactId);
      setError(null);
      await clearReplyContact(contactId);
      toast.success('Đã xóa phản hồi.');
      const params = filter ? { status: filter } : {};
      const response = await getContacts(params);
      setData(response);
    } catch (err) {
      toast.error(err.message || 'Xóa phản hồi thất bại.');
    } finally {
      setActioningId(null);
      setConfirmClearId(null);
    }
  };

  const handleResendEmail = async (contactId) => {
    try {
      setActioningId(contactId);
      setError(null);
      await resendReplyEmail(contactId);
      toast.success('Đã gửi lại email phản hồi.');
    } catch (err) {
      toast.error(err.message || 'Gửi lại email thất bại.');
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
    { key: 'attendance', label: 'Quản lý điểm danh' },
  ];

  const handleMenuSelect = async (key) => {
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'academic-year-setup') {
      navigate('/school-admin/academic-years');
      return;
    }
    if (key === 'academic-curriculum') {
      navigate('/school-admin/curriculum');
      return;
    }
    if (key === 'academic-schedule') {
      navigate('/school-admin/timetable');
      return;
    }
    if (key === 'academic-report') {
      try {
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT);
        const yearId = resp?.status === 'success' ? resp?.data?._id : null;
        if (yearId) navigate(`/school-admin/academic-years/${yearId}/report`);
        else navigate('/school-admin/academic-years');
      } catch (_) {
        navigate('/school-admin/academic-years');
      }
      return;
    }
    if (key === 'academic-students') {
      navigate('/school-admin/class-list');
      return;
    }
    if (key === 'academic-plan' || key === 'classes') {
      navigate('/school-admin/classes');
      return;
    }
    if (key === 'menu') {
      navigate('/school-admin/menus');
      return;
    }
    if (key === 'meal-management') {
      navigate('/school-admin/meal-management');
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

      {/* Filter bar */}
      <Paper elevation={0} sx={{ mb: 3, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'inline-flex', gap: 1 }}>
        {[
          { value: '', label: 'Tất cả' },
          { value: 'pending', label: 'Chưa phản hồi' },
          { value: 'replied', label: 'Đã phản hồi' },
        ].map((opt) => (
          <Button
            key={opt.value}
            size="small"
            variant={filter === opt.value ? 'contained' : 'text'}
            onClick={() => setFilter(opt.value)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: filter === opt.value ? 700 : 400,
              px: 2,
            }}
          >
            {opt.label}
          </Button>
        ))}
      </Paper>

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
                            variant="outlined"
                            color="primary"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditReply(item)}
                            disabled={actioningId === item._id}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                          >
                            Sửa phản hồi
                          </Button>
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
                      {replyMode === 'edit' ? 'Chỉnh sửa phản hồi' : 'Nội dung phản hồi'}
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
                        {replyMode === 'edit' ? 'Lưu & gửi lại email' : 'Gửi phản hồi'}
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
