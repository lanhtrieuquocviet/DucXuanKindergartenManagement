# OTP (One-Time Password) Implementation Guide

## Tổng quan

Hệ thống OTP được triển khai để xác minh danh tính phụ huynh khi nhận trẻ từ trường. Mã OTP có thể được gửi qua **Email** hoặc **SMS**.

## Cấu hình

### 1. Email OTP (Mặc định)

Email OTP được gửi qua Nodemailer. Cấu hình trong file `.env`:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Lưu ý:** Nếu dùng Gmail, bạn cần:
1. Bật "Less secure app access" hoặc
2. Tạo "App Password" từ Google Account Security

### 2. SMS OTP (Twilio)

Để gửi OTP qua SMS, cấu hình Twilio trong file `.env`:

```env
# Twilio Configuration (Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Lưu ý:** 
- Nếu không cấu hình Twilio, SMS sẽ không được gửi (chỉ dùng cho dev/test)
- Mã OTP vẫn được trả về trong response để test

## API Endpoints

### 1. Gửi OTP

**Endpoint:** `POST /api/otp/send`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student_id_here",
  "method": "email",  // hoặc "sms"
  "phoneNumber": "+84912345678"  // Optional, chỉ dùng khi method="sms"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "Mã OTP đã được gửi qua email",
  "data": {
    "otpCode": "123456",
    "method": "email",
    "recipient": "parent@example.com"
  }
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Phụ huynh chưa có email"
}
```

### 2. Xác minh OTP

**Endpoint:** `POST /api/otp/verify`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student_id_here",
  "otpCode": "123456",
  "sentOtpCode": "123456"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "Mã OTP chính xác",
  "data": {
    "verified": true
  }
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Mã OTP không chính xác"
}
```

## Frontend Integration

### 1. Gửi OTP

```javascript
import { post, ENDPOINTS } from '../../service/api';

// Gửi OTP qua Email
const response = await post(ENDPOINTS.OTP.SEND, {
  studentId: 'student_id',
  method: 'email'
});

// Gửi OTP qua SMS
const response = await post(ENDPOINTS.OTP.SEND, {
  studentId: 'student_id',
  method: 'sms',
  phoneNumber: '+84912345678'
});

// Lấy mã OTP từ response (chỉ dùng cho dev/test)
const otpCode = response.data.otpCode;
```

### 2. Xác minh OTP

```javascript
// Xác minh mã OTP
const response = await post(ENDPOINTS.OTP.VERIFY, {
  studentId: 'student_id',
  otpCode: '123456',
  sentOtpCode: '123456'
});

if (response.data.verified) {
  // OTP chính xác, tiếp tục check-out
}
```

### 3. Lưu trữ OTP State (localStorage)

Frontend tự động lưu trạng thái OTP vào localStorage để tránh mất dữ liệu khi đóng modal:

```javascript
// Lưu OTP state
const saveOtpState = (studentId, code, timeLeft, expired, sent) => {
  const otpState = {
    studentId,
    sentOtpCode: code,
    otpTimeLeft: timeLeft,
    otpExpired: expired,
    otpSent: sent,
    timestamp: Date.now(),
  };
  localStorage.setItem(`otp_state_${studentId}`, JSON.stringify(otpState));
};

