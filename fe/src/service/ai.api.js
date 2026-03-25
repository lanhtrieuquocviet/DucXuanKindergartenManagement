import api from "./api";

// Phân tích thực đơn ngày hiện tại
export const analyzeMenu = (dailyMenuId) => {
  return api.post("/ai/analyze-menu", { dailyMenuId });
};

// Gợi ý cải thiện một món ăn
export const improveDish = (foodId) => {
  return api.post("/ai/improve-dish", { foodId });
};

// Gợi ý các món ăn mới
export const suggestNewDishes = () => {
  return api.post("/ai/suggest-dishes", {});
};

// Chat với AI về thực đơn
export const chatWithAI = (message, dailyMenuId) => {
  return api.post("/ai/chat", { message, dailyMenuId });
};

// Tạo món ăn mới từ gợi ý AI
export const createDishFromSuggestion = (data) => {
  return api.post("/ai/create-from-suggestion", data);
};
