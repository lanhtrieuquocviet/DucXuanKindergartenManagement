import { useEffect, useState } from "react";

export default function AskQuestionModal({ open, onClose }) {
  const [captcha, setCaptcha] = useState("");

  useEffect(() => {
    if (open) generateCaptcha();
  }, [open]);

  const generateCaptcha = () => {
    const text = Math.random().toString(36).substring(2, 6).toUpperCase();
    setCaptcha(text);
  };

  if (!open) return null;

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
          <input className="w-full border rounded px-3 py-2" placeholder="Tiêu đề *" />
          <input className="w-full border rounded px-3 py-2" placeholder="Email" />
          <input className="w-full border rounded px-3 py-2" placeholder="Số điện thoại" />
          <input className="w-full border rounded px-3 py-2" placeholder="Địa chỉ" />
          <input className="w-full border rounded px-3 py-2" placeholder="Số CMND (Hộ chiếu)" />
          <select className="w-full border rounded px-3 py-2 bg-white">
            <option value="">-- Loại phản hồi --</option>
            <option value="gop-y">Hỏi đáp</option>
          </select>

          <textarea
            rows={4}
            className="w-full border rounded px-3 py-2"
            placeholder="Nội dung"
          />

          {/* Captcha */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-gray-200 font-mono tracking-widest rounded">
              {captcha}
            </div>
            <button
              onClick={generateCaptcha}
              className="text-blue-600 text-lg"
              title="Đổi mã"
            >
              🔄
            </button>
            <input
              placeholder="Mã xác nhận"
              className="border rounded px-3 py-2 w-40"
            />
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" className="mt-1" />
            <span>
              Tôi đồng ý với các điều kiện trên
            </span>
          </label>

          {/* Buttons */}
          <div className="flex justify-center gap-4 pt-3">
            <button className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
              Đăng
            </button>
            <button
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
