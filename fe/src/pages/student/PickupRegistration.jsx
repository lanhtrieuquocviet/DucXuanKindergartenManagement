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
  const [previewUrl, setPreviewUrl] = useState(null);

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
      // Tự động gán học sinh đầu tiên và cố định luôn
      if (list.length > 0) {
        setForm((prev) => ({ ...prev, studentId: list[0]._id }));
      }
    } catch (err) {
      console.error("Load children failed:", err);
      setError("Không tải được thông tin học sinh.");
    } finally {
      setLoadingChildren(false);
    }
  };

  const fetchMyPickupRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await get(ENDPOINTS.PICKUP.MY_REQUESTS || "/pickup/my-requests");
      setPickupRequests(res.data || []);
    } catch (err) {
      console.error("Load requests failed:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files?.[0];
      if (file) {
        setForm((prev) => ({ ...prev, imageFile: file }));
        setPreviewUrl(URL.createObjectURL(file)); // Tạo link xem trước ảnh
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Chặn nếu đã đủ 3 người
    if (pickupRequests.length >= 3) {
      setError("Mỗi học sinh chỉ được đăng ký tối đa 3 người đưa đón.");
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = "";
      if (form.imageFile) {
        const formData = new FormData();
        formData.append("avatar", form.imageFile);
        const uploadRes = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_AVATAR, formData);
        imageUrl = uploadRes?.data?.url || "";
      }

      const payload = {
        studentId: form.studentId,
        fullName: form.fullName.trim(),
        relation: form.relation.trim(),
        phone: form.phone.trim(),
        imageUrl,
      };

      await post(ENDPOINTS.PICKUP.CREATE || "/pickup/requests", payload);

      setSuccess("Đăng ký thành công! Đang chờ nhà trường duyệt.");
      // Reset form nhưng giữ lại studentId cố định
      setForm({
        studentId: children[0]?._id || "",
        fullName: "",
        relation: "",
        phone: "",
        imageFile: null,
      });
      setPreviewUrl(null);
      fetchMyPickupRequests();
    } catch (err) {
      setError(err.message || "Gửi đăng ký thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: "Chờ duyệt", color: "bg-amber-100 text-amber-800" },
      approved: { text: "Đã duyệt", color: "bg-green-100 text-green-800" },
      rejected: { text: "Từ chối", color: "bg-red-100 text-red-800" },
    };
    return badges[status] || { text: status, color: "bg-gray-100 text-gray-800" };
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 text-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký người đưa đón</h1>
          <button onClick={() => navigate("/student")} className="text-emerald-600 hover:underline font-medium">
            ← Quay lại Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Thêm đăng ký mới</h2>
              <span className={`text-sm font-medium ${pickupRequests.length >= 3 ? 'text-red-500' : 'text-gray-500'}`}>
                Đã đăng ký: {pickupRequests.length}/3
              </span>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">{error}</div>}
            {success && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 text-green-700 text-sm">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cố định học sinh */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Học sinh đăng ký</label>
                <div className="text-gray-900 font-bold flex items-center gap-2">
                  <span className="text-xl">🎓</span>
                  {children.find((c) => c._id === form.studentId)?.fullName || "Đang tải..."}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chọn ảnh với dấu cộng */}
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-colors relative group">
                  <input
                    type="file"
                    name="image"
                    id="pickup-image"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                  <label htmlFor="pickup-image" className="cursor-pointer flex flex-col items-center w-full">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-xl shadow-md" />
                    ) : (
                      <div className="w-24 h-24 flex flex-col items-center justify-center bg-gray-100 rounded-full group-hover:bg-emerald-50 transition-colors">
                        <span className="text-3xl text-gray-400 group-hover:text-emerald-500">+</span>
                        <span className="text-[10px] font-medium text-gray-400 mt-1 uppercase">Ảnh chân dung</span>
                      </div>
                    )}
                  </label>
                  {previewUrl && (
                    <button 
                      type="button" 
                      onClick={() => {setPreviewUrl(null); setForm({...form, imageFile: null})}}
                      className="absolute top-2 right-2 bg-white/80 backdrop-blur shadow-sm rounded-full w-6 h-6 text-xs text-red-500 hover:bg-red-50"
                    >✕</button>
                  )}
                </div>

                <div className="space-y-4 text-left">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên người đưa đón *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Nhập đầy đủ họ tên"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                      Mối quan hệ * <span className="text-[10px] text-gray-400 font-normal">{form.relation.length}/50</span>
                    </label>
                    <input
                      type="text"
                      name="relation"
                      value={form.relation}
                      onChange={handleChange}
                      maxLength={50}
                      placeholder="Ví dụ: Ông nội, Bác ruột..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="09xxx..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || pickupRequests.length >= 3}
                className={`w-full py-3.5 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${
                  submitting || pickupRequests.length >= 3 
                    ? "bg-gray-300 cursor-not-allowed shadow-none" 
                    : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200 active:scale-[0.98]"
                }`}
              >
                {pickupRequests.length >= 3 ? "Đã đạt giới hạn 3 người" : submitting ? "Đang xử lý..." : "Xác nhận đăng ký"}
              </button>
            </form>
          </div>

          {/* List Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Danh sách đã đăng ký</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {loadingRequests ? (
                <div className="p-8 text-center text-gray-400">Đang tải dữ liệu...</div>
              ) : pickupRequests.length === 0 ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                  <span className="text-4xl mb-2">📋</span>
                  <p>Chưa có người đưa đón nào được đăng ký.</p>
                </div>
              ) : (
                pickupRequests.map((req) => {
                  const badge = getStatusBadge(req.status);
                  return (
                    <div key={req._id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 shadow-inner">
                        {req.imageUrl ? (
                          <img src={req.imageUrl} className="w-full h-full object-cover" alt="Avatar" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl bg-gray-200 text-gray-400">👤</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-gray-900 truncate">{req.fullName}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.color}`}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          {req.relation} • <span className="text-gray-400">{req.phone}</span>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PickupRegistration;  