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

  const checkInTime = attendance?.timeString?.checkIn || "";
  const checkOutTime = attendance?.timeString?.checkOut || "";
  const note = attendance?.note || "";
  const delivererDisplay =
    attendance?.delivererType || attendance?.delivererOtherInfo || "";
  const receiverDisplay =
    attendance?.receiverType || attendance?.receiverOtherInfo || "";
  const hasCheckout = Boolean(checkOutTime);
  const parentConfirmLabel = hasCheckout ? "Đã xác nhận" : "Chưa xác nhận";

  const hasCheckInData =
    attendance && (checkInTime || attendance?.status === "present");
  const statusCheckInLabel = hasCheckInData ? "Có mặt" : "Chưa có dữ liệu";

  const statusCheckOutLabel = hasCheckout ? "Đã đón" : "Chưa có dữ liệu";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-emerald-600 shadow-md">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate("/student")}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-700 transition-colors flex-shrink-0"
            aria-label="Quay lại"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white font-semibold text-lg leading-tight">
            Điểm danh hôm nay
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-10 pt-4">
        {/* Student info strip */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4 mb-5 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium">Họ và tên trẻ</p>
              <p className="text-base font-bold text-gray-800 truncate">{studentName}</p>
            </div>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-medium">{className}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">{todayLabel}</span>
            </div>
          </div>
        </div>

        {/* Loading spinner */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Error message */}
            {error && (
              <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm text-red-800 font-medium leading-snug pt-1">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              {/* Check-in card — green left border accent */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden border-l-4 border-l-emerald-500">
                <div className="bg-emerald-600 px-4 py-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <h2 className="text-white font-semibold text-base">Điểm danh đến</h2>
                </div>

                <div className="px-4 py-5 space-y-5">
                  {/* Status pill */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                        statusCheckInLabel === "Có mặt"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          statusCheckInLabel === "Có mặt" ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      />
                      {statusCheckInLabel}
                    </span>
                  </div>

                  {/* Time row */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Giờ đến</p>
                    {hasCheckInData ? (
                      <p className="text-2xl font-bold text-emerald-700 tracking-tight">
                        {checkInTime || "—"}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Chưa có giờ điểm danh</p>
                    )}
                  </div>

                  {/* Deliverer row */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Người đưa</p>
                    <p className="text-sm font-medium text-gray-800">
                      {delivererDisplay || <span className="text-gray-400 font-normal">Chưa có thông tin</span>}
                    </p>
                  </div>

                  {/* Note row */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ghi chú</p>
                    <p className="text-sm text-gray-800">
                      {note || <span className="text-gray-400">Không có ghi chú</span>}
                    </p>
                  </div>

                  {/* Check-in photo — full width */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Hình ảnh xác nhận</p>
                    {attendance?.checkinImageName ? (
                      <a
                        href={attendance.checkinImageName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl overflow-hidden border border-gray-200 shadow-sm active:opacity-80 transition-opacity"
                      >
                        <img
                          src={attendance.checkinImageName}
                          alt="Ảnh check-in"
                          className="w-full object-cover rounded-xl"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/300x200?text=Ảnh+lỗi";
                            e.target.alt = "Không tải được ảnh";
                          }}
                        />
                        <div className="bg-gray-50 px-3 py-2 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="text-xs text-gray-500">Nhấn để xem ảnh đầy đủ</span>
                        </div>
                      </a>
                    ) : (
                      <div className="w-full rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 py-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-400">Chưa có ảnh check-in</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Check-out card — blue left border accent */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden border-l-4 border-l-blue-500">
                <div className="bg-blue-600 px-4 py-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <h2 className="text-white font-semibold text-base">Điểm danh về</h2>
                </div>

                <div className="px-4 py-5 space-y-5">
                  {/* Status pill */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                        statusCheckOutLabel === "Đã đón"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          statusCheckOutLabel === "Đã đón" ? "bg-blue-500" : "bg-gray-400"
                        }`}
                      />
                      {statusCheckOutLabel}
                    </span>
                  </div>

                  {/* Time row */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Giờ về</p>
                    {hasCheckout ? (
                      <p className="text-2xl font-bold text-blue-700 tracking-tight">
                        {checkOutTime}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Chưa có giờ điểm danh về</p>
                    )}
                  </div>

                  {/* Receiver row */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Người đón</p>
                    <p className="text-sm font-medium text-gray-800">
                      {receiverDisplay || <span className="text-gray-400 font-normal">Chưa có thông tin</span>}
                    </p>
                  </div>

                  {/* Parent confirm row */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Xác nhận phụ huynh</p>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                        hasCheckout
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {hasCheckout ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                        </svg>
                      )}
                      {parentConfirmLabel}
                    </span>
                  </div>

                  {/* Check-out photo — full width */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Hình ảnh xác nhận</p>
                    {attendance?.checkoutImageName ? (
                      <a
                        href={attendance.checkoutImageName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl overflow-hidden border border-gray-200 shadow-sm active:opacity-80 transition-opacity"
                      >
                        <img
                          src={attendance.checkoutImageName}
                          alt="Ảnh check-out"
                          className="w-full object-cover rounded-xl"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/300x200?text=Ảnh+lỗi";
                          }}
                        />
                        <div className="bg-gray-50 px-3 py-2 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="text-xs text-gray-500">Nhấn để xem ảnh đầy đủ</span>
                        </div>
                      </a>
                    ) : (
                      <div className="w-full rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 py-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-400">Chưa có ảnh check-out</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default TodayAttendance;
