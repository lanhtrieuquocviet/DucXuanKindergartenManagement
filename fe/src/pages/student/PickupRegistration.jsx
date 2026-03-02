import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  get,
  post,
  postFormData,
  ENDPOINTS,
  del,
  put,
} from "../../service/api";
import { Pencil, Trash2 } from "lucide-react";
function PickupRegistration() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();
  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
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
      const res = await get(
        ENDPOINTS.PICKUP.MY_REQUESTS || "/pickup/my-requests"
      );
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
  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, imageFile: null }));
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      let imageUrl = previewUrl || "";

      if (form.imageFile) {
        const formData = new FormData();
        formData.append("avatar", form.imageFile);
        const uploadRes = await postFormData(
          ENDPOINTS.CLOUDINARY.UPLOAD_AVATAR,
          formData
        );
        imageUrl = uploadRes?.data?.url || "";
      }

      const payload = {
        studentId: form.studentId,
        fullName: form.fullName.trim(),
        relation: form.relation.trim(),
        phone: form.phone.trim(),
        imageUrl,
      };

      if (editingId) {
        await put(ENDPOINTS.PICKUP.UPDATE(editingId), payload);
        setSuccess("Cập nhật thành công!");
      } else {
        if (pickupRequests.length >= 3) {
          setError("Tối đa 3 người đưa đón");
          setSubmitting(false);
          return;
        }
        await post(ENDPOINTS.PICKUP.CREATE, payload);
        setSuccess("Đăng ký thành công!");
      }

      setEditingId(null);
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
      setError(err.message || "Thao tác thất bại");
    } finally {
      setSubmitting(false);
    }
  };
  // Bấm Sửa
  const handleEdit = (req) => {
    setEditingId(req._id);

    setForm({
      studentId: req.student?._id || form.studentId,
      fullName: req.fullName,
      relation: req.relation,
      phone: req.phone,
      imageFile: null,
    });

    setPreviewUrl(req.imageUrl || null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Bấm Xóa
  const confirmDelete = async () => {
    try {
      await del(ENDPOINTS.PICKUP.DELETE(deleteId));
      setSuccess("Đã hủy đăng ký thành công");
      fetchMyPickupRequests();
    } catch (err) {
      setError(err.message || "Xóa thất bại");
    } finally {
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: "Chờ duyệt", color: "bg-amber-100 text-amber-800" },
      approved: { text: "Đã duyệt", color: "bg-green-100 text-green-800" },
      rejected: { text: "Từ chối", color: "bg-red-100 text-red-800" },
    };
    return (
      badges[status] || { text: status, color: "bg-gray-100 text-gray-800" }
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Đăng ký đưa đón</h1>
          <button
            onClick={() => navigate("/student")}
            className="text-green-600 font-medium hover:underline"
          >
            ← Quay lại
          </button>
        </div>

        {/* FORM CARD */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Thêm người đưa đón mới{" "}
            <span className="text-sm text-gray-500">(Tối đa 3 người)</span>
          </h2>

          {/* Học sinh */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1">Học sinh</label>
            <input
              type="text"
              value={
                children.find((c) => c._id === form.studentId)?.fullName ||
                "Đang tải..."
              }
              disabled
              className="w-full border rounded-md px-3 py-2 bg-gray-100"
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Họ tên */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Họ tên người đưa đón *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>

              {/* Mối quan hệ */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mối quan hệ *
                  <span className="text-xs text-gray-400 ml-1">
                    ({form.relation.length}/50)
                  </span>
                </label>
                <input
                  type="text"
                  name="relation"
                  value={form.relation}
                  onChange={handleChange}
                  maxLength={50}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>

              {/* SĐT */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>

              {/* Ảnh */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ảnh (tùy chọn)
                </label>

                {previewUrl ? (
                  <div className="relative w-32 h-40 border rounded-md overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    className="w-full text-sm"
                  />
                )}
              </div>
            </div>

            {/* Button */}
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-md text-white font-medium bg-green-600 hover:bg-green-700"
              >
                {editingId ? "Cập nhật" : "Gửi đăng ký"}
              </button>
            </div>
          </form>
        </div>

        {/* LIST CARD */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Danh sách đã đăng ký ({pickupRequests.length}/3)
          </h3>

          {pickupRequests.length === 0 ? (
            <p className="text-gray-500">Chưa có đăng ký nào.</p>
          ) : (
            <div className="space-y-4">
              {pickupRequests.map((req) => {
                const badge = getStatusBadge(req.status);
                return (
                  <div
                    key={req._id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                        {req.imageUrl && (
                          <img
                            src={req.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold">{req.fullName}</p>
                        <p className="text-sm text-gray-500">
                          {req.relation} | {req.phone}
                        </p>
                      </div>
                    </div>

                    {/* PHẦN BÊN PHẢI */}
                    <div className="flex items-center gap-3">
                      {/* ICON ACTIONS - trước trạng thái */}
                      {req.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(req)}
                            className="p-2 rounded-md hover:bg-blue-50 text-blue-600 transition transform hover:scale-110"
                            title="Chỉnh sửa"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(req._id)}
                            className="p-2 rounded-md hover:bg-red-50 text-red-600 transition transform hover:scale-110"
                            title="Hủy đăng ký"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}

                      {/* BADGE TRẠNG THÁI */}
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${badge.color}`}
                      >
                        {badge.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {deleteId && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-96 p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold mb-3">Xác nhận hủy đăng ký</h3>

            <p className="text-gray-600 mb-6">
              Bạn có chắc muốn hủy người đưa đón này không?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-md border hover:bg-gray-100"
              >
                Hủy
              </button>

              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PickupRegistration;
