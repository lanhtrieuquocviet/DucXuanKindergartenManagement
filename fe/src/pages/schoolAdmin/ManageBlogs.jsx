import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import RichTextEditor from '../../components/RichTextEditor';
import { get, postFormData, ENDPOINTS } from '../../service/api';

// categories will be fetched from backend; each item has {_id, name}
// we convert to {value,label} when rendering the form

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'draft', label: 'Nháp' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'inactive', label: 'Ngưng hiển thị' },
];

function BlogFormModal({ open, onClose, initialData, categories, onSubmit, loading }) {
  const [form, setForm] = useState({
    code: '',
    description: '',
    category: '',
    images: [],
    status: 'draft',
    attachmentUrl: null,
    attachmentType: null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        code: initialData?.code || '',
        description: initialData?.description || '',
        category:
          (initialData?.category &&
            (initialData.category._id || initialData.category)) ||
          (categories[0]?._id || ''),
        images: initialData?.images || [],
        status: initialData?.status || 'draft',
        attachmentUrl: initialData?.attachmentUrl || null,
        attachmentType: initialData?.attachmentType || null,
      });
      setFormErrors({});
    }
  }, [open, initialData, categories]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleUploadCoverImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_BLOG_IMAGE, formData);
      if (response.status === 'success' && response.data?.url) {
        setForm(prev => ({ ...prev, images: [response.data.url] }));
      } else {
        throw new Error(response.message || 'Upload thất bại');
      }
    } catch (err) {
      alert(`Upload ảnh thất bại:\n${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveCoverImage = () => {
    setForm(prev => ({ ...prev, images: [] }));
  };

  const handleAttachFile = async (file) => {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_BLOG_FILE, formData);
      if (response.status === 'success' && response.data?.url) {
        setForm(prev => ({
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
    if (!form.code.trim()) errs.code = 'Tiêu đề không được để trống';
    else if (form.code.length > 100) errs.code = 'Tiêu đề quá dài (tối đa 100 ký tự)';
    if (!form.category) errs.category = 'Vui lòng chọn danh mục';
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
            {initialData ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
          {/* Code */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tiêu đề *
            </label>
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              maxLength={100}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.code ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="vd: BLOG_001"
            />
            <div className="flex justify-between items-center mt-1">
              {formErrors.code
                ? <p className="text-xs text-red-600">{formErrors.code}</p>
                : <span />
              }
              <p className={`text-xs ${form.code.length > 100 ? 'text-red-600' : 'text-gray-400'}`}>
                {form.code.length}/100
              </p>
            </div>
          </div>

          {/* Danh mục */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Danh mục *
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.category ? 'border-red-400' : 'border-gray-300'}`}
              disabled={categories.length === 0}
            >
              {categories.length === 0 ? (
                <option value="">Đang tải danh mục...</option>
              ) : (
                <>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {formErrors.category && (
              <p className="mt-1 text-xs text-red-600">{formErrors.category}</p>
            )}
          </div>

          {/* Nội dung (Rich Text) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nội dung *
            </label>
            <div className={formErrors.description ? 'ring-1 ring-red-400 rounded-md' : ''}>
              <RichTextEditor
                initialValue={form.description}
                onChange={(html) => {
                  setForm((prev) => ({ ...prev, description: html }));
                  if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: null }));
                }}
                disabled={uploading || uploadingFile}
                attachmentUrl={form.attachmentUrl}  
                attachmentType={form.attachmentType}
                onAttachFile={handleAttachFile}
                onRemoveFile={() => setForm(prev => ({ ...prev, attachmentUrl: null, attachmentType: null }))}
              />
            </div>
            {formErrors.description && (
              <p className="mt-1 text-xs text-red-600">{formErrors.description}</p>
            )}
          </div>

          {/* Ảnh bìa */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Ảnh bìa
            </label>
            {form.images[0] ? (
              <div className="relative inline-block">
                <img
                  src={form.images[0]}
                  alt="Ảnh bìa"
                  className="h-32 rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveCoverImage}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadCoverImage}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
              />
            )}
            {uploading && (
              <p className="mt-1 text-xs text-blue-600">Đang tải ảnh lên...</p>
            )}
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
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
              disabled={loading || uploading || uploadingFile}
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

function ManageBlogs() {
  const {
    loading,
    error,
    getBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
    setError,
  } = useSchoolAdmin();

  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();

  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

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
      return;
    }
  }, [navigate, user, isInitializing]);

  const canShowEmptyState = useMemo(
    () => !loading && blogs.length === 0,
    [loading, blogs.length]
  );

  const loadData = async (override = {}) => {
    try {
      const params = {
        page: override.page || pagination.page,
        limit: pagination.limit,
        status: filters.status,
        search: filters.search,
      };
      const res = await getBlogs(params);
      const data = res.data || res;
      setBlogs(data.items || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      // error handled in context
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  // fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resp = await get('/blogs/categories');
        setCategories(resp.data || resp);
      } catch (err) {
        // ignore, categories are not critical
        console.error('Failed to load blog categories', err);
      }
    };
    fetchCategories();
  }, []);

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData({ page: 1 });
  };

  const handleStatusChange = (e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value }));
  };

  const openCreateModal = () => {
    setSelectedBlog(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (blog) => {
    setSelectedBlog(blog);
    setError(null);
    setModalOpen(true);
  };

  const handleDelete = async (blog) => {
    setConfirmDelete(blog);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      setSubmitting(true);
      await deleteBlog(confirmDelete._id);
      await loadData();
      setConfirmDelete(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForm = async (form) => {
    try {
      setSubmitting(true);
      if (selectedBlog) {
        const oldCode = selectedBlog.code;
        await updateBlog(selectedBlog._id, form);
        // after editing we always reset search filter so the updated item
        // remains visible (code might have changed and not match previous query)
        if (filters.search) {
          setFilters((prev) => ({ ...prev, search: '' }));
          await loadData({ page: 1, search: '' });
        } else {
          await loadData();
        }
      } else {
        await createBlog(form);
        await loadData();
      }
      setModalOpen(false);
    } catch (err) {
      // error handled in context; nothing special here
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = async (newPage) => {
    if (newPage === pagination.page) return;
    const next = { ...pagination, page: newPage };
    setPagination(next);
    await loadData({ page: newPage });
  };

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
    { key: 'classes', label: 'Lớp học' },
    { key: 'teachers', label: 'Giáo viên' },
    { key: 'students', label: 'Học sinh & phụ huynh' },
    { key: 'assets', label: 'Quản lý tài sản' },
    { key: 'reports', label: 'Báo cáo của trường' },
    { key: 'contacts', label: 'Liên hệ' },
    { key: 'qa', label: 'Câu hỏi' },
    { key: 'blogs', label: 'Quản lý blog' },
    { key: 'documents', label: 'Quản lý tài liệu' },
    { key: 'attendance', label: 'Quản lý điểm danh' },
  ];

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'classes') {
      navigate('/school-admin/classes');
      return;
    }
    if (key === 'contacts') {
      navigate('/school-admin/contacts');
      return;
    }
    if (key === 'qa') {
      navigate('/school-admin/qa');
      return;
    }
    if (key === 'blogs') {
      navigate('/school-admin/blogs');
      return;
    }
    if (key === 'documents') {
      navigate('/school-admin/documents');
      return;
    }
    if (key === 'attendance') {
      navigate('/school-admin/attendance/overview');
      return;
    }
  };

  const userName = user?.fullName || user?.username || 'School Admin';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };
  return (
    <RoleLayout
      title="Quản lý bài viết (Blog)"
      description="Tạo, chỉnh sửa, xóa và quản lý các bài viết, tin tức của trường."
      menuItems={menuItems}
      activeKey="blogs"
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
        {/* Header + bộ lọc */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Danh sách bài viết</h3>
            <p className="text-xs text-gray-500 mt-1">
              Tổng bài: <span className="font-semibold">{pagination.total}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/school-admin/blog-categories')}
              className="inline-flex items-center justify-center rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Quản lý danh mục
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              + Tạo bài viết mới
            </button>
          </div>
        </div>

        {/* Bộ lọc và tìm kiếm */}
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
              placeholder="Tìm theo mã, nội dung..."
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
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
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
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Mã
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Danh mục
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Nội dung
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Ảnh
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tệp đính kèm
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Trạng thái
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tác giả
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {blogs.map((blog) => (
                <tr key={blog._id}>
                  <td className="px-3 py-2 text-xs font-mono text-gray-700">
                    {blog.code}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {blog.category?.name || '-'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs text-gray-900 line-clamp-2">
                      {blog.description?.replace(/<[^>]*>/g, '') || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {blog.images && blog.images.length > 0 ? (
                      <div className="flex gap-1">
                        {blog.images.slice(0, 2).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`img-${idx}`}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ))}
                        {blog.images.length > 2 && (
                          <span className="text-[10px] text-gray-500">+{blog.images.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {blog.attachmentUrl ? (
                      <a
                        href={blog.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        {blog.attachmentType === 'pdf' ? '📄 PDF' : '📝 Word'}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {blog.status === 'published' && (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Đã xuất bản
                      </span>
                    )}
                    {blog.status === 'draft' && (
                      <span className="inline-flex rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-yellow-700">
                        Nháp
                      </span>
                    )}
                    {blog.status === 'inactive' && (
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                        Ngưng hiển thị
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {blog.author?.fullName || blog.author?.username || '-'}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    <button
                      type="button"
                      onClick={() => navigate(`/school-admin/blogs/${blog._id}`)}
                      className="mr-2 text-blue-600 hover:underline"
                    >
                      Xem
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(blog)}
                      className="mr-2 text-emerald-700 hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(blog)}
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
              Chưa có bài viết nào. Hãy nhấn &quot;Tạo bài viết mới&quot; để bắt đầu.
            </div>
          )}
        </div>

        {/* Phân trang */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
            <div>
              Trang {pagination.page}/{pagination.totalPages} · Tổng{' '}
              {pagination.total} bài viết
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

      <BlogFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selectedBlog}
        categories={categories}
        onSubmit={handleSubmitForm}
        loading={submitting}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn chắc chắn muốn xóa bài viết "${confirmDelete?.title}"?`}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
        loading={submitting}
      />
    </RoleLayout>
  );
}

export default ManageBlogs;

