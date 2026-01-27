function Header() {
    return (
        <header className="w-full bg-green-50">
            {/* ===== MENU ===== */}
            <div className="bg-gradient-to-r from-green-600 to-green-500">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

                    {/* ===== NAV LEFT ===== */}
                    <nav className="flex gap-2 text-sm font-semibold text-white">
                        {/* Trang chủ */}
                        <div className="px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-green-600 transition">
                            Trang chủ
                        </div>

                        {/* Thông tin công khai */}
                        <div className="relative group">
                            <div className="px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-green-600 transition">
                                Thông tin công khai
                            </div>

                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-white text-gray-800 rounded-xl shadow-xl min-w-[220px] z-50">
                                {[
                                    "Thông tin chung về cơ sở giáo dục",
                                    "Công khai thu chi tài chính",
                                    "Điều kiện đảm bảo chất lượng hoạt động giáo dục",
                                    "Kế hoạch và kết quả hoạt động giáo dục",
                                    "Báo cáo thường niên",
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="px-4 py-3 hover:bg-green-100 cursor-pointer"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ===== GIỚI THIỆU – DROPDOWN 2 CẤP (STYLE NHẸ) ===== */}
                        <div className="relative group">
                            <div className="px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-green-600 transition">
                                Giới thiệu
                            </div>

                            {/* Dropdown cấp 1 */}
                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block
                  bg-white text-gray-800 rounded-xl shadow-lg
                  min-w-[260px] z-50 border">

                                {[
                                    "Giới thiệu trường",
                                    "Đội ngũ giáo viên",
                                    "Cơ sở vật chất",
                                    "Lịch học tập",
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="px-4 py-3 cursor-pointer
                   hover:bg-green-50 hover:text-green-700
                   transition"
                                    >
                                        {item}
                                    </div>
                                ))}

                                {/* Cơ cấu tổ chức */}
                                <div className="relative group/sub">
                                    <div
                                        className="px-4 py-3 cursor-pointer flex justify-between items-center
                   hover:bg-green-50 hover:text-green-700 transition"
                                    >
                                        Cơ cấu tổ chức
                                        <span className="text-sm">›</span>
                                    </div>

                                    {/* Dropdown cấp 2 */}
                                    <div className="absolute top-0 left-full ml-1 hidden group-hover/sub:block
                      bg-white text-gray-800 rounded-xl shadow-lg
                      min-w-[260px] border">
                                        {[
                                            "Ban Giám hiệu",
                                            "Tổ Chuyên môn",
                                            "Tổ Hành chính - Văn phòng",
                                            "Hội Thường trực PHHS",
                                        ].map((item) => (
                                            <div
                                                key={item}
                                                className="px-4 py-3 cursor-pointer
                       hover:bg-green-50 hover:text-green-700
                       transition"
                                            >
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tin tức */}
                        <div className="relative group">
                            <div className="px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-green-600 transition">
                                Tin tức
                            </div>

                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-white text-gray-800 rounded-xl shadow-xl min-w-[220px] z-50">
                                {[
                                    "Bản tin trường",
                                    "Thông báo",
                                    "Tin tức từ Phòng",
                                    "Thông báo từ Phòng",
                                    "Hoạt động ngoại khóa",
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="px-4 py-3 hover:bg-green-100 cursor-pointer"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Văn bản */}
                        <div className="relative group">
                            <div className="px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-green-600 transition">
                                Văn bản
                            </div>

                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-white text-gray-800 rounded-xl shadow-xl min-w-[220px] z-50">
                                {[
                                    "Văn bản pháp quy",
                                    "Văn bản từ Phòng",
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="px-4 py-3 hover:bg-green-100 cursor-pointer"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Thư viện */}
                        <div className="relative group">
                            <div className="px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-green-600 transition">
                                Thư viện
                            </div>

                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-white text-gray-800 rounded-xl shadow-xl min-w-[220px] z-50">
                                {[
                                    "Học trực tuyến",
                                    "Chương trình tuần",
                                    "Thực đơn tuần",
                                    "Thư viện ảnh",
                                    "Video Clip",
                                    "Tài liệu",
                                    "Thời khóa biểu",
                                    "Giáo án điện tử",
                                    "Chia sẻ kinh nghiệm",
                                    "Điều cần biết",
                                    "Thơ văn - nhạc",
                                    "Thư giãn",
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="px-4 py-3 hover:bg-green-100 cursor-pointer"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Các menu thường */}
                        {["Liên hệ", "Hỏi đáp"].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-green-600 transition"
                                >
                                    {item}
                                </div>
                            )
                        )}
                    </nav>

                    {/* ===== SEARCH + LOGIN ===== */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white rounded-full px-4 py-2 text-sm shadow">
                            <input
                                className="outline-none text-gray-700 w-36"
                                placeholder="Tìm kiếm..."
                            />
                            <span className="ml-2">🔍</span>
                        </div>
                        <a href="/login">
                            <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-full transition">
                                Đăng nhập
                            </button>
                        </a>
                    </div>
                </div>
            </div>

            {/* ===== BANNER (GIỮ NGUYÊN) ===== */}
            <div className="relative h-[200px] m-4 rounded-xl overflow-hidden">
                <img
                    src="https://mnducxuanbk.thainguyen.edu.vn/upload/47910/20250714/Anh_nen_banner_1_6186c.jpg"
                    alt="Banner"
                    className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 flex items-center px-8">
                    <img
                        src="https://i.pinimg.com/736x/be/c5/3c/bec53c7b30f46d9ad2cecdb48c5e1e1f.jpg"
                        alt="Logo"
                        className="w-[90px] h-[90px] rounded-full mr-4 border-4 border-white"
                    />

                    <div className="max-w-xl">
                        <div className="text-red-600 font-bold mb-1">
                            ỦY BAN NHÂN DÂN PHƯỜNG ĐỨC XUÂN
                        </div>
                        <div className="text-blue-700 text-2xl font-extrabold">
                            TRƯỜNG MẦM NON ĐỨC XUÂN
                        </div>
                        <p className="text-black">Điện thoại: 0869550151</p>
                        <p className="text-black">
                            Địa chỉ: Phường Đức Xuân, tỉnh Thái Nguyên
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
