const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiService {
  constructor() {
    this.primaryModelName = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
    this.fallbackModelName = process.env.GEMINI_FALLBACK_MODEL || "gemini-1.5-flash-latest";

    this.model = genAI.getGenerativeModel({ model: this.primaryModelName });
  }

  async _generateWithFallback(request) {
    const payload =
      request && typeof request === "object" && !Array.isArray(request) && !request.contents && request.prompt
        ? request.prompt
        : request;

    try {
      return await this.model.generateContent(payload);
    } catch (error) {
      // If model not found / not supported, fallback to text-bison
      const status = error?.status;
      const isNotFound = status === 404 || status === 400 || status === 422;
      if (isNotFound && this.model.model !== `models/${this.fallbackModelName}`) {
        console.warn(`Model ${this.model.model} not available; fallback to ${this.fallbackModelName}`);
        this.model = genAI.getGenerativeModel({ model: this.fallbackModelName });
        return this.model.generateContent(request);
      }
      throw error;
    }
  }

  /**
   * Phân tích thực đơn hiện tại và đưa ra đề xuất
   */
  async analyzeMenuSuggestions(dailyMenu, allFoods, ingredients) {
    try {
      const foodList = dailyMenu.lunchFoods
        ?.map((f) => `• ${f.name} (${f.calories} kcal, Protein: ${f.protein}g)`)
        .join("\n") || "Chưa có";

      const afternoonList = dailyMenu.afternoonFoods
        ?.map((f) => `• ${f.name} (${f.calories} kcal, Protein: ${f.protein}g)`)
        .join("\n") || "Chưa có";

      const prompt = `
Bạn là chuyên gia dinh dưỡng trẻ em. Phân tích thực đơn cho trẻ mầm non:

**Bữa trưa hiện tại:**
${foodList}

**Bữa chiều hiện tại:**
${afternoonList}

**Yêu cầu:**
1. Đánh giá cân bằng dinh dưỡng (Carbs, Protein, Fat, Calories)
2. Đề xuất 3 món ăn để cải thiện thực đơn (nếu cần)
3. Cho mỗi gợi ý, cung cấp: tên món, lợi ích, khẩu phần ước tính

**Định dạng trả lời JSON:**
{
  "analysis": "Nhận xét ngắn gọn về thực đơn hiện tại",
  "isBalanced": true/false,
  "suggestions": [
    {
      "dishName": "Tên món ăn",
      "reason": "Tại sao lại đề xuất",
      "nutrition": {"calories": 150, "protein": 8, "fat": 3, "carb": 25},
      "portion": "Khẩu phần ước tính",
      "mealType": "lunch" hoặc "afternoon"
    }
  ],
  "overallRecommendation": "Lời khuyên tổng quát"
}`;

      const result = await this._generateWithFallback(prompt);
      const text = result.response.text();

      // Parse JSON từ response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { error: "Không thể phân tích" };
    } catch (error) {
      console.error("Gemini analyzeMenu error:", error);
      throw error;
    }
  }

  /**
   * Gợi ý cải thiện từng món ăn
   */
  async suggestDishImprovements(foodName, currentIngredients, nutrition) {
    try {
      const ingredientsList = currentIngredients
        .map((ing) => `${ing.name} (${ing.calories} kcal, Protein: ${ing.protein}g)`)
        .join(", ");

      const prompt = `
Bạn là đầu bếp chuyên dinh dưỡng trẻ em. Hãy đề xuất cải thiện món ăn:

**Tên món:** ${foodName}
**Nguyên liệu hiện tại:** ${ingredientsList}
**Dinh dưỡng hiện tại:** ${nutrition.calories} kcal, Protein: ${nutrition.protein}g, Fat: ${nutrition.fat}g, Carb: ${nutrition.carb}g

**Yêu cầu:**
1. Đề xuất 3 cách cải thiện (thêm/bớt nguyên liệu)
2. Mục tiêu: cân bằng dinh dưỡng tốt hơn
3. Vẫn phù hợp với trẻ em

**Định dạng JSON:**
{
  "improvements": [
    {
      "suggestion": "Thay X bằng Y",
      "reason": "Lý do",
      "expectedNutrition": {"calories": 180, "protein": 10, "fat": 4, "carb": 28}
    }
  ],
  "recommendation": "Lời khuyên chung"
}`;

      const result = await this._generateWithFallback(prompt);
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { error: "Không thể gợi ý" };
    } catch (error) {
      console.error("Gemini suggestDishImprovements error:", error);
      throw error;
    }
  }

  /**
   * Suggest new dishes based on existing ingredients
   */
  async suggestNewDishes(existingIngredients, menuHistory = []) {
    try {
      const ingredientsList = existingIngredients
        .slice(0, 15)
        .map((ing) => ing.name)
        .join(", ");

      const recentDishes = menuHistory.slice(0, 5).join(", ");

      const prompt = `
Bạn là đầu bếp chuyên dinh dưỡng trẻ em. Gợi ý các món ăn mới cho trẻ mầm non.

**Nguyên liệu sẵn có:** ${ingredientsList}
**Các món được dùng gần đây:** ${recentDishes || "Chưa có"}

**Yêu cầu:**
1. Gợi ý 5 món ăn mới (cân bằng dinh dưỡng, an toàn cho trẻ)
2. Mỗi món phải dùng ít nhất 2-3 nguyên liệu có sẵn
3. Cung cấp: tên, mô tả ngắn, nguyên liệu cần thêm, dinh dưỡng ước tính

**Định dạng JSON:**
{
  "newDishes": [
    {
      "name": "Tên món",
      "description": "Mô tả ngắn",
      "ingredients": [
        {"name": "Nguyên liệu", "quantity": "100g"}
      ],
      "nutrition": {"calories": 200, "protein": 12, "fat": 5, "carb": 30},
      "cookingTip": "Mẹo nấu nướng"
    }
  ]
}`;

      const result = await this._generateWithFallback(prompt);
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { error: "Không thể gợi ý" };
    } catch (error) {
      console.error("Gemini suggestNewDishes error:", error);
      throw error;
    }
  }

  /**
   * Chat format - gọi Gemini với context thực đơn
   */
  async chatWithContext(userMessage, dailyMenu, allFoods) {
    try {
      const foodContext = allFoods
        .slice(0, 10)
        .map((f) => f.name)
        .join(", ");

      const lunchFoods = dailyMenu.lunchFoods?.map((f) => `${f.name} (${f.calories} kcal)`).join("\n  - ") || "Trống";
      const afternoonFoods = dailyMenu.afternoonFoods?.map((f) => `${f.name} (${f.calories} kcal)`).join("\n  - ") || "Trống";

      const prompt = `
Bạn là trợ lý AI dinh dưỡng chuyên biệt cho trường mầm non. Bạn giúp ngoại bếp và giáo viên lên thực đơn cân bằng và an toàn cho trẻ.

**THỰC ĐƠN HÔM NAY:**
▪ Bữa trưa:
  - ${lunchFoods}
▪ Bữa chiều:
  - ${afternoonFoods}

**NHỮNG MÓN THƯỜNG DÙNG TRONG CƠ SỞ:**
${foodContext}

**CÂU HỎI/YÊU CẦU CỦA NGƯỜI DÙNG:**
${userMessage}

**HƯỚNG DẪN TRẢ LỜI:**
1. Trả lời ngắn gọn, rõ ràng, hữu ích
2. Nếu hỏi về dinh dưỡng, đưa ra gợi ý cụ thể
3. Nếu hỏi về cải thiện, gợi ý thay thế cụ thể với lý do
4. Nếu hỏi thêm món mới, gợi ý 2-3 món phù hợp
5. Luôn ưu tiên sức khỏe và an toàn cho trẻ
6. Trả lời bằng tiếng Việt

**ĐỊNH DẠNG:**
- Sử dụng • hoặc - để liệt kê điểm
- Dùng **đậm** để nhấn mạnh
- Nếu gợi ý thêm/thay thế, phải có lý do cụ thể
`;

      const result = await this._generateWithFallback(prompt);
      const responseText = result.response.text();

      return {
        success: true,
        response: responseText,
      };
    } catch (error) {
      console.error("Gemini chat error:", error);
      throw error;
    }
  }

  /**
   * Detailed daily menu analysis with comprehensive recommendations
   */
  async analyzeDailyMenuDetailed(dailyMenu, allFoods, ingredients) {
    try {
      const lunchFoods = dailyMenu.lunchFoods
        ?.map((f) => `${f.name}: ${f.calories}kcal, Protein: ${f.protein}g, Fat: ${f.fat}g, Carb: ${f.carb}g`)
        .join("\n") || "Chưa có";

      const afternoonFoods = dailyMenu.afternoonFoods
        ?.map((f) => `${f.name}: ${f.calories}kcal, Protein: ${f.protein}g, Fat: ${f.fat}g, Carb: ${f.carb}g`)
        .join("\n") || "Chưa có";

      const prompt = `
Bạn là chuyên gia dinh dưỡng trẻ em. Phân tích chi tiết thực đơn cho trẻ mầm non:

**BỮA TRƯA:**
${lunchFoods}

**BỮA CHIỀU:**
${afternoonFoods}

**PHÂN TÍCH:**
1. Tổng calo cho cả ngày
2. Tỷ lệ Protein/Carb/Fat (nên là 15-20% protein, 50-55% carb, 25-30% fat)
3. Đủ calcium, sắt, vitamin?
4. Đa dạng màu sắc và loại thực phẩm?

**GỢI ÝỀ CẢI THIỆN (nếu cần):**
- Nếu thiếu một nhóm chất, gợi ý cụ thể
- Nếu quá nhiều một loại, gợi ý thay thế
- Luôn giải thích lý do

**ĐỊNH DẠNG TRẢẢP:**
{
  "totalCalories": 1200,
  "isBalanced": true/false,
  "analysis": "Nhận xét chi tiết",
  "nutritionScore": "Đánh giá điểm",
  "suggestions": [
    {
      "issue": "Vấn đề/Thiếu điều gì",
      "recommendation": "Gợi ý cụ thể",
      "reason": "Tại sao"
    }
  ],
  "overallFeedback": "Lời khuyên cuối cùng"
}`;

      const result = await this._generateWithFallback(prompt);
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { error: "Không thể phân tích chi tiết" };
    } catch (error) {
      console.error("Gemini analyzeDailyMenuDetailed error:", error);
      throw error;
    }
  }
}

module.exports = new GeminiService();
