import * as XLSX from 'xlsx';

const days = ["mon", "tue", "wed", "thu", "fri"];
const dayMap = {
  mon: "Thứ Hai",
  tue: "Thứ Ba",
  wed: "Thứ Tư",
  thu: "Thứ Năm",
  fri: "Thứ Sáu",
};

const reverseDayMap = {
  "Thứ Hai": "mon",
  "Thứ Ba": "tue",
  "Thứ Tư": "wed",
  "Thứ Năm": "thu",
  "Thứ Sáu": "fri"
};

const weekTypeMap = {
  "Tuần lẻ": "odd",
  "Tuần chẵn": "even"
};

const mealTypeMap = {
  "Bữa trưa": "lunchFoods",
  "Bữa chiều": "afternoonFoods"
};

const normalizeVi = (text) =>
  String(text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const extractCellText = (row, idx) => String(row?.[idx] ?? "").trim();

const findHeaderRowIndex = (rows) => {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const c0 = normalizeVi(extractCellText(row, 0));
    const c1 = normalizeVi(extractCellText(row, 1));
    const c2 = normalizeVi(extractCellText(row, 2));
    const c3 = normalizeVi(extractCellText(row, 3));
    const c4 = normalizeVi(extractCellText(row, 4));
    if (
      c0 === "thu" &&
      c1.includes("tuan le") &&
      c2.includes("tuan le") &&
      c3.includes("tuan chan") &&
      c4.includes("tuan chan")
    ) {
      return i;
    }
  }
  return -1;
};

/**
 * Parse Excel file and convert to menu update format (handles new wide format)
 * @param {File} file - Excel file to parse
 * @param {object} currentMenuData - Current menu data from API
 * @param {object} availableFoods - Available foods with their IDs
 * @returns {Promise<{ updates: Array, errors: Array }>}
 */
export const parseMenuExcel = async (file, currentMenuData, availableFoods = []) => {
  const errors = [];
  const updates = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: "",
    });

    if (!rows || rows.length === 0) {
      errors.push("File Excel trống");
      return { updates, errors };
    }

    const headerRowIdx = findHeaderRowIndex(rows);
    if (headerRowIdx === -1) {
      errors.push("Không tìm thấy dòng tiêu đề đúng định dạng (Thứ, Tuần lẻ/chẵn - Bữa trưa/chiều)");
      return { updates, errors };
    }

    // Create a food name -> id map for fast lookup
    const foodMap = new Map();
    availableFoods.forEach(food => {
      foodMap.set(food.name?.toLowerCase() || '', food._id);
    });

    const columnConfig = [
      { colIndex: 1, weekType: 'odd', mealType: 'lunchFoods', display: 'Tuần lẻ - Bữa trưa' },
      { colIndex: 2, weekType: 'odd', mealType: 'afternoonFoods', display: 'Tuần lẻ - Bữa chiều' },
      { colIndex: 3, weekType: 'even', mealType: 'lunchFoods', display: 'Tuần chẵn - Bữa trưa' },
      { colIndex: 4, weekType: 'even', mealType: 'afternoonFoods', display: 'Tuần chẵn - Bữa chiều' }
    ];

    for (let rowIndex = headerRowIdx + 1; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex] || [];
      const dayName = extractCellText(row, 0);
      const day = reverseDayMap[dayName];

      if (!day) {
        continue;
      }

      columnConfig.forEach(({ colIndex, weekType, mealType, display }) => {
        const foodNamesStr = extractCellText(row, colIndex);

        // Get daily menu ID
        const dailyMenu = currentMenuData.weeks?.[weekType]?.[day];
        if (!dailyMenu) {
          errors.push(`Dòng ${rowIndex + 1}, cột ${display}: Không tìm thấy dữ liệu`);
          return;
        }

        // Parse food names
        const foodNames = foodNamesStr
          .split(/[;,]/)
          .map(name => name.trim())
          .filter(name => name && !normalizeVi(name).includes('nhap'));

        if (foodNames.length === 0) {
          return; // Allow empty cells
        }

        // Match food names to IDs
        const foodIds = [];
        const notFoundFoods = [];

        foodNames.forEach(foodName => {
          const foodId = foodMap.get(foodName.toLowerCase());
          if (foodId) {
            foodIds.push(foodId);
          } else {
            notFoundFoods.push(foodName);
          }
        });

        if (notFoundFoods.length > 0) {
          errors.push(
            `Dòng ${rowIndex + 1}, ${display}: Không tìm thấy: ${notFoundFoods.join(', ')}`
          );
        }

        if (foodIds.length > 0) {
          updates.push({
            dailyMenuId: dailyMenu._id,
            mealType: mealType,
            foodIds: foodIds,
            weekType,
            day,
            displayName: `${dayName} - ${display}`
          });
        }
      });
    }

    return { updates, errors };
  } catch (error) {
    errors.push(`Lỗi khi đọc file: ${error.message}`);
    return { updates, errors };
  }
};

/**
 * Format errors for display to user
 * @param {Array} errors - Array of error messages
 * @returns {string} - Formatted error message
 */
export const formatImportErrors = (errors) => {
  return errors.join('\n');
};
