const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
  }

  /**
   * Chuẩn hóa dữ liệu menu trước khi gửi cho AI
   * @param {Array} foods - Danh sách món trong menu
   * @returns {Object} Menu data đã format
   */
  formatMenuForAnalysis(foods) {
    if (!Array.isArray(foods) || foods.length === 0) {
      return { dishes: [], totalStats: { calories: 0, protein: 0, fat: 0, carb: 0 } };
    }

    const dishes = foods.map(f => ({
      name: f.name || 'Không rõ',
      quantity: f.quantity || f.portion || '1 phần',
      unit: f.unit || 'g',
      nutrition: {
        calories: Number(f.calories) || 0,
        protein: Number(f.protein) || 0,
        fat: Number(f.fat) || 0,
        carb: Number(f.carb) || 0,
      },
    }));

    // Calculate totals
    const totalStats = dishes.reduce(
      (acc, dish) => ({
        calories: acc.calories + (dish.nutrition.calories || 0),
        protein: acc.protein + (dish.nutrition.protein || 0),
        fat: acc.fat + (dish.nutrition.fat || 0),
        carb: acc.carb + (dish.nutrition.carb || 0),
      }),
      { calories: 0, protein: 0, fat: 0, carb: 0 }
    );

    return { dishes, totalStats };
  }

  /**
   * Tính toán tỷ lệ % dinh dưỡng
   * @param {Object} stats - Thống kê dinh dưỡng
   * @returns {Object} Tỷ lệ phần trăm
   */
  calculateNutritionPercentages(stats) {
    const totalCalories = stats.calories || 615; // Default to minimum target calories
    if (totalCalories === 0) {
      return { proteinPercent: 0, fatPercent: 0, carbPercent: 0 };
    }
    
    return {
      proteinPercent: Number(((stats.protein * 4 / totalCalories) * 100).toFixed(1)),
      fatPercent: Number(((stats.fat * 9 / totalCalories) * 100).toFixed(1)),
      carbPercent: Number(((stats.carb * 4 / totalCalories) * 100).toFixed(1)),
    };
  }

  /**
   * Validate output từ AI
   * @param {Object} result - Kết quả từ AI
   * @returns {Object} Kết quả đã validate
   */
  validateAIResponse(result) {
    return {
      currentAnalysis: {
        totalCalories: Number(result.currentAnalysis?.totalCalories) || 0,
        proteinPercent: Number(result.currentAnalysis?.proteinPercent) || 0,
        fatPercent: Number(result.currentAnalysis?.fatPercent) || 0,
        carbPercent: Number(result.currentAnalysis?.carbPercent) || 0,
        proteinGrams: Number(result.currentAnalysis?.proteinGrams) || 0,
        fatGrams: Number(result.currentAnalysis?.fatGrams) || 0,
        carbGrams: Number(result.currentAnalysis?.carbGrams) || 0,
      },
      deficiencies: Array.isArray(result.deficiencies) ? result.deficiencies : [],
      correctionActions: Array.isArray(result.correctionActions) ? result.correctionActions : [],
      suggestedDishes: Array.isArray(result.suggestedDishes)
        ? result.suggestedDishes.map(d => ({
            oldDishName: d.oldDishName || '',
            newDishName: d.newDishName || '',
            reason: d.reason || '',
            estimatedNutrition: {
              calories: Number(d.estimatedNutrition?.calories) || 0,
              protein: Number(d.estimatedNutrition?.protein) || 0,
              fat: Number(d.estimatedNutrition?.fat) || 0,
              carb: Number(d.estimatedNutrition?.carb) || 0,
            },
          }))
        : [],
      status: ['Đạt chuẩn', 'Cần chỉnh'].includes(result.status) ? result.status : 'Lỗi phân tích',
      summary: result.summary || '',
    };
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

  async analyzeAndOptimizeMenu(foods, allAvailableFoods = []) {
    try {
      // Format menu data
      const menuData = this.formatMenuForAnalysis(foods);
      
      // Add percentages to current analysis
      const percentages = this.calculateNutritionPercentages(menuData.totalStats);

      // Build available foods reference for AI (limit to 30 most common)
      const foodsReference = (allAvailableFoods || [])
        .slice(0, 30)
        .map(f => `${f.name} (${Number(f.calories) || 0}kcal, P:${Number(f.protein) || 0}g, F:${Number(f.fat) || 0}g, C:${Number(f.carb) || 0}g)`)
        .join('\n') || 'Backend sẽ cung cấp danh sách mondataformerly';

      const systemPrompt = `Bạn là chuyên gia dinh dưỡng mầm non tích hợp GPT-4.0. Nhiệm vụ của bạn là kiểm tra và tối ưu hóa thực đơn theo các tiêu chuẩn dinh dưỡng NGHIÊM NGẶT.

CONSTRAINT (Ràng buộc bắt buộc):
- Tổng Calo: 615 - 726 kcal/ngày
- Protein: 13% - 20% tổng năng lượng (tương đương ~20-30g)
- Fat (Chất béo): 25% - 35% tổng năng lượng (tương đương ~17-28g)
- Carb (Tinh bột): 52% - 60% tổng năng lượng (tương đương ~80-109g)

INSTRUCTION ĐẶC BIỆT:
1. Nếu Carb < 52%: Ưu tiên TĂNG định lượng gạo/bún thêm 20-30g mỗi phần hoặc thêm 1 phần cơm bổ sung.
2. Nếu Fat > 35%: Giảm dầu mỡ 5-10g, chuyển sang các món hấp/luộc thay vì xào.
3. Nếu Protein < 13%: Tăng thịt/cá/đậu thêm 15-20g hoặc thêm 1 món giàu protein.

DANH SÁCH MÓN PHỔ BIẾN CÓ SẴN (Gợi ý tên món từ danh sách này):
${foodsReference}

PHÂN TÍCH MENU (Chi tiết định lượng):
- Xác định từng chỉ số hiện tại (Calo, Protein %, Fat %, Carb %)
- Xác định khoảng Thiếu/Thừa với giá trị cụ thể

OUTPUT: JSON HOÀN TOÀN (Không thêm text khác)`;

      const userPrompt = `Phân tích thực đơn sau và gợi ý cách cân bằng:
${JSON.stringify(menuData, null, 2)}

Trả về JSON với cấu trúc chính xác:
{
  "currentAnalysis": {
    "totalCalories": ${menuData.totalStats.calories},
    "proteinPercent": ${percentages.proteinPercent},
    "fatPercent": ${percentages.fatPercent},
    "carbPercent": ${percentages.carbPercent},
    "proteinGrams": ${menuData.totalStats.protein},
    "fatGrams": ${menuData.totalStats.fat},
    "carbGrams": ${menuData.totalStats.carb}
  },
  "deficiencies": [
    {"nutrient": string, "status": "Thiếu" hoặc "Thừa", "amount": number, "detail": string}
  ],
  "correctionActions": [
    {"action": 1, "type": string, "description": string, "impact": string},
    {"action": 2, "type": string, "description": string, "impact": string},
    {"action": 3, "type": string, "description": string, "impact": string}
  ],
  "suggestedDishes": [
    {"oldDishName": string, "newDishName": string, "reason": string, "estimatedNutrition": {"calories": number, "protein": number, "fat": number, "carb": number}},
    {"oldDishName": string, "newDishName": string, "reason": string, "estimatedNutrition": {"calories": number, "protein": number, "fat": number, "carb": number}}
  ],
  "status": "Đạt chuẩn" hoặc "Cần chỉnh",
  "summary": string
}`;

      const response = await this.getClient().chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more deterministic output
      });

      const content = response.choices[0].message.content.trim();
      let result;
      
      try {
        result = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        result = {
          currentAnalysis: { totalCalories: 0, proteinPercent: 0, fatPercent: 0, carbPercent: 0, proteinGrams: 0, fatGrams: 0, carbGrams: 0 },
          deficiencies: [],
          correctionActions: [],
          suggestedDishes: [],
          status: 'Lỗi phân tích',
          summary: content,
        };
      }

      // Validate and sanitize response
      return this.validateAIResponse(result);
    } catch (error) {
      console.error('OpenAI analyzeAndOptimizeMenu error:', error);
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

  /**
   * Tính toán độ tương đồng giữa 2 chuỗi (Levenshtein distance)
   * @param {string} str1 - Chuỗi 1
   * @param {string} str2 - Chuỗi 2
   * @returns {number} Tỷ lệ tương đồng (0-1)
   */
  stringSimilarity(str1, str2) {
    const s1 = String(str1 || '').toLowerCase().trim();
    const s2 = String(str2 || '').toLowerCase().trim();
    
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    // Check if one contains the other
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Levenshtein distance
    const matrix = [];
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLength = Math.max(s1.length, s2.length);
    const distance = matrix[s2.length][s1.length];
    return 1 - distance / maxLength;
  }

  /**
   * Tìm đang đơn từ database dựa trên tên gợi ý từ AI
   * @param {string} suggestionName - Tên món từ AI gợi ý
   * @param {Array} allFoods - Danh sách tất cả các món
   * @param {number} threshold - Ngưỡng độ tương đồng (0-1), mặc định 0.6
   * @returns {Object|null} Món tìm được hoặc null
   */
  findSimilarFood(suggestionName, allFoods, threshold = 0.6) {
    if (!suggestionName || !Array.isArray(allFoods) || allFoods.length === 0) {
      return null;
    }

    let bestMatch = null;
    let bestScore = threshold;

    allFoods.forEach(food => {
      const score = this.stringSimilarity(suggestionName, food.name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = food;
      }
    });

    return bestMatch;
  }

  /**
   * Tìm 2-3 món thay thế từ database dựa trên gợi ý của AI
   * @param {Array} suggestedDishes - Danh sách gợi ý từ AI
   * @param {Array} allFoods - Danh sách tất cả các món
   * @returns {Array} Danh sách các món thay thế đã tìm được từ DB
   */
  async findAlternativeDishesFromDB(suggestedDishes, allFoods) {
    if (!Array.isArray(suggestedDishes) || suggestedDishes.length === 0) {
      return [];
    }

    return suggestedDishes
      .map(suggestion => {
        const foundFood = this.findSimilarFood(suggestion.newDishName, allFoods || [], 0.5);
        return {
          ...suggestion,
          dbMatch: foundFood || null,
          matchScore: foundFood
            ? this.stringSimilarity(suggestion.newDishName, foundFood.name)
            : 0,
        };
      })
      .filter(item => item.dbMatch !== null)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3); // Return top 3 matches
  }
}


module.exports = new OpenAIService();