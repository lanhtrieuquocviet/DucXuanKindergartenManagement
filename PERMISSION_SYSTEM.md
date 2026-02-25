# 🔐 HỆ THỐNG PHÂN QUYỀN (Permission System)

## 📋 Tổng Quan

Hệ thống phân quyền trong ứng dụng được thiết kế theo mô hình **Role-Based Access Control (RBAC)** với 3 cấp độ:
1. **User** (Người dùng)
2. **Role** (Vai trò) 
3. **Permission** (Quyền hạn)

```
┌─────────────┐       ┌───────────┐       ┌──────────────┐
│   User      │───┬──▶│   Role    │───┬──▶│  Permission  │
│             │   │   │           │   │   │              │
│ username    │   │   │ roleName  │   │   │ code         │
│ email       │   │   │           │   │   │ description  │
│ roles: []   │   └──▶│ permissions: []   │              │
└─────────────┘       └───────────┘       └──────────────┘
      N:N                  N:M
```

---

## 📊 Cấu Trúc Dữ Liệu

### 1. User Model
```javascript
{
  username: String (unique, required),      // Tài khoản
  passwordHash: String,                     // Mật khẩu mã hóa
  fullName: String,                         // Họ tên
  email: String (unique),                   // Email
  avatar: String,                           // Ảnh đại diện
  roles: [ObjectId] -> ref: 'Roles',        // Danh sách vai trò
  status: 'active' | 'inactive',            // Trạng thái
  createdAt, updatedAt
}
```

### 2. Role Model
```javascript
{
  roleName: String (unique),                // Tên vai trò (e.g., "SchoolAdmin", "Teacher")
  description: String,                      // Mô tả vai trò
  permissions: [ObjectId] -> ref: 'Permission',  // Danh sách quyền hạn
  createdAt, updatedAt
}
```

### 3. Permission Model
```javascript
{
  code: String (uppercase, unique),         // Mã quyền (e.g., "BLOG_READ", "BLOG_CREATE")
  description: String,                      // Mô tả quyền
  createdAt, updatedAt
}
```

---

## 🔄 Quy Trình Hoạt Động

### **Bước 1: Đăng Nhập (Login)**

```
Client gửi: { username, password }
              │
              ▼
   ┌─────────────────────────┐
   │ authController.login()  │
   │  1. Tìm user            │
   │  2. Xác thực mật khẩu   │
   │  3. Tạo JWT token       │
   └─────────────────────────┘
              │
              ▼
   Trả về: {
     token: "eyJhbGc...",
     user: {
       id, username, fullName, email,
       roles: [{ roleName, permissions }]
     }
   }
```

---

### **Bước 2: Xác Thực và Phân Quyền (Middleware)**

```
╔═══════════════════════════════════════════════════════╗
║          Request gửi từ Client                        ║
║  Header: Authorization: Bearer eyJhbGc...            ║
╚═══════════════════════════════════════════════════════╝
              │
              ▼
   ┌─────────────────────────────────┐
   │  authenticate() middleware      │
   │  ✓ Kiểm tra token tồn tại      │
   │  ✓ Verify JWT token            │
   │  ✓ Lấy user từ DB              │
   │  ✓ Populate roles + permissions│
   └─────────────────────────────────┘
              │
              ▼
   req.user = {
     id: "user_id",
     username: "admin123",
     roles: ["SchoolAdmin"],         // Tên vai trò
     permissions: [                  // Tất cả quyền từ roles
       "BLOG_READ",
       "BLOG_CREATE",
       "BLOG_UPDATE"
     ],
     rawUser: { ... }               // Toàn bộ dữ liệu user
   }
              │
              ▼
   ┌──────────────────────────────────────┐
   │ authorizeRoles() middleware (nếu có) │
   │ role: ['SchoolAdmin']                 │
   │ ✓ Kiểm tra req.user.roles            │
   │ ✓ So sánh với allowedRoles           │
   └──────────────────────────────────────┘
              │
              ▼
   ┌──────────────────────────────────────┐
   │ authorizePermissions() middleware     │
   │ (nếu có)                             │
   │ permissions: ['BLOG_READ']            │
   │ ✓ Kiểm tra req.user.permissions      │
   │ ✓ So sánh với requiredPermissions    │
   └──────────────────────────────────────┘
              │
              ▼
   ✅ Truy cập được endpoint
     hoặc
   ❌ 403 Forbidden
```

---

## 🛣️ Ví Dụ Route với Phân Quyền

### **Ví dụ 1: Kiểm tra Role**
```javascript
// Chỉ SchoolAdmin mới có thể truy cập
router.get(
  '/contacts',
  authenticate,                          // 1. Xác thực đăng nhập
  authorizeRoles('SchoolAdmin'),         // 2. Kiểm tra role
  contactController.listContacts         // 3. Thực thi API
);
```

