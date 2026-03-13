import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, ENDPOINTS } from '../../service/api';

function formatDateInput(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function getMonthsBetween(startDate, endDate) {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const months = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    const month = current.getMonth() + 1;
    const year = current.getFullYear();
    months.push({
      key: `${year}-${month.toString().padStart(2, '0')}`,
      month,
      year,
    });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

export default function AcademicYearPlan() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [currentYear, setCurrentYear] = useState(null);
  const [loadingYear, setLoadingYear] = useState(false);
  const [eventsByMonth, setEventsByMonth] = useState({});

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

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'academic-years' || key === 'academic-year-setup') {
      navigate('/school-admin/academic-years');
      return;
    }
    if (key === 'academic-curriculum') {
      navigate('/school-admin/curriculum');
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
  };

  useEffect(() => {
    const loadCurrentYear = async () => {
      try {
        setLoadingYear(true);
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT);
        if (resp?.status === 'success' && resp.data) {
          setCurrentYear(resp.data);
        } else {
          setCurrentYear(null);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading current academic year:', error);
        setCurrentYear(null);
      } finally {
        setLoadingYear(false);
      }
    };

    loadCurrentYear();
  }, []);

  const months = useMemo(
    () => (currentYear ? getMonthsBetween(currentYear.startDate, currentYear.endDate) : []),
    [currentYear],
  );

  const handleAddEvent = (monthKey) => {
    setEventsByMonth((prev) => {
      const events = prev[monthKey] || [];
      return {
        ...prev,
        [monthKey]: [...events, { id: Date.now(), text: '' }],
      };
    });
  };

  const handleChangeEvent = (monthKey, id, text) => {
    setEventsByMonth((prev) => {
      const events = prev[monthKey] || [];
      return {
        ...prev,
        [monthKey]: events.map((e) => (e.id === id ? { ...e, text } : e)),
      };
    });
  };

  const handleRemoveEvent = (monthKey, id) => {
    setEventsByMonth((prev) => {
      const events = prev[monthKey] || [];
      return {
        ...prev,
        [monthKey]: events.filter((e) => e.id !== id),
      };
    });
  };

  const handleSavePlan = () => {
    // Hiện tại chỉ log ra console. Sau có thể kết nối backend.
    // eslint-disable-next-line no-console
    console.log('Academic year plan:', {
      academicYearId: currentYear?._id,
      eventsByMonth,
    });
    alert('Đã lưu kế hoạch (demo, chưa lưu về server).');
  };

  const userName = user?.fullName || user?.username || 'School Admin';

  return (
    <RoleLayout
      title={
        currentYear
          ? `Thiết lập kế hoạch năm học ${currentYear.yearName}`
          : 'Thiết lập kế hoạch năm học'
      }
      description="Nhập danh sách sự kiện nổi bật theo từng tháng. Bạn có thể thêm, sửa, xóa từng sự kiện."
      menuItems={menuItems}
      activeKey="academic-plan"
      onLogout={handleLogout}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      <Stack spacing={3}>
        <Typography variant="overline" color="text.secondary">
          MamNon DX &gt; Ban Giám Hiệu &gt; Quản lý Năm học &gt; Thiết lập kế hoạch năm học
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'white',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            1. Thông tin cơ bản năm học
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Tên năm học"
              value={currentYear?.yearName || ''}
              fullWidth
              size="small"
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Thời gian bắt đầu"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={formatDateInput(currentYear?.startDate)}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Thời gian kết thúc"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={formatDateInput(currentYear?.endDate)}
              InputProps={{ readOnly: true }}
            />
          </Stack>
          {loadingYear && (
            <Typography variant="body2" color="text.secondary" mt={1.5}>
              Đang tải thông tin năm học...
            </Typography>
          )}
          {!loadingYear && !currentYear && (
            <Typography variant="body2" color="error" mt={1.5}>
              Chưa có năm học đang hoạt động. Vui lòng tạo năm học trước.
            </Typography>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'white',
            position: 'relative',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            2. Danh sách sự kiện theo tháng
          </Typography>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            useFlexGap
            flexWrap="wrap"
          >
            {months.map((m) => {
              const monthKey = m.key;
              const events = eventsByMonth[monthKey] || [];
              return (
                <Paper
                  key={monthKey}
                  elevation={0}
                  sx={{
                    flex: '1 1 260px',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: '#f9fafb',
                    p: 2,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Tháng {m.month}/{m.year}
                  </Typography>
                  <Stack spacing={1.5}>
                    {events.map((e) => (
                      <Stack key={e.id} direction="row" spacing={1}>
                        <TextField
                          placeholder="Sự kiện mới (ví dụ: Lễ khai giảng)"
                          size="small"
                          fullWidth
                          value={e.text}
                          onChange={(evt) =>
                            handleChangeEvent(monthKey, e.id, evt.target.value)
                          }
                        />
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleRemoveEvent(monthKey, e.id)}
                        >
                          Xóa
                        </Button>
                      </Stack>
                    ))}
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAddEvent(monthKey)}
                      sx={{
                        mt: 0.5,
                        alignSelf: 'flex-start',
                        textTransform: 'none',
                      }}
                    >
                      + Thêm sự kiện
                    </Button>
                  </Stack>
                </Paper>
              );
            })}
            {months.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Chưa có thông tin tháng do chưa có năm học hoạt động.
              </Typography>
            )}
          </Stack>

          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              display: 'flex',
              justifyContent: 'flex-end',
              mt: 3,
            }}
          >
            <Button
              variant="contained"
              color="success"
              onClick={handleSavePlan}
              sx={{
                textTransform: 'none',
                px: 3,
                borderRadius: 999,
              }}
              disabled={!currentYear}
            >
              Lưu kế hoạch
            </Button>
          </Box>
        </Paper>
      </Stack>
    </RoleLayout>
  );
}