// Khôi phục OTP state
const restoreOtpState = (studentId) => {
  const stored = localStorage.getItem(`otp_state_${studentId}`);
  if (!stored) return null;
  
  const otpState = JSON.parse(stored);
  const elapsedSeconds = Math.floor((Date.now() - otpState.timestamp) / 1000);
  
  // OTP hết hạn sau 120 giây (2 phút)
  if (elapsedSeconds >= 120) {
    localStorage.removeItem(`otp_state_${studentId}`);
    return null;
  }
  
  return otpState;
};
```

## Tính năng Bảo mật

### 1. Thời gian hết hạn OTP
- **Backend:** OTP được tạo mới mỗi lần gửi, không lưu trữ
- **Frontend:** OTP hết hạn sau 120 giây (2 phút)
- **Validation:** Kiểm tra timestamp để đảm bảo OTP không vượt quá 2 phút

### 2. Chống Brute Force
- OTP không bao giờ bị reset khi đóng/mở modal
- Mã OTP được lưu trữ an toàn trong localStorage
- Thời gian đếm ngược tiếp tục từ nơi nó dừng

### 3. Xác minh Mã OTP
- Mã OTP phải khớp chính xác với mã được gửi
- Không cho phép check-out nếu OTP không chính xác
- OTP tự động xóa khỏi localStorage khi hết hạn

## Luồng Sử dụng

### Scenario 1: Check-out với OTP qua Email

1. Giáo viên nhấn "Check-out" cho học sinh
2. Chọn "Gửi qua Email" → Nhấn "Gửi mã OTP"
3. Mã OTP được gửi đến email phụ huynh
4. Giáo viên nhập mã OTP vào form
5. Nhấn "Lưu" → Hệ thống xác minh OTP
6. Nếu OTP chính xác → Check-out thành công
7. Nếu OTP sai → Hiển thị lỗi, cho phép nhập lại

### Scenario 2: Đóng modal và mở lại

1. Giáo viên gửi OTP → Nhập mã OTP
2. Nhấn "Hủy" → Modal đóng
3. OTP state được lưu vào localStorage
4. Mở lại modal cho cùng học sinh
5. OTP state được khôi phục
6. Thời gian đếm ngược tiếp tục từ nơi nó dừng
7. Giáo viên có thể tiếp tục nhập OTP

### Scenario 3: OTP hết hạn

1. OTP được gửi lúc 10:00
2. Giáo viên không nhập OTP
3. Lúc 10:02 (sau 2 phút) → OTP tự động hết hạn
4. Hiển thị thông báo "Mã OTP đã hết hạn"
5. Giáo viên nhấn "Gửi lại mã OTP"
6. Mã OTP mới được gửi

## Testing

### Test Email OTP

```bash
# 1. Cấu hình .env với email config
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# 2. Gọi API
curl -X POST http://localhost:5000/api/otp/send \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_id",
    "method": "email"
  }'

# 3. Kiểm tra email nhận được mã OTP
```

### Test SMS OTP

```bash
# 1. Cấu hình .env với Twilio config
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# 2. Gọi API
curl -X POST http://localhost:5000/api/otp/send \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_id",
    "method": "sms",
    "phoneNumber": "+84912345678"
  }'

# 3. Kiểm tra SMS nhận được mã OTP
```

### Test OTP Verification

```bash
curl -X POST http://localhost:5000/api/otp/verify \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_id",
    "otpCode": "123456",
    "sentOtpCode": "123456"
  }'
```

## Troubleshooting

### Email OTP không được gửi

**Nguyên nhân:**
- Email config không đúng
- Gmail account không cho phép "Less secure apps"
- Phụ huynh không có email

**Giải pháp:**
1. Kiểm tra `.env` có đúng email config không
2. Nếu dùng Gmail, tạo "App Password"
3. Kiểm tra phụ huynh có email trong hệ thống không

### SMS OTP không được gửi

**Nguyên nhân:**
- Twilio config không đúng
- Số điện thoại không hợp lệ
- Tài khoản Twilio hết credit

**Giải pháp:**
1. Kiểm tra `.env` có đúng Twilio config không
2. Kiểm tra số điện thoại có định dạng đúng không (ví dụ: +84912345678)
3. Kiểm tra tài khoản Twilio có credit không

### OTP hết hạn quá nhanh

**Nguyên nhân:**
- Thời gian hết hạn được set quá ngắn

**Giải pháp:**
- Mặc định là 120 giây (2 phút), có thể thay đổi trong `otpController.js`

## Tài liệu Tham khảo

- [Nodemailer Documentation](https://nodemailer.com/)
- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Express.js Documentation](https://expressjs.com/)
