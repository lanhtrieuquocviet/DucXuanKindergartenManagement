const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
  }

  getClient() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }

    if (!this.client) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.client;
  }

  async analyzeMenuSuggestions(menuData) {
    try {
      const prompt = `Bạn là một trợ lý dinh dưỡng chuyên gia sử dụng GPT-4.0. Phân tích thực đơn sau cho trường mầm non và đánh giá:
- Năng lượng trung bình mỗi ngày (kcal) nên từ 615 đến 726
- Tỷ lệ protein 13-20% tổng năng lượng
- Tỷ lệ chất béo 25-35% tổng năng lượng
- Tỷ lệ tinh bột / carb 52-60% tổng năng lượng

Nếu có điểm không đạt, đề xuất điều chỉnh món ăn (thay đổi phần, thay nguyên liệu, thêm món) để đạt chuẩn.

Dữ liệu (JSON):\n${JSON.stringify(menuData)}

Yêu cầu trả về JSON duy nhất với cấu trúc:
{
  "analysis": string,
  "isBalanced": boolean,
  "overallRecommendation": string,
  "suggestions": [
    {"dishName": string, "reason": string, "nutrition": {"calories": number, "protein": number, "fat": number, "carb": number}, "portion": string}
  ]
}

Chỉ trả về JSON, không thêm văn bản nào khác.`;

      const response = await this.getClient().chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
      });

      const content = response.choices[0].message.content.trim();
      try {
        return JSON.parse(content);
      } catch (parseError) {
        return {
          analysis: content,
          isBalanced: false,
          overallRecommendation: 'Không thể phân tích chi tiết',
          suggestions: [],
        };
      }
    } catch (error) {
      console.error('OpenAI analyzeMenu error:', error);
      throw error;
    }
  }

  async suggestDishImprovements(dishName, ingredients) {
    try {
      const prompt = `Bạn là trợ lý dinh dưỡng GPT-4.0. Món: "${dishName}" với nguyên liệu: ${ingredients.join(', ')}.
Hãy đề xuất cải thiện món này để phù hợp với khẩu phần mầm non (cân bằng năng lượng, protein/fat/carb). Nêu cụ thể các thay đổi (gia giảm, thay thế, liều lượng).
Trả lời bằng tiếng Việt.`;

      const response = await this.getClient().chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI suggestDishImprovements error:', error);
      throw error;
    }
  }

  async suggestNewDishes(ingredients, recentDishNames) {
    try {
      const ingredientNames = Array.isArray(ingredients)
        ? ingredients.map((ing) => (typeof ing === 'string' ? ing : ing.name || '')).filter(Boolean)
        : [];

      const prompt = `Bạn là trợ lý dinh dưỡng GPT-4.0. Hãy đề xuất 5 món mới phù hợp cho trẻ mầm non dựa trên nguyên liệu: ${ingredientNames.join(', ')}. Tránh trùng lặp với những món gần đây: ${recentDishNames.join(', ')}.
- Ưu tiên món giàu protein nhẹ nhàng, đủ rau xanh, tinh bột vừa phải, ít dầu mỡ.
- Gợi ý phần ăn, cách chế biến an toàn cho trẻ.
- Trả lời bằng tiếng Việt và đầu ra ở định dạng JSON với mảng "newDishes" mỗi phần tử gồm {name, description, nutrition: {calories, protein, fat, carb}, cookingTip }.`;

      const response = await this.getClient().chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 700,
      });

      const content = response.choices[0].message.content.trim();
      try {
        const parsed = JSON.parse(content);
        return parsed;
      } catch (parseError) {
        return { rawText: content, newDishes: [] };
      }
    } catch (error) {
      console.error('OpenAI suggestNewDishes error:', error);
      throw error;
    }
  }

  async chatWithContext(message, dailyMenu, allFoods) {
    try {
      const context = `Bạn là trợ lý lập kế hoạch thực đơn mầm non bằng GPT-4.0.
Dữ liệu thực đơn: ${JSON.stringify(dailyMenu)}\nDanh sách món: ${JSON.stringify(allFoods)}\nYêu cầu người dùng: ${message}\n
Hãy trả lời ngắn gọn, đúng tiêu chuẩn dinh dưỡng và dễ hiểu.`;

      const response = await this.getClient().chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: context }],
        max_tokens: 1000,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw error;
    }
  }

  async suggestMenuBalance(menuData) {
    try {
      const prompt = `Bạn là trợ lý dinh dưỡng GPT-4.0, nhiệm vụ cân bằng thực đơn mầm non.
- Mục tiêu calo trung bình 615-726 kcal mỗi ngày.
- Protein 13-20% tổng năng lượng, chất béo 25-35%, tinh bột/carb 52-60%.

Hãy phân tích menu sau: ${JSON.stringify(menuData)}
1. Xác định phần nào đang thiếu/thiếu vượt mức.
2. Đưa ra 3 hành động cụ thể (thêm bớt món, điều chỉnh khẩu phần, đổi nguyên liệu).
3. Gợi ý 2 món thay thế/điều chỉnh để đạt chuẩn.
4. Kết luận: "Đạt chuẩn" / "Cần chỉnh".

Trả lời bằng tiếng Việt và định dạng rõ ràng, bullet/number.`;

      const response = await this.getClient().chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1600,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI suggestMenuBalance error:', error);
      throw error;
    }
  }
}


module.exports = new OpenAIService();