# Hướng dẫn Upload Ảnh Blog - Setup & Xử lý

## 1. Cấu hình Backend (Cloudinary)

### 1.1 Đăng ký tài khoản Cloudinary
- Truy cập: https://cloudinary.com
- Đăng ký tài khoản miễn phí
- Lấy **Cloud Name**, **API Key**, **API Secret** từ Dashboard

### 1.2 Cấu hình .env
Thêm vào file `.env` trong thư mục `be/`:

```
CLOUDINARY_URL=cloudinary://[API_KEY]:[API_SECRET]@[CLOUD_NAME]
CLOUDINARY_MEDIA_FOLDER=avatars
CLOUDINARY_BLOG_FOLDER=blogs
```

**Ví dụ:**
```
CLOUDINARY_URL=cloudinary://123456789:abc_xyz@my-cloud
CLOUDINARY_MEDIA_FOLDER=avatars
CLOUDINARY_BLOG_FOLDER=blogs
```

### 1.3 Restart Backend
```bash
cd be
npm start
```

---

## 2. Flow Xử lý Upload Ảnh

```
┌─────────────────┐
│  Người dùng chọn│
│      ảnh        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Frontend: HandleUploadImages         │
│ - Kiểm tra max 3 ảnh                │
│ - Tạo FormData với field "image"    │
│ - Gửi POST đến /api/cloudinary/...  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Backend: Middleware Chain           │
│ 1. authenticate - kiểm tra JWT      │
│ 2. authorizeRoles('SchoolAdmin')    │
│ 3. uploadMiddleware.single('image') │
│    - Validate file type (image/*)   │
│    - Max 5MB                        │
│    - Buffer to memory               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Backend: uploadBlogImage Controller │
│ 1. Kiểm tra file tồn tại            │
│ 2. Kiểm tra Cloudinary config       │
│ 3. Convert buffer thành data URI    │
│ 4. Upload lên Cloudinary            │
│ 5. Trả về secure_url                │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Frontend: Response Handler          │
│ - Check response.status === 'success'
│ - Lấy URL từ response.data.url      │
│ - Add vào form.images array         │
│ - Update UI preview                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Hiển thị ảnh   │
│     preview     │
└─────────────────┘
```

---

## 3. Chi tiết từng bước

### Bước 1: Frontend (ManageBlogs.jsx)
```javascript
const handleUploadImages = async (e) => {
  // 1. Lấy files từ input
  const files = Array.from(e.target.files);
  
  // 2. Kiểm tra giới hạn
  if (form.images.length + files.length > 3) {
    alert('Tối đa 3 ảnh');
    return;
  }

  // 3. Loop qua từng file
  for (let i = 0; i < files.length; i++) {
    // 4. Tạo FormData
    const formData = new FormData();
    formData.append('image', files[i]);  // ← field name phải là "image"

    // 5. Upload qua API
    const response = await postFormData(
      '/api/cloudinary/upload-blog-image',
      formData
    );

    // 6. Lấy URL từ response
    if (response.status === 'success') {
      newImages.push(response.data.url);
    }
  }

  // 7. Update form
  setForm(prev => ({ ...prev, images: newImages }));
};
```

### Bước 2: Backend Middleware (cloudinary.routes.js)
```javascript
// Chain middleware theo thứ tự:
1. authenticate           // Kiểm tra JWT
2. authorizeRoles(...)    // Kiểm tra role
3. uploadMiddleware       // Xử lý file upload
4. uploadBlogImage        // Handler upload
5. handleUploadError      // Error handler
```

### Bước 3: Backend Controller (cloudinaryController.js)
```javascript
const uploadBlogImage = async (req, res) => {
  // 1. Kiểm tra file
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({...});
  }

  // 2. Kiểm tra config
  const config = cloudinary.config();
  if (!config.api_key || !config.api_secret || !config.cloud_name) {
    return res.status(500).json({...});
  }

  // 3. Convert buffer to data URI
  const dataUri = `data:${req.file.mimetype};base64,...`;

  // 4. Upload to Cloudinary
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'blogs',
    resource_type: 'image',
  });

  // 5. Trả về URL
  return res.status(200).json({
    status: 'success',
    data: { url: result.secure_url },
  });
};
```

---

## 4. Xử lý Lỗi

