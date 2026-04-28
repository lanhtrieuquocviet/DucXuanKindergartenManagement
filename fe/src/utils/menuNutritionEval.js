/**
 * Logic đánh giá dinh dưỡng thực đơn — dùng chung Kitchen & School Admin.
 */

export const DEFAULT_NUTRITION_RANGES = {
  avgCalories: { min: 615, max: 726 },
  protein: { min: 13, max: 20 },
  fat: { min: 25, max: 35 },
  carb: { min: 52, max: 60 },
};

export function getNutritionRangesFromPlan(planItems = []) {
  const ranges = {
    avgCalories: { ...DEFAULT_NUTRITION_RANGES.avgCalories },
    protein: { ...DEFAULT_NUTRITION_RANGES.protein },
    fat: { ...DEFAULT_NUTRITION_RANGES.fat },
    carb: { ...DEFAULT_NUTRITION_RANGES.carb },
  };

  planItems.forEach((item) => {
    const label = String(item?.name || "").toLowerCase();
    const min = Number(item?.min);
    const max = Number(item?.max);
    if (Number.isNaN(min) || Number.isNaN(max) || max <= min) return;

    if (/calo|kcal|năng lượng|nang luong/.test(label)) {
      ranges.avgCalories = { min, max };
      return;
    }
    if (/đạm|chất đạm|protein/.test(label)) {
      ranges.protein = { min, max };
      return;
    }
    if (/béo|chất béo|fat|lipid/.test(label)) {
      ranges.fat = { min, max };
      return;
    }
    if (/tinh bột|carb|glucid|starch/.test(label)) {
      ranges.carb = { min, max };
    }
  });

  return ranges;
}

/** Cộng mọi món trưa + chiều (món lặp vẫn cộng dồn). */
export function aggregateDayNutritionSumAll(dayMenu) {
  let calories = 0;
  let protein = 0;
  let fat = 0;
  let carb = 0;
  const add = (food) => {
    if (!food) return;
    calories += Number(food.calories) || 0;
    protein += Number(food.protein) || 0;
    fat += Number(food.fat) || 0;
    carb += Number(food.carb) || 0;
  };
  (dayMenu?.lunchFoods || []).forEach(add);
  (dayMenu?.afternoonFoods || []).forEach(add);
  return { calories, protein, fat, carb };
}

export function evaluateNutrition(nutrition = {}, ranges = DEFAULT_NUTRITION_RANGES) {
  const avgCalories = Number(nutrition.avgCalories || 0);
  const protein = Number(nutrition.protein || 0);
  const fat = Number(nutrition.fat || 0);
  const carb = Number(nutrition.carb || 0);

  const pKcal = protein * 4;
  const fKcal = fat * 9;
  const cKcal = carb * 4;
  const totalMacroKcal = pKcal + fKcal + cKcal;

  const proteinPercent = totalMacroKcal > 0 ? Number(((pKcal / totalMacroKcal) * 100).toFixed(2)) : 0;
  const fatPercent = totalMacroKcal > 0 ? Number(((fKcal / totalMacroKcal) * 100).toFixed(2)) : 0;
  const carbPercent = totalMacroKcal > 0 ? Number(((cKcal / totalMacroKcal) * 100).toFixed(2)) : 0;

  const result = {
    calories: {
      value: avgCalories,
      pass: avgCalories >= ranges.avgCalories.min && avgCalories <= ranges.avgCalories.max,
      range: `${ranges.avgCalories.min} - ${ranges.avgCalories.max}`,
    },
    protein: {
      value: proteinPercent,
      pass: proteinPercent >= ranges.protein.min && proteinPercent <= ranges.protein.max,
      range: `${ranges.protein.min}% - ${ranges.protein.max}%`,
    },
    fat: {
      value: fatPercent,
      pass: fatPercent >= ranges.fat.min && fatPercent <= ranges.fat.max,
      range: `${ranges.fat.min}% - ${ranges.fat.max}%`,
    },
    carb: {
      value: carbPercent,
      pass: carbPercent >= ranges.carb.min && carbPercent <= ranges.carb.max,
      range: `${ranges.carb.min}% - ${ranges.carb.max}%`,
    },
  };

  result.overallPass = result.calories.pass && result.protein.pass && result.fat.pass && result.carb.pass;
  return result;
}

export function evaluateDailyNutrition(dayMenu, ranges = DEFAULT_NUTRITION_RANGES, options = {}) {
  const { useSnapshotTotals = false } = options;
  const hasSnapshotTotals =
    dayMenu &&
    dayMenu.totalCalories !== undefined &&
    dayMenu.totalProtein !== undefined &&
    dayMenu.totalFat !== undefined &&
    dayMenu.totalCarb !== undefined;

  const snapshot = useSnapshotTotals && hasSnapshotTotals
    ? {
        calories: Number(dayMenu.totalCalories) || 0,
        protein: Number(dayMenu.totalProtein) || 0,
        fat: Number(dayMenu.totalFat) || 0,
        carb: Number(dayMenu.totalCarb) || 0,
      }
    : aggregateDayNutritionSumAll(dayMenu);

  const { calories: calRaw, protein, fat, carb } = snapshot;
  const calories = Number(calRaw || 0);

  const pKcal = protein * 4;
  const fKcal = fat * 9;
  const cKcal = carb * 4;
  const totalMacroKcal = pKcal + fKcal + cKcal;

  const proteinPercent = totalMacroKcal > 0 ? Number(((pKcal / totalMacroKcal) * 100).toFixed(1)) : 0;
  const fatPercent = totalMacroKcal > 0 ? Number(((fKcal / totalMacroKcal) * 100).toFixed(1)) : 0;
  const carbPercent = totalMacroKcal > 0 ? Number(((cKcal / totalMacroKcal) * 100).toFixed(1)) : 0;

  const reasons = [];
  if (calories < ranges.avgCalories.min || calories > ranges.avgCalories.max) {
    reasons.push(`Calo: ${calories.toFixed(1)} (mục tiêu ${ranges.avgCalories.min}-${ranges.avgCalories.max})`);
  }
  if (proteinPercent < ranges.protein.min || proteinPercent > ranges.protein.max) {
    reasons.push(`Đạm: ${proteinPercent}% (mục tiêu ${ranges.protein.min}-${ranges.protein.max}%)`);
  }
  if (fatPercent < ranges.fat.min || fatPercent > ranges.fat.max) {
    reasons.push(`Béo: ${fatPercent}% (mục tiêu ${ranges.fat.min}-${ranges.fat.max}%)`);
  }
  if (carbPercent < ranges.carb.min || carbPercent > ranges.carb.max) {
    reasons.push(`Tinh bột: ${carbPercent}% (mục tiêu ${ranges.carb.min}-${ranges.carb.max}%)`);
  }

  return {
    calories,
    proteinPercent,
    fatPercent,
    carbPercent,
    pass: reasons.length === 0,
    reasons,
  };
}
