import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { get, post, postFormData, ENDPOINTS } from "../../service/api";

function PickupRegistration() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();

  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [pickupRequests, setPickupRequests] = useState([]);

  const [form, setForm] = useState({
    studentId: "",
    fullName: "",
    relation: "",
    phone: "",
    imageFile: null,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    const isParent = userRoles.some((r) =>
      ["Parent", "StudentParent", "Student"].includes(r)
    );
    if (!isParent) {
      navigate("/", { replace: true });
      return;
    }

    fetchChildren();
    fetchMyPickupRequests();
  }, [isInitializing, user, navigate]);

  const fetchChildren = async () => {
    try {
      setLoadingChildren(true);
      setError("");
      const res = await get(ENDPOINTS.AUTH.MY_CHILDREN);
      const list = res.data || [];
      setChildren(list);
      if (list.length > 0) {
        setForm((prev) => ({ ...prev, studentId: list[0]._id }));
      }
    } catch (err) {
      console.error("Load children failed:", err);
      setError("Không tải được danh sách trẻ. Vui lòng thử lại.");
    } finally {
      setLoadingChildren(false);
    }
  };

  const fetchMyPickupRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await get(
        ENDPOINTS.PICKUP.MY_REQUESTS || "/pickup/my-requests"
      );
      setPickupRequests(res.data || []);
    } catch (err) {
      console.error("Load my requests failed:", err);
      // Không set error để tránh che mất lỗi khác
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((prev) => ({ ...prev, imageFile: files?.[0] || null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!form.studentId) {
      setError("Vui lòng chọn học sinh.");
      setSubmitting(false);
      return;
    }
    if (!form.fullName.trim() || !form.relation || !form.phone.trim()) {
      setError("Vui lòng nhập đầy đủ Họ tên, Mối quan hệ và Số điện thoại.");
      setSubmitting(false);
      return;
    }
    if (!/^(0|\+84)[3-9]\d{8}$/.test(form.phone.trim())) {
      setError(
        "Số điện thoại phải bắt đầu bằng 0 theo sau 9 số (VD: 0912345678)"
      );
      setSubmitting(false);
      return;
    }

    try {
      let imageUrl = "";

      // 1. Upload ảnh nếu có
      if (form.imageFile) {
        const formData = new FormData();
        formData.append("avatar", form.imageFile); // hoặc 'file' tùy backend
        const uploadRes = await postFormData(
          ENDPOINTS.CLOUDINARY.UPLOAD_AVATAR,
          formData
        );
        imageUrl = uploadRes?.data?.url || "";
      }

      // 2. Gửi đăng ký
      const payload = {
        studentId: form.studentId,
        fullName: form.fullName.trim(),
        relation: form.relation,
        phone: form.phone.trim(),
        imageUrl,
      };

      const res = await post(
        ENDPOINTS.PICKUP.CREATE || "/pickup/requests",
        payload
      );

      setSuccess("Đăng ký đã được gửi thành công! Đang chờ nhà trường duyệt.");
      setForm({
        studentId: children[0]?._id || "",
        fullName: "",
        relation: "",
        phone: "",
        imageFile: null,
      });

      // Reload danh sách
      fetchMyPickupRequests();
    } catch (err) {
      console.error("Submit failed:", err);
      setError(err.message || "Gửi đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return { text: "Chờ duyệt", color: "bg-amber-100 text-amber-800" };
      case "approved":
        return { text: "Đã duyệt", color: "bg-green-100 text-green-800" };
      case "rejected":
        return { text: "Từ chối", color: "bg-red-100 text-red-800" };
      default:
        return { text: status, color: "bg-gray-100 text-gray-800" };
    }
  };

  const selectedChild =
    children.find((c) => c._id === form.studentId) || children[0];

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Đăng ký người đưa / đón
          </h1>
          <button
            onClick={() => navigate("/student")}
            className="text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1"
          >
            ← Quay lại Dashboard
          </button>
        </div>

        {/* Thông tin trẻ */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-5 mb-6">
          {loadingChildren ? (
            <p className="text-gray-500">Đang tải thông tin trẻ...</p>
          ) : children.length === 0 ? (
            <p className="text-red-600">
              Bạn chưa có thông tin trẻ nào. Vui lòng liên hệ nhà trường.
            </p>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn trẻ
              </label>
              <select
                value={form.studentId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, studentId: e.target.value }))
                }
                className="w-full md:w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {children.map((child) => (
                  <option key={child._id} value={child._id}>
                    {child.fullName}{" "}
                    {child.classId?.className
                      ? `(${child.classId.className})`
                      : ""}
                  </option>
                ))}
              </select>

              {selectedChild && (
                <div className="mt-4 text-sm text-gray-700">
                  <p>
                    <strong>Trẻ:</strong> {selectedChild.fullName}
                  </p>
                  <p>
                    <strong>Lớp:</strong>{" "}
                    {selectedChild.classId?.className || "Chưa xếp lớp"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form + Danh sách */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          {/* Form */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Đăng ký người đưa đón mới
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên người đưa đón{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Nhập họ tên"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mối quan hệ với trẻ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="relation"
                    value={form.relation}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="VD: 090xxxxxxx"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ảnh người đưa đón (tùy chọn)
                  </label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {form.imageFile && (
                    <p className="mt-1 text-xs text-gray-500">
                      Đã chọn: {form.imageFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || loadingChildren}
                  className={`px-8 py-3 rounded-md text-white font-medium transition ${
                    submitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {submitting ? "Đang gửi..." : "+ Gửi đăng ký"}
                </button>
              </div>
            </form>
          </div>

          {/* Danh sách đã đăng ký */}
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Danh sách người đưa đón đã đăng ký
            </h3>

            {loadingRequests ? (
              <p className="text-gray-500">Đang tải danh sách...</p>
            ) : pickupRequests.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-600">Chưa có đăng ký nào.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Hãy thêm đăng ký mới ở phần trên.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pickupRequests.map((req) => {
                  const badge = getStatusBadge(req.status);
                  return (
                    <div
                      key={req._id}
                      className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-emerald-300 transition"
                    >
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                        {req.imageUrl ? (
                          <img
                            src={req.imageUrl}
                            alt={req.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                            👤
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {req.fullName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Quan hệ:{" "}
                              <span className="font-medium">
                                {req.relation}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              SĐT:{" "}
                              <span className="font-medium">{req.phone}</span>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Trẻ:{" "}
                              <span className="font-medium">
                                {req.student?.fullName || "Đang tải..."}
                              </span>
                            </p>
                          </div>
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}
                          >
                            {badge.text}
                          </span>
                        </div>

                        {req.rejectedReason && req.status === "rejected" && (
                          <p className="mt-2 text-sm text-red-600 italic">
                            Lý do từ chối: {req.rejectedReason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PickupRegistration;
