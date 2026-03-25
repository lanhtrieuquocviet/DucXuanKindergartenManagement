import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { get, post, postFormData, ENDPOINTS, del, put } from "../../service/api";
import { ArrowLeft, Pencil, Trash2, Plus, Camera, X, UserCheck, Phone, Users } from "lucide-react";

function PickupRegistration() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();
  const [children, setChildren] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isOtherRelation, setIsOtherRelation] = useState(false);
  const [form, setForm] = useState({ studentId: "", fullName: "", relation: "", phone: "", imageFile: null });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    fetchChildren();
    fetchMyPickupRequests();
  }, [isInitializing, user, navigate]);

  const fetchChildren = async () => {
    try {
      const res = await get(ENDPOINTS.AUTH.MY_CHILDREN);
      const list = res.data || [];
      setChildren(list);
      if (list.length > 0) setForm((prev) => ({ ...prev, studentId: list[0]._id }));
    } catch { setError("Không tải được thông tin học sinh."); }
  };

  const fetchMyPickupRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await get(ENDPOINTS.PICKUP.MY_REQUESTS || "/pickup/my-requests");
      setPickupRequests(res.data || []);
    } catch (err) { console.error(err); } finally { setLoadingRequests(false); }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files?.[0];
      if (file) { setForm((prev) => ({ ...prev, imageFile: file })); setPreviewUrl(URL.createObjectURL(file)); }
    } else if (name === "fullName") {
      if (value.length <= 50) setForm((prev) => ({ ...prev, [name]: value }));
    } else if (name === "phone") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      if (onlyNums.length <= 10) setForm((prev) => ({ ...prev, [name]: onlyNums }));
    } else if (name === "relation") {
      if (isOtherRelation) { setForm((prev) => ({ ...prev, relation: value })); }
      else if (value === "Other") { setIsOtherRelation(true); setForm((prev) => ({ ...prev, relation: "" })); }
      else { setIsOtherRelation(false); setForm((prev) => ({ ...prev, [name]: value })); }
    } else { setForm((prev) => ({ ...prev, [name]: value })); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      if (!form.fullName.trim()) throw new Error("Vui lòng nhập họ tên người đón");
      if (!form.phone.trim()) throw new Error("Vui lòng nhập số điện thoại");
      const phonePattern = /^0[35789]\d{8}$/;
      if (!phonePattern.test(form.phone.trim())) throw new Error("Số điện thoại không hợp lệ.");
      if (!form.relation.trim()) throw new Error("Vui lòng nhập mối quan hệ");
      if (!form.imageFile) throw new Error("Vui lòng chọn ảnh để đăng ký");
      let imageUrl = "";
      if (form.imageFile) {
        const formData = new FormData();
        formData.append("avatar", form.imageFile);
        const uploadRes = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_AVATAR, formData);
        imageUrl = uploadRes?.data?.url || "";
      }
      const payload = { studentId: form.studentId, fullName: form.fullName.trim(), relation: form.relation.trim(), phone: form.phone.trim(), imageUrl };
      if (editingId) {
        await put(ENDPOINTS.PICKUP.UPDATE(editingId), payload);
        setSuccess("Cập nhật thành công!");
      } else {
        if (pickupRequests.length >= 5) throw new Error("Mỗi học sinh tối đa 5 người đưa đón");
        await post(ENDPOINTS.PICKUP.CREATE, payload);
        setSuccess("Đăng ký thành công!");
      }
      setEditingId(null); setIsOtherRelation(false);
      setForm({ studentId: children[0]?._id || "", fullName: "", relation: "", phone: "", imageFile: null });
      setPreviewUrl(null);
      fetchMyPickupRequests();
    } catch (err) { setError(err.message || "Thao tác thất bại"); } finally { setSubmitting(false); }
  };

  const handleEdit = (req) => {
    setEditingId(req._id);
    const standardRelations = ["Bố", "Mẹ", "Ông", "Bà", "Anh/Chị"];
    setIsOtherRelation(!standardRelations.includes(req.relation));
    setForm({ studentId: req.student?._id || form.studentId, fullName: req.fullName, relation: req.relation, phone: req.phone, imageFile: null });
    setPreviewUrl(req.imageUrl || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async () => {
    try { await del(ENDPOINTS.PICKUP.DELETE(deleteId)); setSuccess("Đã hủy đăng ký thành công"); fetchMyPickupRequests(); }
    catch (err) { setError(err.message); } finally { setDeleteId(null); }
  };

  const getStatusConfig = (status) => {
    const map = {
      pending:  { text: "Chờ duyệt", bg: "#fefce8", color: "#92400e", dot: "#f59e0b" },
      approved: { text: "Đã duyệt",  bg: "#ecfdf5", color: "#065f46", dot: "#10b981" },
      rejected: { text: "Từ chối",   bg: "#fef2f2", color: "#7f1d1d", dot: "#ef4444" },
    };
    return map[status] || { text: status, bg: "#f8fafc", color: "#475569", dot: "#94a3b8" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-emerald-600 text-white shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate("/student")} className="p-2 -ml-2 rounded-full active:bg-emerald-500 transition">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-base font-bold">Quản lý đưa đón</h1>
            <p className="text-emerald-200 text-xs">{pickupRequests.length}/5 người đã đăng ký</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Plus size={15} className="text-emerald-600" />
            </div>
            <h2 className="font-bold text-gray-800 text-sm">
              {editingId ? "Cập nhật thông tin người đón" : "Đăng ký người đưa đón mới"}
            </h2>
          </div>

          <div className="p-4">
            {error && (
              <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-start gap-2">
                <span className="text-base">⚠️</span> {error}
              </div>
            )}
            {success && (
              <div className="mb-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100 flex items-start gap-2">
                <span className="text-base">✅</span> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo upload - full width, prominent */}
              <div className="flex justify-center">
                <div className="relative">
                  <input type="file" name="image" id="pickup-image" accept="image/*" onChange={handleChange} className="hidden" />
                  <label htmlFor="pickup-image" className="cursor-pointer block">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-emerald-300 bg-emerald-50 flex items-center justify-center active:opacity-80 transition">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-emerald-400">
                          <Camera size={24} />
                          <span className="text-[10px] font-bold uppercase">Ảnh{!editingId && ' *'}</span>
                        </div>
                      )}
                    </div>
                  </label>
                  {previewUrl && (
                    <button type="button" onClick={() => { setPreviewUrl(null); setForm({ ...form, imageFile: null }); }}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Họ tên */}
              <div>
                <label className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                  Họ tên người đón <span className="font-normal text-gray-400">{form.fullName.length}/50</span>
                </label>
                <div className="relative">
                  <UserCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Nhập họ và tên" required
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50" />
                </div>
              </div>

              {/* SĐT */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="0xxxxxxxxx" maxLength="10" required
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50" />
                </div>
              </div>

              {/* Mối quan hệ */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mối quan hệ</label>
                <div className="relative">
                  <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  {!isOtherRelation ? (
                    <select name="relation" value={form.relation} onChange={handleChange} required
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none">
                      <option value="">-- Chọn mối quan hệ --</option>
                      {["Bố","Mẹ","Ông","Bà","Anh/Chị"].map(r => <option key={r} value={r}>{r}</option>)}
                      <option value="Other">Khác...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" name="relation" value={form.relation} onChange={handleChange} placeholder="Vd: Dì, Chú, Hàng xóm..." autoFocus maxLength="30"
                        className="flex-1 border border-emerald-400 rounded-xl pl-9 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50" />
                      <button type="button" onClick={() => { setIsOtherRelation(false); setForm(p => ({ ...p, relation: "" })); }}
                        className="px-3 py-2 text-xs text-red-500 font-semibold bg-red-50 rounded-xl border border-red-100">Hủy</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setIsOtherRelation(false); setForm({ studentId: children[0]?._id, fullName: "", relation: "", phone: "", imageFile: null }); setPreviewUrl(null); setError(""); setSuccess(""); }}
                    className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold text-gray-600 text-sm active:bg-gray-50 transition">
                    Hủy sửa
                  </button>
                )}
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm active:bg-emerald-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm">
                  {submitting ? "Đang xử lý..." : editingId ? "Cập nhật" : "Đăng ký ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danh sách */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">Người đưa đón đã đăng ký</h3>
          </div>

          {loadingRequests ? (
            <div className="p-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pickupRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-3xl mb-2">👤</div>
              <p className="text-sm">Chưa có người đưa đón nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pickupRequests.map((req) => {
                const cfg = getStatusConfig(req.status);
                return (
                  <div key={req._id} className="p-4 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0">
                      {req.imageUrl
                        ? <img src={req.imageUrl} className="w-full h-full object-cover" alt={req.fullName} />
                        : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl">👤</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm leading-tight truncate">{req.fullName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{req.relation} · {req.phone}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold mt-1 px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                        {cfg.text}
                      </span>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => handleEdit(req)} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl active:bg-blue-100 transition"><Pencil size={16} /></button>
                        <button onClick={() => setDeleteId(req._id)} className="p-2.5 text-red-600 bg-red-50 rounded-xl active:bg-red-100 transition"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Xác nhận xóa?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">Người đưa đón này sẽ bị xóa khỏi danh sách và không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-gray-300 font-bold text-gray-600 text-sm active:bg-gray-50 transition">Hủy</button>
              <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm active:bg-red-700 transition">Xóa ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PickupRegistration;
