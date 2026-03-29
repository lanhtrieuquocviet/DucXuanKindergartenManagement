# AI Menu Integration Guide

## 🎯 Tổng Quan
Tính năng AI thông minh giúp quản lý thực đơn hiệu quả hơn bằng cách:
- **Gợi ý món mới** với đầy đủ nguyên liệu và thông số dinh dưỡng
- **Chỉnh sửa/cải thiện** các món ăn hiện có trong hệ thống
- **Tạo từ gợi ý** - Tự động thêm các món mới vào database

---

## 📦 Các Files Được Tạo

### 1. **API Service** - `fe/src/service/ai.api.js`
```javascript
// Gọi các API endpoint của backend
- analyzeMenu(dailyMenuId)      // Phân tích thực đơn
- improveDish(foodId)            // Gợi ý cải thiện món
- suggestNewDishes()             // Gợi ý món mới
- chatWithAI(message, dailyMenuId) // Chat với AI
- createDishFromSuggestion(data)  // Tạo món từ gợi ý
```

### 2. **AI Menu Widget** - `fe/src/components/AIMenuWidget.jsx`
Floating widget hiển thị ở góc dưới phải màn hình
- Có thể ẩn/hiển thị (collapse/expand)
- Hiển thị trạng thái Edit/View
- 2 nút chính: Chỉnh sửa & Gợi ý mới

### 3. **AI Menu Dialog** - `fe/src/components/AIMenuDialog.jsx`
Modal chi tiết khi người dùng click vào widget
- **Tab 1: Gợi ý Món Mới**
  - Hiển thị danh sách gợi ý
  - Chi tiết: Nguyên liệu, Dinh dưỡng, Mẹo nấu
  - Nút "Tạo Món Này" để thêm vào database
  
- **Tab 2: Chỉnh Sửa Thực Đơn**
  - Liệt kê các món đã có
  - Gợi ý cải thiện cho từng món
  - Hiển thị cách cấu trúc nguyên liệu tốt hơn

### 4. **Integration** - `fe/src/pages/kitchenStaff/MenuDetails.jsx`
```javascript
// Import thêm
import AIMenuWidget from "../../components/AIMenuWidget";

// Thêm vào render
{menu && <AIMenuWidget menu={menu} isEditable={isEditable} onMenuUpdate={fetchMenuDetail} />}
```

---

## 🎨 Giao Diện

### Widget Position
- **Vị trí**: Bottom-right corner (z-index: 999)
- **Kích thước**: 320px width, flexible height
- **Style**: Gradient purple-blue với blur effect
- **Animation**: Collapse/expand smooth transition

### Color Scheme
```
Gradient: #667eea → #764ba2 (Purple/Blue)
Success: #4ade80 (Green)
Highlight: #f97316 (Orange - Calories)
```

### States
- **Edit Mode**: Widget fully active, all buttons available
- **View Mode**: Only "Gợi ý Món Mới" button active
- **Collapsed**: Shows floating icon button in corner

---

## 🚀 Cách Sử Dụng

### 1. Gợi ý Món Mới
```
1. Click widget → Mở dialog
2. Click "✨ Gợi ý Món Mới"
3. Xem danh sách gợi ý
4. Click vào một gợi ý để xem chi tiết
5. Click "Tạo Món Này" để thêm vào database
6. Xác nhận → Tạo thành công
```
**Kết quả**: Món mới được lưu vào Food collection, có thể add vào menu

### 2. Chỉnh Sửa Thực Đơn (Chỉ ở Edit Mode)
```
1. Click widget → Mở dialog
2. Click "📋 Chỉnh Sửa Thực Đơn"
3. Chọn một món từ danh sách hiện tại
4. Xem gợi ý cải thiện:
   - Thay thế nguyên liệu nào
   - Lý do thay thế
   - Dinh dưỡng dự kiến sau cải thiện
5. Sử dụng gợi ý để cập nhật thực đơn
```
**Lưu ý**: Chỉ có khi ở chế độ "Nháp" hoặc "Bị từ chối"

