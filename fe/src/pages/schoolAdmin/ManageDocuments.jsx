import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { get, postFormData, putFormData, del, ENDPOINTS } from '../../service/api';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'draft', label: 'Nháp' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'inactive', label: 'Ngưng hiển thị' },
];

function DocumentFormModal({ open, onClose, initialData, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'draft',
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        title: initialData?.title || '',
        description: initialData?.description || '',
        status: initialData?.status || 'draft',
      });
      setPdfFile(null);
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePdfSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      alert('Vui lòng chọn file PDF hợp lệ');
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert('Vui lòng nhập tiêu đề');
      return;
    }

    if (!initialData && !pdfFile) {
      alert('Vui lòng chọn file PDF');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('status', form.status);

      if (pdfFile) {
        formData.append('pdf', pdfFile);
      }

      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
      alert(`Lỗi: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? 'Chỉnh sửa tài liệu' : 'Tạo tài liệu mới'}</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Tiêu đề *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Nhập tiêu đề tài liệu"
            />
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Nhập mô tả tài liệu (tuỳ chọn)"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>File PDF *</label>
            {initialData ? (
              <div className="pdf-info">
                <p>Tài liệu hiện tại: {initialData.title}</p>
                <p>Số trang: {initialData.images?.length || 0}</p>
                <label>Tải lên file PDF mới (tuỳ chọn):</label>
              </div>
            ) : null}
            <input
              type="file"
              accept=".pdf"
              onChange={handlePdfSelect}
              disabled={uploading}
            />
            {pdfFile && (
              <p className="file-selected">
                ✓ {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Trạng thái</label>
            <select name="status" value={form.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={uploading || loading}
          >
            Hủy
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={uploading || loading}
          >
            {uploading || loading ? 'Đang xử lý...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentGallery({ document }) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!document.images || document.images.length === 0) {
    return <div className="document-gallery">Không có hình ảnh</div>;
  }

  const currentImage = document.images[currentPage];

  return (
    <div className="document-gallery">
      <div className="gallery-image">
        <img src={currentImage} alt={`trang ${currentPage + 1}`} />
      </div>
      <div className="gallery-navigation">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
        >
          ← Trang trước
        </button>
        <span className="page-info">
          Trang {currentPage + 1} / {document.images.length}
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(document.images.length - 1, currentPage + 1))}
          disabled={currentPage === document.images.length - 1}
        >
          Trang sau →
        </button>
      </div>
    </div>
  );
}

export default function ManageDocuments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Load documents
  const loadDocuments = async (page = 1, searchTerm = '', status = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (searchTerm) params.append('search', searchTerm);
      if (status) params.append('status', status);

      const response = await get(`${ENDPOINTS.SCHOOL_ADMIN.DOCUMENTS}?${params.toString()}`);

      if (response.status === 'success') {
        setDocuments(response.data.items);
        setPagination(response.data.pagination);
      } else {
        alert(response.message || 'Lỗi tải danh sách tài liệu');
      }
    } catch (error) {
      console.error('Load documents error:', error);
      alert('Lỗi tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments(pagination.page, filters.search, filters.status);
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, search: value }));
    loadDocuments(1, value, filters.status);
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, status: value }));
    loadDocuments(1, filters.search, value);
  };

  const handleCreate = () => {
    setSelectedDocument(null);
    setModalOpen(true);
  };

  const handleEdit = (document) => {
    setSelectedDocument(document);
    setModalOpen(true);
  };

  const handleDelete = (document) => {
    setDeleteConfirm(document);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    setLoading(true);
    try {
      const response = await del(
        ENDPOINTS.SCHOOL_ADMIN.DOCUMENT_DETAIL(deleteConfirm._id)
      );

      if (response.status === 'success') {
        alert('Xóa tài liệu thành công');
        loadDocuments(pagination.page, filters.search, filters.status);
      } else {
        alert(response.message || 'Lỗi xóa tài liệu');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Lỗi xóa tài liệu');
    } finally {
      setLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      let response;

      if (selectedDocument) {
        // Update
        response = await putFormData(
          ENDPOINTS.SCHOOL_ADMIN.DOCUMENT_DETAIL(selectedDocument._id),
          formData
        );
      } else {
        // Create
        response = await postFormData(ENDPOINTS.SCHOOL_ADMIN.DOCUMENTS, formData);
      }

      if (response.status === 'success') {
        alert(selectedDocument ? 'Cập nhật tài liệu thành công' : 'Tạo tài liệu thành công');
        loadDocuments(1, filters.search, filters.status);
      } else {
        alert(response.message || 'Lỗi lưu tài liệu');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    loadDocuments(newPage, filters.search, filters.status);
  };

  return (
    <RoleLayout requiredRole="SchoolAdmin">
      <div className="manage-documents">
        <div className="page-header">
          <h1>Quản lý tài liệu</h1>
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
            + Tạo tài liệu mới
          </button>
        </div>

        <div className="filter-section">
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            value={filters.search}
            onChange={handleSearch}
            disabled={loading}
          />
          <select value={filters.status} onChange={handleStatusChange} disabled={loading}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loading && documents.length === 0 ? (
          <div className="loading">Đang tải...</div>
        ) : documents.length === 0 ? (
          <div className="empty-state">Không có tài liệu nào</div>
        ) : (
          <>
            <div className="documents-grid">
              {documents.map((doc) => (
                <div key={doc._id} className="document-card">
                  <div className="card-header">
                    <h3>{doc.title}</h3>
                    <span className={`status-badge status-${doc.status}`}>{doc.status}</span>
                  </div>

                  <div className="card-body">
                    <p className="description">{doc.description || 'Không có mô tả'}</p>

                    {doc.images && doc.images.length > 0 && (
                      <div className="thumbnail">
                        <img src={doc.images[0]} alt="Trang 1" />
                        <span className="page-count">{doc.images.length} trang</span>
                      </div>
                    )}

                    <div className="card-meta">
                      <p className="author">Người đăng: {doc.author?.fullName || doc.author?.username}</p>
                      <p className="date">
                        {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(doc)}
                      disabled={loading}
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(doc)}
                      disabled={loading}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={pagination.page === 1 || loading}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  ← Trước
                </button>
                <span className="page-info">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page === pagination.totalPages || loading}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}

        <DocumentFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          initialData={selectedDocument}
          onSubmit={handleSubmit}
          loading={loading}
        />

        <ConfirmDialog
          open={deleteConfirm !== null}
          title="Xóa tài liệu"
          message={`Bạn có chắc chắn muốn xóa tài liệu "${deleteConfirm?.title}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={loading}
        />
      </div>

      <style>{`
        .manage-documents {
          padding: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 28px;
          color: #333;
        }

        .filter-section {
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
        }

        .filter-section input,
        .filter-section select {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          flex: 1;
        }

        .documents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .document-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          background: white;
          transition: box-shadow 0.3s ease;
        }

        .document-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          background: #f5f5f5;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #eee;
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
          flex: 1;
          word-break: break-word;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          white-space: nowrap;
          margin-left: 10px;
        }

        .status-draft {
          background: #fff3cd;
          color: #856404;
        }

        .status-published {
          background: #d4edda;
          color: #155724;
        }

        .status-inactive {
          background: #f8d7da;
          color: #721c24;
        }

        .card-body {
          padding: 15px;
        }

        .description {
          margin: 0 0 12px 0;
          color: #666;
          font-size: 14px;
          line-height: 1.5;
          max-height: 60px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .thumbnail {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          border-radius: 4px;
          overflow: hidden;
          background: #f0f0f0;
          margin-bottom: 12px;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .page-count {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
        }

        .card-meta {
          font-size: 13px;
          color: #999;
          margin-bottom: 12px;
        }

        .card-meta p {
          margin: 4px 0;
        }

        .author {
          color: #666;
        }

        .date {
          color: #999;
        }

        .card-footer {
          display: flex;
          gap: 8px;
          padding: 12px 15px;
          border-top: 1px solid #eee;
          background: #fafafa;
        }

        .btn {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #c82333;
        }

        .btn-sm {
          flex: 1;
          padding: 6px 10px;
          font-size: 13px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          margin-top: 30px;
        }

        .pagination button {
          padding: 8px 15px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .pagination button:hover:not(:disabled) {
          background: #f0f0f0;
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          color: #666;
          font-size: 14px;
        }

        .loading,
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #999;
          font-size: 16px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 20px;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        }

        .close-btn:hover {
          color: #333;
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 14px;
        }

        .form-group textarea {
          resize: vertical;
        }

        .file-selected {
          margin-top: 8px;
          color: #28a745;
          font-size: 13px;
        }

        .pdf-info {
          background: #f0f0f0;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .pdf-info p {
          margin: 4px 0;
          color: #666;
        }

        .modal-footer {
          display: flex;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #eee;
          background: #fafafa;
        }

        .modal-footer button {
          flex: 1;
          padding: 10px 20px;
        }

        /* Document Gallery Styles */
        .document-gallery {
          margin: 20px 0;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
          background: #f9f9f9;
        }

        .gallery-image {
          text-align: center;
          background: white;
          padding: 20px;
        }

        .gallery-image img {
          max-width: 100%;
          height: auto;
          max-height: 400px;
          border-radius: 4px;
        }

        .gallery-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f0f0f0;
          gap: 10px;
        }

        .gallery-navigation button {
          padding: 8px 12px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.3s ease;
        }

        .gallery-navigation button:hover:not(:disabled) {
          background: #e0e0e0;
        }

        .gallery-navigation button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .documents-grid {
            grid-template-columns: 1fr;
          }

          .page-header {
            flex-direction: column;
            gap: 15px;
          }

          .page-header button {
            width: 100%;
          }

          .filter-section {
            flex-direction: column;
          }

          .card-footer {
            flex-direction: column;
          }

          .modal-content {
            width: 95%;
          }
        }
      `}</style>
    </RoleLayout>
  );
}
