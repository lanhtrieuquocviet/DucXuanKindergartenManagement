function Footer() {
  return (
    <footer className="w-full mt-10 relative overflow-hidden">
      {/* Background */}
      <div className="relative h-[180px] w-full bg-green-600">

        {/* Overlay */}
        <div className="absolute inset-0 bg-green-900/20 text-gray-900">
          <div className="max-w-7xl mx-auto h-full px-6 py-4 flex flex-col justify-between">

            {/* ===== MENU ===== */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold items-center">

              {[
                { label: "Trang chủ", link: "/" },
                { label: "Thông tin công khai", link: "/public-information" },
                { label: "Giới thiệu", link: "/introduce-school" },
                { label: "Tin tức", link: "/school-news" },
                { label: "Văn bản", link: "/legal-documents" },
                { label: "Thư viện", link: "/photo-gallery" },
                { label: "Liên hệ", link: "/contact" },
                // { label: "Hỏi đáp", link: "/qa" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.link}
                  className="
                    h-[32px]
                    flex items-center
                    px-2
                    leading-[32px]
                    text-white
                    hover:text-green-900
                    transition-colors
                    duration-200
                  "
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* ===== CONTENT ===== */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center flex-wrap gap-4 sm:gap-6">

              {/* LEFT */}
              <div className="flex items-center gap-4">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgJSe-7VrwJQ7Pfb5oTd81kxK72xSG4VGh0g&s"
                  alt="Logo"
                  className="w-20 h-20 rounded-full border-4 border-white bg-white"
                />

                <div className="font-bold text-lg text-white">
                  Trường Mầm non Đức Xuân
                </div>
              </div>

              {/* RIGHT */}
              <div className="text-sm sm:text-right leading-relaxed text-white">
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
