import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import ExcelJS from 'exceljs';
import { get, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  Divider,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const getLocalISODate = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

function ExportAttendanceReport() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getClasses, getStudents, loading, error } = useSchoolAdmin();
  const menuItems = useSchoolAdminMenu();

  const [reportType, setReportType] = useState('whole-school'); // whole-school, by-class, by-student
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

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

    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, user, isInitializing]);

  useEffect(() => {
    if (reportType === 'by-student' && selectedClass) {
      fetchStudents(selectedClass);
    } else {
      setStudents([]);
      setSelectedStudent('');
    }
  }, [reportType, selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await getClasses();
      if (response?.data) {
        setClasses(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setClasses([]);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      if (!classId) {
        setStudents([]);
        return;
      }
      const response = await getStudents(classId);
      if (response?.data) {
        setStudents(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents([]);
    }
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  // Lấy toàn bộ dữ liệu điểm danh bằng 1 API call duy nhất
  const fetchAttendanceData = async () => {
    const params = new URLSearchParams({ from: fromDate, to: toDate });
    if (reportType === 'by-class' && selectedClass) params.set('classId', selectedClass);
    if (reportType === 'by-student' && selectedStudent) params.set('studentId', selectedStudent);

    const response = await get(`${ENDPOINTS.SCHOOL_ADMIN.ATTENDANCE_EXPORT_DATA}?${params.toString()}`);
    return Array.isArray(response?.data) ? response.data : [];
  };

  // Xuất ra Excel
  const exportToExcel = async (data) => {
    const fmtDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const reportTypeText =
      reportType === 'whole-school' ? 'Toàn trường' :
      reportType === 'by-class' ? `Lớp: ${classes.find((c) => c._id === selectedClass)?.className || ''}` :
      `Học sinh: ${students.find((s) => s._id === selectedStudent)?.fullName || ''}`;

    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
    const thinBorder = { style: 'thin', color: { argb: 'FFB0BEC5' } };
    const allBorders = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    const applyHeaderStyle = (cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = headerFill;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = allBorders;
    };

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Kindergarten Management';
    wb.created = new Date();

    // ── Sheet 1: Chi tiết điểm danh ──────────────────────────────────────
    const ws = wb.addWorksheet('Chi tiết điểm danh');
    ws.columns = [
      { width: 18 }, { width: 26 }, { width: 14 },
      { width: 12 }, { width: 12 }, { width: 18 }, { width: 18 }, { width: 14 },
    ];

    // Row 1: Tiêu đề
    ws.mergeCells('A1:H1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'BÁO CÁO ĐIỂM DANH';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D47A1' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 42;

    // Row 2: Thông tin báo cáo
    ws.mergeCells('A2:H2');
    const infoCell = ws.getCell('A2');
    infoCell.value = `Phạm vi: ${reportTypeText}   |   Từ ngày: ${fmtDate(fromDate)}   |   Đến ngày: ${fmtDate(toDate)}`;
    infoCell.font = { italic: true, size: 10, color: { argb: 'FF1565C0' } };
    infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 22;

    // Row 3: Trống
    ws.addRow([]);
    ws.getRow(3).height = 6;

    // Row 4: Header cột
    const detailHeaders = ['Lớp', 'Học sinh', 'Ngày', 'Giờ đến', 'Giờ về', 'Người đưa', 'Người đón', 'Trạng thái'];
    const headerRow = ws.addRow(detailHeaders);
    headerRow.height = 26;
    headerRow.eachCell((cell) => applyHeaderStyle(cell));

    // Data rows (bắt đầu từ row 5)
    data.forEach((item, idx) => {
      const row = ws.addRow([
        item.className, item.studentName, fmtDate(item.date),
        item.checkIn, item.checkOut, item.deliverer, item.receiver, item.status,
      ]);
      row.height = 20;
      const bgArgb = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF5F9FF';
      row.eachCell((cell, colNum) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.border = allBorders;
        cell.alignment = { vertical: 'middle', horizontal: colNum <= 2 ? 'left' : 'center' };
        cell.font = { size: 10 };
      });
      // Màu trạng thái
      const statusCell = row.getCell(8);
      if (item.status === 'Có mặt') {
        statusCell.font = { bold: true, size: 10, color: { argb: 'FF2E7D32' } };
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      } else {
        statusCell.font = { bold: true, size: 10, color: { argb: 'FFC62828' } };
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
      }
    });

    ws.views = [{ state: 'frozen', ySplit: 4, xSplit: 0 }];
    ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 8 } };

    // ── Sheet 2: Tổng hợp ─────────────────────────────────────────────────
    const ws2 = wb.addWorksheet('Tổng hợp');
    ws2.columns = [{ width: 18 }, { width: 26 }, { width: 18 }, { width: 15 }, { width: 14 }];

    ws2.mergeCells('A1:E1');
    const t2 = ws2.getCell('A1');
    t2.value = 'TỔNG HỢP ĐIỂM DANH';
    t2.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    t2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D47A1' } };
    t2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws2.getRow(1).height = 38;

    ws2.mergeCells('A2:E2');
    const i2 = ws2.getCell('A2');
    i2.value = `${reportTypeText}   |   ${fmtDate(fromDate)} – ${fmtDate(toDate)}`;
    i2.font = { italic: true, size: 10, color: { argb: 'FF1565C0' } };
    i2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    i2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws2.getRow(2).height = 22;
    ws2.addRow([]).height = 6;

    const sumHeaderRow = ws2.addRow(['Lớp', 'Học sinh', 'Số ngày có mặt', 'Số ngày nghỉ', 'Tổng ngày']);
    sumHeaderRow.height = 26;
    sumHeaderRow.eachCell((cell) => applyHeaderStyle(cell));

    const studentSummary = {};
    data.forEach((item) => {
      const key = `${item.className}__${item.studentName}`;
      if (!studentSummary[key]) studentSummary[key] = { className: item.className, studentName: item.studentName, present: 0, absent: 0 };
      if (item.status === 'Có mặt') studentSummary[key].present++; else studentSummary[key].absent++;
    });

    Object.values(studentSummary).forEach((s, idx) => {
      const row = ws2.addRow([s.className, s.studentName, s.present, s.absent, s.present + s.absent]);
      row.height = 20;
      const bgArgb = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF5F9FF';
      row.eachCell((cell, colNum) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.border = allBorders;
        cell.alignment = { vertical: 'middle', horizontal: colNum <= 2 ? 'left' : 'center' };
        cell.font = { size: 10 };
      });
      // Tô màu số ngày có mặt / nghỉ
      row.getCell(3).font = { bold: true, size: 10, color: { argb: 'FF2E7D32' } };
      row.getCell(4).font = { bold: true, size: 10, color: { argb: s.absent > 0 ? 'FFC62828' : 'FF757575' } };
      row.getCell(5).font = { bold: true, size: 10, color: { argb: 'FF1565C0' } };
    });

    ws2.views = [{ state: 'frozen', ySplit: 4 }];

    // Xuất file
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_cao_diem_danh_${fromDate}_${toDate}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    // Validate
    if (!fromDate || !toDate) {
      setNotice({ type: 'error', text: 'Vui lòng chọn từ ngày và đến ngày' });
      return;
    }

    if (reportType === 'by-class' && !selectedClass) {
      setNotice({ type: 'error', text: 'Vui lòng chọn lớp' });
      return;
    }

    if (reportType === 'by-student' && (!selectedClass || !selectedStudent)) {
      setNotice({ type: 'error', text: 'Vui lòng chọn lớp và học sinh' });
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setNotice({ type: 'error', text: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc' });
      return;
    }

    setNotice({ type: '', text: '' });
    setIsExporting(true);
    try {
      // Lấy dữ liệu điểm danh
      const attendanceData = await fetchAttendanceData();

      if (attendanceData.length === 0) {
        setNotice({ type: 'error', text: 'Không có dữ liệu điểm danh trong khoảng thời gian đã chọn' });
        setIsExporting(false);
        return;
      }

      await exportToExcel(attendanceData);
      setNotice({ type: 'success', text: 'Xuất báo cáo Excel thành công!' });
    } catch (err) {
      console.error('Error exporting report:', err);
      setNotice({
        type: 'error',
        text: 'Có lỗi xảy ra khi xuất báo cáo: ' + (err.message || 'Lỗi không xác định'),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const userName = user?.fullName || user?.username || 'School Admin';

  // Helper: numbered section badge
  const SectionBadge = ({ number }) => (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        bgcolor: 'primary.main',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.85rem',
        flexShrink: 0,
      }}
    >
      {number}
    </Box>
  );

  return (
    <RoleLayout
      title="Xuất báo cáo điểm danh"
      description="Từ màn hình Overview, chọn Xuất báo cáo điểm danh → Hiển thị màn hình Xuất báo cáo điểm danh"
      menuItems={menuItems}
      activeKey="attendance"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {notice.text && (
        <Alert severity={notice.type === 'success' ? 'success' : 'error'} sx={{ mb: 2 }}>
          {notice.text}
        </Alert>
      )}

      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <FileDownloadIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
            <Typography variant="h6" fontWeight={700} color="text.primary">
              Export Attendance Report
            </Typography>
          </Stack>

          {/* Section 1: Phạm vi báo cáo */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <SectionBadge number={1} />
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                Phạm vi báo cáo
              </Typography>
            </Stack>
            <Stack spacing={2} sx={{ ml: 5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Loại báo cáo</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value);
                    setSelectedClass('');
                    setSelectedStudent('');
                  }}
                  label="Loại báo cáo"
                >
                  <MenuItem value="whole-school">Toàn trường</MenuItem>
                  <MenuItem value="by-class">Theo lớp</MenuItem>
                  <MenuItem value="by-student">Theo học sinh</MenuItem>
                </Select>
              </FormControl>

              {(reportType === 'by-class' || reportType === 'by-student') && (
                <FormControl fullWidth size="small">
                  <InputLabel>Chọn lớp (nếu có)</InputLabel>
                  <Select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedStudent('');
                    }}
                    label="Chọn lớp (nếu có)"
                  >
                    <MenuItem value="">- Không -</MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.className}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {reportType === 'by-student' && (
                <FormControl fullWidth size="small" disabled={!selectedClass}>
                  <InputLabel>Chọn học sinh (nếu có)</InputLabel>
                  <Select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    label="Chọn học sinh (nếu có)"
                  >
                    <MenuItem value="">- Không -</MenuItem>
                    {students.map((student) => (
                      <MenuItem key={student._id} value={student._id}>
                        {student.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Section 2: Thời gian */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <SectionBadge number={2} />
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                Thời gian
              </Typography>
            </Stack>
            <Box
              sx={{
                ml: 5,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                type="date"
                size="small"
                label="Từ ngày"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary' }} />,
                }}
                fullWidth
              />
              <TextField
                type="date"
                size="small"
                label="Đến ngày"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary' }} />,
                }}
                fullWidth
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Section 3: Nội dung báo cáo */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <SectionBadge number={3} />
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                Nội dung báo cáo
              </Typography>
            </Stack>
            <Box sx={{ ml: 5 }}>
              <List dense disablePadding>
                {[
                  'Thông tin trường / lớp',
                  'Danh sách học sinh',
                  'Giờ đến – giờ về',
                  'Người đưa / người đón',
                  'Trạng thái điểm danh',
                  'Tổng hợp số ngày có mặt / nghỉ',
                ].map((item) => (
                  <ListItem key={item} disablePadding sx={{ py: 0.25 }}>
                    <Typography variant="body2" color="text.secondary">
                      • {item}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>

          {/* Button Xuất báo cáo */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleExport}
              disabled={loading || isExporting}
              startIcon={
                isExporting
                  ? <CircularProgress size={18} color="inherit" />
                  : <FileDownloadIcon />
              }
              sx={{ px: 4, fontWeight: 600, minWidth: 180 }}
            >
              {isExporting ? 'Đang xuất...' : 'Xuất báo cáo'}
            </Button>
          </Box>
        </Paper>

        {/* Nút quay lại */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="inherit"
            size="large"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/school-admin/attendance/overview')}
            sx={{ px: 4, fontWeight: 600, bgcolor: 'grey.700', color: 'white', '&:hover': { bgcolor: 'grey.800' } }}
          >
            Quay lại
          </Button>
        </Box>
      </Box>
    </RoleLayout>
  );
}

export default ExportAttendanceReport;
