# Hướng dẫn thiết lập MongoDB Atlas

## Bước 1: Tạo file .env

Tạo file `.env` trong thư mục `be/` với nội dung sau:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

## Bước 2: Lấy MongoDB Atlas Connection String

1. Đăng nhập vào [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Vào **Clusters** → Chọn cluster của bạn
3. Click **Connect** → Chọn **Connect your application**
4. Copy connection string có dạng:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Thay thế:
   - `<username>`: Tên người dùng MongoDB của bạn
   - `<password>`: Mật khẩu MongoDB của bạn
   - Thêm tên database vào cuối: `/<dbname>`
   
   Ví dụ:
   ```
   mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/kindergarten_db?retryWrites=true&w=majority
   ```

## Bước 3: Cấu hình Network Access

1. Vào **Network Access** trong MongoDB Atlas
2. Click **Add IP Address**
3. Chọn **Allow Access from Anywhere** (0.0.0.0/0) hoặc thêm IP cụ thể của bạn
4. Click **Confirm**

## Bước 4: Chạy server

```bash
cd be
npm install  # Nếu chưa cài đặt dependencies
npm start    # Hoặc npm run dev để chạy với nodemon
```

Nếu kết nối thành công, bạn sẽ thấy thông báo:
```
✅ MongoDB Atlas connected successfully!
   Database: kindergarten_db
   Host: cluster0.xxxxx.mongodb.net
```

## Bước 5: Cấu hình Email (Cho chức năng quên mật khẩu)

### Sử dụng Gmail:

**App Password là gì?**
- App Password là mật khẩu đặc biệt 16 ký tự do Google tạo ra
- Dùng để ứng dụng bên thứ ba (như hệ thống này) có thể gửi email thay bạn
- Khác với mật khẩu Gmail thông thường, App Password an toàn hơn
- Ví dụ App Password: `abcd efgh ijkl mnop` (16 ký tự, có thể có khoảng trắng)

**Các bước tạo App Password:**

1. **Bật xác thực 2 bước** (bắt buộc):
   - Vào [Google Account Settings](https://myaccount.google.com/)
   - Chọn **Security** (Bảo mật) ở menu bên trái
   - Tìm mục **2-Step Verification** (Xác minh 2 bước)
   - Nếu chưa bật, click **Get started** và làm theo hướng dẫn
   - **Lưu ý:** Phải bật xác thực 2 bước mới có thể tạo App Password

2. **Tìm và tạo App Password**:
   
   **Cách 1: Từ trang "Xác minh 2 bước" (trang bạn đang xem)**
   - Từ trang **"Xác minh 2 bước"** hiện tại
   - **Cuộn xuống cuối trang** (xuống dưới phần "Bước thứ hai" và nút "Tắt Xác minh 2 bước")
   - Bạn sẽ thấy một phần có tiêu đề **"Mật khẩu ứng dụng"** hoặc **"App passwords"**
   - Click vào **"Mật khẩu ứng dụng"** hoặc link tương tự
   
   **Cách 2: Từ trang Security chính**
   - Vào [Google Account Settings](https://myaccount.google.com/)
   - Chọn **Security** (Bảo mật) ở menu bên trái
   - Cuộn xuống tìm mục **"Mật khẩu ứng dụng"** hoặc **"App passwords"**
   - Nếu không thấy, click vào **"Xác minh 2 bước"** trước, sau đó cuộn xuống cuối trang sẽ thấy
   
   **Sau khi vào trang App Passwords:**
   - Google có thể yêu cầu nhập mật khẩu Gmail để xác nhận
   - Trong trang **App passwords**:
     - Chọn **Select app** (Chọn ứng dụng) → Chọn **Mail**
     - Chọn **Select device** (Chọn thiết bị) → Chọn **Other (Custom name)** (Khác - Tên tùy chỉnh)
     - Nhập tên: `DucXuan Kindergarten` (hoặc tên bất kỳ bạn muốn)
     - Click **Generate** (Tạo)
   
   **Lưu ý:** Nếu bạn không thấy "Mật khẩu ứng dụng" ở cuối trang "Xác minh 2 bước", có thể:
   - Bạn chưa bật xác thực 2 bước hoàn toàn
   - Hoặc bạn có thể truy cập trực tiếp: [App Passwords](https://myaccount.google.com/apppasswords)

3. **Copy mật khẩu được tạo**:
   - Google sẽ hiển thị một mật khẩu 16 ký tự, ví dụ: `abcd efgh ijkl mnop`
   - **Quan trọng:** Copy toàn bộ 16 ký tự này (bao gồm cả khoảng trắng nếu có)
   - Mật khẩu này chỉ hiển thị **MỘT LẦN DUY NHẤT**, nếu đóng cửa sổ sẽ không xem lại được
   - **Lưu ý:** Khi copy vào file `.env`, bạn có thể bỏ khoảng trắng hoặc giữ nguyên đều được

4. **Cập nhật file `.env`**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop
   ```
   - Thay `your-email@gmail.com` bằng email Gmail của bạn
   - Thay `abcdefghijklmnop` bằng App Password 16 ký tự vừa copy (có thể bỏ khoảng trắng)
   - Ví dụ: Nếu App Password là `abcd efgh ijkl mnop`, bạn có thể viết:
     - `EMAIL_PASSWORD=abcdefghijklmnop` (bỏ khoảng trắng) ✅
     - hoặc `EMAIL_PASSWORD=abcd efgh ijkl mnop` (giữ khoảng trắng) ✅

### Sử dụng email khác (Outlook, Yahoo, etc.):

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

**Yahoo:**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

**Lưu ý:** Với các nhà cung cấp email khác, bạn có thể cần tạo App Password tương tự như Gmail.

## Lưu ý

- File `.env` đã được thêm vào `.gitignore` để không commit lên Git
- Không chia sẻ file `.env` hoặc connection string công khai
- Đảm bảo mật khẩu MongoDB của bạn mạnh và an toàn
- **KHÔNG** sử dụng mật khẩu Gmail thông thường, phải dùng App Password
- Nếu không cấu hình email, chức năng quên mật khẩu sẽ không hoạt động