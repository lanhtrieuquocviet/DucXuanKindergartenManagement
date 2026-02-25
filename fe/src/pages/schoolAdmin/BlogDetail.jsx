import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';

const STATUS_DISPLAY = {
  draft: { label: 'Nháp', color: 'bg-yellow-50 text-yellow-700' },
  published: { label: 'Đã xuất bản', color: 'bg-emerald-50 text-emerald-700' },
  inactive: { label: 'Ngưng hiển thị', color: 'bg-gray-100 text-gray-600' },
};

function BlogDetail() {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getBlogs, deleteBlog, setError } = useSchoolAdmin();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setLocalError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(null);

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

  // Load blog detail
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        setLocalError(null);
        const response = await getBlogs();
        const blogs = response?.data?.items || [];
        const found = blogs.find((b) => b._id === blogId);
        if (found) {
          setBlog(found);
        } else {
          setLocalError('Không tìm thấy bài viết');
        }
      } catch (err) {
        setLocalError(err.message || 'Lỗi khi tải bài viết');
      } finally {
        setLoading(false);
      }
    };

    if (blogId) {
      fetchBlog();
    }
  }, [blogId, getBlogs]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteBlog(blogId);
      navigate('/school-admin/blogs', { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Xóa bài viết thất bại');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleEdit = () => {
    navigate(`/school-admin/blogs/${blogId}/edit`);
  };

  const handleBack = () => {
    navigate('/school-admin/blogs', { replace: true });
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
    if (key === 'blogs') {
      navigate('/school-admin/blogs');
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <RoleLayout
        title="Chi tiết bài viết"
        menuItems={menuItems}
        activeKey="blogs"
        onLogout={handleLogout}
        onViewProfile={handleViewProfile}
        onMenuSelect={handleMenuSelect}
        userName={userName}
        userAvatar={user?.avatar}
      >
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout
      title="Chi tiết bài viết"
      description={blog?.code || 'Xem thông tin chi tiết bài viết'}
      menuItems={menuItems}
      activeKey="blogs"
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      onMenuSelect={handleMenuSelect}
      userName={userName}
      userAvatar={user?.avatar}
    >
      {error || setLocalError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
          {error || setLocalError}
        </div>
      )}

      {blog ? (
        <div className="space-y-4">
          {/* Header với nút quay lại */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              ← Quay lại danh sách
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Sửa
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>

          {/* Thông tin cơ bản */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mã */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Mã bài viết</h3>
                <p className="text-lg font-mono font-semibold text-gray-900">{blog.code}</p>
              </div>

              {/* Danh mục */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Danh mục</h3>
                <p className="text-lg font-semibold text-gray-900">{blog.category}</p>
              </div>

              {/* Trạng thái */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Trạng thái</h3>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    STATUS_DISPLAY[blog.status]?.color || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {STATUS_DISPLAY[blog.status]?.label || blog.status}
                </span>
              </div>

              {/* Tác giả */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Tác giả</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {blog.author?.fullName || blog.author?.username || '-'}
                </p>
              </div>

              {/* Ngày tạo */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Ngày tạo</h3>
                <p className="text-sm text-gray-700">{formatDate(blog.createdAt)}</p>
              </div>

              {/* Ngày cập nhật */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Ngày cập nhật</h3>
                <p className="text-sm text-gray-700">{formatDate(blog.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Nội dung */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Nội dung</h3>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap break-words text-sm leading-relaxed bg-gray-50 p-4 rounded-md">
              {blog.description}
            </div>
          </div>

          {/* Hình ảnh */}
          {blog.images && blog.images.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase">
                Danh sách hình ảnh ({blog.images.length})
              </h3>
              
              {/* Main image viewer */}
              <div className="mb-6">
                {selectedImageIdx !== null ? (
                  <div className="relative">
                    <img
                      src={blog.images[selectedImageIdx]}
                      alt={`Blog ${selectedImageIdx + 1}`}
                      className="w-full max-h-96 object-contain rounded-lg shadow-md bg-gray-50"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                      {selectedImageIdx + 1}/{blog.images.length}
                    </div>
                    <div className="absolute top-2 left-2 flex gap-2">
                      <button
                        onClick={() => setSelectedImageIdx(selectedImageIdx === 0 ? blog.images.length - 1 : selectedImageIdx - 1)}
                        className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setSelectedImageIdx((selectedImageIdx + 1) % blog.images.length)}
                        className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition"
                      >
                        →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Chọn ảnh từ danh sách bên dưới</p>
                  </div>
                )}
              </div>

              {/* Thumbnail list */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Nhấp để xem</p>
                <div className="flex gap-2 flex-wrap">
                  {blog.images.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`relative group cursor-pointer transition-all ${
                        selectedImageIdx === idx ? 'ring-2 ring-blue-400 scale-105' : 'hover:scale-105'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-24 h-24 object-cover rounded-lg shadow group-hover:shadow-lg transition-shadow border-2 border-transparent"
                      />
                      <div className="absolute inset-0 rounded-lg bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100">{idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">Không tìm thấy bài viết</p>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-900"
          >
            ← Quay lại danh sách
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn chắc chắn muốn xóa bài viết "${blog?.code}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
      />
    </RoleLayout>
  );
}

export default BlogDetail;
