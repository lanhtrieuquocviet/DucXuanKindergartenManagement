import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';

function PickupRegistration() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    relation: '',
    phone: '',
  });
  const [pickupList, setPickupList] = useState([]);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    const isParent =
      userRoles.includes('Parent') ||
      userRoles.includes('StudentParent') ||
      userRoles.includes('Student');
    if (!isParent) {
      navigate('/', { replace: true });
      return;
    }

    const fetchChildren = async () => {
      try {
        setError('');
        const response = await get(ENDPOINTS.AUTH.MY_CHILDREN);
        const list = response.data || [];
        setChildren(list);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load children info', e);
        setError('Không tải được danh sách trẻ.');
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [navigate, user, isInitializing]);

  const student = children[0] || null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim() || !form.relation || !form.phone.trim()) {
      setError('Vui lòng nhập đầy đủ Họ tên, Mối quan hệ và Số điện thoại.');
      return;
    }

    const newItem = {
      id: Date.now(),
      fullName: form.fullName.trim(),
      relation: form.relation,
      phone: form.phone.trim(),
      status: 'pending', // Chờ duyệt (mock)
    };

    setPickupList((prev) => [newItem, ...prev]);
    setForm({
      fullName: '',
      relation: '',
      phone: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg md:text-xl font-semibold text-gray-800">
            Đăng ký người đưa / đón
          </h1>
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            ← Quay lại Dashboard
          </button>
        </div>

        {/* Thông tin trẻ */}
        <div className="bg-sky-50 border border-sky-100 rounded-t-xl px-4 py-3 mb-0">
          {loading ? (
            <p className="text-sm text-gray-500">Đang tải thông tin trẻ...</p>
          ) : student ? (
            <div className="space-y-1 text-sm text-gray-800">
              <p>
                <span className="mr-1">👶</span>
                Trẻ: <span className="font-semibold">{student.fullName}</span>
              </p>
              <p>
                <span className="mr-1">🏫</span>
                Lớp:{' '}
                <span className="font-semibold">
                  {student.classId?.className || 'Chưa xếp lớp'}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-red-500">
              Chưa có thông tin trẻ. Vui lòng liên hệ nhà trường.
            </p>
          )}
        </div>

        {/* Khung trắng chứa form + danh sách */}
        <div className="bg-white border border-sky-100 border-t-0 rounded-b-xl shadow-sm p-4 md:p-5">
          {/* Form đăng ký */}
          <h2 className="text-sm md:text-base font-semibold text-gray-800 mb-3">
            Form đăng ký người đưa đón
          </h2>

          {error && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 mb-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Họ và tên người đưa đón
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Nhập họ tên"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mối quan hệ với trẻ
              </label>
              <select
                name="relation"
                value={form.relation}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">-- Chọn --</option>
                <option value="Bố">Bố</option>
                <option value="Mẹ">Mẹ</option>
                <option value="Ông">Ông</option>
                <option value="Bà">Bà</option>
                <option value="Anh/Chị">Anh/Chị</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="VD: 090xxxxxxx"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ảnh người đưa / đón
              </label>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-xs file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center w-full md:w-auto px-6 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
            >
              + Gửi đăng ký
            </button>
          </form>

          {/* Danh sách người đưa đón */}
          <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-3">
            Danh sách người đưa đón đã đăng ký
          </h3>

          {pickupList.length === 0 ? (
            <p className="text-sm text-gray-500">
              Chưa có người đưa đón nào được đăng ký.
            </p>
          ) : (
            <div className="space-y-3">
              {pickupList.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                    👤
                  </div>
                  <div className="flex-1 text-sm text-gray-800">
                    <p className="font-semibold">{p.fullName}</p>
                    <p className="text-xs text-gray-600">
                      Quan hệ: {p.relation}
                    </p>
                    <p className="text-xs text-gray-600">SĐT: {p.phone}</p>
                    <p className="mt-1 text-xs font-medium text-amber-600">
                      Trạng thái: Chờ duyệt
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PickupRegistration;

