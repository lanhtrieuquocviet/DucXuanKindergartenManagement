import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Download as DownloadIcon, Search as SearchIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, ENDPOINTS } from '../../service/api';

const EVENTS_TEMPLATE = [
  { name: 'Lễ khai giảng năm học', time: '05/09/2025', classes: 'Toàn trường', status: 'Đã tổ chức', statusTone: 'done' },
  { name: 'Ngày hội phụ huynh đầu năm', time: '10/09/2025', classes: 'Toàn trường', status: 'Đã tổ chức', statusTone: 'done' },
  { name: 'Kiểm tra sức khỏe định kỳ', time: '15/09/2025', classes: 'Toàn trường', status: 'Đã tổ chức', statusTone: 'done' },
  { name: 'Tết Trung thu', time: '15/10/2025', classes: 'Toàn trường', status: 'Đã tổ chức', statusTone: 'done' },
  { name: 'Ngày Phụ nữ Việt Nam 20/10', time: '20/10/2025', classes: 'Toàn trường', status: 'Đã tổ chức', statusTone: 'done' },
  { name: 'Ngày Nhà giáo Việt Nam 20/11', time: '20/11/2025', classes: 'Toàn trường', status: 'Sắp diễn ra', statusTone: 'upcoming' },
  { name: 'Tết Nguyên đán', time: 'Tháng 1/2026', classes: 'Toàn trường', status: 'Sắp diễn ra', statusTone: 'upcoming' },
  { name: 'Ngày hội thể thao học đường', time: '15/03/2026', classes: 'Toàn trường', status: 'Sắp diễn ra', statusTone: 'upcoming' },
  { name: 'Lễ tổng kết năm học', time: '25/05/2026', classes: 'Toàn trường', status: 'Sắp diễn ra', statusTone: 'upcoming' },
];

function getChipStyles(tone) {
  if (tone === 'done') {
    return {
      bgcolor: '#dcfce7',
      color: '#16a34a',
      border: '1px solid',
      borderColor: '#86efac',
      fontWeight: 700,
    };
  }
  if (tone === 'upcoming') {
    return {
      bgcolor: '#fef9c3',
      color: '#ca8a04',
      border: '1px solid',
      borderColor: '#facc15',
      fontWeight: 700,
    };
  }
  return {};
}

export default function AcademicYearReport() {
  const { yearId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (key === 'academic-curriculum') {
      navigate('/school-admin/curriculum');
      return;
    }
    if (key === 'academic-schedule') {
      navigate('/school-admin/timetable');
      return;
    }
    if (key === 'academic-report') {
      if (yearId) navigate(`/school-admin/academic-years/${yearId}/report`);
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
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setSummary(null);

        // Ưu tiên lấy tóm tắt qua endpoint "history" (dùng được cho cả năm kết thúc/tra cứu).
        if (yearId) {
          const params = new URLSearchParams();
          params.set('yearId', yearId);
          const historyResp = await get(
            `${ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.HISTORY}?${params.toString()}`,
          );

          if (
            historyResp?.status === 'success' &&
            Array.isArray(historyResp.data) &&
            historyResp.data[0]
          ) {
            if (!cancelled) setSummary(historyResp.data[0]);
            return;
          }
        }

        // Nếu không tìm thấy trong history, thử lấy năm học hiện tại.
        const currentResp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT);
        if (
          !cancelled &&
          currentResp?.status === 'success' &&
          currentResp.data &&
          (!yearId || String(currentResp.data._id) === String(yearId))
        ) {
          setSummary(currentResp.data);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error loading academic year report:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [get, yearId]);

  const yearName = summary?.yearName || '2025-2026';

  // KPI theo mẫu ảnh (có thể thay bằng dữ liệu thật từ API sau).
  const kpis = [
    { value: 285, label: 'Tổng số trẻ', accent: '#4f46e5' },
    { value: '92.4%', label: 'Tỷ lệ đạt chuẩn phát triển', accent: '#6366f1' },
    { value: '4.1%', label: 'Tỷ lệ vắng học trung bình', accent: '#7c3aed' },
    { value: '98.7%', label: 'Tỷ lệ tiêm chủng đầy đủ', accent: '#4f46e5' },
  ];

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return EVENTS_TEMPLATE;

    return EVENTS_TEMPLATE.filter((ev) => {
      return [ev.name, ev.time, ev.classes, ev.status].some((v) =>
        String(v).toLowerCase().includes(q),
      );
    });
  }, [searchQuery]);

  const userName = user?.fullName || user?.username || 'School Admin';

  return (
    <RoleLayout
      title={`Báo cáo & Thống kê - Năm học ${yearName}`}
      description="Tổng hợp dữ liệu và báo cáo qua từng năm học."
      menuItems={menuItems}
      activeKey="academic-report"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
            MamNon DX &gt; Ban Giám hiệu &gt; Quản lý Năm học &gt; Báo cáo &amp; Thống kê
          </Typography>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ color: '#4f46e5', mt: 1 }}
          >
            Báo cáo &amp; Thống kê - Năm học {yearName}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Tổng hợp dữ liệu và báo cáo qua trong năm học hiện tại.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.5,
            p: { xs: 2, md: 2.5 },
            background: 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(79,70,229,0.08) 100%)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <TextField
                placeholder="Tìm trong báo cáo hoặc sự kiện (ví dụ: tỷ lệ đạt chuẩn, sức khỏe, lễ khai giảng...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  backgroundColor: 'white',
                  borderRadius: 999,
                  '& .MuiOutlinedInput-root': { borderRadius: 999 },
                }}
              />

              <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<PdfIcon />}
                  sx={{
                    bgcolor: '#4f46e5',
                    '&:hover': { bgcolor: '#4338ca' },
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 2.2,
                  }}
                  onClick={() => window.print()}
                >
                  Báo cáo (PDF)
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 2.2,
                  }}
                  onClick={() => window.alert('Chưa tích hợp xuất Excel trong bản demo.')}
                >
                  Excel
                </Button>
              </Stack>
            </Stack>

            <Grid container spacing={2}>
              {kpis.map((card) => (
                <Grid item xs={12} sm={6} md={3} key={card.label}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      backgroundColor: 'white',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      minHeight: 92,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 0.5,
                      '&:hover': { borderColor: '#c7d2fe' },
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight={900}
                      sx={{ color: '#4f46e5', lineHeight: 1.1 }}
                    >
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ mt: 0.5 }}>
                      {card.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Paper>

        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#4f46e5', mb: 1.5 }}>
            Danh sách tất cả sự kiện trong năm học
          </Typography>
        </Box>

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 2.5,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'white',
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#4f46e5' }}>
                <TableCell sx={{ color: 'white', fontWeight: 900, borderColor: 'rgba(255,255,255,0.15)', width: 60 }}>
                  STT
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 900, borderColor: 'rgba(255,255,255,0.15)' }}>
                  Tên sự kiện
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 900, borderColor: 'rgba(255,255,255,0.15)', width: 180 }}>
                  Thời gian
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 900, borderColor: 'rgba(255,255,255,0.15)', width: 200 }}>
                  Khối lớp liên quan
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 900, borderColor: 'rgba(255,255,255,0.15)', width: 160 }}>
                  Trạng thái
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Đang tải dữ liệu...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Không có sự kiện phù hợp với bộ lọc.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((ev, idx) => (
                  <TableRow
                    key={`${ev.name}-${idx}`}
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{ev.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{ev.time}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{ev.classes}</TableCell>
                    <TableCell>
                      <Chip label={ev.status} size="small" sx={getChipStyles(ev.statusTone)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </RoleLayout>
  );
}
