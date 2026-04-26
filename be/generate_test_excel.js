const ExcelJS = require('exceljs');

async function createTestExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('DanhSachHocSinh');

  // Set column widths
  worksheet.columns = [
    { width: 25 }, // A: Họ tên phụ huynh
    { width: 30 }, // B: Email phụ huynh
    { width: 20 }, // C: Số điện thoại phụ huynh
    { width: 25 }, // D: Họ tên học sinh
    { width: 15 }, // E: Ngày sinh
    { width: 15 }, // F: Giới tính
    { width: 20 }, // G: Địa chỉ
    { width: 20 }, // H: Ảnh học sinh (URL)
    { width: 15 }, // I: Lớp
  ];

  // Add decorative headers (Rows 1-4)
  worksheet.mergeCells('A1:I1');
  const title1 = worksheet.getCell('A1');
  title1.value = 'TRƯỜNG MẦM NON ĐỨC XUÂN';
  title1.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };
  title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } }; // Blue background

  worksheet.mergeCells('A2:I2');
  const title2 = worksheet.getCell('A2');
  title2.value = 'DANH SÁCH HỌC SINH - PHỤ HUYNH (MẪU NHẬP EXCEL)';
  title2.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };

  worksheet.mergeCells('A3:I3');
  const title3 = worksheet.getCell('A3');
  title3.value = 'Hướng dẫn: Chỉ nhập ở các dòng dữ liệu bên dưới. Cột bắt buộc gồm Họ tên phụ huynh, Email phụ huynh, Số điện thoại phụ huynh, Họ tên học sinh, Ngày sinh, Giới tính.';
  title3.font = { italic: true, color: { argb: 'FF0D47A1' } };
  title3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };

  worksheet.mergeCells('A4:I4');
  const title4 = worksheet.getCell('A4');
  title4.value = 'Quy ước: Giới tính nhận Nam/Nữ/Khác (hoặc male/female/other). Ngày sinh theo định dạng YYYY-MM-DD.';
  title4.font = { italic: true, color: { argb: 'FF1B5E20' } };
  title4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };

  // Add actual headers (Row 5)
  const headers = [
    'Họ tên phụ huynh', 'Email phụ huynh', 'Số điện thoại phụ huynh', 
    'Họ tên học sinh', 'Ngày sinh', 'Giới tính', 'Địa chỉ', 'Ảnh học sinh (URL)', 'Lớp'
  ];
  const headerRow = worksheet.getRow(5);
  headerRow.values = headers;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Style header row cells
  for (let i = 1; i <= 9; i++) {
    const cell = headerRow.getCell(i);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D47A1' } };
  }

  // Add sample data (Rows 6+)
  const data = [
    ['Nguyễn Văn A', 'phuhuynh.a@example.com', '0987654321', 'Nguyễn Thị B', '2020-09-01', 'Nữ', 'Bắc Kạn', '', 'Mẫu giáo 1'],
    ['Nguyễn Văn A', 'phuhuynh.a@example.com', '0987654321', 'Nguyễn Văn C', '2021-03-15', 'Nam', 'Bắc Kạn', '', 'Mẫu giáo 1'],
    ['Trần Thị D', 'phuhuynh.d@example.com', '0912345678', 'Lê Văn E', '2020-05-20', 'Nam', 'Bắc Kạn', '', 'Mầm 2'],
    ['Phạm Văn F', 'phuhuynh.f@example.com', '0933445566', 'Phạm Thị G', '2019-11-10', 'Nữ', 'Bắc Kạn', '', 'Mẫu giáo 2']
  ];

  data.forEach((rowData, index) => {
    const row = worksheet.addRow(rowData);
    row.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Save the file
  const filePath = './Test_Import_Students.xlsx';
  await workbook.xlsx.writeFile(filePath);
  console.log(`Đã tạo file Excel thành công tại: ${filePath}`);
}

createTestExcel().catch(console.error);
