import api, { ENDPOINTS, getToken } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Tạo menu
export const createMenu = (data) => {
  return api.post(ENDPOINTS.KITCHEN.CREATE_MENU, data);
};

// Lấy danh sách menu (query: page, limit, ...)
export const getMenus = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return api.get(`${ENDPOINTS.KITCHEN.MENUS}${q ? `?${q}` : ""}`);
};

// Chi tiết menu
export const getMenuDetail = (id) => {
  return api.get(ENDPOINTS.KITCHEN.MENU_DETAIL(id));
};

// Update menu
export const updateMenu = (id, data) => {
  return api.put(ENDPOINTS.KITCHEN.UPDATE_MENU(id), data);
};

export const getNutritionPlanSetting = () => {
  return api.get(ENDPOINTS.KITCHEN.NUTRITION_PLAN);
};

export const updateNutritionPlanSetting = (items) => {
  return api.put(ENDPOINTS.KITCHEN.NUTRITION_PLAN, { items });
};

export const listDistrictNutritionPlans = () => {
  return api.get(ENDPOINTS.KITCHEN.DISTRICT_NUTRITION_PLANS);
};

export const getDistrictNutritionPlanDetail = (id) => {
  return api.get(`${ENDPOINTS.KITCHEN.DISTRICT_NUTRITION_PLANS}/${id}`);
};

export const createDistrictNutritionPlan = (formData) => {
  return api.postFormData(ENDPOINTS.KITCHEN.DISTRICT_NUTRITION_PLANS, formData);
};

export const updateDistrictNutritionPlan = (id, formData) => {
  return api.putFormData(`${ENDPOINTS.KITCHEN.DISTRICT_NUTRITION_PLANS}/${id}`, formData);
};

export const endDistrictNutritionPlan = (id) => {
  return api.patch(`${ENDPOINTS.KITCHEN.DISTRICT_NUTRITION_PLANS}/${id}/end`, {});
};

/** Tải file Word kế hoạch quy định sở (cần đăng nhập) */
export async function downloadDistrictRegulationFile(planId) {
  const token = getToken();
  const res = await fetch(
    `${API_BASE_URL}/menus/district-nutrition-plans/${planId}/regulation`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  if (!res.ok) {
    let msg = "Tải file thất bại";
    try {
      const err = await res.json();
      if (err.message) msg = err.message;
    } catch {
      /* noop */
    }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const dispo = res.headers.get("Content-Disposition") || "";
  let filename = "ke-hoach.docx";
  const m = /filename\*=UTF-8''([^;\s]+)/i.exec(dispo);
  if (m) {
    try {
      filename = decodeURIComponent(m[1].replace(/"/g, ""));
    } catch {
      /* noop */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Submit menu
export const submitMenu = (id) => {
  return api.put(ENDPOINTS.KITCHEN.SUBMIT_MENU(id));
};

// Approve menu
export const approveMenu = (id) => {
  return api.put(ENDPOINTS.KITCHEN.APPROVE_MENU(id));
};

// Reject menu — body: { presets?: string[], detail?: string }
export const rejectMenu = (id, body) => {
  return api.put(ENDPOINTS.KITCHEN.REJECT_MENU(id), body);
};

/** Yêu cầu chỉnh sửa khi thực đơn đang áp dụng — body giống reject */
export const requestEditFromActiveMenu = (id, body) => {
  return api.patch(ENDPOINTS.KITCHEN.REQUEST_EDIT_MENU(id), body);
};

export const applyMenu = (id) => {
  return api.patch(`${ENDPOINTS.KITCHEN.MENUS}/${id}/apply`, {});
};

export const endMenu = (id) => {
  return api.patch(`${ENDPOINTS.KITCHEN.MENUS}/${id}/end`, {});
};

// update daily menu (thêm món vào ngày)
export const updateDailyMenu = (id, data) => {
  return api.put(`/daily-menus/${id}`, data);
};



// Lấy danh sách food
export const getFoods = () => {
  return api.get(`/foods`);
};

export const createFood = (data) => {
  return api.post("/foods", data);
};

export const updateFood = (id, data) => {
  return api.put(`/foods/${id}`, data);
};

export const deleteFood = (id) => {
  return api.delete(`/foods/${id}`);
};

// Ingredient support
export const getIngredients = () => {
  return api.get(`/ingredients`);
};

export const createIngredient = (data) => {
  return api.post(`/ingredients`, data);
};

export const updateIngredient = (id, data) => {
  return api.put(`/ingredients/${id}`, data);
};

export const deleteIngredient = (id) => {
  return api.delete(`/ingredients/${id}`);
};

// ============================================
// AI Menu Assistant APIs
// ============================================

export const aiAnalyzeMenu = (dailyMenuId) => {
  return api.post("/ai/analyze-menu", { dailyMenuId });
};

export const aiImproveDish = (foodId) => {
  return api.post("/ai/improve-dish", { foodId });
};

export const aiSuggestNewDishes = () => {
  return api.post("/ai/suggest-dishes");
};

export const aiChatAboutMenu = (message, dailyMenuId) => {
  return api.post("/ai/chat", { message, dailyMenuId });
};

export const aiCreateDishFromSuggestion = (data) => {
  return api.post("/ai/create-from-suggestion", data);
};

export const aiBalanceMenu = (dailyMenuId) => {
  return api.post("/ai/balance-menu", { dailyMenuId });
};

export const aiHealthCheck = () => {
  return api.get("/ai/health");
};