---

## 🔗 Backend Integration

### Endpoints đã tồn tại:
```
POST /api/ai/suggest-dishes           → Gợi ý món mới
POST /api/ai/improve-dish             → Gợi ý cải thiện
POST /api/ai/create-from-suggestion   → Tạo món từ gợi ý
POST /api/ai/analyze-menu             → Phân tích thực đơn
POST /api/ai/chat                     → Chat với AI
```

### Yêu cầu:
- ✅ Backend phải có OPENAI_API_KEY cấu hình
- ✅ OpenAI GPT-4 service setup in `be/src/utils/openaiService.js`
- ✅ Controller setup in `be/src/controller/aiMenuController.js`

---

## 📊 Thông Tin Dinh Dưỡng Hiển Thị

Mỗi gợi ý/món ăn sẽ hiển thị:
- **Calories** (kcal) - Năng lượng: #f97316 🔥
- **Protein** (g) - Đạm: #6366f1 🥩
- **Fat** (g) - Chất béo: #eab308
- **Carb** (g) - Tinh bột: #22c55e

---

## 💡 Features Detail

### Nutrition Analysis
```
AI sẽ phân tích dựa trên:
- Chuẩn dinh dưỡng cho trẻ mầm non
- Cân bằng các chất dinh dưỡng
- Đa dạng nguyên liệu
- An toàn thực phẩm cho trẻ
```

### Ingredient Suggestions
```
Mỗi gợi ý bao gồm:
- Danh sách nguyên liệu cụ thể
- Khẩu phần ước tính
- Dinh dưỡng từng nguyên liệu
- Cách kết hợp tối ưu
```

### Improvement Tips
```
AI sẽ suggest:
- Nguyên liệu nên thêm
- Nguyên liệu nên thay thế
- Lý do thay thế (dinh dưỡng, an toàn, độ ngon)
- Dinh dưỡng dự kiến sau cải thiện
```

---

## 🛠️ Troubleshooting

### Widget không hiển thị?
- ✅ Kiểm tra menu đã load đầy đủ
- ✅ Kiểm tra browser console có error không
- ✅ Kiểm tra AIMenuWidget component import đúng

### Gợi ý không tải?
- ✅ Kiểm tra backend server đang chạy
- ✅ Kiểm tra GEMINI_API_KEY cấu hình
- ✅ Kiểm tra network tab xem API call có success không

### Không thể tạo món?
- ✅ Kiểm tra tên món không trùng lặp trong database
- ✅ Kiểm tra nguyên liệu đã được định nghĩa
- ✅ Kiểm tra permission có đủ không

---

## 📝 Customization

### Thay đổi vị trí widget:
File: `AIMenuWidget.jsx` - Tìm `sx={{ position: "fixed", bottom: 32, right: 32 }}`

### Thay đổi kích thước:
```javascript
width: 320,  // Thay đổi width
// Trong sx của Card component
```

### Thay đổi màu sắc:
```javascript
background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
// Thay đổi gradient colors
```

---

## 📈 Performance Tips

1. **Lazy load widget**: Widget sẽ chỉ hiển thị khi menu loaded
2. **Collapse khi không dùng**: Giúp tiết kiệm không gian màn hình
3. **AI calls cached**: Gợi ý được lưu khi dialog mở, không call lại khi tab switch

---

## ✨ Future Enhancements

Có thể mở rộng:
- [ ] Lưu history gợi ý
- [ ] Favorite/bookmark gợi ý
- [ ] AI chat interface
- [ ] Batch create multiple dishes
- [ ] Menu comparison suggestions
- [ ] Seasonal menu recommendations

---

## 📞 Support

Nếu có lỗi hoặc cần thêm feature:
1. Kiểm tra console log
2. Kiểm tra network requests
3. Kiểm tra backend logs
4. Liên hệ team phát triển
