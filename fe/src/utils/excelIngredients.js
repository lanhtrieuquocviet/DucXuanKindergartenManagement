/**
 * Excel nguyên liệu — cùng phong cách form Báo cáo cơ sở vật chất (ExcelJS).
 * Toàn bộ nhãn tiếng Việt.
 */
import { INGREDIENT_GROUPS } from "../constants/ingredientCategories";

const LAST_COL = "F";

/** Tiêu đề dòng nhóm trong file (dùng khi import: nhận diện theo số thứ tự 1. … 5.) */
export function excelSectionRowTitle(group) {
  return `${group.order}. ${group.title} — ${group.hint}`;
}

function cellText(cell) {
  if (!cell || cell.value == null) return "";
  const v = cell.value;
  if (typeof v === "object" && Array.isArray(v.richText)) {
    return v.richText.map((t) => t.text || "").join("").trim();
  }
  if (typeof v === "object" && v.text != null) return String(v.text).trim();
  if (typeof v === "object" && v.result != null) return String(v.result).trim();
  return String(v).trim();
}

function numCell(cell) {
  const v = cell?.value;
  if (v == null || v === "") return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "object" && typeof v.result === "number") return v.result;
  const n = Number(String(v).replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

function categoryFromSectionTitle(text) {
  const t = String(text || "").trim();
  const m = /^(\d+)\./.exec(t);
  if (!m) return null;
  const order = Number(m[1]);
  const g = INGREDIENT_GROUPS.find((x) => x.order === order);
  return g?.id || null;
}

/**
 * @param {ArrayBuffer} buffer
 * @returns {Promise<Array<{ name: string, category: string, unit: string, calories: number, protein: number, fat: number, carb: number }>>}
 */
export async function parseIngredientExcel(buffer) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  let currentCat = "luong_thuc";
  const out = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber <= 6) return;

    const a = cellText(row.getCell(1));
    if (!a) return;

    if (/^\d+\./.test(a)) {
      const cat = categoryFromSectionTitle(a);
      if (cat) currentCat = cat;
      return;
    }

    if (a === "Tên nguyên liệu" || a.includes("Tên nguyên liệu")) return;
    if (a.toLowerCase().startsWith("hướng dẫn")) return;
    if (a.includes("TRƯỜNG MẦM NON")) return;
    if (a.includes("BÁO CÁO NGUYÊN LIỆU")) return;
    if (/mẫu\s*\/\s*xuất từ hệ thống/i.test(a) || /mẫu tải về/i.test(a)) return;

    const unit = cellText(row.getCell(2)) || "100g";
    const calories = numCell(row.getCell(3));
    const protein = numCell(row.getCell(4));
    const fat = numCell(row.getCell(5));
    const carb = numCell(row.getCell(6));

    out.push({
      name: a,
      category: currentCat,
      unit: unit || "100g",
      calories,
      protein,
      fat,
      carb,
    });
  });

  return out;
}

