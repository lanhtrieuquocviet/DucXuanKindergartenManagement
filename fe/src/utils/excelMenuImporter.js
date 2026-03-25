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
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData || jsonData.length === 0) {
      errors.push("File Excel trống hoặc không đúng định dạng");
      return { updates, errors };
    }

    // Create a food name -> id map for fast lookup
    const foodMap = new Map();
    availableFoods.forEach(food => {
      foodMap.set(food.name?.toLowerCase() || '', food._id);
    });

    // Handle new format: days as rows, week/meal combinations as columns
    const columnHeaders = Object.keys(jsonData[0]);
    const dayColumn = columnHeaders[0]; // First column should be day name

    // Map columns to week/meal combinations
    const columnConfig = [
      { colIndex: 1, weekType: 'odd', mealType: 'lunchFoods', display: 'Tuần lẻ - Bữa trưa' },
      { colIndex: 2, weekType: 'odd', mealType: 'afternoonFoods', display: 'Tuần lẻ - Bữa chiều' },
      { colIndex: 3, weekType: 'even', mealType: 'lunchFoods', display: 'Tuần chẵn - Bữa trưa' },
      { colIndex: 4, weekType: 'even', mealType: 'afternoonFoods', display: 'Tuần chẵn - Bữa chiều' }
    ];

    jsonData.forEach((row, rowIndex) => {
      const dayName = row[dayColumn]?.trim();
      const day = reverseDayMap[dayName];

      if (!day) {
        errors.push(`Dòng ${rowIndex + 2}: Ngày không hợp lệ ("${dayName}")`);
        return;
      }

      columnConfig.forEach(({ colIndex, weekType, mealType, display }) => {
        const colName = columnHeaders[colIndex];
        if (!colName) return;

        const foodNamesStr = row[colName]?.trim() || '';

        // Get daily menu ID
        const dailyMenu = currentMenuData.weeks?.[weekType]?.[day];
        if (!dailyMenu) {
          errors.push(`Dòng ${rowIndex + 2}, cột ${display}: Không tìm thấy dữ liệu`);
          return;
        }

        // Parse food names
        const foodNames = foodNamesStr
          .split(/[;,]/)
          .map(name => name.trim())
          .filter(name => name && !name.includes('Nhập'));

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
            `Dòng ${rowIndex + 2}, ${display}: Không tìm thấy: ${notFoundFoods.join(', ')}`
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
    });

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
