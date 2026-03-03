import { useState, useEffect } from "react";
import Captcha from "../../components/Captcha";
import { post, ENDPOINTS } from "../../service/api";

const initialForm = {
  title: "",
  email: "",
  phone: "",
  address: "",
  idNumber: "",
  category: "",
  content: "",
};

const initialErrors = {
  title: "",
  email: "",
  phone: "",
  address: "",
  idNumber: "",
  category: "",
  content: "",
};

function validate(values, agreed) {
  const errors = { ...initialErrors };

  if (!values.title.trim()) {
    errors.title = "Tiêu đề không được để trống";
  } else if (values.title.length > 200) {
    errors.title = "Tiêu đề tối đa 200 ký tự";
  }

  if (!values.email.trim()) {
    errors.email = "Email không được để trống";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email.trim())) {
      errors.email = "Email không hợp lệ";
    }
  }

  if (!values.phone.trim()) {
    errors.phone = "Số điện thoại không được để trống";
  } else if (!/^[0-9+\-\s()]{6,20}$/.test(values.phone.trim())) {
    errors.phone = "Số điện thoại không hợp lệ";
  }

  if (!values.address.trim()) {
    errors.address = "Địa chỉ không được để trống";
  } else if (values.address.length > 200) {
    errors.address = "Địa chỉ tối đa 200 ký tự";
  }

  if (!values.idNumber.trim()) {
    errors.idNumber = "Số CMND/Hộ chiếu không được để trống";
  } else if (values.idNumber.length > 50) {
    errors.idNumber = "Số CMND/Hộ chiếu tối đa 50 ký tự";
  }

  if (!values.category.trim()) {
    errors.category = "Vui lòng chọn loại phản hồi";
  }

  if (!values.content.trim()) {
    errors.content = "Nội dung không được để trống";
  } else if (values.content.length > 2000) {
    errors.content = "Nội dung tối đa 2000 ký tự";
  }

  if (!agreed) {
    errors.agreed = "Bạn phải đồng ý với điều khoản";
  }

  return errors;
}

export default function AskQuestionModal({ open, onClose, onSubmitted }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setErrors(initialErrors);
      setCaptchaValid(false);
      setCaptchaError(false);
      setMessage(null);
      setAgreed(false);
    }
  }, [open]);

  if (!open) return null;

  const handleCaptchaValidate = (valid) => {
    setCaptchaValid(valid);
    if (valid) setCaptchaError(false);
  };

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setMessage(null);
  };

  const handleSubmit = async () => {
    const vErrors = validate(form, agreed);
    setErrors(vErrors);
    const hasError = Object.values(vErrors).some(Boolean);
    if (hasError) return;
    if (!captchaValid) {
      setCaptchaError(true);
      setMessage("Vui lòng nhập đúng mã bảo mật để gửi câu hỏi.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      const payload = {
        title: form.title.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        idNumber: form.idNumber.trim() || undefined,
        category: form.category.trim() || undefined,
        content: form.content.trim(),
      };
      const res = await post(ENDPOINTS.QA.QUESTIONS, payload, { includeAuth: false });
      if (onSubmitted) {
        onSubmitted(res.data);
      }
      setForm(initialForm);
      setCaptchaValid(false);
      setMessage("Gửi câu hỏi thành công.");
      onClose();
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Gửi câu hỏi thất bại. Vui lòng thử lại.";
      const backendErrors = err?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length) {
        const next = { ...initialErrors };
        backendErrors.forEach(({ field, message: m }) => {
          if (field in next) next[field] = m;
        });
        setErrors(next);
      }
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[520px] rounded-lg shadow-lg relative">
        {/* Header */}
        <div className="border-b px-5 py-3 font-semibold text-center">
          GỬI THÔNG TIN HỎI ĐÁP
          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-3 text-sm">
          {message && (
            <div className="mb-2 text-xs text-red-600">
              {message}
            </div>
          )}

          <div>
            <input
              className={`w-full border rounded px-3 py-2 ${errors.title ? "border-red-500" : ""}`}
              placeholder="Tiêu đề *"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
            />
            {errors.title && <p className="text-red-600 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <input
              className={`w-full border rounded px-3 py-2 ${errors.email ? "border-red-500" : ""}`}
              placeholder="Email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <input
              className={`w-full border rounded px-3 py-2 ${errors.phone ? "border-red-500" : ""}`}
              placeholder="Số điện thoại"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
            {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <input
              className={`w-full border rounded px-3 py-2 ${errors.address ? "border-red-500" : ""}`}
              placeholder="Địa chỉ"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
            />
            {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address}</p>}
          </div>

          <div>
            <input
              className={`w-full border rounded px-3 py-2 ${errors.idNumber ? "border-red-500" : ""}`}
              placeholder="Số CMND (Hộ chiếu)"
              value={form.idNumber}
              onChange={(e) => setField("idNumber", e.target.value)}
            />
            {errors.idNumber && <p className="text-red-600 text-xs mt-1">{errors.idNumber}</p>}
          </div>

          <div>
            <select
              className={`w-full border rounded px-3 py-2 bg-white ${errors.category ? "border-red-500" : ""}`}
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
            >
              <option value="">-- Loại phản hồi --</option>
              <option value="hoi-dap">Hỏi đáp</option>
            </select>
            {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category}</p>}
          </div>

          <div>
            <textarea
              rows={4}
              className={`w-full border rounded px-3 py-2 ${errors.content ? "border-red-500" : ""}`}
              placeholder="Nội dung *"
              value={form.content}
              onChange={(e) => setField("content", e.target.value)}
            />
            {errors.content && <p className="text-red-600 text-xs mt-1">{errors.content}</p>}
          </div>

          {/* Captcha giống trang Contact */}
          <div>
            <label className="text-xs font-medium block mb-1">Mã bảo mật *</label>
            <Captcha onValidate={handleCaptchaValidate} />
            {captchaError && (
              <p className="text-red-600 text-xs mt-1">
                Vui lòng nhập đúng mã bảo mật.
              </p>
            )}
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
            />
            <span>
              Tôi đồng ý với các điều kiện trên
            </span>
          </label>
          {errors.agreed && (
            <p className="text-red-600 text-xs mt-1">
              {errors.agreed}
            </p>
          )}

          {/* Buttons */}
          <div className="flex justify-center gap-4 pt-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Đang gửi..." : "Đăng"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
            >
              Xóa nội dung
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