async function buildWorkbook({ ingredients, templateEmptyRowsPerSection = 10 }) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Trường MN Đức Xuân";
  wb.created = new Date();

  const ws = wb.addWorksheet("Nguyên liệu", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    views: [{ state: "frozen", xSplit: 0, ySplit: 7 }],
  });

  ws.columns = [
    { width: 42 },
    { width: 14 },
    { width: 11 },
    { width: 11 },
    { width: 11 },
    { width: 13 },
  ];

  const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
  const bdr = (style = "thin", color = "B0BEC5") => ({ style, color: { argb: color } });
  const allBorders = (style = "thin", color = "B0BEC5") => ({
    top: bdr(style, color),
    bottom: bdr(style, color),
    left: bdr(style, color),
    right: bdr(style, color),
  });
  const font = (size, bold, color = "212121", italic = false) => ({
    name: "Times New Roman",
    size,
    bold,
    italic,
    color: { argb: color },
  });
  const align = (h, v = "middle", wrap = true) => ({ horizontal: h, vertical: v, wrapText: wrap });

  const styleCell = (cell, { f, fi, al, bd } = {}) => {
    if (f) cell.fill = f;
    if (fi) cell.font = fi;
    if (al) cell.alignment = al;
    if (bd) cell.border = bd;
  };

  const mergeStyle = (addr, opts) => styleCell(ws.getCell(addr), opts);

  const SECTION_COLORS = ["1565C0", "6A1B9A", "00695C", "B71C1C", "E65100"];

  // Row 1
  ws.mergeCells(`A1:${LAST_COL}1`);
  mergeStyle("A1", {
    f: fill("1565C0"),
    fi: font(14, true, "FFFFFF"),
    al: align("center"),
  });
  ws.getCell("A1").value = "TRƯỜNG MẦM NON ĐỨC XUÂN";
  ws.getRow(1).height = 26;

  ws.mergeCells(`A2:${LAST_COL}2`);
  mergeStyle("A2", {
    f: fill("1976D2"),
    fi: font(13, true, "FFFFFF"),
    al: align("center"),
  });
  ws.getCell("A2").value = "BÁO CÁO NGUYÊN LIỆU – MẪU NHẬP DỮ LIỆU";
  ws.getRow(2).height = 24;

  ws.mergeCells(`A3:${LAST_COL}3`);
  mergeStyle("A3", {
    f: fill("E3F2FD"),
    fi: font(9, false, "1565C0", true),
    al: align("left"),
  });
  ws.getCell("A3").value =
    "  Hướng dẫn: Điền tên nguyên liệu và các chỉ số theo đơn vị tính (thường là trên 100g). " +
    "Mỗi nhóm có thanh màu riêng; không xóa dòng tiêu đề nhóm (1. … 5.). " +
    "File .xlsx dùng để Import vào hệ thống Quản lý nguyên liệu.";
  ws.getRow(3).height = 36;

  ws.addRow([]);
  ws.getRow(4).height = 6;

  const setH = (addr, value, bgColor = "1565C0") => {
    ws.getCell(addr).value = value;
    mergeStyle(addr, {
      f: fill(bgColor),
      fi: font(10, true, "FFFFFF"),
      al: align("center"),
      bd: allBorders("medium", "90CAF9"),
    });
  };

  const headers = [
    ["A5", "Tên nguyên liệu"],
    ["B5", "Đơn vị tính"],
    ["C5", "Năng lượng\n(Kcal)"],
    ["D5", "Chất đạm\n(g)"],
    ["E5", "Chất béo\n(g)"],
    ["F5", "Tinh bột\n(g)"],
  ];
  ws.getRow(5).height = 28;
  headers.forEach(([addr, val]) => {
    const col = addr[0];
    ws.mergeCells(`${addr}:${col}6`);
    setH(addr, val, "1565C0");
  });

  ws.addRow([]);
  ws.getRow(7).height = 16;
  const hints = ["", "VD: 100g", "theo ĐVT", "theo ĐVT", "theo ĐVT", "theo ĐVT"];
  hints.forEach((u, i) => {
    const cell = ws.getRow(7).getCell(i + 1);
    cell.value = u;
    cell.font = font(9, false, "546E7A", true);
    cell.fill = fill("E3F2FD");
    cell.alignment = align("center");
    cell.border = allBorders("thin", "B0BEC5");
  });

  const byCat = {};
  INGREDIENT_GROUPS.forEach((g) => {
    byCat[g.id] = [];
  });
  (ingredients || []).forEach((ing) => {
    const id = ing.category || "luong_thuc";
    if (!byCat[id]) byCat[id] = [];
    byCat[id].push(ing);
  });

  const addSectionHeader = (group, colorIdx) => {
    const color = SECTION_COLORS[colorIdx] || "1565C0";
    const row = ws.addRow([excelSectionRowTitle(group)]);
    ws.mergeCells(`A${row.number}:${LAST_COL}${row.number}`);
    styleCell(ws.getCell(`A${row.number}`), {
      f: fill(color),
      fi: font(10, true, "FFFFFF"),
      al: align("left"),
      bd: {
        top: bdr("medium", color),
        bottom: bdr("medium", color),
        left: bdr("thin"),
        right: bdr("thin"),
      },
    });
    row.height = 22;
  };

  const addDataRow = (label, unit, kcal, prot, fat, carb, isExample = false) => {
    const row = ws.addRow([label, unit, kcal, prot, fat, carb]);
    row.height = 18;
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      if (colNum === 1) {
        cell.font = font(10, !isExample, isExample ? "757575" : "212121");
        cell.alignment = align("left");
        cell.fill = fill(isExample ? "FAFAFA" : "FFFFFF");
      } else {
        cell.font = font(10, false, "1565C0");
        cell.alignment = align("center");
        cell.fill = fill("FFFFFF");
        cell.numFmt = colNum >= 3 ? "#,##0.##" : undefined;
      }
      cell.border = allBorders("thin", "CFD8DC");
    });
  };

  INGREDIENT_GROUPS.forEach((group, idx) => {
    addSectionHeader(group, idx);
    const rows = byCat[group.id] || [];
    if (rows.length > 0) {
      rows.forEach((ing) => {
        addDataRow(
          ing.name,
          ing.unit || "100g",
          Number(ing.calories) || 0,
          Number(ing.protein) || 0,
          Number(ing.fat) || 0,
          Number(ing.carb) || 0,
          false
        );
      });
    } else if (templateEmptyRowsPerSection > 0) {
      const examples = [
        ["Gạo tẻ", "100g", 130, 2.7, 0.3, 28],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""],
      ];
      for (let i = 0; i < templateEmptyRowsPerSection; i++) {
        const ex = examples[i] || ["", "", "", "", "", ""];
        addDataRow(ex[0], ex[1], ex[2], ex[3], ex[4], ex[5], true);
      }
    }
  });

  const lastR = ws.addRow([]);
  ws.mergeCells(`A${lastR.number}:${LAST_COL}${lastR.number}`);
  ws.getCell(`A${lastR.number}`).value =
    `Mẫu / xuất từ hệ thống Quản lý nguyên liệu – Trường MN Đức Xuân  |  ${new Date().toLocaleDateString("vi-VN")}`;
  styleCell(ws.getCell(`A${lastR.number}`), {
    f: fill("ECEFF1"),
    fi: font(9, false, "90A4AE", true),
    al: align("right"),
  });
  lastR.height = 14;

  return wb;
}

export async function downloadIngredientTemplate() {
  const wb = await buildWorkbook({ ingredients: [], templateEmptyRowsPerSection: 10 });
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mau_nguyen_lieu.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportIngredientsExcel(ingredients) {
  const wb = await buildWorkbook({ ingredients: ingredients || [], templateEmptyRowsPerSection: 0 });
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `nguyen-lieu-${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
