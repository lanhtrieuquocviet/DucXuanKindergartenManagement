import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, post, patch, del, ENDPOINTS } from '../../service/api';
import { toast } from 'react-toastify';


function formatMonthQuarter(value) {
  if (!value || typeof value !== 'string') return '';
  const v = value.trim();
  if (!v) return '';
  if (/^Tháng\s+/i.test(v)) return v;
  return `Tháng ${v}`;
}

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
  { key: 'menu', label: 'Quản lý thực đơn' },
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

function CurriculumTopicCard({ topic, onEdit, onDelete }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Thanh dọc tím bên trái + header tím */}
      <Box sx={{ display: 'flex', minHeight: 1 }}>
        <Box
          sx={{
            width: 6,
            minHeight: 120,
            backgroundColor: '#7c3aed',
            borderRadius: '6px 0 0 0',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#7c3aed',
              border: '2px solid white',
              boxShadow: 1,
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          {/* Header card - nền tím */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              px: 2.5,
              py: 2,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {formatMonthQuarter(topic.monthQuarter)}
                {topic.monthQuarter ? ': ' : ''}
                {topic.topicName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5 }}>
                Lĩnh vực chính: {topic.mainField}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                onClick={() => onEdit(topic)}
                sx={{
                  bgcolor: 'rgba(234, 179, 8, 0.9)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgb(202, 138, 4)' },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onDelete(topic)}
                sx={{
                  bgcolor: 'rgba(239, 68, 68, 0.9)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgb(185, 28, 28)' },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
          {/* Nội dung trắng */}
          <Box sx={{ p: 2.5, backgroundColor: 'white' }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
              Mục tiêu chính
            </Typography>
            <Box
              component="pre"
              sx={{
                m: 0,
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 80,
                overflow: 'auto',
                p: 1.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: '#fafafa',
              }}
            >
              {topic.mainObjectives || '—'}
            </Box>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mt: 2 }} gutterBottom>
              Hoạt động nổi bật
            </Typography>
            <Box
              component="pre"
              sx={{
                m: 0,
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 80,
                overflow: 'auto',
                p: 1.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: '#fafafa',
              }}
            >
              {topic.featuredActivities || '—'}
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

export default function CurriculumPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [academicYear, setAcademicYear] = useState(null);
  const [loadingYear, setLoadingYear] = useState(true);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [form, setForm] = useState({
    monthQuarter: '',
    topicName: '',
    mainField: '',
    mainObjectives: '',
    featuredActivities: '',
  });

  const fetchTopics = async (yearId) => {
    if (!yearId) {
      setTopics([]);
      return;
    }
    try {
      setLoadingTopics(true);
      const resp = await get(ENDPOINTS.SCHOOL_ADMIN.CURRICULUM.LIST(yearId));
      if (resp?.status === 'success' && Array.isArray(resp.data)) {
        setTopics(resp.data);
      } else {
        setTopics([]);
      }
    } catch (err) {
      setTopics([]);
      toast.error(err?.message || 'Không tải được danh sách chủ đề');
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'academic-years' || key === 'academic-year-setup') {
      navigate('/school-admin/academic-years');
      return;
    }
    if (key === 'academic-plan') navigate('/school-admin/academic-plan');
    else if (key === 'academic-students') navigate('/school-admin/students');
    else if (key === 'classes') navigate('/school-admin/classes');
    else if (key === 'menu') navigate('/school-admin/menus');
    else if (key === 'students') navigate('/school-admin/students');
    else if (key === 'contacts') navigate('/school-admin/contacts');
    else if (key === 'qa') navigate('/school-admin/qa');
    else if (key === 'blogs') navigate('/school-admin/blogs');
    else if (key === 'documents') navigate('/school-admin/documents');
    else if (key === 'public-info') navigate('/school-admin/public-info');
    else if (key === 'attendance') navigate('/school-admin/attendance/overview');
  };

  useEffect(() => {
    const fetchCurrentYear = async () => {
      try {
        setLoadingYear(true);
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT);
        if (resp?.status === 'success' && resp.data) {
          setAcademicYear(resp.data);
        } else {
          setAcademicYear(null);
        }
      } catch (err) {
        setAcademicYear(null);
      } finally {
        setLoadingYear(false);
      }
    };
    fetchCurrentYear();
  }, []);

  useEffect(() => {
    if (academicYear?._id) {
      fetchTopics(academicYear._id);
    } else if (!loadingYear) {
      setTopics([]);
    }
  }, [academicYear?._id, loadingYear]);

  const yearName = academicYear?.yearName || 'Năm học';
  const breadcrumb = 'MamNon DX → Ban Giám hiệu → Chương trình giáo dục';

  const filteredTopics = topics.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.monthQuarter && t.monthQuarter.toLowerCase().includes(q)) ||
      (t.topicName && t.topicName.toLowerCase().includes(q)) ||
      (t.mainField && t.mainField.toLowerCase().includes(q))
    );
  });

  const openAddModal = () => {
    setEditingTopic(null);
    setForm({
      monthQuarter: '',
      topicName: '',
      mainField: '',
      mainObjectives: '',
      featuredActivities: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (topic) => {
    setEditingTopic(topic);
    setForm({
      monthQuarter: topic.monthQuarter || '',
      topicName: topic.topicName || '',
      mainField: topic.mainField || '',
      mainObjectives: topic.mainObjectives || '',
      featuredActivities: topic.featuredActivities || '',
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTopic(null);
  };

  const handleSaveTopic = async () => {
    if (!academicYear?._id && !editingTopic) {
      toast.error('Chưa có năm học đang hoạt động. Vui lòng tạo năm học trước.');
      return;
    }
    try {
      setSaving(true);
      if (editingTopic) {
        const resp = await patch(ENDPOINTS.SCHOOL_ADMIN.CURRICULUM.UPDATE(editingTopic._id), {
          monthQuarter: form.monthQuarter.trim(),
          topicName: form.topicName.trim(),
          mainField: form.mainField.trim(),
          mainObjectives: form.mainObjectives.trim(),
          featuredActivities: form.featuredActivities.trim(),
        });
        if (resp?.status === 'success' && resp.data) {
          setTopics((prev) => prev.map((t) => (t._id === editingTopic._id ? resp.data : t)));
          toast.success('Đã cập nhật chủ đề');
          handleCloseModal();
        }
      } else {
        const resp = await post(ENDPOINTS.SCHOOL_ADMIN.CURRICULUM.CREATE, {
          academicYearId: academicYear._id,
          monthQuarter: form.monthQuarter.trim(),
          topicName: form.topicName.trim(),
          mainField: form.mainField.trim(),
          mainObjectives: form.mainObjectives.trim(),
          featuredActivities: form.featuredActivities.trim(),
        });
        if (resp?.status === 'success' && resp.data) {
          setTopics((prev) => [resp.data, ...prev]);
          toast.success('Đã thêm chủ đề mới');
          handleCloseModal();
        }
      }
    } catch (err) {
      toast.error(err?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = async (topic) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chủ đề "${topic.topicName}"?`)) return;
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.CURRICULUM.DELETE(topic._id));
      setTopics((prev) => prev.filter((t) => t._id !== topic._id));
      toast.success('Đã xóa chủ đề');
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại');
    }
  };

  const userName = user?.fullName || user?.username || 'School Admin';

  return (
    <RoleLayout
      title={`Chương trình giáo dục - ${yearName}`}
      description="Quản lý các chủ đề và mục tiêu giáo dục theo tháng. Bạn có thể thêm, sửa, xóa tự do."
      menuItems={menuItems}
      activeKey="academic-curriculum"
      onLogout={handleLogout}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      <Stack spacing={3}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
          {breadcrumb}
        </Typography>

        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
            Chương trình giáo dục - {yearName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý các chủ đề và mục tiêu giáo dục theo tháng. Bạn có thể thêm, sửa, xóa tự do.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <TextField
            placeholder="Tìm theo chủ đề, tháng, lĩnh vực phát triển..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flex: 1,
              maxWidth: 400,
              '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: 'white' },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddModal}
            disabled={!academicYear}
            sx={{
              bgcolor: '#22c55e',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              px: 2.5,
              '&:hover': { bgcolor: '#16a34a' },
            }}
          >
            Thêm chủ đề mới
          </Button>
        </Stack>

        {loadingYear && (
          <Typography variant="body2" color="text.secondary">
            Đang tải thông tin năm học...
          </Typography>
        )}

        {loadingTopics && (
          <Typography variant="body2" color="text.secondary">
            Đang tải danh sách chủ đề...
          </Typography>
        )}

        <Stack spacing={2}>
          {filteredTopics.map((topic) => (
            <CurriculumTopicCard
              key={topic._id}
              topic={topic}
              onEdit={openEditModal}
              onDelete={handleDeleteTopic}
            />
          ))}
          {!academicYear && !loadingYear && (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Typography color="text.secondary">
                Chưa có năm học đang hoạt động. Vui lòng tạo năm học trước (Quản lý năm học).
              </Typography>
            </Paper>
          )}
          {academicYear && filteredTopics.length === 0 && !loadingTopics && (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Typography color="text.secondary">
                Chưa có chủ đề nào. Nhấn &quot;Thêm chủ đề mới&quot; để tạo.
              </Typography>
            </Paper>
          )}
        </Stack>
      </Stack>

      {/* Modal Thêm/Sửa chủ đề */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: '1.25rem',
            color: '#7c3aed',
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 2,
          }}
        >
          {editingTopic ? 'Chỉnh sửa chủ đề' : 'Thêm chủ đề mới'}
        </DialogTitle>
        <IconButton
          onClick={handleCloseModal}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Tháng / Năm"
              placeholder="Ví dụ: Tháng 9/2025"
              fullWidth
              size="small"
              value={form.monthQuarter}
              onChange={(e) => setForm((f) => ({ ...f, monthQuarter: e.target.value }))}
            />
            <TextField
              label="Tên chủ đề"
              placeholder="Ví dụ: Chào đón năm học mới"
              fullWidth
              size="small"
              value={form.topicName}
              onChange={(e) => setForm((f) => ({ ...f, topicName: e.target.value }))}
            />
            <TextField
              label="Lĩnh vực phát triển chính"
              placeholder="Ví dụ: Xã hội - Cảm xúc & Thể chất"
              fullWidth
              size="small"
              value={form.mainField}
              onChange={(e) => setForm((f) => ({ ...f, mainField: e.target.value }))}
            />
            <TextField
              label="Mục tiêu chính"
              placeholder="Mục tiêu chi tiết..."
              fullWidth
              multiline
              minRows={4}
              value={form.mainObjectives}
              onChange={(e) => setForm((f) => ({ ...f, mainObjectives: e.target.value }))}
            />
            <TextField
              label="Hoạt động nổi bật"
              placeholder="Danh sách hoạt động..."
              fullWidth
              multiline
              minRows={4}
              value={form.featuredActivities}
              onChange={(e) => setForm((f) => ({ ...f, featuredActivities: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseModal} disabled={saving} sx={{ textTransform: 'none' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveTopic}
            disabled={saving}
            sx={{
              bgcolor: '#7c3aed',
              textTransform: 'none',
              '&:hover': { bgcolor: '#6d28d9' },
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}
