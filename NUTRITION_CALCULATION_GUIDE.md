# Hướng dẫn Tính toán Dinh dưỡng - Nutrition Calculation System

## Tổng quan

Hệ thống tính toán dinh dưỡng được xây dựng dựa trên các hệ số chuyển đổi tiêu chuẩn:
- **1g Protein = 4 Kcal**
- **1g Fat/Lipid = 9 Kcal**
- **1g Carb/Glucid = 4 Kcal**

## Cấu trúc Dữ liệu

### 1. Model Ingredient
Lưu trữ giá trị dinh dưỡng gốc (thường tính per 100g):
```javascript
{
  name: "Gạo trắng",
  unit: "100g",
  calories: 130,
  protein: 2.7,
  fat: 0.3,
  carb: 28,
}
```

### 2. Model Food
Lưu trữ thông tin món ăn với danh sách nguyên liệu:
```javascript
{
  name: "Cơm trắng",
  calories: 130,
  protein: 2.7,
  fat: 0.3,
  carb: 28,
  ingredients: [
    {
      name: "Gạo trắng",
      quantity: "100g",
      calories: 130,
      protein: 2.7,
      fat: 0.3,
      carb: 28,
    },
  ],
}
```

### 3. Model DailyMenu
Lưu trữ thông tin thực đơn ngày với tổng hợp dinh dưỡng:
```javascript
{
  menuId: ObjectId,
  weekType: "odd" | "even",
  dayOfWeek: "mon" | "tue" | "wed" | "thu" | "fri",
  lunchFoods: [ObjectId, ObjectId, ...],
  afternoonFoods: [ObjectId, ObjectId, ...],
  
  // Dinh dưỡng tổng hợp (grams)
  totalCalories: 1500,
  totalProtein: 45,
  totalFat: 30,
  totalCarb: 200,
  
  // Tỉ lệ % so với tổng Kcal
  proteinPercentage: 30,
  fatPercentage: 40,
  carbPercentage: 30,
  
  // Chi tiết quy đổi Kcal
  nutritionDetails: {
    kcalFromProtein: 180,  // 45g * 4
    kcalFromFat: 270,      // 30g * 9
    kcalFromCarb: 800,     // 200g * 4
    calculatedTotalKcal: 1250,
  },
}
```

## API Nutrition Calculator

### File: `be/src/utils/nutritionCalculator.js`

#### 1. `convertGramsToKcal(nutrients)`
Chuyển đổi grams sang Kcal

**Input:**
```javascript
{
  protein: 50,  // grams
  fat: 30,      // grams
  carb: 200,    // grams
}
```

**Output:**
```javascript
{
  kcalFromProtein: 200,     // 50 * 4
  kcalFromFat: 270,         // 30 * 9
  kcalFromCarb: 800,        // 200 * 4
  totalKcal: 1270,
}
```

#### 2. `calculateNutritionPercentage(nutrients)`
Tính tỉ lệ % của P-L-G so với tổng Kcal

**Input:**
```javascript
{
  protein: 50,
  fat: 30,
  carb: 200,
}
```

**Output:**
```javascript
{
  proteinPercentage: 15.75,    // (200 / 1270) * 100
  fatPercentage: 21.26,        // (270 / 1270) * 100
  carbPercentage: 62.99,       // (800 / 1270) * 100
  totalKcal: 1270,
  proteinGrams: 50,
  fatGrams: 30,
  carbGrams: 200,
}
```

#### 3. `aggregateNutritionFromFoods(foods)`
**Hàm chính để quét các món ăn và tổng cộng dinh dưỡng**

Lấy danh sách Food objects từ database và tính toán tổng P-L-G

**Input:**
```javascript
[
  {
    name: "Cơm",
    calories: 130,
    protein: 2.7,
    fat: 0.3,
    carb: 28,
  },
  {
    name: "Cá luộc",
    calories: 90,
    protein: 20,
    fat: 1,
    carb: 0,
  },
]
```

**Output:**
```javascript
{
  totalProteinGrams: 22.7,
  totalFatGrams: 1.3,
  totalCarbGrams: 28,
  totalCalories: 220,
  calculatedTotalKcal: 184.2,
  proteinPercentage: 49.35,
  fatPercentage: 6.35,
  carbPercentage: 60.87,
  details: {
    kcalFromProtein: 90.8,   // 22.7 * 4
    kcalFromFat: 11.7,       // 1.3 * 9
    kcalFromCarb: 112,       // 28 * 4
  },
}
```

#### 4. `aggregateNutritionFromIngredients(ingredients)`
Tính toán từ danh sách nguyên liệu với khối lượng cụ thể

**Input:**
```javascript
[
  {
    name: "Gạo",
    weight: 150,      // grams
    calories: 130,
    protein: 2.7,
    fat: 0.3,
    carb: 28,
  },
  {
    name: "Cá",
    weight: 100,
    calories: 90,
    protein: 20,
    fat: 1,
    carb: 0,
  },
]
```

**Output:**
```javascript
{
  totalProteinGrams: 24.05,
  totalFatGrams: 1.45,
  totalCarbGrams: 42,
  totalCalories: 244.5,
  calculatedTotalKcal: 270,
  proteinPercentage: 35.70,
  fatPercentage: 4.83,
  carbPercentage: 62.22,
}
```

## Sử dụng trong Controller

### Ví dụ: Update Daily Menu

