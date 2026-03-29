/**
 * Nutrition Calculator Utility
 * Quy đổi và tính toán giá trị dinh dưỡng theo tiêu chuẩn:
 * - 1g Protein = 4 Kcal
 * - 1g Fat/Lipid = 9 Kcal
 * - 1g Carb/Glucid = 4 Kcal
 */

// Hệ số quy đổi Kcal
const KCAL_COEFFICIENTS = {
  protein: 4,      // 1g protein = 4 Kcal
  fat: 9,          // 1g fat = 9 Kcal
  carb: 4,         // 1g carb = 4 Kcal
};

/**
 * Chuyển đổi grams thành Kcal
 * @param {Object} nutrients - Đối tượng chứa protein, fat, carb (đơn vị: grams)
 * @returns {Object} Đối tượng chứa kcalFromProtein, kcalFromFat, kcalFromCarb, totalKcal
 */
const convertGramsToKcal = (nutrients) => {
  const protein = nutrients.protein || 0;
  const fat = nutrients.fat || 0;
  const carb = nutrients.carb || 0;

  const kcalFromProtein = protein * KCAL_COEFFICIENTS.protein;
  const kcalFromFat = fat * KCAL_COEFFICIENTS.fat;
  const kcalFromCarb = carb * KCAL_COEFFICIENTS.carb;
  const totalKcal = kcalFromProtein + kcalFromFat + kcalFromCarb;

  return {
    kcalFromProtein: Math.round(kcalFromProtein * 100) / 100,
    kcalFromFat: Math.round(kcalFromFat * 100) / 100,
    kcalFromCarb: Math.round(kcalFromCarb * 100) / 100,
    totalKcal: Math.round(totalKcal * 100) / 100,
  };
};

/**
 * Tính tỉ lệ % của P - L - G so với tổng Kcal
 * @param {Object} nutrients - Đối tượng chứa protein, fat, carb (đơn vị: grams)
 * @returns {Object} Đối tượng chứa các tỉ lệ % và kcal breakdown
 */
const calculateNutritionPercentage = (nutrients) => {
  const kcalBreakdown = convertGramsToKcal(nutrients);
  const { totalKcal } = kcalBreakdown;

  if (totalKcal === 0) {
    return {
      proteinPercentage: 0,
      fatPercentage: 0,
      carbPercentage: 0,
      totalKcal: 0,
      proteinGrams: 0,
      fatGrams: 0,
      carbGrams: 0,
    };
  }

  return {
    proteinPercentage: Math.round((kcalBreakdown.kcalFromProtein / totalKcal) * 100 * 100) / 100,
    fatPercentage: Math.round((kcalBreakdown.kcalFromFat / totalKcal) * 100 * 100) / 100,
    carbPercentage: Math.round((kcalBreakdown.kcalFromCarb / totalKcal) * 100 * 100) / 100,
    totalKcal: kcalBreakdown.totalKcal,
    proteinGrams: Math.round((nutrients.protein || 0) * 100) / 100,
    fatGrams: Math.round((nutrients.fat || 0) * 100) / 100,
    carbGrams: Math.round((nutrients.carb || 0) * 100) / 100,
  };
};

/**
 * Tính toán tổng hợp dinh dưỡng từ danh sách thực phẩm
 * Hàm "quét" qua các món ăn và tổng cộng P - L - G
 * @param {Array} foods - Danh sách các food objects từ database
 * @returns {Object} Đối tượng chứa tổng dinh dưỡng và các tỉ lệ %
 */
const aggregateNutritionFromFoods = (foods) => {
  if (!foods || foods.length === 0) {
    return {
      totalProteinGrams: 0,
      totalFatGrams: 0,
      totalCarbGrams: 0,
      totalCalories: 0,
      proteinPercentage: 0,
      fatPercentage: 0,
      carbPercentage: 0,
      details: {
        kcalFromProtein: 0,
        kcalFromFat: 0,
        kcalFromCarb: 0,
      },
    };
  }

  // Tổng cộng các giá trị dinh dưỡng
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarb = 0;
  let totalCalories = 0;

  foods.forEach((food) => {
    totalProtein += food.protein || 0;
    totalFat += food.fat || 0;
    totalCarb += food.carb || 0;
    totalCalories += food.calories || 0;
  });

  // Tính toán tỉ lệ %
  const nutritionInfo = calculateNutritionPercentage({
    protein: totalProtein,
    fat: totalFat,
    carb: totalCarb,
  });

  return {
    totalProteinGrams: nutritionInfo.proteinGrams,
    totalFatGrams: nutritionInfo.fatGrams,
    totalCarbGrams: nutritionInfo.carbGrams,
    totalCalories: totalCalories, // Giữ calories từ database nếu có
    calculatedTotalKcal: nutritionInfo.totalKcal, // Kcal tính từ P-L-G
    proteinPercentage: nutritionInfo.proteinPercentage,
    fatPercentage: nutritionInfo.fatPercentage,
    carbPercentage: nutritionInfo.carbPercentage,
    details: {
      kcalFromProtein: convertGramsToKcal({
        protein: totalProtein,
        fat: 0,
        carb: 0,
      }).kcalFromProtein,
      kcalFromFat: convertGramsToKcal({
        protein: 0,
        fat: totalFat,
        carb: 0,
      }).kcalFromFat,
      kcalFromCarb: convertGramsToKcal({
        protein: 0,
        fat: 0,
        carb: totalCarb,
      }).kcalFromCarb,
    },
  };
};

/**
 * Tính toán dinh dưỡng từ danh sách nguyên liệu với khối lượng
 * @param {Array} ingredients - Danh sách nguyên liệu: [{name, weight, protein, fat, carb}, ...]
 * @returns {Object} Tổng dinh dưỡng đã cộng dồn
 */
const aggregateNutritionFromIngredients = (ingredients) => {
  if (!ingredients || ingredients.length === 0) {
    return {
      totalProteinGrams: 0,
      totalFatGrams: 0,
      totalCarbGrams: 0,
      totalCalories: 0,
      proteinPercentage: 0,
      fatPercentage: 0,
      carbPercentage: 0,
    };
  }

  let totalProtein = 0;
  let totalFat = 0;
  let totalCarb = 0;
  let totalCalories = 0;

  ingredients.forEach((ingredient) => {
    // Giả định weight là đơn vị grams
    const weight = ingredient.weight || 100;
    const baseWeight = 100; // Dữ liệu gốc giả định là per 100g

    const multiplier = weight / baseWeight;

    totalProtein += (ingredient.protein || 0) * multiplier;
    totalFat += (ingredient.fat || 0) * multiplier;
    totalCarb += (ingredient.carb || 0) * multiplier;
    totalCalories += (ingredient.calories || 0) * multiplier;
  });

  const nutritionInfo = calculateNutritionPercentage({
    protein: totalProtein,
    fat: totalFat,
    carb: totalCarb,
  });

  return {
    totalProteinGrams: nutritionInfo.proteinGrams,
    totalFatGrams: nutritionInfo.fatGrams,
    totalCarbGrams: nutritionInfo.carbGrams,
    totalCalories: Math.round(totalCalories * 100) / 100,
    calculatedTotalKcal: nutritionInfo.totalKcal,
    proteinPercentage: nutritionInfo.proteinPercentage,
    fatPercentage: nutritionInfo.fatPercentage,
    carbPercentage: nutritionInfo.carbPercentage,
  };
};

module.exports = {
  convertGramsToKcal,
  calculateNutritionPercentage,
  aggregateNutritionFromFoods,
  aggregateNutritionFromIngredients,
  KCAL_COEFFICIENTS,
};
