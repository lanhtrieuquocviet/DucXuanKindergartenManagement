import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { PictureAsPdf as PdfIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get, ENDPOINTS } from '../../service/api';

const DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const ROWS = [
  { key: 'sang', label: 'Sáng' },
  { key: 'chieu', label: 'Chiều' },
];

const DEFAULT_SAMPLE = {
  sang: ['Âm nhạc', 'HD Nhận biết', 'PTVĐ', 'Tạo hình', 'LQVH', 'Ôn luyện trò chơi dân gian'],
  chieu: ['Vệ sinh', 'LQ kiến thức mới', 'Rèn kỹ năng', 'Ôn luyện', 'Nêu gương', 'Ôn luyện trò chơi dân gian'],
};

const STORAGE_KEY = 'school_timetable_by_grade';

function getInitialTimetableForGrade(gradeId, gradeName) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[gradeId]?.sang?.length === 6 && parsed[gradeId]?.chieu?.length === 6) {
        return parsed[gradeId];
      }
    }
  } catch (_) {}
  if (gradeName && /nhà trẻ|24-36|mầm/i.test(gradeName)) {
    return { sang: [...DEFAULT_SAMPLE.sang], chieu: [...DEFAULT_SAMPLE.chieu] };
  }
  return {
    sang: ['', '', '', '', '', ''],
    chieu: ['', '', '', '', '', ''],
  };
}

function saveTimetableToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

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

