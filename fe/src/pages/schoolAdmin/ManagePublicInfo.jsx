import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import RichTextEditor from '../../components/RichTextEditor';
import { get, post, put, del, postFormData, ENDPOINTS } from '../../service/api';

const CATEGORIES = [
  'Thông tin chung về cơ sở giáo dục',
  'Công khai thu chi tài chính',
  'Điều kiện đảm bảo chất lượng hoạt động giáo dục',
  'Kế hoạch và kết quả hoạt động giáo dục',
  'Báo cáo thường niên',
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'draft', label: 'Nháp' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'inactive', label: 'Ngưng hiển thị' },
];

function PublicInfoFormModal({ open, onClose, initialData, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
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
        category: initialData?.category || CATEGORIES[0],
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
    if (!form.category) errs.category = 'Vui lòng chọn danh mục';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-gray-800">
            {initialData ? 'Chỉnh sửa thông tin công khai' : 'Tạo thông tin công khai mới'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
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
              placeholder="Nhập tiêu đề"
            />
            <div className="flex justify-between items-center mt-1">
              {formErrors.title ? <p className="text-xs text-red-600">{formErrors.title}</p> : <span />}
              <p className={`text-xs ${form.title.length > 200 ? 'text-red-600' : 'text-gray-400'}`}>{form.title.length}/200</p>
            </div>
          </div>

          {/* Danh mục */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Danh mục *</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.category ? 'border-red-400' : 'border-gray-300'}`}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {formErrors.category && <p className="mt-1 text-xs text-red-600">{formErrors.category}</p>}
          </div>

          {/* Nội dung (Rich Text) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mô tả / Nội dung</label>
            <RichTextEditor
              initialValue={form.description}
              onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
              disabled={uploadingFile}
              attachmentUrl={form.attachmentUrl}
              attachmentType={form.attachmentType}
              onAttachFile={handleAttachFile}
              onRemoveFile={() => setForm((prev) => ({ ...prev, attachmentUrl: null, attachmentType: null }))}
            />
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
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
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

const menuItems = [
  { key: 'overview', label: 'Tổng quan trường' },
  { key: 'classes', label: 'Lớp học' },
  { key: 'contacts', label: 'Liên hệ' },
  { key: 'qa', label: 'Câu hỏi' },
  { key: 'blogs', label: 'Quản lý blog' },
  { key: 'documents', label: 'Quản lý tài liệu' },
  { key: 'public-info', label: 'Thông tin công khai' },
  { key: 'attendance', label: 'Quản lý điểm danh' },
];

export default function ManagePublicInfo() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', category: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) navigate('/', { replace: true });
  }, [navigate, user, isInitializing]);

  const canShowEmptyState = useMemo(() => !loading && items.length === 0, [loading, items.length]);

  const loadItems = async (override = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', override.page || pagination.page);
      params.append('limit', pagination.limit);
      const st = override.status !== undefined ? override.status : filters.status;
      const cat = override.category !== undefined ? override.category : filters.category;
      const sr = override.search !== undefined ? override.search : filters.search;
      if (st) params.append('status', st);
      if (cat) params.append('category', cat);
      if (sr) params.append('search', sr);

      const resp = await get(`${ENDPOINTS.SCHOOL_ADMIN.PUBLIC_INFOS}?${params.toString()}`);
      if (resp.status === 'success') {
        setItems(resp.data.items);
        setPagination(resp.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, [filters.status, filters.category]); // eslint-disable-line

  const handleSubmitForm = async (form) => {
    try {
      setSubmitting(true);
      let resp;
      if (selected) {
        resp = await put(ENDPOINTS.SCHOOL_ADMIN.PUBLIC_INFO_DETAIL(selected._id), form);
      } else {
        resp = await post(ENDPOINTS.SCHOOL_ADMIN.PUBLIC_INFOS, form);
      }
      if (resp.status === 'success') {
        await loadItems({ page: 1 });
        setModalOpen(false);
      } else {
        setError(resp.message || 'Lỗi lưu');
      }
    } catch (err) {
      setError(err.message || 'Lỗi lưu');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      setSubmitting(true);
      const resp = await del(ENDPOINTS.SCHOOL_ADMIN.PUBLIC_INFO_DETAIL(confirmDelete._id));
      if (resp.status === 'success') {
        await loadItems({ page: 1 });
        setConfirmDelete(null);
      } else {
        setError(resp.message || 'Lỗi xóa');
      }
    } catch (err) {
      setError(err.message || 'Lỗi xóa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuSelect = (key) => {
    const routes = {
      overview: '/school-admin',
      classes: '/school-admin/classes',
      contacts: '/school-admin/contacts',
      qa: '/school-admin/qa',
      blogs: '/school-admin/blogs',
      documents: '/school-admin/documents',
      'public-info': '/school-admin/public-info',
      attendance: '/school-admin/attendance/overview',
    };
    if (routes[key]) navigate(routes[key]);
  };

  const userName = user?.fullName || user?.username || 'School Admin';
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <RoleLayout
      title="Thông tin công khai"
      description="Quản lý các thông tin công khai của trường."
      menuItems={menuItems}
      activeKey="public-info"
      onLogout={handleLogout}
      onViewProfile={() => navigate('/profile')}
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
            <h3 className="text-sm font-semibold text-gray-800">Danh sách thông tin công khai</h3>
            <p className="text-xs text-gray-500 mt-1">Tổng: <span className="font-semibold">{pagination.total}</span></p>
          </div>
          <button
            type="button"
            onClick={() => { setSelected(null); setError(null); setModalOpen(true); }}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            + Tạo mới
          </button>
        </div>

        {/* Bộ lọc */}
        <div className="flex flex-col gap-3 border-b border-gray-100 pb-3 md:flex-row md:items-center mb-4">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && loadItems({ page: 1 })}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Tìm theo tiêu đề..."
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tất cả danh mục</option>
            {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {/* Bảng danh sách */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Tiêu đề</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Danh mục</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Tệp đính kèm</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Trạng thái</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Tác giả</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="px-3 py-2 text-xs font-medium text-gray-900 max-w-[200px]">
                    <div className="line-clamp-2">{item.title}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700 max-w-[160px]">
                    <div className="line-clamp-2">{item.category}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {item.attachmentUrl ? (
                      <a href={item.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        {item.attachmentType === 'pdf' ? '📄 PDF' : '📝 Word'}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {item.status === 'published' && <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Đã xuất bản</span>}
                    {item.status === 'draft' && <span className="inline-flex rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-yellow-700">Nháp</span>}
                    {item.status === 'inactive' && <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">Ngưng hiển thị</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">{item.author?.fullName || item.author?.username || '-'}</td>
                  <td className="px-3 py-2 text-right text-xs">
                    <button type="button" onClick={() => { setSelected(item); setError(null); setModalOpen(true); }} className="mr-2 text-emerald-700 hover:underline">Sửa</button>
                    <button type="button" onClick={() => setConfirmDelete(item)} disabled={submitting} className="text-red-600 hover:underline disabled:opacity-50">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {canShowEmptyState && (
            <div className="py-8 text-center text-sm text-gray-500">
              Chưa có thông tin nào. Hãy nhấn &quot;Tạo mới&quot; để bắt đầu.
            </div>
          )}
        </div>

        {/* Phân trang */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
            <div>Trang {pagination.page}/{pagination.totalPages} · Tổng {pagination.total}</div>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={pagination.page === 1 || loading}
                onClick={() => loadItems({ page: pagination.page - 1 })}
                className="rounded-md border border-gray-300 px-2 py-1 disabled:opacity-50"
              >«</button>
              <button
                type="button"
                disabled={pagination.page === pagination.totalPages || loading}
                onClick={() => loadItems({ page: pagination.page + 1 })}
                className="rounded-md border border-gray-300 px-2 py-1 disabled:opacity-50"
              >»</button>
            </div>
          </div>
        )}
      </div>

      <PublicInfoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selected}
        onSubmit={handleSubmitForm}
        loading={submitting}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn chắc chắn muốn xóa "${confirmDelete?.title}"?`}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
        loading={submitting}
      />
    </RoleLayout>
  );
}
