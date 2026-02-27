import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { get, del, ENDPOINTS } from '../../service/api';

const STATUS_DISPLAY = {
  draft: { label: 'Nháp', color: 'bg-yellow-50 text-yellow-700' },
  published: { label: 'Đã xuất bản', color: 'bg-emerald-50 text-emerald-700' },
  inactive: { label: 'Ngưng hiển thị', color: 'bg-gray-100 text-gray-600' },
};

function DocumentDetail() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();

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
    { key: 'documents', label: 'Quản lý tài liệu' },
  ];

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setLocalError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

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

  // load document
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setLoading(true);
        setLocalError(null);
        const resp = await get(ENDPOINTS.SCHOOL_ADMIN.DOCUMENT_DETAIL(documentId));
        if (resp.status === 'success' && resp.data) {
          setDocument(resp.data);
        } else {
          setLocalError('Không tìm thấy tài liệu');
        }
      } catch (err) {
        setLocalError(err.message || 'Lỗi khi tải tài liệu');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDoc();
    }
  }, [documentId]);

  const handleBack = () => {
    navigate('/school-admin/documents');
  };

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
    if (key === 'documents') {
      navigate('/school-admin/documents');
      return;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await del(ENDPOINTS.SCHOOL_ADMIN.DOCUMENT_DETAIL(documentId));
      navigate('/school-admin/documents', { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Xóa tài liệu thất bại');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <RoleLayout
        title="Chi tiết tài liệu"
        menuItems={menuItems}
        activeKey="documents"
        onMenuSelect={handleMenuSelect}
        onLogout={handleLogout}
        onViewProfile={handleViewProfile}
        userName={user?.fullName || user?.username}
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
      title="Chi tiết tài liệu"
      description={document?.title || 'Xem thông tin chi tiết tài liệu'}
      menuItems={menuItems}
      activeKey="documents"
      onMenuSelect={handleMenuSelect}
      onLogout={handleLogout}
      onViewProfile={handleViewProfile}
      userName={user?.fullName || user?.username}
      userAvatar={user?.avatar}
    >
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {document ? (
        <div className="space-y-4">
          {/* header */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              ← Quay lại danh sách
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Xóa
            </button>
          </div>

          {/* basic info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Tiêu đề</h3>
                <p className="text-lg font-mono font-semibold text-gray-900">{document.title}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Trạng thái</h3>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    STATUS_DISPLAY[document.status]?.color || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {STATUS_DISPLAY[document.status]?.label || document.status}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Tác giả</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {document.author?.fullName || document.author?.username || '-'}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Ngày tạo</h3>
                <p className="text-sm text-gray-700">{formatDate(document.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Ngày cập nhật</h3>
                <p className="text-sm text-gray-700">{formatDate(document.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* description */}
          {document.description && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Mô tả</h3>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap break-words text-sm leading-relaxed bg-gray-50 p-4 rounded-md">
                {document.description}
              </div>
            </div>
          )}

          {/* images gallery */}
          {document.images && document.images.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase">
                Danh sách hình ảnh ({document.images.length})
              </h3>

              {/* main viewer */}
              <div className="mb-6">
                {document.images[selectedImageIdx] !== undefined ? (
                  <div className="relative">
                    <img
                      src={document.images[selectedImageIdx]}
                      alt={`Trang ${selectedImageIdx + 1}`}
                      className="w-full max-h-96 object-contain rounded-lg shadow-md bg-gray-50"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                      {selectedImageIdx + 1}/{document.images.length}
                    </div>
                    <div className="absolute top-2 left-2 flex gap-2">
                      <button
                        onClick={() => setSelectedImageIdx(selectedImageIdx === 0 ? document.images.length - 1 : selectedImageIdx - 1)}
                        className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setSelectedImageIdx((selectedImageIdx + 1) % document.images.length)}
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

              {/* thumbnails */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Nhấp để xem</p>
                <div className="flex gap-2 flex-wrap">
                  {document.images.map((url, idx) => (
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
          <p className="text-gray-500">Không tìm thấy tài liệu</p>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-900"
          >
            ← Quay lại danh sách
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn chắc chắn muốn xóa tài liệu "${document?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
      />
    </RoleLayout>
  );
}

export default DocumentDetail;
