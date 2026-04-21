import { toast } from 'react-toastify';

export const handleDownloadTemplate = async () => {
  try {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Trường MN Đức Xuân';
    wb.created = new Date();

    const ws = wb.addWorksheet('Mẫu nhập học sinh', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 6 }],
    });

    ws.columns = [
      { key: 'A', width: 28 },
      { key: 'B', width: 30 },
      { key: 'C', width: 24 },
      { key: 'D', width: 26 },
      { key: 'E', width: 14 },
      { key: 'F', width: 14 },
      { key: 'G', width: 24 },
      { key: 'H', width: 36 },
      { key: 'I', width: 18 },
    ];

    const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
    const font = (size, bold, color = '212121', italic = false) => ({
      name: 'Times New Roman',
      size,
      bold,
      italic,
      color: { argb: color },
    });
    const border = (style = 'thin', color = 'B0BEC5') => ({ style, color: { argb: color } });
    const allBorders = (style = 'thin', color = 'B0BEC5') => ({
      top: border(style, color),
      bottom: border(style, color),
      left: border(style, color),
      right: border(style, color),
    });
    const align = (horizontal = 'center', vertical = 'middle', wrapText = true) => ({
      horizontal,
      vertical,
      wrapText,
    });

    ws.mergeCells('A1:I1');
    ws.getCell('A1').value = 'TRƯỜNG MẦM NON ĐỨC XUÂN';
    ws.getCell('A1').fill = fill('1565C0');
    ws.getCell('A1').font = font(14, true, 'FFFFFF');
    ws.getCell('A1').alignment = align('center');
    ws.getRow(1).height = 26;

    ws.mergeCells('A2:I2');
    ws.getCell('A2').value = 'DANH SÁCH HỌC SINH - PHỤ HUYNH (MẪU NHẬP EXCEL)';
    ws.getCell('A2').fill = fill('1976D2');
    ws.getCell('A2').font = font(13, true, 'FFFFFF');
    ws.getCell('A2').alignment = align('center');
    ws.getRow(2).height = 24;

    ws.mergeCells('A3:I3');
    ws.getCell('A3').value =
      'Hướng dẫn: Chỉ nhập ở các dòng dữ liệu bên dưới. Cột bắt buộc gồm Họ tên phụ huynh, Email phụ huynh, Số điện thoại phụ huynh, Họ tên học sinh, Ngày sinh, Giới tính.';
    ws.getCell('A3').fill = fill('E3F2FD');
    ws.getCell('A3').font = font(9, false, '1565C0', true);
    ws.getCell('A3').alignment = align('left');
    ws.getRow(3).height = 20;

    ws.mergeCells('A4:I4');
    ws.getCell('A4').value =
      'Quy ước: Giới tính nhận Nam/Nữ/Khác (hoặc male/female/other). Ngày sinh theo định dạng YYYY-MM-DD.';
    ws.getCell('A4').fill = fill('E8F5E9');
    ws.getCell('A4').font = font(9, false, '2E7D32', true);
    ws.getCell('A4').alignment = align('left');
    ws.getRow(4).height = 18;

    const headers = [
      'Họ tên phụ huynh',
      'Email phụ huynh',
      'Số điện thoại phụ huynh',
      'Họ tên học sinh',
      'Ngày sinh',
      'Giới tính',
      'Địa chỉ',
      'Ảnh học sinh (URL)',
      'Lớp',
    ];
    ws.addRow(headers);
    ws.getRow(5).height = 24;
    ws.getRow(5).eachCell((cell) => {
      cell.fill = fill('0D47A1');
      cell.font = font(10, true, 'FFFFFF');
      cell.alignment = align('center');
      cell.border = allBorders('medium', '90CAF9');
    });

    const sampleRows = [
      [
        'Nguyễn Văn A',
        'phuhuynh.a@example.com',
        '0987654321',
        'Nguyễn Thị B',
        '2020-09-01',
        'Nữ',
        'Bắc Kạn',
        '',
        'Mẫu giáo 1',
      ],
      [
        'Nguyễn Văn A',
        'phuhuynh.a@example.com',
        '0987654321',
        'Nguyễn Văn C',
        '2021-03-15',
        'Nam',
        'Bắc Kạn',
        '',
        'Mẫu giáo 1',
      ],
    ];
    sampleRows.forEach((row) => ws.addRow(row));

    for (let r = 6; r <= 30; r += 1) {
      if (r > 7) ws.addRow(new Array(9).fill(''));
      const row = ws.getRow(r);
      row.height = 20;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = allBorders('thin', 'CFD8DC');
        cell.alignment = align(colNumber === 8 ? 'left' : 'center');
        cell.fill = fill(r % 2 === 0 ? 'FFFFFF' : 'FAFAFA');
        cell.font = font(10, false, colNumber <= 3 ? '1565C0' : '212121');
        if (colNumber === 5) cell.numFmt = 'yyyy-mm-dd';
      });
    }

    ws.mergeCells('A31:I31');
    ws.getCell('A31').value = `Mẫu tải từ hệ thống lúc ${new Date().toLocaleString('vi-VN')}`;
    ws.getCell('A31').fill = fill('ECEFF1');
    ws.getCell('A31').font = font(9, false, '607D8B', true);
    ws.getCell('A31').alignment = align('right');
    ws.getRow(31).height = 16;

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau_nhap_hoc_sinh_phu_huynh.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Tải file mẫu thành công');
  } catch (err) {
    toast.error(`Không tải được file mẫu: ${err?.message || ''}`);
  }
};
