import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';

// ─── Form Modal ───────────────────────────────────────────────────────────────
function CategoryFormModal({ open, onClose, initialData, onSubmit, loading }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        name: initialData?.name || '',
        description: initialData?.description || '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Tên danh mục không được để trống';
    else if (form.name.length > 100) errs.name = 'Tên danh mục tối đa 100 ký tự';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold text-gray-800">
            {initialData ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
          {/* Tên */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tên danh mục *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              maxLength={100}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.name ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="vd: Bản tin trường"
            />
            <div className="flex justify-between mt-1">
              {formErrors.name
                ? <p className="text-xs text-red-600">{formErrors.name}</p>
                : <span />}
              <p className={`text-xs ${form.name.length > 100 ? 'text-red-600' : 'text-gray-400'}`}>
                {form.name.length}/100
              </p>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Mô tả ngắn về danh mục (tuỳ chọn)"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function ManageBlogCategories() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const {
    loading,
    error,
    setError,
    getBlogCategoriesAdmin,
    createBlogCategory,
    updateBlogCategory,
    deleteBlogCategory,
  } = useSchoolAdmin();

  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [noPermission, setNoPermission] = useState(false);

  // Auth check
  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) { navigate('/', { replace: true }); }
  }, [navigate, user, isInitializing]);

  const loadCategories = async () => {
    try {
      const res = await getBlogCategoriesAdmin();
      setCategories(res.data || []);
      setNoPermission(false);
    } catch (err) {
      if (err.message?.includes('không có quyền') || err.status === 403) {
        setNoPermission(true);
      }
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const openCreate = () => { setSelected(null); setError(null); setModalOpen(true); };
  const openEdit = (cat) => { setSelected(cat); setError(null); setModalOpen(true); };

  const handleSubmit = async (form) => {
    try {
      setSubmitting(true);
      if (selected) {
        await updateBlogCategory(selected._id, form);
      } else {
        await createBlogCategory(form);
      }
      await loadCategories();
      setModalOpen(false);
    } catch {
      // error shown via context
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setSubmitting(true);
      await deleteBlogCategory(confirmDelete._id);
      await loadCategories();
      setConfirmDelete(null);
    } catch {
      // error shown via context
    } finally {
      setSubmitting(false);
    }
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
    { key: 'public-info', label: 'Thông tin công khai' },
    { key: 'attendance', label: 'Quản lý điểm danh' },
  ];

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
  const handleViewProfile = () => navigate('/profile');

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

  return (
    <RoleLayout
      title="Quản lý danh mục blog"
      description="Tạo, chỉnh sửa và xóa các danh mục phân loại bài viết."
      menuItems={menuItems}
      activeKey="blogs"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      {/* Không có quyền */}
      {noPermission && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-6 text-center">
          <p className="text-yellow-800 font-medium">Bạn không có quyền quản lý danh mục blog.</p>
          <p className="text-yellow-700 text-sm mt-1">Liên hệ quản trị viên để được cấp quyền <code className="bg-yellow-100 px-1 rounded">MANAGE_BLOG_CATEGORY</code>.</p>
        </div>
      )}

      {!noPermission && (
        <div className="bg-white rounded-lg shadow p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Danh sách danh mục</h3>
              <p className="text-xs text-gray-500 mt-1">
                Tổng: <span className="font-semibold">{categories.length}</span> danh mục
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              + Tạo danh mục mới
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Tên danh mục</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Mô tả</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Ngày tạo</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-500">Đang tải...</td>
                  </tr>
                )}
                {!loading && categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                      Chưa có danh mục nào. Nhấn &quot;Tạo danh mục mới&quot; để bắt đầu.
                    </td>
                  </tr>
                )}
                {categories.map((cat) => (
                  <tr key={cat._id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      <span className="line-clamp-2">{cat.description || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(cat.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="mr-3 text-emerald-700 hover:underline text-xs"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(cat)}
                        disabled={submitting}
                        className="text-red-600 hover:underline text-xs disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selected}
        onSubmit={handleSubmit}
        loading={submitting}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn chắc chắn muốn xóa danh mục "${confirmDelete?.name}"? Danh mục không thể xóa nếu còn bài viết đang dùng.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={submitting}
      />
    </RoleLayout>
  );
}

export default ManageBlogCategories;
