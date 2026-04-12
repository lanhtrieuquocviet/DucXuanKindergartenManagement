/** Đồng bộ mã với backend Ingredient.category */
export const INGREDIENT_GROUPS = [
  {
    id: "luong_thuc",
    order: 1,
    title: "Lương thực",
    hint: "Gạo tẻ, gạo nếp, mì sợi, bún, phở — chủ yếu Glucid",
  },
  {
    id: "giau_dam",
    order: 2,
    title: "Giàu đạm (thực phẩm chính)",
    hint: "Thịt lợn, thịt bò, thịt gà, trứng, tôm, cua, cá — chủ yếu Protein",
  },
  {
    id: "rau_cu",
    order: 3,
    title: "Rau củ quả",
    hint: "Su hào, cà rốt, rau ngót, bí, dưa hấu, chuối — Vitamin & chất xơ",
  },
  {
    id: "gia_vi",
    order: 4,
    title: "Gia vị & chất béo",
    hint: "Dầu ăn, mỡ, nước mắm, muối, đường, hành, gừng — Lipid & điều vị",
  },
  {
    id: "phu_lieu",
    order: 5,
    title: "Phụ liệu / ăn nhẹ",
    hint: "Sữa, sữa chua, bánh bao, vừng, lạc…",
  },
];

export function labelForIngredientCategory(id) {
  return INGREDIENT_GROUPS.find((g) => g.id === id)?.title || id;
}
