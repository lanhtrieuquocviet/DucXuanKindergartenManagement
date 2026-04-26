import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppMenu } from '../../hooks/useAppMenu';
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
  const { user, logout, isInitializing, hasPermission } = useAuth();
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
    academicYearName: '',
  });
  const todayKey = useMemo(() => {
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [now]);

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

        // 1. Fetch current academic year first
        const yearRes = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT).catch(() => null);
        const activeYear = yearRes?.status === 'success' ? yearRes.data : null;
        const activeYearId = activeYear?._id || '';

        // 2. Fetch stats with academicYearId filter
        const [studentsRes, classesRes, teachersRes, attendanceRes, contactsRes] = await Promise.all([
          get(`${ENDPOINTS.STUDENTS.LIST}${activeYearId ? `?academicYearId=${activeYearId}` : ''}`),
          get(`${ENDPOINTS.CLASSES.LIST}${activeYearId ? `?academicYearId=${activeYearId}` : ''}`),
          get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS),
          get(`${ENDPOINTS.SCHOOL_ADMIN.ATTENDANCE_OVERVIEW}?date=${todayStr}${activeYearId ? `&academicYearId=${activeYearId}` : ''}`),
          get(ENDPOINTS.SCHOOL_ADMIN.CONTACTS),
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
          studentTotal > 0 ? Math.min(100, Math.round((attendanceMarked / studentTotal) * 100)) : 0;

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

        const questionRows = Array.isArray(contactsRes?.data?.contacts)
          ? contactsRes.data.contacts
          : [];
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
          academicYearName: activeYear?.yearName || '',
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, [isInitializing, user, todayKey]);

  const userName = user?.fullName || user?.username || 'School Admin';


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
      note: stats.academicYearName ? `Năm học: ${stats.academicYearName}` : 'Tổng số học sinh',
      icon: <GroupsIcon sx={{ fontSize: 34, color: '#3730a3' }} />,
    },
    {
      label: 'Tỷ lệ có mặt hôm nay',
      value: `${stats.attendanceRate}%`,
      note: `${stats.attendanceMarked}/${stats.studentTotal} em đã điểm danh`,
      icon: <CheckCircleIcon sx={{ fontSize: 34, color: '#059669' }} />,
    },
    {
      label: 'Tổng số lớp học',
      value: String(stats.classTotal),
      note: stats.academicYearName ? `Năm học: ${stats.academicYearName}` : 'Số lớp học',
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
    <Box>
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
            Chuyên cần &amp; điểm danh {stats.academicYearName ? `(${stats.academicYearName})` : ''}
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
    </Box>
  );
}

export default SchoolAdminDashboard;
