import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import RichTextEditor from '../../components/RichTextEditor';
import { get, post, put, del, postFormData, ENDPOINTS } from '../../service/api';

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
    attachmentUrl: null,
    attachmentType: null,
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        title: initialData?.title || '',
        description: initialData?.description || '',
        status: initialData?.status || 'draft',
        attachmentUrl: initialData?.attachmentUrl || null,
        attachmentType: initialData?.attachmentType || null,
      });
      setFormErrors({});
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleAttachFile = async (file) => {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_BLOG_FILE, formData);
      if (response.status === 'success' && response.data?.url) {
        setForm((prev) => ({
          ...prev,
          attachmentUrl: response.data.url,
          attachmentType: response.data.type,
        }));
      } else {
        throw new Error(response.message || 'Upload thất bại');
      }
    } catch (err) {
      alert(`Upload file thất bại:\n${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Tiêu đề không được để trống';
    else if (form.title.length > 200) errs.title = 'Tiêu đề quá dài (tối đa 200 ký tự)';
    if (!form.description.trim()) errs.description = 'Nội dung không được để trống';
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-gray-800">
            {initialData ? 'Chỉnh sửa tài liệu' : 'Tạo tài liệu mới'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tiêu đề *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={200}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.title ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Nhập tiêu đề tài liệu"
            />
            <div className="flex justify-between items-center mt-1">
              {formErrors.title
                ? <p className="text-xs text-red-600">{formErrors.title}</p>
                : <span />}
              <p className={`text-xs ${form.title.length > 200 ? 'text-red-600' : 'text-gray-400'}`}>
                {form.title.length}/200
              </p>
            </div>
          </div>

          {/* Nội dung (Rich Text) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nội dung *</label>
            <div className={formErrors.description ? 'ring-1 ring-red-400 rounded-md' : ''}>
              <RichTextEditor
                initialValue={form.description}
                onChange={(html) => {
                  setForm((prev) => ({ ...prev, description: html }));
                  if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: null }));
                }}
                disabled={uploadingFile}
                attachmentUrl={form.attachmentUrl}
                attachmentType={form.attachmentType}
                onAttachFile={handleAttachFile}
                onRemoveFile={() => setForm((prev) => ({ ...prev, attachmentUrl: null, attachmentType: null }))}
              />
            </div>
            {formErrors.description && (
              <p className="mt-1 text-xs text-red-600">{formErrors.description}</p>
            )}
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
            >
              <option value="draft">Nháp</option>
              <option value="published">Đã xuất bản</option>
              <option value="inactive">Ngưng hiển thị</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || uploadingFile}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageDocuments() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Auth check
  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SchoolAdmin')) {
      navigate('/', { replace: true });
    }
  }, [navigate, user, isInitializing]);

  const canShowEmptyState = useMemo(
    () => !loading && documents.length === 0,
    [loading, documents.length]
  );

  const loadDocuments = async (override = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', override.page || pagination.page);
      params.append('limit', pagination.limit);
      if (override.status !== undefined ? override.status : filters.status)
        params.append('status', override.status !== undefined ? override.status : filters.status);
      if (override.search !== undefined ? override.search : filters.search)
        params.append('search', override.search !== undefined ? override.search : filters.search);

      const response = await get(`${ENDPOINTS.SCHOOL_ADMIN.DOCUMENTS}?${params.toString()}`);
      if (response.status === 'success') {
        setDocuments(response.data.items);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDocuments({ page: 1 });
  };

  const handleStatusChange = (e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value }));
  };

  const openCreateModal = () => {
    setSelectedDocument(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (doc) => {
    setSelectedDocument(doc);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmitForm = async (form) => {
    try {
      setSubmitting(true);
      let response;
      if (selectedDocument) {
        response = await put(ENDPOINTS.SCHOOL_ADMIN.DOCUMENT_DETAIL(selectedDocument._id), form);
      } else {
        response = await post(ENDPOINTS.SCHOOL_ADMIN.DOCUMENTS, form);
      }
      if (response.status === 'success') {
        await loadDocuments({ page: 1 });
        setModalOpen(false);
      } else {
        setError(response.message || 'Lỗi lưu tài liệu');
      }
    } catch (err) {
      setError(err.message || 'Lỗi lưu tài liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      setSubmitting(true);
      const response = await del(ENDPOINTS.SCHOOL_ADMIN.DOCUMENT_DETAIL(confirmDelete._id));
      if (response.status === 'success') {
        await loadDocuments({ page: 1 });
        setConfirmDelete(null);
      } else {
        setError(response.message || 'Lỗi xóa tài liệu');
      }
    } catch (err) {
      setError(err.message || 'Lỗi xóa tài liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = async (newPage) => {
    if (newPage === pagination.page) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
    await loadDocuments({ page: newPage });
  };

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
    { key: 'classes', label: 'Lớp học' },
    { key: 'teachers', label: 'Giáo viên' },
    { key: 'students', label: 'Học sinh & phụ huynh' },
    { key: 'assets', label: 'Quản lý tài sản' },
    { key: 'reports', label: 'Báo cáo của trường' },
    { key: 'contacts', label: 'Liên hệ' },
    { key: 'blogs', label: 'Quản lý blog' },
    { key: 'attendance', label: 'Quản lý điểm danh' },
  ];

  const handleMenuSelect = (key) => {
    const routes = {
      overview: '/school-admin',
      classes: '/school-admin/classes',
      contacts: '/school-admin/contacts',
      blogs: '/school-admin/blogs',
      attendance: '/school-admin/attendance/overview',
    };
    if (routes[key]) navigate(routes[key]);
  };

  const userName = user?.fullName || user?.username || 'School Admin';
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };
  const handleViewProfile = () => navigate('/profile');

  return (
    <RoleLayout
      title="Quản lý tài liệu"
      description="Tạo, chỉnh sửa, xóa và quản lý tài liệu của trường."
      menuItems={menuItems}
      activeKey="documents"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Danh sách tài liệu</h3>
            <p className="text-xs text-gray-500 mt-1">
              Tổng: <span className="font-semibold">{pagination.total}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            + Tạo tài liệu mới
          </button>
        </div>

        {/* Bộ lọc */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col gap-3 border-b border-gray-100 pb-3 md:flex-row md:items-center md:justify-between mb-4"
        >
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Tìm theo tiêu đề, nội dung..."
            />
            <button
              type="submit"
              className="hidden rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 md:inline-flex"
            >
              Tìm kiếm
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filters.status}
              onChange={handleStatusChange}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 md:hidden"
            >
              Lọc
            </button>
          </div>
        </form>

        {/* Bảng danh sách */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Tiêu đề</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Nội dung</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Tệp đính kèm</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Trạng thái</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Tác giả</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {documents.map((doc) => (
                <tr key={doc._id}>
                  <td className="px-3 py-2 text-xs font-medium text-gray-900 max-w-[180px]">
                    <div className="line-clamp-2">{doc.title}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs text-gray-700 line-clamp-2">
                      {doc.description?.replace(/<[^>]*>/g, '') || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {doc.attachmentUrl ? (
                      <a
                        href={doc.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        {doc.attachmentType === 'pdf' ? '📄 PDF' : '📝 Word'}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {doc.status === 'published' && (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Đã xuất bản</span>
                    )}
                    {doc.status === 'draft' && (
                      <span className="inline-flex rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-yellow-700">Nháp</span>
                    )}
                    {doc.status === 'inactive' && (
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">Ngưng hiển thị</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {doc.author?.fullName || doc.author?.username || '-'}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    <button
                      type="button"
                      onClick={() => navigate(`/school-admin/documents/${doc._id}`)}
                      className="mr-2 text-blue-600 hover:underline"
                    >
                      Xem
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(doc)}
                      className="mr-2 text-emerald-700 hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(doc)}
                      disabled={submitting}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {canShowEmptyState && (
            <div className="py-8 text-center text-sm text-gray-500">
              Chưa có tài liệu nào. Hãy nhấn &quot;Tạo tài liệu mới&quot; để bắt đầu.
            </div>
          )}
        </div>

        {/* Phân trang */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
            <div>
              Trang {pagination.page}/{pagination.totalPages} · Tổng {pagination.total} tài liệu
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={pagination.page === 1 || loading}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="rounded-md border border-gray-300 px-2 py-1 disabled:opacity-50"
              >
                «
              </button>
              <button
                type="button"
                disabled={pagination.page === pagination.totalPages || loading}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="rounded-md border border-gray-300 px-2 py-1 disabled:opacity-50"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      <DocumentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selectedDocument}
        onSubmit={handleSubmitForm}
        loading={submitting}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn chắc chắn muốn xóa tài liệu "${confirmDelete?.title}"?`}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
        loading={submitting}
      />
    </RoleLayout>
  );
}
