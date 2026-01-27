# Hướng dẫn thiết lập MongoDB Atlas

## Bước 1: Tạo file .env

Tạo file `.env` trong thư mục `be/` với nội dung sau:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development
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

## Lưu ý

- File `.env` đã được thêm vào `.gitignore` để không commit lên Git
- Không chia sẻ file `.env` hoặc connection string công khai
- Đảm bảo mật khẩu MongoDB của bạn mạnh và an toàn
