import * as XLSX from 'xlsx';

const days = ["mon", "tue", "wed", "thu", "fri"];
const dayMap = {
  mon: "Thứ Hai",
  tue: "Thứ Ba",
  wed: "Thứ Tư",
  thu: "Thứ Năm",
  fri: "Thứ Sáu",
};

const mealTypeMap = {
  lunchFoods: "Bữa trưa",
  afternoonFoods: "Bữa chiều"
};

/**
 * Generates and downloads an Excel template for menu import
 * @param {string} month - Month number
 * @param {string} year - Year number
 */
export const downloadMenuTemplate = (month, year) => {
  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 },  // Day column
      { wch: 25 },  // Odd week - Lunch
      { wch: 25 },  // Odd week - Afternoon
      { wch: 25 },  // Even week - Lunch
      { wch: 25 }   // Even week - Afternoon
    ];

    // Create headers
    const headers = [
      ['Thứ', 'Tuần lẻ - Bữa trưa', 'Tuần lẻ - Bữa chiều', 'Tuần chẵn - Bữa trưa', 'Tuần chẵn - Bữa chiều']
    ];

    // Add day rows
    const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'];
    dayNames.forEach(dayName => {
      headers.push([dayName, '', '', '', '']);
    });

    // Convert to sheet
    XLSX.utils.sheet_add_aoa(ws, headers);

    // Style header row
    for (let col = 0; col < 5; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      ws[cellAddress] = {
        t: 's',
        v: headers[0][col],
        s: {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4F46E5' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
        }
      };
    }

    // Style day column
    for (let row = 1; row < headers.length; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
      ws[cellAddress] = {
        t: 's',
        v: headers[row][0],
        s: {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E8EAED' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        }
      };
      
      // Set row height for better readability
      ws['!rows'] = ws['!rows'] || [];
      ws['!rows'][row] = { hpt: 60 };
    }

    // Add data cells with borders and default styling
    for (let row = 1; row < headers.length; row++) {
      for (let col = 1; col < 5; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        ws[cellAddress] = {
          t: 's',
          v: '(Nhập tên món, cách nhau bằng ;)',
          s: {
            alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            }
          }
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, `Thuc_don`);
    XLSX.writeFile(wb, `Mau_Nhap_Thuc_Don_${month}_${year}.xlsx`);
  } catch (error) {
    console.error('Error creating template:', error);
    throw new Error('Không thể tạo biểu mẫu: ' + error.message);
  }
};

/**
 * Exports current menu data to Excel for editing (new format)
 * @param {object} menuData - Menu data object with weeks, month, year
 */
export const exportMenuToExcel = (menuData) => {
  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    const { weeks, month, year } = menuData;

    // Set column widths
    ws['!cols'] = [
      { wch: 12 },  // Day column
      { wch: 25 },  // Odd week - Lunch
      { wch: 25 },  // Odd week - Afternoon
      { wch: 25 },  // Even week - Lunch
      { wch: 25 }   // Even week - Afternoon
    ];

    // Create headers
    const headers = [
      ['Thứ', 'Tuần lẻ - Bữa trưa', 'Tuần lẻ - Bữa chiều', 'Tuần chẵn - Bữa trưa', 'Tuần chẵn - Bữa chiều']
    ];

    // Add day rows with data
    const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'];
    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri'];

    dayKeys.forEach((dayKey, idx) => {
      const dayName = dayNames[idx];
      
      // Get foods for each column
      const oddLunch = (weeks?.odd?.[dayKey]?.lunchFoods || []).map(f => f.name).join('; ');
      const oddAfternoon = (weeks?.odd?.[dayKey]?.afternoonFoods || []).map(f => f.name).join('; ');
      const evenLunch = (weeks?.even?.[dayKey]?.lunchFoods || []).map(f => f.name).join('; ');
      const evenAfternoon = (weeks?.even?.[dayKey]?.afternoonFoods || []).map(f => f.name).join('; ');

      headers.push([dayName, oddLunch, oddAfternoon, evenLunch, evenAfternoon]);
    });

    // Convert to sheet
    XLSX.utils.sheet_add_aoa(ws, headers);

    // Style header row
    for (let col = 0; col < 5; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      ws[cellAddress] = {
        t: 's',
        v: headers[0][col],
        s: {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4F46E5' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
        }
      };
    }

    // Style day column and data cells
    for (let row = 1; row < headers.length; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
      ws[cellAddress] = {
        t: 's',
        v: headers[row][0],
        s: {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E8EAED' } },
          alignment: { horizontal: 'center', vertical: 'top' }
        }
      };
      
      // Set row height
      ws['!rows'] = ws['!rows'] || [];
      ws['!rows'][row] = { hpt: 60 };

      // Style data cells
      for (let col = 1; col < 5; col++) {
        const dataCellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        ws[dataCellAddress] = {
          t: 's',
          v: headers[row][col] || '',
          s: {
            alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            }
          }
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, `Thuc_don`);
    XLSX.writeFile(wb, `Thuc_Don_${month}_${year}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error exporting menu:', error);
    throw new Error('Không thể xuất thực đơn: ' + error.message);
  }
};
