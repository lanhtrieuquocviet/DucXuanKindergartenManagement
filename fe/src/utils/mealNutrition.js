/** Tính dinh dưỡng thực tế từ chỉ số /100g và khối lượng (g). */
export function scaledFromPer100(line) {
  const g = Number(line.grams) || 0;
  const m = g / 100;
  return {
    calories: (Number(line.caloriesPer100g) || 0) * m,
    protein: (Number(line.proteinPer100g) || 0) * m,
    fat: (Number(line.fatPer100g) || 0) * m,
    carb: (Number(line.carbPer100g) || 0) * m,
  };
}

export function sumIngredientLines(lines) {
  return (lines || []).reduce(
    (acc, line) => {
      const s = scaledFromPer100(line);
      return {
        calories: acc.calories + s.calories,
        protein: acc.protein + s.protein,
        fat: acc.fat + s.fat,
        carb: acc.carb + s.carb,
      };
    },
    { calories: 0, protein: 0, fat: 0, carb: 0 }
  );
}
