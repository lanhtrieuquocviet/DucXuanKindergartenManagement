import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';

function TodayAttendance() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = useMemo(() => new Date(), []);
  const todayLabel = today.toLocaleDateString('vi-VN');
  const todayQuery = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

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

    const fetchData = async () => {
      try {
        setError('');
        setLoading(true);

        // 1. Lấy danh sách con
        const childrenRes = await get(ENDPOINTS.AUTH.MY_CHILDREN);
        const list = childrenRes.data || [];
        setChildren(list);

        const student = list[0];
        if (!student?._id) {
          setAttendance(null);
          setError('Chưa có thông tin trẻ để xem điểm danh.');
          return;
        }

        // 2. Lấy điểm danh hôm nay cho trẻ đầu tiên
        const attendanceRes = await get(
          `${ENDPOINTS.STUDENTS.ATTENDANCE_LIST}?studentId=${student._id}&date=${todayQuery}`,
        );
        const attendances = attendanceRes.data || [];
        setAttendance(attendances[0] || null);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load today attendance', e);
        setError('Không tải được dữ liệu điểm danh hôm nay.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, user, isInitializing, todayQuery]);

  const student = children[0] || null;
  const studentName = student?.fullName || '—';
  const className = student?.classId?.className || 'Chưa xếp lớp';

  const statusCheckIn = attendance?.status || 'present';
  const checkInTime = attendance?.timeString?.checkIn || '';
  const checkOutTime = attendance?.timeString?.checkOut || '';
  const note = attendance?.note || '';

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span role="img" aria-label="clipboard">
              📋
            </span>
            Chi tiết điểm danh
          </h1>
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            ← Quay lại Dashboard
          </button>
        </div>

        {/* Thông tin trẻ + ngày */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-4 text-sm text-gray-800 space-y-1">
          <p>
            <span className="mr-1">👶</span>
            Trẻ:{' '}
            <span className="font-semibold">
              {studentName}
            </span>
          </p>
          <p>
            <span className="mr-1">🏫</span>
            Lớp:{' '}
            <span className="font-semibold">
              {className}
            </span>
          </p>
          <p>
            <span className="mr-1">📅</span>
            Ngày:{' '}
            <span className="font-semibold">
              {todayLabel}
            </span>
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Đang tải dữ liệu điểm danh...</p>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}

            {!attendance && !error && (
              <p className="text-sm text-gray-600">
                Chưa có dữ liệu điểm danh cho ngày hôm nay.
              </p>
            )}

            {attendance && (
              <div className="space-y-6">
                {/* Điểm danh đến */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="border-b border-gray-100 px-4 py-2 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-600" />
                    <h2 className="text-sm md:text-base font-semibold text-gray-800">
                      Điểm danh đến
                    </h2>
                  </div>
                  <div className="px-4 py-3 space-y-3 text-sm">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-md px-3 py-1.5 text-emerald-700 text-xs font-semibold inline-block">
                      Trạng thái:{' '}
                      {statusCheckIn === 'present'
                        ? 'Có mặt'
                        : statusCheckIn === 'absent'
                          ? 'Vắng'
                          : 'Xin nghỉ'}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Giờ đến
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={checkInTime || ''}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Người đưa
                      </label>
                      <input
                        type="text"
                        readOnly
                        value=""
                        placeholder="(Chưa có thông tin người đưa)"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Hình ảnh xác nhận
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center h-28 text-xs text-gray-400">
                          Ảnh check-in
                        </div>
                        <div className="border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center h-28 text-xs text-gray-400">
                          Ảnh người đưa
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Ghi chú
                      </label>
                      <textarea
                        readOnly
                        value={note}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 min-h-[60px]"
                        placeholder="Không có ghi chú."
                      />
                    </div>
                  </div>
                </section>

                {/* Điểm danh về */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="border-b border-gray-100 px-4 py-2 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
                    <h2 className="text-sm md:text-base font-semibold text-gray-800">
                      Điểm danh về
                    </h2>
                  </div>
                  <div className="px-4 py-3 space-y-3 text-sm">
                    <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-1.5 text-blue-700 text-xs font-semibold inline-block">
                      Trạng thái:{' '}
                      {checkOutTime ? 'Đã đón' : 'Chưa đón'}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Giờ về
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={checkOutTime || ''}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Người đón
                      </label>
                      <input
                        type="text"
                        readOnly
                        value=""
                        placeholder="(Chưa có thông tin người đón)"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Hình ảnh xác nhận
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center h-28 text-xs text-gray-400">
                          Ảnh check-out
                        </div>
                        <div className="border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center h-28 text-xs text-gray-400">
                          Ảnh người đón
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TodayAttendance;

