import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { Box, Paper, Typography, Stack, Divider, LinearProgress } from '@mui/material';
import {
  Groups as GroupsIcon,
  CheckCircle as CheckCircleIcon,
  LaptopMac as LaptopMacIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { get, ENDPOINTS } from '../../service/api';

function SchoolAdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const [now, setNow] = useState(new Date());
  const [stats, setStats] = useState({
    studentTotal: 0,
    attendanceRate: 0,
    attendancePresent: 0,
    attendanceMarked: 0,
    attendanceAbsent: 0,
    classTotal: 0,
    teacherTotal: 0,
    attendanceRows: [],
    questionTodayTotal: 0,
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
    }
  }, [navigate, user, isInitializing]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isInitializing || !user) return;

    const fetchDashboardStats = async () => {
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const [studentsRes, classesRes, teachersRes, attendanceRes, questionsRes] = await Promise.all([
          get(ENDPOINTS.STUDENTS.LIST),
          get(ENDPOINTS.CLASSES.LIST),
          get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS),
          get(`${ENDPOINTS.SCHOOL_ADMIN.ATTENDANCE_OVERVIEW}?date=${todayStr}`),
          get(ENDPOINTS.SCHOOL_ADMIN.QA_QUESTIONS),
        ]);

        const studentTotal = Number(studentsRes?.total ?? studentsRes?.data?.length ?? 0);
        const classTotal = Number(classesRes?.total ?? classesRes?.data?.length ?? 0);

        const teacherRows = Array.isArray(teachersRes?.data) ? teachersRes.data : [];
        const teacherTotal = teacherRows.filter((t) => (t?.status || 'active') === 'active').length;

        const attendanceClasses = Array.isArray(attendanceRes?.data?.classes)
          ? attendanceRes.data.classes
          : [];

        const checkedRows = attendanceClasses.filter(
          (c) => Number(c?.present || 0) + Number(c?.absent || 0) > 0,
        );

        const attendancePresent = checkedRows.reduce(
          (sum, c) => sum + Number(c?.present || 0),
          0,
        );
        const attendanceAbsent = checkedRows.reduce(
          (sum, c) => sum + Number(c?.absent || 0),
          0,
        );
        const attendanceMarked = attendancePresent + attendanceAbsent;
        const attendanceRate =
          attendanceMarked > 0 ? Math.round((attendancePresent / attendanceMarked) * 100) : 0;

        const attendanceRows = checkedRows.map((c) => {
          const totalStudents = Number(c?.totalStudents || 0);
          const present = Number(c?.present || 0);
          const percent = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;
          return {
            label: c?.className || 'Lớp',
            percent,
            detail: `(${present}/${totalStudents})`,
            color: percent >= 90 ? '#059669' : '#dc2626',
          };
        });

        const questionRows = Array.isArray(questionsRes?.data) ? questionsRes.data : [];
        const questionTodayTotal = questionRows.filter((q) => {
          const created = q?.createdAt ? new Date(q.createdAt) : null;
          if (!created || Number.isNaN(created.getTime())) return false;
          const qY = created.getFullYear();
          const qM = created.getMonth();
          const qD = created.getDate();
          return qY === today.getFullYear() && qM === today.getMonth() && qD === today.getDate();
        }).length;

        setStats({
          studentTotal,
          attendanceRate,
          attendancePresent,
          attendanceMarked,
          attendanceAbsent,
          classTotal,
          teacherTotal,
          attendanceRows,
          questionTodayTotal,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, [isInitializing, user]);

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

  const userName = user?.fullName || user?.username || 'School Admin';

  const handleMenuSelect = async (key) => {
    if (key === 'overview') return;
    if (key === 'academic-years' || key === 'academic-year-setup') return navigate('/school-admin/academic-years');
    if (key === 'academic-curriculum') return navigate('/school-admin/curriculum');
    if (key === 'academic-schedule') return navigate('/school-admin/timetable');
    if (key === 'academic-plan') return navigate('/school-admin/academic-plan');
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
    if (key === 'academic-students') return navigate('/school-admin/class-list');
    if (key === 'classes') return navigate('/school-admin/classes');
    if (key === 'menu') return navigate('/school-admin/menus');
    if (key === 'meal-management') return navigate('/school-admin/meal-management');
    if (key === 'teachers') return navigate('/school-admin/teachers');
    if (key === 'students') return navigate('/school-admin/students');
    if (key === 'contacts') return navigate('/school-admin/contacts');
    if (key === 'qa') return navigate('/school-admin/qa');
    if (key === 'blogs') return navigate('/school-admin/blogs');
    if (key === 'documents') return navigate('/school-admin/documents');
    if (key === 'public-info') return navigate('/school-admin/public-info');
    if (key === 'attendance') return navigate('/school-admin/attendance/overview');
  };

  const dateTimeText = useMemo(() => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(now);
  }, [now]);

  const statCards = [
    {
      label: 'Tổng học sinh',
      value: String(stats.studentTotal),
      note: 'Tổng số học sinh toàn trường',
      icon: <GroupsIcon sx={{ fontSize: 34, color: '#3730a3' }} />,
    },
    {
      label: 'Tỷ lệ có mặt hôm nay',
      value: `${stats.attendanceRate}%`,
      note: `${stats.attendancePresent}/${stats.attendanceMarked} em đã điểm danh | ${stats.attendanceAbsent} em vắng`,
      icon: <CheckCircleIcon sx={{ fontSize: 34, color: '#059669' }} />,
    },
    {
      label: 'Tổng số lớp học',
      value: String(stats.classTotal),
      note: 'Số lớp học toàn trường',
      icon: <LaptopMacIcon sx={{ fontSize: 34, color: '#d97706' }} />,
    },
    {
      label: 'Tổng số giáo viên',
      value: String(stats.teacherTotal),
      note: 'Giáo viên đang hoạt động',
      icon: <PersonIcon sx={{ fontSize: 34, color: '#dc2626' }} />,
    },
  ];

  return (
    <RoleLayout
      title="Bảng điều khiển của Ban giám hiệu"
      description="Quản lý trường, lớp học, giáo viên và phụ huynh trong phạm vi trường."
      menuItems={menuItems}
      activeKey="overview"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      <Typography variant="h4" fontWeight={800} sx={{ color: '#312eae', mb: 3 }}>
        Dashboard Tổng quan trường - {dateTimeText}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {statCards.map((card) => (
          <Paper
            key={card.label}
            elevation={0}
            sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: '#e5e7eb' }}
          >
            <Box sx={{ mb: 1.5 }}>{card.icon}</Box>
            <Typography variant="body1" sx={{ color: '#374151' }}>{card.label}</Typography>
            <Typography variant="h3" fontWeight={800} sx={{ color: '#312eae', lineHeight: 1.2, my: 1 }}>
              {card.value}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>{card.note}</Typography>
          </Paper>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#312eae', mb: 2 }}>
            Tổng quan chuyên cần &amp; điểm danh (toàn trường)
          </Typography>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: '#e5e7eb' }}>
            <Stack spacing={2}>
              {stats.attendanceRows.map((row, idx) => (
                <Box key={row.label}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography sx={{ minWidth: 145, color: '#111827' }}>{row.label}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={row.percent}
                        sx={{
                          height: 8,
                          borderRadius: 999,
                          bgcolor: '#e5e7eb',
                          '& .MuiLinearProgress-bar': { bgcolor: row.color, borderRadius: 999 },
                        }}
                      />
                    </Box>
                    <Typography sx={{ minWidth: 92, color: '#111827' }}>
                      {row.percent}% {row.detail}
                    </Typography>
                  </Stack>
                  {idx < stats.attendanceRows.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                </Box>
              ))}
              {stats.attendanceRows.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Chưa có lớp nào điểm danh hôm nay.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#312eae', mb: 2 }}>
            Tổng quan Cổng thông tin liên lạc
          </Typography>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: '#e5e7eb' }}>
            <Typography variant="body1" sx={{ color: '#6b7280' }}>Số câu hỏi nhận được hôm nay</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#111827' }}>
              {stats.questionTodayTotal}
            </Typography>
          </Paper>
        </Box>
      </Box>
    </RoleLayout>
  );
}

export default SchoolAdminDashboard;
