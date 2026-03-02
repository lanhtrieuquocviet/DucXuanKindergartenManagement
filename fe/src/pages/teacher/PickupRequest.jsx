import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import RoleLayout from "../../layouts/RoleLayout";
import { get, post, ENDPOINTS } from "../../service/api";
import ConfirmDialog from "../../components/ConfirmDialog"; // component bạn đã có

// Các hằng số trạng thái
const STATUS_LABELS = {
  pending: {
    text: "Chờ duyệt",
    color: "bg-amber-100 text-amber-800 border-amber-300",
  },
  approved: {
    text: "Đã duyệt",
    color: "bg-green-100 text-green-800 border-green-300",
  },
  rejected: {
    text: "Từ chối",
    color: "bg-red-100 text-red-800 border-red-300",
  },
};

function PickupRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isInitializing } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending"); // mặc định chỉ hiển thị chờ duyệt
  const [previewImage, setPreviewImage] = useState(null);// Image max
  // Modal xác nhận
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(""); // 'approve' | 'reject'

  const menuItems = useMemo(() => [
    { key: "classes", label: "Lớp phụ trách" },
    { key: "students", label: "Danh sách học sinh" },
    { key: "attendance", label: "Điểm danh" },
    { key: "students", label: "Danh sách học sinh" },
    { key: "pickup-approval", label: "Phê duyệt đưa đón" },
    { key: "schedule", label: "Lịch dạy & hoạt động" },
    { key: "messages", label: "Thông báo cho phụ huynh" },
  ];

  const activeKey = useMemo(() => {
    const path = location.pathname || '';
    if (path.startsWith('/teacher/attendance')) return 'attendance';
    if (path.startsWith('/teacher/pickup-approval')) return 'pickup-approval';
    return 'classes';
  }, [location.pathname]);

  const handleMenuSelect = (key) => {
    if (key === "classes") { navigate("/teacher"); return; }
    if (key === "attendance") { navigate("/teacher/attendance"); return; }
    if (key === "pickup-approval") { navigate("/teacher/pickup-approval"); return; }
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes("Teacher")) {
      navigate("/", { replace: true });
      return;
    }

    fetchPickupRequests();
  }, [isInitializing, user, navigate]);

  const fetchPickupRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await get(ENDPOINTS.PICKUP.REQUESTS || "/pickup/requests");
      let filtered = res.data || [];

      // Lọc theo trạng thái nếu không phải "all"
      if (filterStatus !== "all") {
        filtered = filtered.filter((r) => r.status === filterStatus);
      }

      setRequests(filtered);
    } catch (err) {
      console.error("Fetch pickup requests failed:", err);
      setError("Không tải được danh sách. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setConfirmOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest) return;

    try {
      setError("");
      const payload = {
        requestId: selectedRequest._id,
        status: actionType === "approve" ? "approved" : "rejected",
        // Nếu từ chối, có thể thêm rejectedReason từ modal sau này
      };

      await post(
        ENDPOINTS.PICKUP.UPDATE_STATUS || "/pickup/requests/status",
        payload
      );

      // Cập nhật UI
      setRequests((prev) =>
        prev.map((r) =>
          r._id === selectedRequest._id ? { ...r, status: payload.status } : r
        )
      );

      setSuccessMessage(
        actionType === "approve"
          ? "Đã duyệt thành công!"
          : "Đã từ chối đăng ký."
      );
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Action failed:", err);
      setError(err.message || "Lỗi khi xử lý yêu cầu. Vui lòng thử lại.");
    } finally {
      setConfirmOpen(false);
      setSelectedRequest(null);
      setActionType("");
    }
  };

  const getStatusBadge = (status) =>
    STATUS_LABELS[status] || {
      text: status,
      color: "bg-gray-100 text-gray-800",
    };

  const userName = user?.fullName || user?.username || "Giáo viên";

  return (
    <RoleLayout
      title="Phê duyệt người đưa đón"
      description="Xem và xử lý các đăng ký người đưa đón từ phụ huynh."
      menuItems={menuItems}
      activeKey={activeKey}
      onLogout={() => navigate("/login", { replace: true })}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate("/profile")}
      onMenuSelect={handleMenuSelect}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header & Filter */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Phê duyệt người đưa đón
              </h1>
              <p className="text-gray-600 mt-1">
                Các đăng ký từ phụ huynh chờ giáo viên xác nhận
              </p>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pending">Chỉ chờ duyệt</option>
                <option value="all">Tất cả</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>

              <button
                onClick={fetchPickupRequests}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white font-medium transition ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "Đang tải..." : "Làm mới"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm flex items-center gap-2">
              <span>✅</span> {successMessage}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Đang tải danh sách đăng ký...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50">
              <p className="text-gray-600 text-lg">
                Hiện chưa có đăng ký nào{" "}
                {filterStatus === "pending" ? "chờ duyệt" : ""}.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Khi phụ huynh đăng ký, danh sách sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Học sinh</th>
                  <th className="px-6 py-4">Người đăng ký</th>
                  <th className="px-6 py-4">Quan hệ</th>
                  <th className="px-6 py-4">SĐT</th>
                  <th className="px-6 py-4">Ảnh</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((req) => {
                  const badge = getStatusBadge(req.status);
                  return (
                    <tr
                      key={req._id}
                      className="hover:bg-gray-50 transition align-middle"
                    >
                      <td className="px-6 py-4 font-medium">
                        {req.student?.fullName || "—"}
                      </td>
                      <td className="px-6 py-4">{req.fullName}</td>
                      <td className="px-6 py-4">{req.relation}</td>
                      <td className="px-6 py-4">{req.phone}</td>
                      <td className="px-6 py-6">
                        <div className="flex justify-center">
                          {req.imageUrl ? (
                            <img
                              src={req.imageUrl}
                              alt={req.fullName}
                              onClick={() => setPreviewImage(req.imageUrl)}
                              className="w-16 h-16 rounded-lg object-cover border border-gray-300 shadow-sm cursor-pointer hover:scale-105 transition"
                            />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}
                        >
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {req.status === "pending" && (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleAction(req, "approve")}
                              className="px-4 py-1.5 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 transition"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleAction(req, "reject")}
                              className="px-4 py-1.5 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 transition"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal xác nhận */}
      <ConfirmDialog
        open={confirmOpen}
        title={actionType === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
        message={
          actionType === "approve"
            ? `Bạn có chắc muốn duyệt "${selectedRequest?.fullName}" (${selectedRequest?.relation}) cho học sinh "${selectedRequest?.student?.fullName}"?`
            : `Bạn có chắc muốn từ chối "${selectedRequest?.fullName}" (${selectedRequest?.relation})?`
        }
        confirmText={actionType === "approve" ? "Duyệt" : "Từ chối"}
        confirmButtonClass={
          actionType === "approve"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }
        onConfirm={confirmAction}
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedRequest(null);
          setActionType("");
        }}
      />
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg w-full px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Preview"
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />

            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}

export default PickupRequest;