**Luồng kiểm tra:**
1. ✅ Có token hợp lệ? → Tiếp tục
2. ✅ Role là 'SchoolAdmin'? → Cho phép
3. ❌ Role khác? → 403 Forbidden

### **Ví dụ 2: Kiểm tra Permission**
```javascript
// Cần có quyền BLOG_READ để xem danh sách blog
router.get(
  '/blogs',
  authenticate,                          // 1. Xác thực
  authorizeRoles('SchoolAdmin'),         // 2. Kiểm tra Role
  authorizePermissions('BLOG_READ'),     // 3. Kiểm tra Permission
  blogController.listBlogs               // 4. Thực thi API
);

// Cần cả 2 quyền để tạo và xóa blog
router.delete(
  '/blogs/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('BLOG_DELETE'),   // Yêu cầu quyền DELETE
  blogController.deleteBlog
);
```

### **Ví dụ 3: Nhiều Permission**
```javascript
// Yêu cầu ĐỦ TẤT CẢ các quyền trong danh sách
authorizePermissions('BLOG_READ', 'BLOG_EDIT', 'BLOG_DELETE')
// → User phải có cả 3 quyền này

// Nếu User chỉ có: BLOG_READ, BLOG_EDIT
// → ❌ 403 Forbidden (thiếu BLOG_DELETE)
```

---

## 👥 Các Role Trong Hệ Thống

Dựa trên code, có 3 role chính:

| Role | Mô Tả | Quyền |
|------|-------|-------|
| **SystemAdmin** | Quản lý toàn bộ hệ thống | - Quản lý User<br>- Quản lý Role<br>- Quản lý Permission<br>- Gán Role cho User |
| **SchoolAdmin** | Quản lý trường mầm non | - Xem/phản hồi liên hệ<br>- Quản lý Blog (CRUD)<br>- Xem điểm danh<br>- Quản lý lớp |
| **Teacher** | Giáo viên | - Điểm danh<br>- Xem điểm học sinh<br>- Quản lý lớp |

---

## ⚙️ Các Thao Tác Quản Lý Permission (SystemAdmin)

### **1. Tạo Permission**
```javascript
POST /api/system-admin/permissions
{
  "code": "BLOG_CREATE",
  "description": "Tạo bài blog mới"
}

Response:
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "code": "BLOG_CREATE",
    "description": "Tạo bài blog mới"
  }
}
```

### **2. Xem Danh Sách Permission**
```javascript
GET /api/system-admin/permissions

Response:
{
  "status": "success",
  "data": [
    { "_id": "...", "code": "BLOG_READ", "description": "Xem blog" },
    { "_id": "...", "code": "BLOG_CREATE", "description": "Tạo blog" },
    { "_id": "...", "code": "BLOG_UPDATE", "description": "Cập nhật blog" },
    { "_id": "...", "code": "BLOG_DELETE", "description": "Xóa blog" }
  ]
}
```

### **3. Cập Nhật Permission**
```javascript
PUT /api/system-admin/permissions/:id
{
  "description": "Mô tả mới"
}
```

### **4. Xóa Permission**
```javascript
DELETE /api/system-admin/permissions/:id
// ⚠️ Chỉ có thể xóa nếu Permission không được sử dụng trong Role
```

### **5. Gán Permission vào Role**
```javascript
PUT /api/system-admin/roles/:roleId/permissions
{
  "permissionCodes": ["BLOG_READ", "BLOG_CREATE", "BLOG_UPDATE"]
}
// → Cập nhật tất cả quyền của role (thay thế, không thêm)
```

### **6. Gán Role cho User**
```javascript
PUT /api/system-admin/users/:userId/roles
{
  "roleIds": ["607f1f77bcf86cd799439011", "607f1f77bcf86cd799439012"]
}
// → User có cả 2 role này, sẽ có tất cả quyền từ cả 2 role
```

---

## 🔑 Luồng Kiểm Soát Quyền Chi Tiết

### **Khi User gửi yêu cầu:**

```
1️⃣ BƯỚC XÁC THỰC (authenticate middleware)
   ├─ Lấy token từ header Authorization
   ├─ Verify token (kiểm tra chữ ký JWT)
   ├─ Lấy userId từ token payload
   ├─ Query DB: User.findById(userId).populate('roles.permissions')
   └─ Gắn req.user với thông tin đầy đủ

2️⃣ BƯỚC KIỂM ROLES (authorizeRoles middleware)
   ├─ Lấy req.user.roles (array tên role)
   ├─ So sánh với allowedRoles từ middleware
   ├─ Nếu user.roles ∩ allowedRoles ≠ ∅ → ✅ Tiếp tục
   └─ Nếu không → ❌ 403 Forbidden

3️⃣ BƯỚC KIỂM PERMISSIONS (authorizePermissions middleware)
   ├─ Lấy req.user.permissions (array permission codes)
   ├─ So sánh với requiredPermissions từ middleware
   ├─ Nếu requiredPermissions ⊆ user.permissions → ✅ Tiếp tục
   └─ Nếu không → ❌ 403 Forbidden

4️⃣ BƯỚC THỰC THI (Controller)
   └─ Thực thi logic business
```

