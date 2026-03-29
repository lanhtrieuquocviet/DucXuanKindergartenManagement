# Quick Integration Guide - Hệ thống Tính toán Dinh dưỡng

## 📋 Tóm Tắt Cấu trúc

Hệ thống tính toán dinh dưỡng được chia thành 3 phần chính:

```
┌─────────────────────────────────────────────────────┐
│         Frontend (MenuDetails.jsx)                   │
│   Hiển thị thông tin dinh dưỡng + các biểu đồ      │
└────────────────┬────────────────────────────────────┘
                 │ API Call: PUT /api/daily-menu/:id
                 ▼
┌─────────────────────────────────────────────────────┐
│  Backend Controller (dailyMenu.controller.js)        │
│  - Nhận request với lunchFoods, afternoonFoods      │
│  - Gọi hàm aggregateNutritionFromFoods()            │
│  - Lưu toàn bộ dữ liệu vào Database                 │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Utility Functions (nutritionCalculator.js)          │
│  - convertGramsToKcal()                             │
│  - calculateNutritionPercentage()                   │
│  - aggregateNutritionFromFoods() ⭐ MAIN FUNCTION    │
│  - aggregateNutritionFromIngredients()              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Database (DailyMenu Collection)                    │
│  - totalProtein, totalFat, totalCarb                │
│  - proteinPercentage, fatPercentage, carbPercentage │
│  - nutritionDetails (Kcal breakdown)                │
└─────────────────────────────────────────────────────┘
```

## 🔧 Files Được Tạo/Chỉnh Sửa

### 1. **Tạo mới: `be/src/utils/nutritionCalculator.js`**
   - Hệ thống tính toán dinh dưỡng chính
   - 4 hàm chính + hằng số hệ số Kcal
   - Tất cả logic tính toán được tập trung ở đây

### 2. **Chỉnh sửa: `be/src/models/DailyMenu.js`**
   - Thêm fields mới: `proteinPercentage`, `fatPercentage`, `carbPercentage`
   - Thêm object `nutritionDetails` với kcal breakdown
   - Backward compatible - không ảnh hưởng đến dữ liệu cũ

### 3. **Chỉnh sửa: `be/src/controller/dailyMenu.controller.js`**
   - Import hàm `aggregateNutritionFromFoods`
   - Thay thế logic tính toán đơn giản bằng hàm mới
   - Tự động lưu tất cả fields mới vào database

### 4. **Tạo mới: `be/src/tests/nutritionCalculator.test.js`**
   - 5 test cases toàn diện
   - Kiểm chứng tất cả công thức tính toán
   - Có thể chạy lại bất cứ lúc nào: `node be/src/tests/nutritionCalculator.test.js`

### 5. **Tạo mới: `NUTRITION_CALCULATION_GUIDE.md`** (file này)
   - Tài liệu chi tiết đầy đủ
   - Ví dụ thực tế
   - API reference

## 🚀 Cách Sử dụng

### Backend - Tự động tính toán khi update Daily Menu

```javascript
// Route: PUT /api/daily-menu/:id
{
  lunchFoods: ["food_id_1", "food_id_2"],
  afternoonFoods: ["food_id_3"]
}

// Response:
{
  success: true,
  data: {
    _id: "...",
    totalProtein: 45.5,
    totalFat: 22,
    totalCarb: 150,
    totalCalories: 1300,
    
    // 🆕 Dữ liệu mới được thêm vào
    proteinPercentage: 14.2,
    fatPercentage: 15.2,
    carbPercentage: 70.6,
    
    nutritionDetails: {
      kcalFromProtein: 182,
      kcalFromFat: 198,
      kcalFromCarb: 600,
      calculatedTotalKcal: 980
    }
  }
}
```

### Frontend - Hiển thị dữ liệu

```javascript
// Trong MenuDetails.jsx
const dailyMenuData = response.data;

// Hiển thị tỉ lệ %
<ProteinChart percentage={dailyMenuData.proteinPercentage} />
<FatChart percentage={dailyMenuData.fatPercentage} />
<CarbChart percentage={dailyMenuData.carbPercentage} />

// Hiển thị chi tiết
<NutritionInfo
  protein={dailyMenuData.totalProtein}
  fat={dailyMenuData.totalFat}
  carb={dailyMenuData.totalCarb}
  kcalBreakdown={dailyMenuData.nutritionDetails}
/>
```

## 📊 Công thức Tính toán

