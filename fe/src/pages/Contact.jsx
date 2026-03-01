import { useState } from "react";
import Captcha from "../components/Captcha";
import { post, ENDPOINTS } from "../service/api";

const initialForm = {
  fullName: "",
  address: "",
  phone: "",
  email: "",
  content: "",
};

const initialErrors = {
  fullName: "",
  address: "",
  phone: "",
  email: "",
  content: "",
};

function validateForm(values) {
  const err = { ...initialErrors };
  if (!values.fullName?.trim()) err.fullName = "Họ và tên không được để trống";
  else if (values.fullName.length > 40) err.fullName = "Họ và tên tối đa 40 ký tự";
  if (values.address?.length > 100) err.address = "Địa chỉ tối đa 100 ký tự";
  if (!values.phone?.trim()) err.phone = "Số điện thoại không được để trống";
  else if (!/^[0-9+\-\s()]{10}$/.test(values.phone.trim())) err.phone = "Số điện thoại không hợp lệ (10 ký tự số)";
  if (!values.email?.trim()) err.email = "Thư điện tử không được để trống";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) err.email = "Thư điện tử không đúng định dạng";
  if (!values.content?.trim()) err.content = "Nội dung liên hệ không được để trống";
  else if (values.content.length > 2000) err.content = "Nội dung tối đa 2000 ký tự";
  return err;
}

function Contact() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: null });

  const handleCaptchaValidate = (valid) => {
    setCaptchaValid(valid);
    if (valid) setCaptchaError(false);
  };

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setMessage({ type: null, text: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm(form);
    setErrors(err);
    const hasError = Object.values(err).some(Boolean);
    if (hasError) return;
    if (!captchaValid) {
      setCaptchaError(true);
      setMessage({ type: "error", text: "Vui lòng nhập đúng mã bảo mật để gửi liên hệ." });
      return;
    }

    setLoading(true);
    setMessage({ type: null, text: null });
    try {
      await post(ENDPOINTS.CONTACT.SUBMIT, {
        fullName: form.fullName.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        content: form.content.trim(),
      }, { includeAuth: false });
      setMessage({ type: "success", text: "Gửi liên hệ thành công. Chúng tôi sẽ phản hồi trong thời gian sớm nhất!" });
      setForm(initialForm);
      setCaptchaValid(false);
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Gửi liên hệ thất bại. Vui lòng thử lại.";
      const backendErrors = err?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length) {
        const next = { ...initialErrors };
        backendErrors.forEach(({ field, message: m }) => {
          if (field in next) next[field] = m;
        });
        setErrors(next);
      }
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* ===== LEFT: THÔNG TIN LIÊN HỆ ===== */}
      <div className="border rounded-lg p-6 shadow bg-white">
        <h2 className="font-bold text-lg mb-4 bg-gray-200 px-3 py-2 rounded">
          Thông tin liên hệ
        </h2>
        <p className="font-semibold mb-2">Liên hệ trực tiếp:</p>
        <p className="font-bold">Trường Mầm non Đức Xuân</p>
        <p className="mt-2 text-sm leading-relaxed">
          Địa chỉ: Tổ 9B, phường Đức Xuân, tỉnh Thái Nguyên <br />
          Điện thoại: 0869550151 <br />
          Email: cddcuxuan_pgdtbackan@backan.edu.vn
        </p>
        <p className="mt-3 text-sm italic">
          Cảm ơn quý khách đã gửi ý kiến. Chúng tôi sẽ phản hồi trong thời gian sớm nhất!
        </p>
      </div>

      {/* ===== RIGHT: FORM ===== */}
      <div className="border rounded-lg p-6 shadow bg-white">
        <h2 className="font-bold mb-4">
          Hoặc gửi liên hệ cho chúng tôi theo mẫu dưới đây:
        </h2>

        {message.text && (
          <div
            className={`mb-4 rounded-md px-4 py-2 text-sm ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Họ và tên *"
            name="fullName"
            value={form.fullName}
            onChange={(v) => setField("fullName", v)}
            error={errors.fullName}
          />
          <Input
            label="Địa chỉ"
            name="address"
            value={form.address}
            onChange={(v) => setField("address", v)}
            error={errors.address}
          />
          <Input
            label="Số điện thoại *"
            name="phone"
            value={form.phone}
            onChange={(v) => setField("phone", v)}
            error={errors.phone}
          />
          <Input
            label="Thư điện tử (Email) *"
            name="email"
            type="email"
            value={form.email}
            onChange={(v) => setField("email", v)}
            error={errors.email}
          />

          <div>
            <label className="text-sm font-medium">Nội dung liên hệ *</label>
            <textarea
              name="content"
              rows="4"
              value={form.content}
              onChange={(e) => setField("content", e.target.value)}
              className={`w-full border rounded px-3 py-2 mt-1 focus:outline-green-500 ${
                errors.content ? "border-red-500" : ""
              }`}
            />
            {errors.content && (
              <p className="text-red-600 text-xs mt-1">{errors.content}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Mã bảo mật *</label>
            <Captcha onValidate={handleCaptchaValidate} />
            {captchaError && (
              <p className="text-red-600 text-xs mt-1">Vui lòng nhập đúng mã bảo mật.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white transition ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Đang gửi..." : "Gửi liên hệ"}
          </button>
        </form>
      </div>
    </div>
  );
}

const Input = ({ label, name, value, onChange, error, type = "text" }) => (
  <div>
    <label className="text-sm font-medium">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border rounded px-3 py-2 mt-1 focus:outline-green-500 ${
        error ? "border-red-500" : ""
      }`}
    />
    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
  </div>
);

export default Contact;