---

## 📌 Các Permission Codes Hiện Có

Dựa trên code routes, các Permission codes:

```
BLOG_READ       # Xem danh sách blog
BLOG_CREATE     # Tạo blog mới
BLOG_UPDATE     # Cập nhật blog
BLOG_DELETE     # Xóa blog
(Có thể có nhiều khác tùy vào features)
```

---

## 🎯 Tóm Tắt Quy Trình

```
┌────────────────────────────────────────────────────────┐
│ CLIENT SIDE                                            │
│ 1. User nhập username/password                         │
│ 2. Gửi POST /login                                     │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ SERVER SIDE - LOGIN                                    │
│ 1. Verify mật khẩu                                     │
│ 2. Populate roles + permissions                        │
│ 3. Tạo JWT token                                       │
│ 4. Trả token về client                                 │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ CLIENT SIDE                                            │
│ 1. Lưu token vào localStorage/sessionStorage           │
│ 2. Gửi token trong header Authorization mỗi request   │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ SERVER SIDE - MIDDLEWARE                               │
│ 1. authenticate() - Verify token, load user            │
│ 2. authorizeRoles() - Kiểm tra role (nếu có)         │
│ 3. authorizePermissions() - Kiểm tra permission (nếu có)
│ 4. Nếu pass → Gọi controller                          │
│ 5. Nếu fail → Trả 401/403 error                       │
└────────────────────────────────────────────────────────┘
```

---

## ⚠️ Lưu Ý Quan Trọng

### **1. JWT Token**
- Token được lưu trong `Authorization: Bearer <token>` header
- Token hết hạn sau 1 ngày (tùy JWT_EXPIRES_IN)
- Khi token hết hạn, user phải đăng nhập lại

### **2. Permission mất hiệu lực ngay lập tức**
- Nếu delete permission từ role → user đó mất quyền ngay
- Nhưng token hiện tại vẫn có giá trị cũ cho đến khi hết hạn
- **Giải pháp:** Refresh token sau khi thay đổi role/permission

### **3. Cache Permission trong Token**
- Permissions được lưu trong JWT payload khi login
- Nếu thay đổi role/permission, cần logout + login lại để cập nhật

### **4. Validation**
- Permission code: phải UPPERCASE
- Username: phải chứa ít nhất 1 chữ viết hoa
- Password: ít nhất 6 ký tự, có 1 chữ viết hoa + 1 số + 1 ký tự đặc biệt

---

## 🚀 Ví Dụ Thực Tế

### **Kịch Bản 1: SchoolAdmin xem contacts**

```
1. User đăng nhập → Nhận token
   token payload: {
     sub: "user_id_123",
     roles: ["SchoolAdmin"]
   }

2. GET /api/school-admin/contacts
   Header: Authorization: Bearer token
   
3. authenticate middleware:
   ✓ Verify token thành công
   ✓ Load user + roles
   req.user.roles = ["SchoolAdmin"]
   req.user.permissions = [
     "BLOG_READ", "BLOG_CREATE", "BLOG_UPDATE", "BLOG_DELETE"
   ]
   
4. authorizeRoles('SchoolAdmin'):
   ✓ "SchoolAdmin" ∈ req.user.roles
   
5. ✅ Thực thi contactController.listContacts()
```

### **Kịch Bản 2: User không có permission**

```
1. Teacher (không có BLOG_DELETE) cố tạo blog

2. DELETE /api/school-admin/blogs/123
   Header: Authorization: Bearer token
   
3. authenticate middleware: ✓ OK
   req.user.permissions = ["BLOG_READ"]
   
4. authorizeRoles('SchoolAdmin'): ✓ OK (nếu Teacher có role này)

5. authorizePermissions('BLOG_DELETE'):
   ✗ "BLOG_DELETE" ∉ req.user.permissions
   
6. ❌ 403 Forbidden
   message: "Bạn không có quyền thực hiện thao tác này"
```

---

## 📁 Các File Liên Quan

- [Permission Model](be/src/models/Permission.js)
- [Role Model](be/src/models/Role.js)
- [User Model](be/src/models/User.js)
- [Auth Middleware](be/src/middleware/auth.js)
- [SystemAdmin Controller](be/src/controller/systemAdminController.js)
- [Auth Controller](be/src/controller/authController.js)
- [Routes Config](be/src/routes/)

