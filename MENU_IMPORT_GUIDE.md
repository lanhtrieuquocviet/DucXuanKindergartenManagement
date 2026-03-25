# Hướng Dẫn Sử Dụng Tính Năng Nhập/Xuất Thực Đơn

## 📥 Cách Sử Dụng

### 1. Tải Mẫu Biểu (Download Template)
- Nhấp nút **"Tải mẫu"** ở trên cùng màn hình
- File Excel `Mau_Nhap_Thuc_Don_[Tháng]_[Năm].xlsx` sẽ được tải về
- Mẫu chứa tất cả các ô cần điền cho tuần lẻ và tuần chẵn

### 2. Điền Dữ Liệu Thực Đơn
Trong file Excel, bạn sẽ thấy các cột:
- **Loại tuần**: Tuần lẻ hoặc Tuần chẵn
- **Ngày**: Thứ Hai đến Thứ Sáu
- **Bữa ăn**: Bữa trưa hoặc Bữa chiều
- **Danh sách món ăn**: Nhập tên các món

#### Cách nhập món ăn:
```
Cơm tấm; Canh chua; Trứng cuộn chiên
```
hoặc
```
Cơm tấm, Canh chua, Trứng cuộn chiên
```

**Lưu ý:**
- Tên món ăn phải đúng chính xác (theo tên trong hệ thống)
- Cách nhau bằng dấu `;` (chấm phảy) hoặc `,` (phẩy)
- Tên không nên có khoảng trắng thừa ở đầu/cuối

### 3. Xuất Excel (Export)
- Nhấp **"Xuất Excel"** để tải file thực đơn hiện tại
- Tệp sẽ chứa toàn bộ thực đơn đã được nhập
- Bạn có thể chỉnh sửa và tải lại

### 4. Nhập Excel (Import)
- Chỉnh sửa xong, nhấp **"Nhập Excel"** (chỉ có khi trạng thái Nháp hoặc Bị từ chối)
- Chọn file Excel đã chỉnh sửa
- Hệ thống sẽ kiểm tra và hiển thị lỗi (nếu có)
- Nếu không lỗi, sẽ hiển thị xác nhận số bữa ăn sắp cập nhật
- Nhấp "Xác nhận nhập" để hoàn tất

## ⚠️ Xử Lý Lỗi

### Lỗi có thể gặp:
1. **Tên món ăn không được tìm thấy**
   - Kiểm tra chính tả tên món
   - Đảm bảo món tồn tại trong hệ thống

2. **File không có dữ liệu**
   - Đảm bảo file có định dạng .xlsx
   - Kiểm tra cột tiêu đề chính xác

3. **Dữ liệu không đầy đủ**
   - Nhấp "Tôi sẽ bổ sung ngay" để quay lại chỉnh sửa

## 💡 Mẹo

- **Xuất trước khi chỉnh sửa**: Nếu muốn sửa thực đơn hiện tại, xuất nó trước
- **Kiểm tra trạng thái**: Chỉ có thể nhập khi thực đơn ở trạng thái "Nháp" hoặc "Bị từ chối"
- **Chuẩn bị toàn bộ tuần**: Tải mẫu và điền toàn bộ 2 tuần cùng lúc

## 📋 Ví Dụ File Excel

| Loại tuần | Ngày | Bữa ăn | Danh sách món ăn |
|-----------|------|--------|------------------|
| Tuần lẻ | Thứ Hai | Bữa trưa | Cơm tấm; Canh chua; Trứng chiên |
| Tuần lẻ | Thứ Hai | Bữa chiều | Sữa chua; Bánh bao; Cam |
| Tuần lẻ | Thứ Ba | Bữa trưa | Cháo gà; Khúc xương; Tiramisu |
| ... | ... | ... | ... |
