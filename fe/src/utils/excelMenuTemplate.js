const LAST_COL = "E";
const dayRows = [
  { key: "mon", label: "Thứ Hai" },
  { key: "tue", label: "Thứ Ba" },
  { key: "wed", label: "Thứ Tư" },
  { key: "thu", label: "Thứ Năm" },
  { key: "fri", label: "Thứ Sáu" },
];

async function buildMenuWorkbook({ month, year, menuData }) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Trường MN Đức Xuân";
  wb.created = new Date();

  const ws = wb.addWorksheet("Thực đơn", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    views: [{ state: "frozen", xSplit: 0, ySplit: 7 }],
  });

  ws.columns = [{ width: 14 }, { width: 28 }, { width: 28 }, { width: 28 }, { width: 28 }];

  const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
  const font = (size, bold, color = "212121", italic = false) => ({
    name: "Times New Roman",
    size,
    bold,
    italic,
    color: { argb: color },
  });
  const border = (style = "thin", color = "B0BEC5") => ({ style, color: { argb: color } });
  const allBorders = (style = "thin", color = "B0BEC5") => ({
    top: border(style, color),
    bottom: border(style, color),
    left: border(style, color),
    right: border(style, color),
  });
  const align = (h, v = "middle", wrap = true) => ({ horizontal: h, vertical: v, wrapText: wrap });

  ws.mergeCells(`A1:${LAST_COL}1`);
  ws.getCell("A1").value = "TRƯỜNG MẦM NON ĐỨC XUÂN";
  ws.getCell("A1").fill = fill("1565C0");
  ws.getCell("A1").font = font(14, true, "FFFFFF");
  ws.getCell("A1").alignment = align("center");
  ws.getRow(1).height = 26;

  ws.mergeCells(`A2:${LAST_COL}2`);
  ws.getCell("A2").value = `THỰC ĐƠN THÁNG ${month}/${year} – MẪU NHẬP DỮ LIỆU`;
  ws.getCell("A2").fill = fill("1976D2");
  ws.getCell("A2").font = font(13, true, "FFFFFF");
  ws.getCell("A2").alignment = align("center");
  ws.getRow(2).height = 24;

  ws.mergeCells(`A3:${LAST_COL}3`);
  ws.getCell("A3").value =
    "  Hướng dẫn: Nhập tên món ăn cho từng ô, cách nhau bằng dấu ';'. " +
    "Không xóa dòng tiêu đề cột và cột 'Thứ'. File .xlsx dùng để Import vào hệ thống Quản lý thực đơn.";
  ws.getCell("A3").fill = fill("E3F2FD");
  ws.getCell("A3").font = font(9, false, "1565C0", true);
  ws.getCell("A3").alignment = align("left");
  ws.getRow(3).height = 34;

  ws.addRow([]);
  ws.getRow(4).height = 6;

  const headers = [
    ["A5", "Thứ"],
    ["B5", "Tuần lẻ - Bữa trưa"],
    ["C5", "Tuần lẻ - Bữa chiều"],
    ["D5", "Tuần chẵn - Bữa trưa"],
    ["E5", "Tuần chẵn - Bữa chiều"],
  ];
  ws.getRow(5).height = 28;
  headers.forEach(([addr, text]) => {
    const col = addr[0];
    ws.mergeCells(`${addr}:${col}6`);
    const cell = ws.getCell(addr);
    cell.value = text;
    cell.fill = fill("1565C0");
    cell.font = font(10, true, "FFFFFF");
    cell.alignment = align("center");
    cell.border = allBorders("medium", "90CAF9");
  });

  ws.addRow([]);
  ws.getRow(7).height = 16;
  const hints = ["", "VD: Bún bò; Sữa chua", "VD: Bánh flan", "VD: Cơm gà", "VD: Cháo cá"];
  hints.forEach((text, idx) => {
    const cell = ws.getRow(7).getCell(idx + 1);
    cell.value = text;
    cell.fill = fill("E3F2FD");
    cell.font = font(9, false, "546E7A", true);
    cell.alignment = align("center");
    cell.border = allBorders("thin", "B0BEC5");
  });

  dayRows.forEach(({ key, label }) => {
    const oddLunch = (menuData?.weeks?.odd?.[key]?.lunchFoods || []).map((f) => f.name).join("; ");
    const oddAfternoon = (menuData?.weeks?.odd?.[key]?.afternoonFoods || []).map((f) => f.name).join("; ");
    const evenLunch = (menuData?.weeks?.even?.[key]?.lunchFoods || []).map((f) => f.name).join("; ");
    const evenAfternoon = (menuData?.weeks?.even?.[key]?.afternoonFoods || []).map((f) => f.name).join("; ");
    const row = ws.addRow([
      label,
      oddLunch || "(Nhập tên món, cách nhau bằng ;)",
      oddAfternoon || "(Nhập tên món, cách nhau bằng ;)",
      evenLunch || "(Nhập tên món, cách nhau bằng ;)",
      evenAfternoon || "(Nhập tên món, cách nhau bằng ;)",
    ]);
    row.height = 54;

    row.eachCell({ includeEmpty: true }, (cell, colNo) => {
      if (colNo === 1) {
        cell.fill = fill("F5F7FA");
        cell.font = font(10, true, "263238");
        cell.alignment = align("center", "middle");
      } else {
        const isHint = String(cell.value || "").includes("(Nhập");
        cell.fill = fill("FFFFFF");
        cell.font = isHint ? font(10, false, "607D8B", true) : font(10, false, "212121");
        cell.alignment = align("left", "top");
      }
      cell.border = allBorders("thin", "CFD8DC");
    });
  });

  const footer = ws.addRow([]);
  ws.mergeCells(`A${footer.number}:${LAST_COL}${footer.number}`);
  ws.getCell(`A${footer.number}`).value =
    `Mẫu / xuất từ hệ thống Quản lý thực đơn – Trường MN Đức Xuân  |  ${new Date().toLocaleDateString("vi-VN")}`;
  ws.getCell(`A${footer.number}`).fill = fill("ECEFF1");
  ws.getCell(`A${footer.number}`).font = font(9, false, "90A4AE", true);
  ws.getCell(`A${footer.number}`).alignment = align("right");
  ws.getRow(footer.number).height = 14;

  return wb;
}

export const downloadMenuTemplate = async (month, year) => {
  try {
    const wb = await buildMenuWorkbook({ month, year, menuData: null });
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Mau_Nhap_Thuc_Don_${month}_${year}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error creating template:", error);
    throw new Error("Không thể tạo biểu mẫu: " + error.message);
  }
};

export const exportMenuToExcel = async (menuData) => {
  try {
    const { month, year } = menuData || {};
    const wb = await buildMenuWorkbook({ month, year, menuData });
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Thuc_Don_${month}_${year}_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting menu:", error);
    throw new Error("Không thể xuất thực đơn: " + error.message);
  }
};
