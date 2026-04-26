import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
}

export default function AcademicYearDetail() {
  const { yearId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const menuItems = useSchoolAdminMenu();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('yearId', yearId);
        const resp = await get(
          `${ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.HISTORY}?${params.toString()}`,
        );
        if (resp?.status === 'success' && Array.isArray(resp.data) && resp.data[0]) {
          setSummary(resp.data[0]);
        } else {
          setSummary(null);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading academic year summary:', error);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    if (yearId) {
      loadSummary();
    }
  }, [yearId]);

  useEffect(() => {
    const loadClasses = async () => {
      if (!yearId || tab !== 1) return;
      try {
        setClassesLoading(true);
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CLASSES(yearId));
        if (resp?.status === 'success' && Array.isArray(resp.data)) {
          setClasses(resp.data);
        } else {
          setClasses([]);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading classes:', error);
        setClasses([]);
      } finally {
        setClassesLoading(false);
      }
    };
    loadClasses();
  }, [yearId, tab]);

  const passRate = 0;
  const reportCount = 0;
  const totalStudents = Number(summary?.studentCount) || 0;
  const fixedDevelopedStudents = 262;
  const developedRate = totalStudents > 0
    ? Math.round((fixedDevelopedStudents / totalStudents) * 100)
    : 0;

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            MamNon DX &gt; Ban Giám Hiệu &gt; Quản lý Năm học &gt; Tra cứu &amp; Lưu trữ
            &gt; Chi tiết: {summary?.yearName || ''}
          </Typography>
          <Typography variant="h5" fontWeight={700} mt={1}>
            {summary?.yearName || 'Năm học'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Thông tin chi tiết năm học đã kết thúc. Truy cập các tab bên dưới để xem dữ
            liệu cụ thể.
          </Typography>
        </Box>

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
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {summary?.yearName || 'Năm học'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Trạng thái:{' '}
                <strong>{summary?.status === 'inactive' ? 'Đã kết thúc' : 'Đang hoạt động'}</strong>
                {summary?.endDate && ` | Kết thúc ngày ${formatDate(summary.endDate)}`}
              </Typography>
            </Box>
            <Button
              variant="contained"
              sx={{
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Export toàn bộ dữ liệu
            </Button>
          </Stack>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            mt={3}
            alignItems="stretch"
          >
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                p: 2,
              }}
            >
              <Typography variant="h4" fontWeight={700} color="#4f46e5">
                {summary?.classCount ?? '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lớp học
              </Typography>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                p: 2,
              }}
            >
              <Typography variant="h4" fontWeight={700} color="#4f46e5">
                {summary?.studentCount ?? '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Trẻ em
              </Typography>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                p: 2,
              }}
            >
              <Typography variant="h4" fontWeight={700} color="#4f46e5">
                {passRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tỷ lệ đạt chuẩn
              </Typography>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                p: 2,
              }}
            >
              <Typography variant="h4" fontWeight={700} color="#4f46e5">
                {reportCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Báo cáo lưu trữ
              </Typography>
            </Paper>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'white',
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2, pt: 1 }}
          >
            <Tab label="Tổng quan" />
            <Tab label="Danh sách lớp học" />
            <Tab label="Danh sách trẻ em" />
            <Tab label="Chương trình & Kế hoạch" />
            <Tab label="Báo cáo & Thống kê" />
            <Tab label="Lưu trữ & Tài liệu" />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Tổng quan năm học
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Thời gian: {summary ? `${formatDate(summary.startDate)} – ${formatDate(summary.endDate)}` : '-'}
              </Typography>
              {summary?.description && (
                <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                  {summary.description}
                </Typography>
              )}
              {!summary && !loading && (
                <Typography variant="body2" color="text.secondary">
                  Không tìm thấy dữ liệu cho năm học này.
                </Typography>
              )}
              {loading && (
                <Typography variant="body2" color="text.secondary">
                  Đang tải dữ liệu...
                </Typography>
              )}
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography
                variant="h6"
                fontWeight={700}
                color="primary"
                gutterBottom
                sx={{ mb: 2 }}
              >
                Danh sách lớp học năm {summary?.yearName || ''}
              </Typography>
              {classesLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Đang tải danh sách lớp...
                </Typography>
              ) : classes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Không có lớp học nào trong năm học này.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {classes.map((cls) => (
                    <Paper
                      key={cls._id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'grey.50',
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                        {cls.className}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Giáo viên: {cls.teacherNames} – {cls.studentCount} trẻ
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {tab === 2 && (
            <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 3,
                  backgroundColor: 'grey.50',
                }}
              >
                <Typography variant="h6" fontWeight={700} color="#4f46e5" gutterBottom>
                  Danh sách trẻ em (tóm tắt)
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body1" color="text.primary">
                    Tổng số: {totalStudents} trẻ
                  </Typography>
                </Stack>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (yearId) navigate(`/school-admin/students?yearId=${yearId}`);
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: '#6366f1',
                      '&:hover': { bgcolor: '#4f46e5' },
                    }}
                  >
                    Xem danh sách đầy đủ &amp; hồ sơ cá nhân
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}

          {tab === 3 && (
            <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 3,
                  backgroundColor: 'grey.50',
                }}
              >
                <Typography variant="h6" fontWeight={700} color="#4f46e5" gutterBottom>
                  Chương trình &amp; Kế hoạch
                </Typography>
                <Stack spacing={1.5}>
                  <Typography variant="body1" color="text.primary">
                    Xem và chỉnh sửa chủ đề theo khối lớp, kế hoạch tuần cho năm học{' '}
                    <strong>{summary?.yearName || ''}</strong>.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mở trang thiết lập kế hoạch để quản lý đầy đủ nội dung chương trình của năm này.
                  </Typography>
                </Stack>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (yearId) navigate(`/school-admin/academic-plan?yearId=${yearId}`);
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: '#6366f1',
                      '&:hover': { bgcolor: '#4f46e5' },
                    }}
                  >
                    Mở thiết lập kế hoạch năm học
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}

          {tab === 4 && (
            <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 3,
                  backgroundColor: 'grey.50',
                }}
              >
                <Typography variant="h6" fontWeight={700} color="#4f46e5" gutterBottom>
                  Báo cáo &amp; Thống kê
                </Typography>
                <Stack spacing={1.5}>
                  <Typography variant="body1" color="text.primary">
                    Mở màn hình báo cáo đầy đủ theo năm học.
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    Bạn sẽ thấy KPI, thanh tìm kiếm và danh sách sự kiện giống giao diện mẫu.
                  </Typography>
                </Stack>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (yearId) navigate(`/school-admin/academic-years/${yearId}/report`);
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: '#4f46e5',
                      '&:hover': { bgcolor: '#4338ca' },
                    }}
                  >
                    Mở trang Báo cáo &amp; Thống kê
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}

          {tab === 5 && (
            <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 3,
                  backgroundColor: 'grey.50',
                }}
              >
                <Typography variant="h6" fontWeight={700} color="#4f46e5" gutterBottom>
                  Lưu trữ &amp; Tài liệu
                </Typography>
                <Stack spacing={1.5}>
                  <Typography variant="body1" color="text.primary">
                    Tài liệu lưu trữ: Tài liệu hồ sơ, tài liệu biên bản họp...
                  </Typography>
                </Stack>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (yearId) navigate(`/school-admin/files?yearId=${yearId}`);
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: '#6366f1',
                      '&:hover': { bgcolor: '#4f46e5' },
                    }}
                  >
                    Truy cập kho lưu trữ
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}

