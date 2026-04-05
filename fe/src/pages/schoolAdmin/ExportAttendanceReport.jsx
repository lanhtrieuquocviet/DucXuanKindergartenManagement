import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  RadioGroup,
  FormControlLabel,
  Radio,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const PDF_FONT_FAMILY = 'NotoSans';
const PDF_FONT_FILE = 'NotoSans-Variable.ttf';
const PDF_FONT_URL = `${import.meta.env.BASE_URL}fonts/${PDF_FONT_FILE}`;

const arrayBufferToBinaryString = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return binary;
};

const registerVietnameseFont = async (doc) => {
  const fontList = doc.getFontList?.() || {};
  if (fontList[PDF_FONT_FAMILY]) return;

  const fontResponse = await fetch(PDF_FONT_URL);
  if (!fontResponse.ok) {
    throw new Error('Không thể tải font PDF để hiển thị tiếng Việt');
  }

  const fontBuffer = await fontResponse.arrayBuffer();
  const fontBinary = arrayBufferToBinaryString(fontBuffer);

  doc.addFileToVFS(PDF_FONT_FILE, fontBinary);
  doc.addFont(PDF_FONT_FILE, PDF_FONT_FAMILY, 'normal');
  // Dùng cùng file variable font cho style bold để tránh phụ thuộc tải nhiều file.
  doc.addFont(PDF_FONT_FILE, PDF_FONT_FAMILY, 'bold');
};

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
  const [exportFormat, setExportFormat] = useState('excel'); // pdf, excel
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

  // Lấy dữ liệu điểm danh theo filter
  const fetchAttendanceData = async () => {
    try {
      let allAttendanceData = [];

      // Hàm helper để format thời gian
      const formatTime = (timeStr, timeObj) => {
        if (timeStr && /^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
        if (timeObj) {
          try {
            const d = new Date(timeObj);
            if (!isNaN(d.getTime())) {
              return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            }
          } catch {}
        }
        return '—';
      };

      if (reportType === 'whole-school') {
        // Lấy tất cả lớp
        const classesResponse = await getClasses();
        const allClasses = Array.isArray(classesResponse?.data) ? classesResponse.data : [];

        // Lấy điểm danh cho từng lớp, lặp qua từng ngày
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const currentDate = d.toISOString().split('T')[0];

          for (const cls of allClasses) {
            try {
              const response = await get(`${ENDPOINTS.SCHOOL_ADMIN.CLASS_ATTENDANCE_DETAIL(cls._id)}?date=${currentDate}`);
              if (response?.data?.students) {
                response.data.students.forEach((student) => {
                  if (student.attendance) {
                    allAttendanceData.push({
                      className: response.data.classInfo?.className || '',
                      studentName: student.fullName,
                      date: currentDate,
                      checkIn: formatTime(student.attendance.timeString?.checkIn, student.attendance.time?.checkIn),
                      checkOut: formatTime(student.attendance.timeString?.checkOut, student.attendance.time?.checkOut),
                      deliverer: student.attendance.delivererType || '—',
                      receiver: student.attendance.receiverType || '—',
                      status: student.attendance.status === 'present' ? 'Có mặt' : 'Nghỉ học',
                    });
                  }
                });
              }
            } catch (err) {
              console.error(`Error fetching attendance for class ${cls._id} on ${currentDate}:`, err);
            }
          }
        }
      } else if (reportType === 'by-class' && selectedClass) {
        // Lặp qua từng ngày
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const currentDate = d.toISOString().split('T')[0];
          try {
            const response = await get(`${ENDPOINTS.SCHOOL_ADMIN.CLASS_ATTENDANCE_DETAIL(selectedClass)}?date=${currentDate}`);
            if (response?.data?.students) {
              response.data.students.forEach((student) => {
                if (student.attendance) {
                  allAttendanceData.push({
                    className: response.data.classInfo?.className || '',
                    studentName: student.fullName,
                    date: currentDate,
                    checkIn: formatTime(student.attendance.timeString?.checkIn, student.attendance.time?.checkIn),
                    checkOut: formatTime(student.attendance.timeString?.checkOut, student.attendance.time?.checkOut),
                    deliverer: student.attendance.delivererType || '—',
                    receiver: student.attendance.receiverType || '—',
                    status: student.attendance.status === 'present' ? 'Có mặt' : 'Nghỉ học',
                  });
                }
              });
            }
          } catch (err) {
            console.error(`Error fetching attendance for class ${selectedClass} on ${currentDate}:`, err);
          }
        }
      } else if (reportType === 'by-student' && selectedStudent) {
        // Sử dụng API history đã hỗ trợ khoảng thời gian
        const params = { from: fromDate, to: toDate };
        const response = await get(`${ENDPOINTS.SCHOOL_ADMIN.STUDENT_ATTENDANCE_HISTORY(selectedStudent)}?${new URLSearchParams(params).toString()}`);
        if (response?.data?.attendances) {
          const studentInfo = response.data.studentInfo;
          response.data.attendances.forEach((attendance) => {
            allAttendanceData.push({
              className: studentInfo?.className || '',
              studentName: studentInfo?.fullName || '',
              date: attendance.date,
              checkIn: formatTime(attendance.timeString?.checkIn, attendance.time?.checkIn),
              checkOut: formatTime(attendance.timeString?.checkOut, attendance.time?.checkOut),
              deliverer: attendance.delivererType || '—',
              receiver: attendance.receiverType || '—',
              status: attendance.status === 'present' ? 'Có mặt' : 'Nghỉ học',
            });
          });
        }
      }

      return allAttendanceData;
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      throw err;
    }
  };

  // Xuất ra PDF
  const exportToPDF = async (data) => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      await registerVietnameseFont(doc);

      // Format ngày
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Tiêu đề
      doc.setFontSize(16);
      doc.setFont(PDF_FONT_FAMILY, 'bold');
      doc.text('BÁO CÁO ĐIỂM DANH', 148, 15, { align: 'center' });

      // Thông tin báo cáo
      doc.setFontSize(10);
      doc.setFont(PDF_FONT_FAMILY, 'normal');
      let yPos = 25;

      const reportTypeText =
        reportType === 'whole-school' ? 'Toàn trường' :
        reportType === 'by-class' ? `Lớp: ${classes.find(c => c._id === selectedClass)?.className || ''}` :
        `Học sinh: ${students.find(s => s._id === selectedStudent)?.fullName || ''}`;

      doc.text(`Phạm vi: ${reportTypeText}`, 20, yPos);
      yPos += 5;
      doc.text(`Từ ngày: ${formatDate(fromDate)}`, 20, yPos);
      yPos += 5;
      doc.text(`Đến ngày: ${formatDate(toDate)}`, 20, yPos);
      yPos += 10;

      // Bảng chi tiết điểm danh
      const tableData = data.map((item) => [
        item.className,
        item.studentName,
        formatDate(item.date),
        item.checkIn,
        item.checkOut,
        item.deliverer,
        item.receiver,
        item.status,
      ]);

      autoTable(doc, {
        head: [['Lớp', 'Học sinh', 'Ngày', 'Giờ đến', 'Giờ về', 'Người đưa', 'Người đón', 'Trạng thái']],
        body: tableData,
        startY: yPos,
        styles: { fontSize: 8, font: PDF_FONT_FAMILY },
        headStyles: { fillColor: [34, 139, 34], textColor: 255, fontStyle: 'bold', font: PDF_FONT_FAMILY },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: yPos, left: 20, right: 20 },
        didDrawPage: function (data) {
          // Thêm số trang
          doc.setFont(PDF_FONT_FAMILY, 'normal');
          doc.setFontSize(8);
          doc.text(
            `Trang ${data.pageNumber}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        },
      });

      // Tổng hợp
      const lastY = doc.lastAutoTable.finalY + 10;
      if (lastY > 180) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos = lastY;
      }

      doc.setFontSize(12);
      doc.setFont(PDF_FONT_FAMILY, 'bold');
      doc.text('TỔNG HỢP', 148, yPos, { align: 'center' });
      yPos += 8;

      // Tính tổng hợp
      const studentSummary = {};
      data.forEach((item) => {
        const key = `${item.className}_${item.studentName}`;
        if (!studentSummary[key]) {
          studentSummary[key] = {
            className: item.className,
            studentName: item.studentName,
            present: 0,
            absent: 0,
          };
        }
        if (item.status === 'Có mặt') {
          studentSummary[key].present++;
        } else {
          studentSummary[key].absent++;
        }
      });

      const summaryTableData = Object.values(studentSummary).map((summary) => [
        summary.className,
        summary.studentName,
        summary.present.toString(),
        summary.absent.toString(),
        (summary.present + summary.absent).toString(),
      ]);

      autoTable(doc, {
        head: [['Lớp', 'Học sinh', 'Số ngày có mặt', 'Số ngày nghỉ', 'Tổng ngày']],
        body: summaryTableData,
        startY: yPos,
        styles: { fontSize: 8, font: PDF_FONT_FAMILY },
        headStyles: { fillColor: [34, 139, 34], textColor: 255, fontStyle: 'bold', font: PDF_FONT_FAMILY },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: yPos, left: 20, right: 20 },
        didDrawPage: function (data) {
          doc.setFont(PDF_FONT_FAMILY, 'normal');
          doc.setFontSize(8);
          doc.text(
            `Trang ${data.pageNumber}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        },
      });

      // Tạo tên file
      const fileName = `Bao_cao_diem_danh_${fromDate}_${toDate}.pdf`;

      // Xuất file
      doc.save(fileName);
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      throw err;
    }
  };

  // Xuất ra Excel
  const exportToExcel = async (data) => {
    try {
      // Tạo workbook
      const wb = XLSX.utils.book_new();

      // Format ngày
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Chuẩn bị dữ liệu cho Excel
      const excelData = data.map((item) => ({
        'Lớp': item.className,
        'Học sinh': item.studentName,
        'Ngày': formatDate(item.date),
        'Giờ đến': item.checkIn,
        'Giờ về': item.checkOut,
        'Người đưa': item.deliverer,
        'Người đón': item.receiver,
        'Trạng thái': item.status,
      }));

      // Tạo worksheet từ dữ liệu
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Đặt độ rộng cột
      const colWidths = [
        { wch: 20 }, // Lớp
        { wch: 25 }, // Học sinh
        { wch: 12 }, // Ngày
        { wch: 10 }, // Giờ đến
        { wch: 10 }, // Giờ về
        { wch: 15 }, // Người đưa
        { wch: 15 }, // Người đón
        { wch: 12 }, // Trạng thái
      ];
      ws['!cols'] = colWidths;

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo điểm danh');

      // Tạo sheet tổng hợp
      const summaryData = [];
      const studentSummary = {};

      data.forEach((item) => {
        const key = `${item.className}_${item.studentName}`;
        if (!studentSummary[key]) {
          studentSummary[key] = {
            className: item.className,
            studentName: item.studentName,
            present: 0,
            absent: 0,
          };
        }
        if (item.status === 'Có mặt') {
          studentSummary[key].present++;
        } else {
          studentSummary[key].absent++;
        }
      });

      summaryData.push(['Lớp', 'Học sinh', 'Số ngày có mặt', 'Số ngày nghỉ', 'Tổng ngày']);
      Object.values(studentSummary).forEach((summary) => {
        summaryData.push([
          summary.className,
          summary.studentName,
          summary.present,
          summary.absent,
          summary.present + summary.absent,
        ]);
      });

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [
        { wch: 20 }, // Lớp
        { wch: 25 }, // Học sinh
        { wch: 15 }, // Số ngày có mặt
        { wch: 15 }, // Số ngày nghỉ
        { wch: 12 }, // Tổng ngày
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng hợp');

      // Tạo tên file
      const fileName = `Bao_cao_diem_danh_${fromDate}_${toDate}.xlsx`;

      // Xuất file
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      throw err;
    }
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

      if (exportFormat === 'excel') {
        // Xuất ra Excel
        await exportToExcel(attendanceData);
        setNotice({ type: 'success', text: 'Xuất báo cáo Excel thành công!' });
      } else if (exportFormat === 'pdf') {
        // Xuất ra PDF
        await exportToPDF(attendanceData);
        setNotice({ type: 'success', text: 'Xuất báo cáo PDF thành công!' });
      }
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

          {/* Section 3: Định dạng xuất */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <SectionBadge number={3} />
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                Định dạng xuất
              </Typography>
            </Stack>
            <Box sx={{ ml: 5 }}>
              <RadioGroup
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <FormControlLabel
                  value="pdf"
                  control={<Radio size="small" color="primary" />}
                  label={<Typography variant="body2" fontWeight={500}>PDF</Typography>}
                />
                <FormControlLabel
                  value="excel"
                  control={<Radio size="small" color="primary" />}
                  label={<Typography variant="body2" fontWeight={500}>Excel (.xlsx)</Typography>}
                />
              </RadioGroup>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Section 4: Nội dung báo cáo */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <SectionBadge number={4} />
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
