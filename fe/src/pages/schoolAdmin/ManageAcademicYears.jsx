import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { get, post, patch, ENDPOINTS } from '../../service/api';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormHelperText,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Archive as ArchiveIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
}

function ManageAcademicYears() {
  const [currentYear, setCurrentYear] = useState(null);
  const [years, setYears] = useState([]);
  const [archiveYear, setArchiveYear] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    termCount: '',
    description: '',
  });
  const [createErrors, setCreateErrors] = useState({});

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
    {
      key: 'academic-years',
      label: 'Quản lý năm học',
      children: [
        { key: 'academic-year-setup', label: 'Thiết lập năm học' },
        { key: 'academic-plan', label: 'Thiết lập kế hoạch' },
        { key: 'academic-students', label: 'Danh sách lớp học' },
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

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleViewProfile = () => {
    navigate('/profile');
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
    if (key === 'academic-plan') {
      navigate('/school-admin/academic-plan');
      return;
    }
    if (key === 'academic-students') {
      navigate('/school-admin/class-list');
      return;
    }
    if (key === 'classes') {
      navigate('/school-admin/classes');
      return;
    }
    if (key === 'menu') {
      navigate('/school-admin/menus');
      return;
    }
    if (key === 'students') {
      navigate('/school-admin/students');
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
    if (key === 'academic-curriculum') {
      navigate('/school-admin/curriculum');
      return;
    }
    if (key === 'academic-schedule') {
      navigate('/school-admin/timetable');
      return;
    }
  };

  const userName = user?.fullName || user?.username || 'School Admin';
  const canCreateNewYear = !currentYear || currentYear.status !== 'active';

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const [currentResp, listResp] = await Promise.all([
          get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT),
          get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.LIST),
        ]);

        if (currentResp?.status === 'success') {
          setCurrentYear(currentResp.data || null);
        }

        if (listResp?.status === 'success') {
          const list = Array.isArray(listResp.data) ? listResp.data : [];
          setYears(list);
          if (!archiveYear && list.length > 0) {
            const inactive = list.find((y) => y.status !== 'active');
            setArchiveYear(inactive?._id || list[0]._id);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching academic years:', error);
      }
    };

    fetchYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenCreate = () => {
    if (!canCreateNewYear) return;
    setCreateForm({
      name: '',
      startDate: '',
      endDate: '',
      termCount: '',
      description: '',
    });
    setCreateErrors({});
    setOpenCreate(true);
  };

  const handleSubmitCreate = () => {
    if (!canCreateNewYear) return;

    const errors = {};
    if (!createForm.name.trim()) errors.name = 'Vui lòng nhập tên năm học';
    if (!createForm.startDate) errors.startDate = 'Vui lòng chọn ngày bắt đầu';
    if (!createForm.endDate) errors.endDate = 'Vui lòng chọn ngày kết thúc';
    if (!createForm.termCount) errors.termCount = 'Vui lòng chọn số lượng kỳ/học kỳ';

    if (createForm.startDate && createForm.endDate) {
      const start = new Date(createForm.startDate);
      const end = new Date(createForm.endDate);
      if (start >= end) {
        errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }

    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      yearName: createForm.name.trim(),
      startDate: createForm.startDate,
      endDate: createForm.endDate,
      termCount: Number(createForm.termCount) || 0,
      description: createForm.description,
    };

    post(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CREATE, payload)
      .then((resp) => {
        if (resp?.status === 'success') {
          const newYear = resp.data;
          setCurrentYear(newYear);
          setYears((prev) => [newYear, ...prev]);
          setOpenCreate(false);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error creating academic year:', error);
        setCreateErrors((prev) => ({
          ...prev,
          api: error.message || 'Không thể tạo năm học mới',
        }));
      });
  };

  const handleFinishYear = () => {
    if (!currentYear || currentYear.status !== 'active') return;

    patch(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.FINISH(currentYear._id), {})
      .then((resp) => {
        if (resp?.status === 'success') {
          const updated = resp.data;
          setCurrentYear(updated);
          setYears((prev) =>
            prev.map((y) => (y._id === updated._id ? updated : y)),
          );
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error finishing academic year:', error);
      });
  };

  const handleSearchHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistory([]);

      let endpoint = ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.HISTORY;
      if (archiveYear) {
        const params = new URLSearchParams();
        params.set('yearId', archiveYear);
        endpoint = `${endpoint}?${params.toString()}`;
      }

      const resp = await get(endpoint);
      if (resp?.status === 'success' && Array.isArray(resp.data)) {
        setHistory(resp.data);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading academic year history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <RoleLayout
      title="Thiết lập Năm học"
      description="Tổng quan năm học đang hoạt động, và tra cứu lịch sử các năm học trước."
      menuItems={menuItems}
      activeKey="academic-year-setup"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8 }}>
                MamNon DX &gt; Ban Giám Hiệu &gt; Thiết lập Năm học
              </Typography>
              <Typography variant="h6" fontWeight={700} mt={0.5}>
                {currentYear?.yearName || 'Chưa có năm học đang hoạt động'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }} mt={0.5}>
                Tổng quan năm học đang hoạt động. Bạn có thể thiết lập kế hoạch chi tiết ở các menu bên trái.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                bgcolor: 'white',
                color: '#4f46e5',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: '#e5e7ff',
                },
              }}
              disabled={!canCreateNewYear}
              onClick={handleOpenCreate}
            >
              Tạo năm học mới
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={1}
          sx={{
            p: 3,
            borderRadius: 2,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <CalendarIcon />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Năm học hiện tại
              </Typography>
              <Typography variant="h6" fontWeight={700} color="text.primary" mt={0.5}>
                {currentYear?.yearName || 'Chưa có năm học đang hoạt động'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {currentYear
                  ? `Bắt đầu: ${formatDate(currentYear.startDate)} – Kết thúc: ${formatDate(
                      currentYear.endDate,
                    )}`
                  : 'Chưa thiết lập thời gian năm học'}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={currentYear?.status === 'active' ? 'Đang hoạt động' : 'Đã kết thúc'}
              color={currentYear?.status === 'active' ? 'success' : 'default'}
              sx={{
                fontWeight: 600,
              }}
            />
            <Button
              variant="outlined"
              color="error"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
              disabled={!currentYear || currentYear.status !== 'active'}
              onClick={handleFinishYear}
            >
              Kết thúc năm học
            </Button>
          </Stack>
        </Paper>

        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <ArchiveIcon sx={{ color: '#6b7280' }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Lưu trữ &amp; Lịch sử năm học
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tra cứu dữ liệu cũ hoặc phân tích xu hướng phát triển qua các năm học.
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Năm học</InputLabel>
              <Select
                label="Năm học"
                value={archiveYear}
                onChange={(e) => setArchiveYear(e.target.value)}
              >
                {years
                  .filter((y) => y.status !== 'active')
                  .map((y) => (
                    <MenuItem key={y._id} value={y._id}>
                      {y.yearName} (đã kết thúc)
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              sx={{
                bgcolor: '#6366f1',
                '&:hover': { bgcolor: '#4f46e5' },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
              }}
              onClick={handleSearchHistory}
            >
              Tra cứu
            </Button>
            <Box sx={{ flexGrow: 1 }} />
          </Stack>

          {historyLoading && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Đang tải kết quả tra cứu...
              </Typography>
            </Box>
          )}

          {!historyLoading && history.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Kết quả tìm kiếm
              </Typography>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems="stretch"
              >
                {history.map((item) => (
                  <Paper
                    key={item._id}
                    elevation={0}
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      p: 2.5,
                      backgroundColor: 'grey.50',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      {item.yearName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Thời gian: {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </Typography>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Số lớp / Số trẻ
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {item.classCount} lớp | {item.studentCount} trẻ
                        </Typography>
                      </Stack>
                    </Stack>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2,
                          bgcolor: '#e0f2fe',
                          color: '#0369a1',
                          '&:hover': { bgcolor: '#bae6fd' },
                        }}
                        onClick={() => navigate(`/school-admin/academic-years/${item._id}`)}
                      >
                        Tra cứu chi tiết năm học
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Dialog tạo năm học mới */}
        <Dialog
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{
              pb: 2,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AddIcon fontSize="small" />
              </Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Tạo năm học mới
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2 }} dividers>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="primary" fontWeight={700} gutterBottom>
                  Thông tin năm học
                </Typography>
                <TextField
                  label="Tên năm học *"
                  placeholder="Ví dụ: 2025 – 2026"
                  fullWidth
                  size="small"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  error={!!createErrors.name}
                  helperText={createErrors.name}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="primary" fontWeight={700} gutterBottom>
                  Thời gian &amp; Cấu trúc kỳ
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Ngày bắt đầu *"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                    value={createForm.startDate}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    error={!!createErrors.startDate}
                    helperText={createErrors.startDate}
                  />
                  <TextField
                    label="Ngày kết thúc *"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                    value={createForm.endDate}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    error={!!createErrors.endDate}
                    helperText={createErrors.endDate}
                  />
                </Stack>

                <FormControl
                  size="small"
                  sx={{ mt: 2, minWidth: 200 }}
                  error={!!createErrors.termCount}
                >
                  <InputLabel>Số lượng kỳ/học kỳ *</InputLabel>
                  <Select
                    label="Số lượng kỳ/học kỳ *"
                    value={createForm.termCount}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, termCount: e.target.value }))
                    }
                  >
                    <MenuItem value={1}>1 kỳ</MenuItem>
                    <MenuItem value={2}>2 kỳ</MenuItem>
                    <MenuItem value={3}>3 kỳ</MenuItem>
                  </Select>
                  {createErrors.termCount && (
                    <FormHelperText>{createErrors.termCount}</FormHelperText>
                  )}
                </FormControl>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="primary" fontWeight={700} gutterBottom>
                  Kế hoạch tổng thể (có thể bổ sung sau)
                </Typography>
                <TextField
                  label="Mô tả ngắn gọn / Mục tiêu năm học"
                  placeholder="Ví dụ: Tập trung phát triển kỹ năng mềm, tăng cường hoạt động ngoại khóa, đảm bảo dinh dưỡng..."
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenCreate(false)}>Hủy</Button>
            <Button
              variant="contained"
              onClick={handleSubmitCreate}
              disabled={!canCreateNewYear}
              sx={{
                bgcolor: '#6366f1',
                '&:hover': { bgcolor: '#4f46e5' },
              }}
            >
              Tạo năm học
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </RoleLayout>
  );
}

export default ManageAcademicYears;

