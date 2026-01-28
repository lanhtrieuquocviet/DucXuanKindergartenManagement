function Contact() {
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
          Cảm ơn quý khách đã gửi ý kiến. Chúng tôi sẽ phản hồi
          trong thời gian sớm nhất!
        </p>
      </div>

      {/* ===== RIGHT: FORM ===== */}
      <div className="border rounded-lg p-6 shadow bg-white">
        <h2 className="font-bold mb-4">
          Hoặc gửi liên hệ cho chúng tôi theo mẫu dưới đây:
        </h2>

        <form className="space-y-4">
          <Input label="Họ và tên *" />
          <Input label="Địa chỉ" />
          <Input label="Số điện thoại *" />
          <Input label="Thư điện tử *" />
          
          <div>
            <label className="text-sm font-medium">Nội dung liên hệ *</label>
            <textarea
              rows="4"
              className="w-full border rounded px-3 py-2 mt-1 focus:outline-green-500"
            />
          </div>

          {/* Captcha giả */}
          <div className="flex items-center gap-3">
            <div className="border px-4 py-2 font-mono bg-gray-100">
              WQ7Z
            </div>
            <input
              placeholder="Mã bảo mật"
              className="border rounded px-3 py-2 w-32"
            />
          </div>

          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold"
          >
            Gửi liên hệ
          </button>
        </form>
      </div>
    </div>
  );
}

const Input = ({ label }) => (
  <div>
    <label className="text-sm font-medium">{label}</label>
    <input
      className="w-full border rounded px-3 py-2 mt-1 focus:outline-green-500"
    />
  </div>
);

export default Contact;
