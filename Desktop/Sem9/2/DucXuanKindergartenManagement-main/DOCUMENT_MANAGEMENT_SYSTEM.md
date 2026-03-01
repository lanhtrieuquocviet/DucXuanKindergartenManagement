# PDF Document Management System

## Overview

A complete Document Management System for the Duc Xuan Kindergarten Management platform, allowing SchoolAdmin to create, manage, and publish PDF documents with automatic conversion to preview images hosted on Cloudinary.

## Architecture

```
React (Upload PDF)
   ↓
Express API (/school-admin/documents)
   ↓
Multer (Receive PDF file)
   ↓
Cloudinary Upload (PDF + Preview Generation)
   ↓
MongoDB (Store document metadata & image URLs)
   ↓
React Gallery (Display document pages as images)
```

## Database Schema

### Document Model (`src/models/Document.js`)

```javascript
{
  _id: ObjectId,
  title: String,              // Document title (required)
  description: String,        // Optional description
  author: ObjectId (ref: User), // Document creator
  images: [String],          // Array of preview image URLs from Cloudinary
  pdfUrl: String,            // Original PDF file URL on Cloudinary
  status: String,            // 'draft' | 'published' | 'inactive'
  createdAt: DateTime,
  updatedAt: DateTime
}
```

## Backend Implementation

### Document Controller (`src/controller/documentController.js`)

**Key Functions:**

- `listDocuments()` - List all documents (admin only)
- `getDocument()` - Get document detail
- `createDocument()` - Create new document with PDF upload
- `updateDocument()` - Update document (with optional new PDF)
- `deleteDocument()` - Delete document
- `getPublishedDocuments()` - Get published documents (public endpoint)

**PDF Processing:**
- PDFs are uploaded to Cloudinary with `resource_type: 'raw'`
- Preview images are generated using Cloudinary's built-in PDF page extraction via the `page` parameter
- Up to 5 preview pages are extracted per PDF

### API Endpoints

#### School Admin (Protected)

```
GET    /api/school-admin/documents              - List documents
GET    /api/school-admin/documents/:id          - Get document detail
POST   /api/school-admin/documents              - Create document (multipart/form-data)
PUT    /api/school-admin/documents/:id          - Update document (multipart/form-data)
DELETE /api/school-admin/documents/:id          - Delete document
```

#### Public

```
GET /api/documents/published                    - Get published documents only
```

### Routes (`src/routes/schoolAdmin.routes.js`)

Document routes are integrated into the SchoolAdmin routes with PDF upload middleware:

```javascript
pdfUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
  },
});
```

## Frontend Implementation

### ManageDocuments Page (`fe/src/pages/schoolAdmin/ManageDocuments.jsx`)

**Features:**
- List documents in a responsive grid layout
- Search documents by title or description
- Filter by status (draft, published, inactive)
- Pagination support
- Create new document with PDF upload
- Edit document details (with optional new PDF)
- Delete document (with confirmation)
- View document preview in modal gallery

**Components:**
- `DocumentFormModal` - Form to create/edit documents
- `DocumentGallery` - View PDF pages as image gallery

**Styles:**
- Responsive grid layout (desktop/mobile)
- Document cards with thumbnail preview
- Status badges
- Modal dialogs for forms
- Page navigation for document preview

### API Integration

**Endpoints used:**
```javascript
ENDPOINTS.SCHOOL_ADMIN.DOCUMENTS           // List/Create
ENDPOINTS.SCHOOL_ADMIN.DOCUMENT_DETAIL(id) // Get/Update/Delete
```

**HTTP Methods:**
- `get()` - Fetch data
- `postFormData()` - Create document with file
- `putFormData()` - Update document with file (new utility function added)
- `del()` - Delete document

## Permissions

### Permission Code
```
MANAGE_DOCUMENTS - Quản lý tài liệu
```

This permission is automatically seeded in MongoDB on server startup.

### Role Assignment
Associate `MANAGE_DOCUMENTS` permission with SchoolAdmin role through the System Admin interface.

