import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, ENDPOINTS } from '../../service/api';

const DEFAULT_AVATAR =
  "https://via.placeholder.com/300x400.png?text=Avatar+3x4";


function TodayAttendance() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Lấy avatar của phụ huynh (người đang đăng nhập)
  const parentAvatar = user?.avatar || DEFAULT_AVATAR;
  const today = useMemo(() => new Date(), []);
  const todayLabel = today.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const todayQuery = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    const isParent =
      userRoles.includes("Parent") ||
      userRoles.includes("StudentParent") ||
      userRoles.includes("Student");
    if (!isParent) {
      navigate("/", { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        setError("");
        setLoading(true);

        const childrenRes = await get(ENDPOINTS.AUTH.MY_CHILDREN);
        const list = childrenRes.data || [];
        setChildren(list);

        const student = list[0];
        if (!student?._id) {
          setAttendance(null);
          setError("Chưa có thông tin trẻ để xem điểm danh.");
          return;
        }

        const attendanceRes = await get(
          `${ENDPOINTS.STUDENTS.ATTENDANCE_LIST}?studentId=${student._id}&date=${todayQuery}`
        );
        const attendances = attendanceRes.data || [];
        setAttendance(attendances[0] || null);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load today attendance", e);
        setError("Không tải được dữ liệu điểm danh hôm nay.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, user, isInitializing, todayQuery]);

  const student = children[0] || null;
  const studentName = student?.fullName || "—";
  const className = student?.classId?.className || "Chưa xếp lớp";

  // Trạng thái chỉ có 3 loại: Có mặt, Đã đón, Chưa có dữ liệu (khi GV điểm danh sẽ gửi tới phụ huynh)
  const checkInTime = attendance?.timeString?.checkIn || "";
  const checkOutTime = attendance?.timeString?.checkOut || "";
  const note = attendance?.note || "";
  const delivererDisplay =
    attendance?.delivererType || attendance?.delivererOtherInfo || "";
  const receiverDisplay =
    attendance?.receiverType || attendance?.receiverOtherInfo || "";
  const hasCheckout = Boolean(checkOutTime);
  const parentConfirmLabel = hasCheckout ? "Đã xác nhận" : "Chưa xác nhận";

  // Điểm danh đến: "Có mặt" khi đã có bản ghi điểm danh đến (có giờ đến hoặc status present), còn lại "Chưa có dữ liệu"
  const hasCheckInData =
    attendance && (checkInTime || attendance?.status === "present");
  const statusCheckInLabel = hasCheckInData ? "Có mặt" : "Chưa có dữ liệu";

  // Điểm danh về: "Đã đón" khi có giờ về, còn lại "Chưa có dữ liệu"
  const statusCheckOutLabel = hasCheckout ? "Đã đón" : "Chưa có dữ liệu";

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        {/* Tiêu đề trang - căn giữa */}
        <div className="text-center mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center justify-center gap-2">
            <span role="img" aria-label="clipboard">
              📋
            </span>
            Chi tiết điểm danh
          </h1>
        </div>

        {/* Khung thông tin trẻ + ngày (nền xanh nhạt) */}
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-4 mb-6 text-sm text-gray-800 space-y-2">
          <p>
            <span className="mr-1">👶</span>
            Trẻ: <span className="font-semibold">{studentName}</span>
          </p>
          <p>
            <span className="mr-1">🏫</span>
            Lớp: <span className="font-semibold">{className}</span>
          </p>
          <p>
            <span className="mr-1">📅</span>
            Ngày: <span className="font-semibold">{todayLabel}</span>
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Đang tải dữ liệu điểm danh...
          </p>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Luôn hiển thị 2 block; trạng thái "Có mặt" / "Đã đón" / "Chưa có dữ liệu" theo dữ liệu GV gửi tới phụ huynh */}
            <div className="space-y-6">
              {/* Điểm danh đến */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-600" />
                  <h2 className="text-base font-semibold text-gray-800">
                    Điểm danh đến
                  </h2>
                </div>
                <div className="px-4 py-4 space-y-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-1">
                      Trạng thái
                    </span>
                    <div
                      className={`inline-block rounded-lg border px-3 py-2 text-sm font-semibold ${
                        statusCheckInLabel === "Có mặt"
                          ? "bg-green-50 border-green-100 text-green-700"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      {statusCheckInLabel}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ đến
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={checkInTime || "—"}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Người đưa
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={delivererDisplay || ""}
                      placeholder="(Chưa có thông tin người đưa)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50"
                    />
                  </div>

                  {/* Trong section Điểm danh đến */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hình ảnh xác nhận
                    </label>
                    <div className="flex justify-center">
                      {/* Ảnh check-in */}
                      <div className="space-y-1 max-w-xs w-full">
                        <div className="text-xs font-medium text-gray-600 text-center">
                          Ảnh check-in
                        </div>
                        {attendance?.checkinImageName ? (
                          <a
                            href={attendance.checkinImageName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:opacity-90 transition"
                          >
                            <img
                              src={attendance.checkinImageName}
                              alt="Ảnh check-in"
                              className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/300x200?text=Ảnh+lỗi";
                                e.target.alt = "Không tải được ảnh";
                              }}
                            />
                          </a>
                        ) : (
                          <div className="h-48 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-500">
                            Chưa có ảnh check-in
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={note || ""}
                      placeholder="Không có ghi chú."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50 min-h-[44px]"
                    />
                  </div>
                </div>
              </section>

              {/* Điểm danh về */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-600" />
                  <h2 className="text-base font-semibold text-gray-800">
                    Điểm danh về
                  </h2>
                </div>
                <div className="px-4 py-4 space-y-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-1">
                      Trạng thái
                    </span>
                    <div
                      className={`inline-block rounded-lg border px-3 py-2 text-sm font-semibold ${
                        statusCheckOutLabel === "Đã đón"
                          ? "bg-blue-50 border-blue-100 text-blue-700"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      {statusCheckOutLabel}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ về
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={checkOutTime || "—"}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Người đón
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={receiverDisplay || ""}
                      placeholder="(Chưa có thông tin người đón)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50"
                    />
                  </div>

                  {/* Trong section Điểm danh về */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hình ảnh xác nhận
                    </label>
                    <div className="flex justify-center">
                      {/* Ảnh check-out */}
                      <div className="space-y-1 max-w-xs w-full">
                        <div className="text-xs font-medium text-gray-600 text-center">
                          Ảnh check-out
                        </div>
                        {attendance?.checkoutImageName ? (
                          <a
                            href={attendance.checkoutImageName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:opacity-90 transition"
                          >
                            <img
                              src={attendance.checkoutImageName}
                              alt="Ảnh check-out"
                              className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/300x200?text=Ảnh+lỗi";
                              }}
                            />
                          </a>
                        ) : (
                          <div className="h-48 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-500">
                            Chưa có ảnh check-out
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xác nhận phụ huynh
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={parentConfirmLabel}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50 font-medium"
                    />
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        {/* Nút quay lại Dashboard - căn giữa, màu xanh */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => navigate("/student")}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>←</span>
            <span>Quay lại Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TodayAttendance;