```javascript
const DailyMenu = require("../models/DailyMenu");
const Food = require("../models/Food");
const {
  aggregateNutritionFromFoods,
} = require("../utils/nutritionCalculator");

exports.updateDailyMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { lunchFoods, afternoonFoods } = req.body;

    const dailyMenu = await DailyMenu.findById(id);

    if (!dailyMenu) {
      return res.status(404).json({
        message: "Daily menu không tồn tại",
      });
    }

    // Cập nhật foods
    if (lunchFoods !== undefined) {
      dailyMenu.lunchFoods = lunchFoods;
    }

    if (afternoonFoods !== undefined) {
      dailyMenu.afternoonFoods = afternoonFoods;
    }

    // Lấy toàn bộ foods
    const allFoods = await Food.find({
      _id: {
        $in: [
          ...(dailyMenu.lunchFoods || []),
          ...(dailyMenu.afternoonFoods || []),
        ],
      },
    });

    // 🔥 SỬ DỤNG NUTRITION CALCULATOR
    const nutritionData = aggregateNutritionFromFoods(allFoods);

    // Cập nhật DailyMenu
    dailyMenu.totalCalories = nutritionData.totalCalories;
    dailyMenu.totalProtein = nutritionData.totalProteinGrams;
    dailyMenu.totalFat = nutritionData.totalFatGrams;
    dailyMenu.totalCarb = nutritionData.totalCarbGrams;
    dailyMenu.proteinPercentage = nutritionData.proteinPercentage;
    dailyMenu.fatPercentage = nutritionData.fatPercentage;
    dailyMenu.carbPercentage = nutritionData.carbPercentage;
    dailyMenu.nutritionDetails = {
      kcalFromProtein: nutritionData.details.kcalFromProtein,
      kcalFromFat: nutritionData.details.kcalFromFat,
      kcalFromCarb: nutritionData.details.kcalFromCarb,
      calculatedTotalKcal: nutritionData.calculatedTotalKcal,
    };

    await dailyMenu.save();

    res.json({
      success: true,
      data: dailyMenu,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
```

## Ví dụ Dữ liệu Thực tế

### Scenario: Tính toán thực đơn ngày cho trẻ em

**Thực đơn:**
- Bữa trưa: Cơm (100g) + Cá luộc (50g) + Rau cải (100g)
- Bữa chiều: Sữa chua (100g) + Bánh quy (30g)

**Tính toán:**

1. **Bữa trưa:**
   - Cơm: 130 cal, 2.7g P, 0.3g F, 28g C
   - Cá: 45 cal, 10g P, 0.5g F, 0g C
   - Rau: 25 cal, 3g P, 0.2g F, 5g C
   - **Tổng:** 200 cal, 15.7g P, 1g F, 33g C

2. **Bữa chiều:**
   - Sữa chua: 60 cal, 3.5g P, 1g F, 4.5g C
   - Bánh quy: 150 cal, 2g P, 8g F, 18g C
   - **Tổng:** 210 cal, 5.5g P, 9g F, 22.5g C

3. **Tổng cộng (cả ngày):**
   - Calories: 410
   - Protein: 21.2g
   - Fat: 10g
   - Carb: 55.5g

4. **Quy đổi Kcal:**
   - Protein: 21.2 × 4 = 84.8 Kcal
   - Fat: 10 × 9 = 90 Kcal
   - Carb: 55.5 × 4 = 222 Kcal
   - **Tổng Kcal tính từ PLC: 396.8 Kcal**

5. **Tỉ lệ %:**
   - Protein: (84.8 / 396.8) × 100 = 21.38%
   - Fat: (90 / 396.8) × 100 = 22.69%
   - Carb: (222 / 396.8) × 100 = 55.93%

## Hướng dẫn Sử dụng cho Frontend

Frontend có thể gọi API `PUT /api/daily-menu/:id` với body:
```json
{
  "lunchFoods": ["foodId1", "foodId2"],
  "afternoonFoods": ["foodId3", "foodId4"]
}
```

Response sẽ trả về:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "totalCalories": 410,
    "totalProtein": 21.2,
    "totalFat": 10,
    "totalCarb": 55.5,
    "proteinPercentage": 21.38,
    "fatPercentage": 22.69,
    "carbPercentage": 55.93,
    "nutritionDetails": {
      "kcalFromProtein": 84.8,
      "kcalFromFat": 90,
      "kcalFromCarb": 222,
      "calculatedTotalKcal": 396.8
    }
  }
}
```

## Lưu ý Quan trọng

1. **Đơn vị dữ liệu:**
   - Calories: Kcal
   - Protein, Fat, Carb: Grams

2. **Database với Ingredient:**
   - Nên lưu giá trị dinh dưỡng per 100g
   - Hàm `aggregateNutritionFromIngredients` sẽ tự động tính toán dựa trên weight

3. **Validation:**
   - Kiểm tra giá trị không âm
   - Kiểm tra array foods không rỗng

4. **Xác suất sai số:**
   - Kết quả được làm tròn đến 2 chữ số thập phân
   - Sai số tối đa: ±0.01 Kcal

## Cải tiến tương lai

- [ ] Thêm cache cho tính toán thường xuyên
- [ ] Hỗ trợ custom coefficients cho từng loại dinh dưỡng
- [ ] Thêm history tracking cho nutritional changes
- [ ] Hỗ trợ multiple serving sizes
- [ ] AI-powered recommendation dựa trên target nutrition