## Frontend Routes

### SchoolAdmin Routes

```
/school-admin/documents          - Manage Documents page
```

Added to SchoolAdminDashboard menu:
- Menu item: "Quản lý tài liệu" (Document Management)
- Navigates to `/school-admin/documents`

## How to Use

### Creating a Document

1. Navigate to **Quản lý tài liệu** (Document Management) from SchoolAdmin dashboard
2. Click **+ Tạo tài liệu mới** (Create New Document)
3. Enter document title (required)
4. Enter description (optional)
5. Select PDF file (required, max 10MB)
6. Select status: Draft/Published/Inactive
7. Click **Lưu** (Save)

**Actions:**
- PDF is uploaded to Cloudinary
- First 5 pages are automatically extracted as preview images
- Document record is created in MongoDB with image URLs

### Editing a Document

1. Find the document in the list
2. Click **Chỉnh sửa** (Edit) button
3. Update title, description, status
4. (Optional) Upload a new PDF file
5. Click **Lưu** (Save)

### Publishing a Document

1. Click **Chỉnh sửa** on the document
2. Change status to **Đã xuất bản** (Published)
3. Click **Lưu** (Save)

### Publishing Documents

Published documents are displayed on the public website through the Documents endpoint.

### Viewing Document Pages

In the document preview:
- Click **Chỉnh sửa** to see the gallery
- Use **Trang trước/Trang sau** buttons to navigate pages
- Page counter shows current position

## Files Created/Modified

### Backend
- ✅ `be/src/models/Document.js` - New document schema
- ✅ `be/src/controller/documentController.js` - New document controller
- ✅ `be/src/routes/documents.routes.js` - New public documents routes
- ✅ `be/src/routes/schoolAdmin.routes.js` - Added document CRUD routes
- ✅ `be/server.js` - Register Document model, import routes, seed permission
- ✅ `be/src/models/index.js` - Export Document model

### Frontend
- ✅ `fe/src/pages/schoolAdmin/ManageDocuments.jsx` - New document management page
- ✅ `fe/src/service/api.js` - Added `putFormData()` function and endpoints
- ✅ `fe/src/App.jsx` - Added `/school-admin/documents` route
- ✅ `fe/src/pages/schoolAdmin/SchoolAdminDashboard.jsx` - Added menu item

### Configuration
- ✅ `be/package.json` - Updated (dependencies already present)

## Error Handling

### Backend Validation
- File type validation (PDF only)
- File size validation (max 10MB)
- Cloudinary configuration check
- Database operation error handling

### Frontend Validation
- Form input validation
- File selection validation
- Error alerts with user-friendly messages
- Loading states during file upload

## Security

- SchoolAdmin role required for management
- Multer middleware validates file type
- CORS properly configured
- MongoDB ObjectId validation
- User authentication required via JWT

## Future Enhancements

1. **Batch Upload** - Upload multiple PDFs at once
2. **Advanced Search** - Full-text search on document content
3. **Document Categories** - Organize documents by category
4. **Access Control** - Restrict document visibility to specific roles
5. **Document Templates** - Pre-configured document formats
6. **Annotation** - Add comments/annotations to document pages
7. **Version History** - Track document version changes
8. **Sharing** - Share documents with specific users/groups

## Troubleshooting

### "Chỉ chấp nhận file PDF" (Only accepts PDF files)
- Ensure the file is in PDF format
- Check file extension is `.pdf`

### "File quá lớn (tối đa 10MB)" (File too large)
- Compress the PDF or reduce number of pages
- Maximum file size is 10MB

### "Cloudinary chưa được cấu hình" (Cloudinary not configured)
- Verify `CLOUDINARY_URL` environment variable is set
- Check credentials in `.env` file

### Preview images not showing
- Verify Cloudinary upload was successful
- Check PDF is valid and not corrupted
- Ensure image URLs are accessible

### "Không tìm thấy tài liệu" (Document not found)
- Document may have been deleted
- Check if you have permission to access it
- Refresh the page