### 1. Quy đổi Kcal:
```
Protein Kcal = Protein (grams) × 4
Fat Kcal = Fat (grams) × 9
Carb Kcal = Carb (grams) × 4
Total Kcal = Protein Kcal + Fat Kcal + Carb Kcal
```

### 2. Tính Tỉ lệ %:
```
Protein % = (Protein Kcal / Total Kcal) × 100
Fat % = (Fat Kcal / Total Kcal) × 100
Carb % = (Carb Kcal / Total Kcal) × 100
```

### 3. Aggregation từ Foods:
```
Total Protein = Σ (food.protein) từ tất cả foods
Total Fat = Σ (food.fat) từ tất cả foods
Total Carb = Σ (food.carb) từ tất cả foods
Total Calories = Σ (food.calories) từ tất cả foods
```

## ✅ Kiểm tra Implementation

Để kiểm tra xem implementation có hoạt động đúng:

```bash
# Chạy test file
cd be
node src/tests/nutritionCalculator.test.js

# Kết quả kỳ vọng: ✓ PASSED cho tất cả 5 tests
```

## 🔄 Quy trình Update Daily Menu

1. **Frontend gọi API:**
   ```
   PUT /api/daily-menu/[menuId]
   Body: { lunchFoods: [...], afternoonFoods: [...] }
   ```

2. **Backend nhận request:**
   - Tìm DailyMenu record
   - Update `lunchFoods` và `afternoonFoods`
   - Lấy tất cả Food documents

3. **Backend tính toán (tự động):**
   ```javascript
   const nutritionData = aggregateNutritionFromFoods(allFoods);
   // Tự động tính: totalProtein, totalFat, totalCarb
   // Tự động tính: proteinPercentage, fatPercentage, carbPercentage
   // Tự động tính: nutritionDetails.kcalFromProtein, ...
   ```

4. **Backend lưu vào Database:**
   - Tất cả giá trị dinh dưỡng được lưu
   - Không cần frontend tính toán lại

5. **Frontend hiển thị:**
   - Lấy dữ liệu từ API response
   - Hiển thị biểu đồ, tỉ lệ %, chi tiết

## 📝 Ví dụ Thực tế

**Scenario:** Tính toán thực đơn cho một ngày

**Input Foods:**
- Cơm: 130 cal, 2.7g P, 0.3g F, 28g C
- Cá: 200 cal, 25g P, 12g F, 0g C
- Rau: 25 cal, 3g P, 0.2g F, 5g C

**Tính toán:**
```
Total: 355 cal, 30.7g P, 12.5g F, 33g C

Kcal Breakdown:
- Protein: 30.7 × 4 = 122.8 Kcal
- Fat: 12.5 × 9 = 112.5 Kcal
- Carb: 33 × 4 = 132 Kcal
- Total: 367.3 Kcal

Percentages:
- Protein: (122.8 / 367.3) × 100 = 33.43%
- Fat: (112.5 / 367.3) × 100 = 30.63%
- Carb: (132 / 367.3) × 100 = 35.94%
```

## ⚠️ Lưu ý Quan trọng

1. **Dữ liệu Gốc:**
   - Ingredient model lưu giá trị per 100g
   - Food model tính tổng từ các ingredient
   - DailyMenu căn cứ trên tổng của Food

2. **Đơn vị:**
   - Calories: Kcal
   - Protein, Fat, Carb: Grams
   - Percentages: %

3. **Rounding:**
   - Kết quả được làm tròn đến 2 chữ số thập phân
   - Ví dụ: 15.75 % chứ không phải 15.7536%

4. **Validation:**
   - Kiểm tra array Foods không rỗng
   - Giá trị âm được xử lý (default = 0)
   - Chia cho 0 được xử lý (return 0)

## 🎯 Tiếp theo

### Tính năng có thể thêm:
- [ ] Lưu history thay đổi giá trị dinh dưỡng
- [ ] Notifications khi vượt/dưới mục tiêu dinh dưỡng
- [ ] AI recommendations dựa trên dữ liệu
- [ ] Export PDF report chi tiết
- [ ] Compare with recommended daily intake standards

## 📞 Support

Nếu có câu hỏi hoặc cần hỗ trợ, tham khảo:
- `NUTRITION_CALCULATION_GUIDE.md` - Tài liệu chi tiết
- `be/src/utils/nutritionCalculator.js` - Code chính với comments
- `be/src/tests/nutritionCalculator.test.js` - Test examples

---

✅ **Implementation hoàn thành và kiểm chứng!** 🎉
