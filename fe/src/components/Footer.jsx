function Footer() {
  return (
    <footer className="w-full mt-10">
      {/* Background */}
      <div className="relative h-[180px] w-full overflow-hidden">
        <img
          src="https://webmamnon.wordpress.com/wp-content/uploads/2013/08/cropped-banner.png"
          alt="Footer background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-green-900/20 text-gray-900">
          <div className="max-w-7xl mx-auto h-full px-6 py-4 flex flex-col justify-between">
            
            {/* ===== MENU ===== */}
            <div className="flex flex-wrap gap-6 text-sm font-semibold">
              {[
                "Trang chủ",
                "Thông tin công khai",
                "Giới thiệu",
                "Tin tức",
                "Văn bản",
                "Thư viện",
                "Hỏi đáp",
                "Liên hệ",
              ].map((item) => (
                <span
                  key={item}
                  className="cursor-pointer hover:text-green-700 transition"
                >
                  {item}
                </span>
              ))}
            </div>

            {/* ===== CONTENT ===== */}
            <div className="flex justify-between items-center flex-wrap gap-6">
              
              {/* LEFT */}
              <div className="flex items-center gap-4">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgJSe-7VrwJQ7Pfb5oTd81kxK72xSG4VGh0g&s"
                  alt="Logo"
                  className="w-20 h-20 rounded-full border-4 border-white bg-white"
                />

                <div className="font-bold text-lg">
                  Trường Mầm non Đức Xuân
                </div>
              </div>

              {/* RIGHT */}
              <div className="text-sm text-right leading-relaxed">
                <div>Địa chỉ: Tổ 9B, phường Đức Xuân, tỉnh Thái Nguyên</div>
                <div>Điện thoại: 0869550151</div>
                <div>Email: cddcuxuan_pgdtbackan@backan.edu.vn</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="bg-green-700 text-white text-center text-sm py-2">
        © {new Date().getFullYear()} Trường Mầm non Đức Xuân
      </div>
    </footer>
  );
}

export default Footer;
