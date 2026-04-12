const Food = require("../models/Food");
const Ingredient = require("../models/Ingredient");

/**
 * @param {string} raw
 * @param {number} defaultGrams
 */
function parseGramsFromQuantity(raw, defaultGrams = 100) {
  if (raw == null || raw === "") return defaultGrams;
  const s = String(raw).trim().replace(",", ".");
  const m = s.match(/^([\d.]+)\s*([a-zA-Z]*)$/);
  if (m) {
    const n = Number(m[1]);
    return Number.isFinite(n) && n > 0 ? n : defaultGrams;
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : defaultGrams;
}

function buildIngredientLookup(ingredients) {
  const map = new Map();
  for (const ing of ingredients || []) {
    const key = String(ing.name || "")
      .trim()
      .toLowerCase();
    if (key) map.set(key, ing);
  }
  return map;
}

/**
 * @param {string[]} foodIds mongoose ids
 * @returns {Promise<Array<{ food: import('mongoose').Types.ObjectId, ingredientLines: object[] }>>}
 */
async function explodeFoodsToSlots(foodIds) {
  if (!foodIds || foodIds.length === 0) return [];

  const foods = await Food.find({ _id: { $in: foodIds } }).lean();
  const ingredients = await Ingredient.find({}).lean();
  const byName = buildIngredientLookup(ingredients);
  const foodById = new Map(foods.map((f) => [String(f._id), f]));

  return foodIds.map((id) => {
    const fid = String(id);
    const food = foodById.get(fid);
    if (!food) {
      return { food: id, ingredientLines: [] };
    }

    const lines = (food.ingredients || []).map((line) => {
      const name = String(line.name || "").trim();
      const grams = parseGramsFromQuantity(line.quantity, 100);
      const db = byName.get(name.toLowerCase());
      return {
        name: name || "Nguyên liệu",
        grams,
        caloriesPer100g: db != null ? Number(db.calories) || 0 : Number(line.calories) || 0,
        proteinPer100g: db != null ? Number(db.protein) || 0 : Number(line.protein) || 0,
        fatPer100g: db != null ? Number(db.fat) || 0 : Number(line.fat) || 0,
        carbPer100g: db != null ? Number(db.carb) || 0 : Number(line.carb) || 0,
      };
    });

    return { food: food._id, ingredientLines: lines };
  });
}

/**
 * Giữ slot cũ nếu món vẫn còn trong bữa; món mới thì bung từ DB.
 * @param {Array<{ food: any, ingredientLines?: any[] }>|null|undefined} prevSlots
 * @param {string[]} newFoodIds
 */
async function rebuildMealSlots(prevSlots, newFoodIds) {
  const prevMap = new Map(
    (prevSlots || []).map((s) => [String(s.food), s])
  );
  const missing = newFoodIds.filter((id) => !prevMap.has(String(id)));
  const exploded = await explodeFoodsToSlots(missing);
  const explodedMap = new Map(exploded.map((s) => [String(s.food), s]));

  return newFoodIds.map((id) => {
    const k = String(id);
    if (prevMap.has(k)) return prevMap.get(k);
    return explodedMap.get(k) || { food: id, ingredientLines: [] };
  });
}

/**
 * @param {Array<{ food: any, ingredientLines?: any[] }>} slots
 * @param {Map<string, object>} foodsById lean food docs
 */
function sumNutritionFromSlots(slots, foodsById) {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarb = 0;

  for (const slot of slots || []) {
    const fid = String(slot.food);
    const food = foodsById.get(fid);
    const lines = slot.ingredientLines;

    if (lines && lines.length > 0) {
      for (const line of lines) {
        const g = Number(line.grams) || 0;
        const m = g / 100;
        totalCalories += (Number(line.caloriesPer100g) || 0) * m;
        totalProtein += (Number(line.proteinPer100g) || 0) * m;
        totalFat += (Number(line.fatPer100g) || 0) * m;
        totalCarb += (Number(line.carbPer100g) || 0) * m;
      }
    } else if (food) {
      totalCalories += Number(food.calories) || 0;
      totalProtein += Number(food.protein) || 0;
      totalFat += Number(food.fat) || 0;
      totalCarb += Number(food.carb) || 0;
    }
  }

  return {
    totalCalories: Math.round(totalCalories * 100) / 100,
    totalProtein: Math.round(totalProtein * 100) / 100,
    totalFat: Math.round(totalFat * 100) / 100,
    totalCarb: Math.round(totalCarb * 100) / 100,
  };
}

module.exports = {
  parseGramsFromQuantity,
  explodeFoodsToSlots,
  rebuildMealSlots,
  sumNutritionFromSlots,
};
