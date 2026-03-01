import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';

function ContactList() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState(''); // '' | 'pending' | 'replied'
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [message, setMessage] = useState({ type: null, text: null });
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const { getContacts, replyContact, clearReplyContact, resendReplyEmail, loading, error, setError } = useSchoolAdmin();
  const [actioningId, setActioningId] = useState(null); // id đang xóa hoặc gửi lại email

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

    const fetchData = async () => {
      try {
        const params = filter ? { status: filter } : {};
        const response = await getContacts(params);
        setData(response);
      } catch (_) {}
    };
    fetchData();
  }, [navigate, user, isInitializing, filter]);

  const handleReply = (item) => {
    setReplyingId(item._id);
    setReplyText(item.reply || '');
  };

  const handleCancelReply = () => {
    setReplyingId(null);
    setReplyText('');
    setMessage({ type: null, text: null });
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập nội dung phản hồi.' });
      return;
    }
    try {
      setError(null);
      setMessage({ type: null, text: null });
      await replyContact(replyingId, replyText.trim());
      setMessage({ type: 'success', text: 'Đã phản hồi thành công.' });
      const params = filter ? { status: filter } : {};
      const response = await getContacts(params);
      setData(response);
      setReplyingId(null);
      setReplyText('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Phản hồi thất bại.' });
    }
  };

  const handleClearReply = async (contactId) => {
    if (!window.confirm('Bạn có chắc muốn xóa phản hồi này? Liên hệ sẽ chuyển về trạng thái chưa phản hồi.')) return;
    try {
      setActioningId(contactId);
      setError(null);
      setMessage({ type: null, text: null });
      await clearReplyContact(contactId);
      setMessage({ type: 'success', text: 'Đã xóa phản hồi.' });
      const params = filter ? { status: filter } : {};
      const response = await getContacts(params);
      setData(response);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Xóa phản hồi thất bại.' });
    } finally {
      setActioningId(null);
    }
  };

  const handleResendEmail = async (contactId) => {
    try {
      setActioningId(contactId);
      setError(null);
      setMessage({ type: null, text: null });
      await resendReplyEmail(contactId);
      setMessage({ type: 'success', text: 'Đã gửi lại email phản hồi.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gửi lại email thất bại.' });
    } finally {
      setActioningId(null);
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
  };

  const userName = user?.fullName || user?.username || 'School Admin';
  const contacts = data?.data?.contacts || [];
  const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

  return (
    <RoleLayout
      title="Quản lý liên hệ"
      description="Xem và phản hồi các liên hệ từ phụ huynh/khách."
      menuItems={menuItems}
      activeKey="contacts"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {message.text && (
        <div
          className={`mb-4 rounded-md px-4 py-2 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Lọc:</span>
        <button
          type="button"
          onClick={() => setFilter('')}
          className={`px-3 py-1 rounded text-sm ${!filter ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded text-sm ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Chưa phản hồi
        </button>
        <button
          type="button"
          onClick={() => setFilter('replied')}
          className={`px-3 py-1 rounded text-sm ${filter === 'replied' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Đã phản hồi
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && (
          <div className="p-6 text-center text-gray-500">Đang tải...</div>
        )}
        {!loading && contacts.length === 0 && (
          <div className="p-6 text-center text-gray-500">Chưa có liên hệ nào.</div>
        )}
        {!loading && contacts.length > 0 && (
          <div className="divide-y divide-gray-200">
            {contacts.map((item) => (
              <div key={item._id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{item.fullName}</p>
                    <p className="text-sm text-gray-600">
                      {item.email} {item.phone && ` • ${item.phone}`}
                    </p>
                    {item.address && (
                      <p className="text-sm text-gray-500">Địa chỉ: {item.address}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                      {item.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Gửi lúc: {formatDate(item.createdAt)}
                    </p>
                    {item.status === 'replied' && (
                      <div className="mt-3 p-3 bg-green-50 rounded border border-green-100">
                        <p className="text-xs font-medium text-green-800 mb-1">Phản hồi:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {item.reply}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(item.repliedAt)}
                          {item.repliedBy?.fullName && ` • ${item.repliedBy.fullName}`}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleResendEmail(item._id)}
                            disabled={actioningId === item._id}
                            className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {actioningId === item._id ? 'Đang gửi...' : 'Gửi lại email'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClearReply(item._id)}
                            disabled={actioningId === item._id}
                            className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Xóa phản hồi
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {item.status === 'pending' && replyingId !== item._id && (
                      <button
                        type="button"
                        onClick={() => handleReply(item)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Phản hồi
                      </button>
                    )}
                  </div>
                </div>

                {replyingId === item._id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nội dung phản hồi
                    </label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={4}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-green-500"
                      placeholder="Nhập nội dung phản hồi..."
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={handleSubmitReply}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Gửi phản hồi
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelReply}
                        className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleLayout>
  );
}

export default ContactList;