### 4.1 Lỗi Frontend
| Lỗi | Nguyên nhân | Giải pháp |
|-----|-----------|----------|
| `Route not found: POST /api/cloudinary/upload-blog-image` | Route không được mount | Restart backend |
| `Thiếu token xác thực` | Không gửi JWT | Đăng nhập lại |
| `Bạn không có quyền` | Role không phải SchoolAdmin | Kiểm tra role user |
| `File quá lớn (tối đa 5MB)` | File > 5MB | Chọn file nhỏ hơn |
| `Chỉ chấp nhận file ảnh` | Type file sai | Chọn file ảnh (jpg, png, ...) |

### 4.2 Lỗi Backend
| Lỗi | Nguyên nhân | Giải pháp |
|-----|-----------|----------|
| `Cloudinary chưa cấu hình` | Thiếu CLOUDINARY_URL | Thêm vào .env |
| `Không tải lên được ảnh` | Cloudinary API lỗi | Kiểm tra credentials |
| `ENOENT: no such file` | Buffer không được ghi | Kiểm tra disk space |

### 4.3 Debug
Mở **DevTools (F12) → Console** để xem logs:
```
✓ Ảnh 1 uploaded: https://...
✗ Upload lỗi cho ảnh 2: File quá lớn
```

---

## 5. API Endpoints

### Upload Avatar (User)
```
POST /api/cloudinary/upload-avatar
Auth: ✓ (any user)
Body: form-data { 'avatar': File }
Response: { status: 'success', data: { url: '...' } }
```

### Upload Blog Image (SchoolAdmin)
```
POST /api/cloudinary/upload-blog-image
Auth: ✓ (SchoolAdmin only)
Body: form-data { 'image': File }
Response: { status: 'success', data: { url: '...' } }
```

---

## 6. Security Best Practices

✅ **Đang làm:**
- Kiểm tra MIME type (image/jpeg, image/png, ...)
- Giới hạn file size (5MB)
- Xác thực user (JWT)
- Kiểm tra role (SchoolAdmin)
- Tách folder (/avatars, /blogs)

⚠️ **Nên làm thêm:**
- Rename file để tránh trùng
- Virus scan (Cloudinary có)
- Rate limiting
- Audit logging

---

## 7. Troubleshooting

### Vấn đề: Upload thất bại, console log trống
**Giải pháp:**
1. Kiểm tra Network tab (F12 → Network)
2. Xem response status code
3. Kiểm tra backend logs: `node be/server.js`

### Vấn đề: Response 401 - Token lỗi
**Giải pháp:**
1. Logout và Login lại
2. Kiểm tra token trong localStorage:
   ```javascript
   console.log(localStorage.getItem('token'));
   ```

### Vấn đề: Response 403 - Không có quyền
**Giải pháp:**
1. Kiểm tra role:
   ```javascript
   console.log(JSON.parse(localStorage.getItem('user')));
   ```
2. User phải có role `SchoolAdmin`

### Vấn đề: Cloudinary upload thất bại (500)
**Giải pháp:**
```bash
# Kiểm tra .env
cat be/.env | grep CLOUDINARY

# Restart server
cd be && npm start
```

---

## 8. Testing

### Manual Test (Postman / cURL)
```bash
# 1. Login để lấy token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'

# 2. Upload image với token
TOKEN="your_token_here"
curl -X POST http://localhost:3000/api/cloudinary/upload-blog-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/image.jpg"
```

### Unit Test (Frontend)
```javascript
// src/pages/schoolAdmin/__tests__/ManageBlogs.test.jsx
test('Upload image success', async () => {
  const file = new File(['...'], 'test.jpg', { type: 'image/jpeg' });
  const input = screen.getByTitle('Upload images');
  
  await userEvent.upload(input, file);
  
  expect(await screen.findByText('Ảnh 1 uploaded')).toBeInTheDocument();
});
```

---

## 9. File Size & Performance

| Item | Giá trị | Ghi chú |
|------|--------|--------|
| Max file size | 5MB | Cấu hình trong multer |
| Max images/post | 3 | Cấu hình trong BlogSchema |
| Quy trình | Max 30s | Cloudinary timeout |
| Concurrent uploads | 1 | Sequential xử lý |

---

## 10. Tham khảo

- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Multer Docs**: https://github.com/expressjs/multer
- **FormData API**: https://developer.mozilla.org/en-US/docs/Web/API/FormData