export default function TimetablePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [academicYear, setAcademicYear] = useState(null);
  const [grades, setGrades] = useState([]);
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [timetableByGrade, setTimetableByGrade] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleMenuSelect = (key) => {
    if (key === 'overview') navigate('/school-admin');
    if (key === 'academic-years' || key === 'academic-year-setup') navigate('/school-admin/academic-years');
    if (key === 'academic-plan') navigate('/school-admin/academic-plan');
    if (key === 'academic-students') navigate('/school-admin/class-list');
    if (key === 'academic-curriculum') navigate('/school-admin/curriculum');
    if (key === 'academic-schedule') return;
    if (key === 'classes') navigate('/school-admin/classes');
    if (key === 'menu') navigate('/school-admin/menus');
    if (key === 'students') navigate('/school-admin/students');
    if (key === 'contacts') navigate('/school-admin/contacts');
    if (key === 'qa') navigate('/school-admin/qa');
    if (key === 'blogs') navigate('/school-admin/blogs');
    if (key === 'documents') navigate('/school-admin/documents');
    if (key === 'public-info') navigate('/school-admin/public-info');
    if (key === 'attendance') navigate('/school-admin/attendance/overview');
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [yearRes, gradesRes] = await Promise.all([
          get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT),
          get(ENDPOINTS.GRADES.LIST),
        ]);
        if (yearRes?.status === 'success' && yearRes.data) setAcademicYear(yearRes.data);
        else setAcademicYear(null);
        if (gradesRes?.status === 'success' && Array.isArray(gradesRes.data)) {
          const list = gradesRes.data;
          setGrades(list);
          if (list.length > 0 && !selectedGradeId) {
            setSelectedGradeId(list[0]._id);
          }
        } else setGrades([]);
      } catch (_) {
        setAcademicYear(null);
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedGradeId || grades.length === 0) return;
    if (timetableByGrade[selectedGradeId]) return;
    const grade = grades.find((g) => g._id === selectedGradeId);
    const initial = getInitialTimetableForGrade(selectedGradeId, grade?.gradeName);
    setTimetableByGrade((prev) => {
      const next = { ...prev, [selectedGradeId]: initial };
      saveTimetableToStorage(next);
      return next;
    });
  }, [selectedGradeId, grades]);

  const currentTimetable = selectedGradeId
    ? timetableByGrade[selectedGradeId] ?? getInitialTimetableForGrade(
        selectedGradeId,
        grades.find((g) => g._id === selectedGradeId)?.gradeName
      )
    : null;

  const setCurrentTimetable = useCallback(
    (next) => {
      if (!selectedGradeId) return;
      setTimetableByGrade((prev) => {
        const updated = { ...prev, [selectedGradeId]: next };
        saveTimetableToStorage(updated);
        return updated;
      });
    },
    [selectedGradeId]
  );

  const handleCellChange = (rowKey, dayIndex, value) => {
    if (!currentTimetable) return;
    const next = {
      sang: [...(currentTimetable.sang || ['', '', '', '', '', ''])],
      chieu: [...(currentTimetable.chieu || ['', '', '', '', '', ''])],
    };
    next[rowKey][dayIndex] = value;
    setCurrentTimetable(next);
  };

  const handleGradeChange = (e) => {
    const id = e.target.value;
    setSelectedGradeId(id);
    setIsEditMode(false);
    if (id && !timetableByGrade[id]) {
      const grade = grades.find((g) => g._id === id);
      setTimetableByGrade((prev) => ({
        ...prev,
        [id]: getInitialTimetableForGrade(id, grade?.gradeName),
      }));
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleSave = () => {
    if (selectedGradeId && currentTimetable) {
      setTimetableByGrade((prev) => {
        const next = { ...prev, [selectedGradeId]: currentTimetable };
        saveTimetableToStorage(next);
        return next;
      });
      setIsEditMode(false);
    }
  };

  const handleEnterEdit = () => {
    setIsEditMode(true);
  };

  const yearName = academicYear?.yearName || '2025-2026';
  const breadcrumb = `MamNon DX → Ban Giám hiệu → Quản lý Năm học → Thời khóa biểu các khối ${yearName}`;
  const selectedGrade = grades.find((g) => g._id === selectedGradeId);
  const gradeLabel = selectedGrade ? `Khối ${selectedGrade.gradeName}` : '';

  return (
    <RoleLayout
      title={`Thời khóa biểu các khối - ${yearName}`}
      description="Xem thời khóa biểu mẫu theo từng khối lớp. Chọn khối để xem chi tiết."
      menuItems={menuItems}
      activeKey="academic-schedule"
      onLogout={handleLogout}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'School Admin'}
      userAvatar={user?.avatar}
    >
      <Stack spacing={3} sx={{ '@media print': { '& .no-print': { display: 'none' } } }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }} className="no-print">
          {breadcrumb}
        </Typography>

        <Box className="no-print">
          <Typography variant="h5" fontWeight={700} sx={{ color: '#1e40af' }}>
            Thời khóa biểu các khối - Năm học {yearName}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Xem thời khóa biểu mẫu theo từng khối lớp. Chọn khối để xem chi tiết.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} className="no-print">
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel id="timetable-grade-label">Khối lớp</InputLabel>
            <Select
              labelId="timetable-grade-label"
              label="Khối lớp"
              value={selectedGradeId}
              onChange={handleGradeChange}
              disabled={loading}
            >
              {grades.map((g) => (
                <MenuItem key={g._id} value={g._id}>
                  {g.gradeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={handlePrintPdf}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            In / Xuất PDF
          </Button>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              Đang tải...
            </Box>
          ) : !selectedGradeId || grades.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              Chưa có khối lớp nào. Vui lòng tạo khối lớp trước (Quản lý Lớp học).
            </Box>
          ) : (
            <>
              <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Thời khóa biểu khối {selectedGrade?.gradeName || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.25}>
                    Năm học: {yearName} (Mẫu tham khảo)
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} className="no-print">
                  {isEditMode ? (
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        sx={{
                          bgcolor: '#16a34a',
                          '&:hover': { bgcolor: '#15803d' },
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Lưu
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setIsEditMode(false)}
                        sx={{ textTransform: 'none' }}
                      >
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={handleEnterEdit}
                      sx={{
                        bgcolor: '#2563eb',
                        '&:hover': { bgcolor: '#1d4ed8' },
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Chỉnh sửa
                    </Button>
                  )}
                </Stack>
              </Box>

              <TableContainer>
                <Table size="small" sx={{ minWidth: 560 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#1e40af', '& th': { color: 'white', fontWeight: 700, borderColor: 'rgba(255,255,255,0.2)' } }}>
                      <TableCell sx={{ width: 100 }}>Buổi</TableCell>
                      {DAYS.map((d) => (
                        <TableCell key={d} align="center">
                          {d}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ROWS.map((row) => (
                      <TableRow key={row.key} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            bgcolor: '#dbeafe',
                            fontWeight: 600,
                            width: 100,
                            verticalAlign: 'middle',
                          }}
                        >
                          {row.label}
                        </TableCell>
                        {(currentTimetable?.[row.key] || Array(6).fill('')).map((val, dayIndex) => (
                          <TableCell key={dayIndex} sx={{ p: 0.5, verticalAlign: 'middle' }}>
                            {isEditMode ? (
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Nội dung"
                                value={val}
                                onChange={(e) => handleCellChange(row.key, dayIndex, e.target.value)}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    bgcolor: 'white',
                                    fontSize: '0.875rem',
                                  },
                                }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ py: 1, px: 1, minHeight: 40, bgcolor: '#f8fafc', borderRadius: 1 }}>
                                {val || '—'}
                              </Typography>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box
                sx={{
                  mt: 0,
                  p: 1.5,
                  bgcolor: '#fef9c3',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  <strong>Lưu ý:</strong> Đây là thời khóa biểu mẫu tham khảo. Thời khóa biểu thực tế có thể được điều chỉnh theo tình hình cụ thể của trường và từng khối lớp.
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      </Stack>
    </RoleLayout>
  );
}
