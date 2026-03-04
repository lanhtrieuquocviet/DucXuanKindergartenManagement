import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { get, ENDPOINTS } from '../../service/api';

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

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
    { key: 'classes', label: 'Lớp học' },
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

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'classes') {
      navigate('/school-admin/classes');
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
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      {notice.text && (
        <div
          className={`mb-4 rounded-md px-4 py-2 text-sm ${
            notice.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">📤</span>
            <h2 className="text-xl font-bold text-gray-800">Export Attendance Report</h2>
          </div>

          {/* Section 1: Phạm vi báo cáo */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Phạm vi báo cáo</h3>
            </div>
            <div className="ml-10 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Loại báo cáo
                </label>
                <select
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value);
                    setSelectedClass('');
                    setSelectedStudent('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="whole-school">Toàn trường</option>
                  <option value="by-class">Theo lớp</option>
                  <option value="by-student">Theo học sinh</option>
                </select>
              </div>

              {(reportType === 'by-class' || reportType === 'by-student') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Chọn lớp (nếu có)
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedStudent('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">- Không -</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.className}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {reportType === 'by-student' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Chọn học sinh (nếu có)
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    disabled={!selectedClass}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">- Không -</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Thời gian */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Thời gian</h3>
            </div>
            <div className="ml-10 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Từ ngày
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400">📅</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Đến ngày
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400">📅</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Định dạng xuất */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Định dạng xuất</h3>
            </div>
            <div className="ml-10 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">PDF</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Excel (.xlsx)</span>
              </label>
            </div>
          </div>

          {/* Section 4: Nội dung báo cáo */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Nội dung báo cáo</h3>
            </div>
            <div className="ml-10">
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Thông tin trường / lớp</li>
                <li>Danh sách học sinh</li>
                <li>Giờ đến – giờ về</li>
                <li>Người đưa / người đón</li>
                <li>Trạng thái điểm danh</li>
                <li>Tổng hợp số ngày có mặt / nghỉ</li>
              </ul>
            </div>
          </div>

          {/* Button Xuất báo cáo */}
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || isExporting}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xuất...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">1</span>
                  <span>Xuất báo cáo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nút quay lại */}
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              navigate('/school-admin/attendance/overview');
            }}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>Quay lại</span>
          </button>
        </div>
      </div>
    </RoleLayout>
  );
}

export default ExportAttendanceReport;
