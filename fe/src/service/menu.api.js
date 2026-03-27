import api from "./api";
import { ENDPOINTS } from "./api";

// Tạo menu
export const createMenu = (data) => {
  return api.post(ENDPOINTS.KITCHEN.CREATE_MENU, data);
};

// Lấy danh sách menu
export const getMenus = () => {
  return api.get(ENDPOINTS.KITCHEN.MENUS);
};

// Chi tiết menu
export const getMenuDetail = (id) => {
  return api.get(ENDPOINTS.KITCHEN.MENU_DETAIL(id));
};

// Update menu
export const updateMenu = (id, data) => {
  return api.put(ENDPOINTS.KITCHEN.UPDATE_MENU(id), data);
};

// Submit menu
export const submitMenu = (id) => {
  return api.put(ENDPOINTS.KITCHEN.SUBMIT_MENU(id));
};

// Approve menu
export const approveMenu = (id) => {
  return api.put(ENDPOINTS.KITCHEN.APPROVE_MENU(id));
};

// Reject menu
export const rejectMenu = (id, reason) => {
  return api.put(ENDPOINTS.KITCHEN.REJECT_MENU(id), { reason });
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