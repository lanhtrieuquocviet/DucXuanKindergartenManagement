import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { get, post, postFormData, ENDPOINTS, del, put } from "../../service/api";
import { Pencil, Trash2, Plus } from "lucide-react";

function PickupRegistration() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();
  const [children, setChildren] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Thêm state để quản lý việc nhập "Khác"
  const [isOtherRelation, setIsOtherRelation] = useState(false);

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
    fetchChildren();
    fetchMyPickupRequests();
  }, [isInitializing, user, navigate]);

  const fetchChildren = async () => {
    try {
      const res = await get(ENDPOINTS.AUTH.MY_CHILDREN);
      const list = res.data || [];
      setChildren(list);
      if (list.length > 0) {
        setForm((prev) => ({ ...prev, studentId: list[0]._id }));
      }
    } catch (err) {
      setError("Không tải được thông tin học sinh.");
    }
  };

  const fetchMyPickupRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await get(ENDPOINTS.PICKUP.MY_REQUESTS || "/pickup/my-requests");
      setPickupRequests(res.data || []);
    } catch (err) {
      console.error(err);
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
        setPreviewUrl(URL.createObjectURL(file));
      }
    } 
    // Validate Họ tên tối đa 50 ký tự
    else if (name === "fullName") {
      if (value.length <= 50) {
        setForm((prev) => ({ ...prev, [name]: value }));
      }
    }
    // Validate Số điện thoại: Chỉ số và tối đa 11 số
    else if (name === "phone") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      if (onlyNums.length <= 11) {
        setForm((prev) => ({ ...prev, [name]: onlyNums }));
      }
    } 
    // Xử lý logic chọn "Khác" cho mối quan hệ
    else if (name === "relation") {
      // Nếu đang nhập custom relation (isOtherRelation = true), chỉ cập nhật giá trị
      if (isOtherRelation) {
        setForm((prev) => ({ ...prev, relation: value }));
      } else if (value === "Other") {
        // Nếu chọn "Khác" từ dropdown
        setIsOtherRelation(true);
        setForm((prev) => ({ ...prev, relation: "" })); // Reset để người dùng nhập mới
      } else {
        // Chọn mối quan hệ tiêu chuẩn từ dropdown
        setIsOtherRelation(false);
        setForm((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      // Validate required fields
      if (!form.fullName.trim()) {
        throw new Error("Vui lòng nhập họ tên người đón");
      }
      if (!form.phone.trim()) {
        throw new Error("Vui lòng nhập số điện thoại");
      }
      if (!form.relation.trim()) {
        throw new Error("Vui lòng nhập mối quan hệ");
      }
      // Image validation: require image for both creating and updating
      if (!form.imageFile) {
        throw new Error("Vui lòng chọn ảnh để đăng ký hoặc cập nhật thông tin");
      }

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

      if (editingId) {
        await put(ENDPOINTS.PICKUP.UPDATE(editingId), payload);
        setSuccess("Cập nhật thành công!");
      } else {
        if (pickupRequests.length >= 3) {
          throw new Error("Mỗi học sinh tối đa 3 người đưa đón");
        }
        await post(ENDPOINTS.PICKUP.CREATE, payload);
        setSuccess("Đăng ký thành công!");
      }

      // Reset Form
      setEditingId(null);
      setIsOtherRelation(false);
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

  const handleEdit = (req) => {
    setEditingId(req._id);
    const standardRelations = ["Bố", "Mẹ", "Ông", "Bà", "Anh/Chị"];
    const isOther = !standardRelations.includes(req.relation);
    
    setIsOtherRelation(isOther);
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

  const confirmDelete = async () => {
    try {
      await del(ENDPOINTS.PICKUP.DELETE(deleteId));
      setSuccess("Đã hủy đăng ký thành công");
      fetchMyPickupRequests();
    } catch (err) { setError(err.message); } finally { setDeleteId(null); }
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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý đưa đón</h1>
          <button onClick={() => navigate("/student")} className="text-emerald-600 font-medium">← Quay lại</button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Plus size={20} className="text-emerald-500" />
            {editingId ? "Cập nhật thông tin" : "Đăng ký người đưa đón mới"}
          </h2>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm border border-green-100">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Họ tên */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex justify-between">
                  Họ tên người đón * <span>{form.fullName.length}/50</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              {/* SĐT */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại *</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              {/* Mối quan hệ */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mối quan hệ *</label>
                {!isOtherRelation ? (
                  <select
                    name="relation"
                    value={form.relation}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  >
                    <option value="">-- Chọn mối quan hệ --</option>
                    <option value="Bố">Bố</option>
                    <option value="Mẹ">Mẹ</option>
                    <option value="Ông">Ông</option>
                    <option value="Bà">Bà</option>
                    <option value="Anh/Chị">Anh/Chị</option>
                    <option value="Other">Khác</option>
                  </select>
                ) : (
                  <div className="flex gap-2 animate-fadeIn">
                    <input
                      type="text"
                      name="relation"
                      value={form.relation}
                      onChange={handleChange}
                      placeholder="Nhập mối quan hệ khác (vd: Dì, Chú, Hàng xóm...)"
                      className="flex-1 border border-emerald-500 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                      autoFocus
                      maxLength="30"
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsOtherRelation(false);
                        setForm((prev) => ({ ...prev, relation: "" }));
                      }}
                      className="text-xs text-gray-400 hover:text-red-500 whitespace-nowrap font-medium"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>

              {/* Ảnh - Bắt buộc khi thêm mới */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-colors relative">
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
                    <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-xl shadow-md" />
                  ) : (
                    <div className="w-16 h-16 flex flex-col items-center justify-center bg-gray-100 rounded-full">
                      <Plus className="text-gray-400" />
                      <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Ảnh{!editingId && ' *'}</span>
                    </div>
                  )}
                </label>
                {previewUrl && (
                  <button 
                    type="button" 
                    onClick={() => {setPreviewUrl(null); setForm({...form, imageFile: null})}}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center hover:bg-red-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setIsOtherRelation(false);
                    setForm({ studentId: children[0]?._id, fullName: "", relation: "", phone: "", imageFile: null });
                    setPreviewUrl(null);
                  }}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-600 hover:bg-gray-50"
                >Hủy sửa</button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:bg-gray-300"
              >
                {submitting ? "Đang xử lý..." : editingId ? "Cập nhật thông tin" : "Gửi đăng ký ngay"}
              </button>
            </div>
          </form>
        </div>

        {/* Danh sách - Hiển thị 3/3 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-lg">Người đưa đón đã đăng ký</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {pickupRequests.map((req) => {
              const badge = getStatusBadge(req.status);
              return (
                <div key={req._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                      {req.imageUrl ? <img src={req.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">👤</div>}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{req.fullName}</p>
                      <p className="text-xs text-gray-500">{req.relation} • {req.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {req.status === "pending" && (
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(req)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={18} /></button>
                        <button onClick={() => setDeleteId(req._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </div>
                    )}
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full ${badge.color}`}>{badge.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal xóa - Giữ nguyên */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scaleUp">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa?</h3>
            <p className="text-gray-500 text-sm mb-6">Hành động này không thể hoàn tác. Người đưa đón này sẽ bị xóa khỏi danh sách.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-600">Hủy</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700">Xóa ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PickupRegistration;