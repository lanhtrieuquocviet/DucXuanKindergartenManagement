function Header() {
    return (
        <header className="w-full bg-green-50">
            {/* ===== MENU ===== */}
            <div className="bg-gradient-to-r from-green-600 to-green-500">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

                    {/* ===== NAV LEFT ===== */}
                    <nav className="flex gap-2 text-sm font-semibold text-white">
                        {/* Trang chủ */}
                        <a href="/">
                            <div className="px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-green-600 transition">
                                Trang chủ
                            </div>
                        </a>

                        {/* Thông tin công khai */}
                        <div className="relative group">
                            <div className="px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-green-600 transition">
                                Thông tin công khai
                            </div>

                            {/* Dropdown cấp 1 */}
                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-white text-gray-800 rounded-xl shadow-xl min-w-[260px] z-50">
                                {/* Link thông tin chung */}
                                <a href="/public-information">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer font-medium">
                                        Thông tin chung về cơ sở giáo dục
                                    </div>
                                </a>

                                {[
                                    {
                                        label: "Công khai thu chi tài chính",
                                        slug: "financial-disclosure",
                                    },
                                    {
                                        label: "Điều kiện đảm bảo chất lượng hoạt động giáo dục",
                                        slug: "education-quality",
                                    },
                                    {
                                        label: "Kế hoạch và kết quả hoạt động giáo dục",
                                        slug: "education-plan-result",
                                    },
                                    {
                                        label: "Báo cáo thường niên",
                                        slug: "annual-report",
                                    },
                                ].map((item) => {
                                    const currentYear = new Date().getFullYear();
                                    const years = [currentYear, currentYear - 1];

                                    return (
                                        <div
                                            key={item.slug}
                                            className="relative group/sub"
                                        >
                                            {/* Item cấp 1 */}
                                            <div className="px-4 py-3 hover:bg-green-100 cursor-pointer flex justify-between items-center">
                                                <span>{item.label}</span>
                                                <span className="text-xs">▶</span>
                                            </div>

                                            {/* Dropdown cấp 2 (năm) */}
                                            <div className="absolute top-0 left-full ml-1 hidden group-hover/sub:block bg-white rounded-xl shadow-xl min-w-[120px] z-50">
                                                {years.map((year) => (
                                                    <a
                                                        key={year}
                                                        href={`/public-information/${item.slug}/${year}`}
                                                    >
                                                        <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                                            Năm {year}
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
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
                                <a href="/introduce-school">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Giới thiệu trường
                                    </div>
                                </a>
                                <a href="/teacher-team">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Đội ngũ giáo viên
                                    </div>
                                </a>

                                <a href="/facilities">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Cơ sở vật chất
                                    </div>
                                </a>

                                <a href="/study-schedule">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Lịch học tập
                                    </div>
                                </a>


                                {/* Cơ cấu tổ chức */}
                                <div className="relative group/sub">
                                    <div
                                        className="px-4 py-3 cursor-pointer flex justify-between items-center
                   hover:bg-green-50 hover:text-green-700 transition"
                                    >
                                        Cơ cấu tổ chức
                                        <span className="text-sm">▶</span>
                                    </div>

                                    {/* Dropdown cấp 2 */}
                                    <div className="absolute top-0 left-full ml-1 hidden group-hover/sub:block
                      bg-white text-gray-800 rounded-xl shadow-lg
                      min-w-[260px] border">
                                        <a href="/board-of-directors">
                                            <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                                Ban giám hiệu
                                            </div>
                                        </a>
                                        <a href="/professional-group">
                                            <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                                Tổ Chuyên môn
                                            </div>
                                        </a>
                                        <a href="/administrative-staff">
                                            <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                                Tổ Hành chính - Văn phòng
                                            </div>
                                        </a>
                                        <a href="/parent-council">
                                            <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                                Hội Thường trực PHHS
                                            </div>
                                        </a>
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
                                <a href="/school-news">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Bản tin trường
                                    </div>
                                </a>
                                <a href="/notifications-news">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Thông báo
                                    </div>
                                </a>
                                <a href="/department-news">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Tin tức từ Phòng
                                    </div>
                                </a>
                                <a href="/department-notifications">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Thông báo từ Phòng
                                    </div>
                                </a>
                                <a href="/extracurricular-activities">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Hoạt động ngoại khóa
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Văn bản */}
                        <div className="relative group">
                            <div className="px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-green-600 transition">
                                Văn bản
                            </div>

                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-white text-gray-800 rounded-xl shadow-xl min-w-[220px] z-50">
                                <a href="/legal-documents">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Văn bản pháp quy
                                    </div>
                                </a>
                                <a href="/department-documents">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Văn bản từ Phòng
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Thư viện */}
                        <div className="relative group">
                            <div className="px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-green-600 transition">
                                Thư viện
                            </div>

                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-white text-gray-800 rounded-xl shadow-xl min-w-[220px] z-50">
                                <a
                                    href="https://k12online.vn/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Học trực tuyến
                                    </div>
                                </a>

                                <a href="/weekly-program">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Trương chình tuần
                                    </div>
                                </a>

                                <a href="/weekly-menu">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Thực đơn tuần
                                    </div>
                                </a>

                                <a href="/photo-gallery">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Thư viện ảnh
                                    </div>
                                </a>

                                <a href="/video-gallery">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Video clip
                                    </div>
                                </a>

                                <a href="/document-library">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Tài liệu
                                    </div>
                                </a>

                                <a href="/schedule">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Thời khóa biểu
                                    </div>
                                </a>

                                <a href="/lesson-plan">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Giáo án điện tử
                                    </div>
                                </a>

                                <a href="/experience-sharing">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Chia sẻ kinh nghiệm
                                    </div>
                                </a>

                                <a href="/things-to-know">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Điều cần biết
                                    </div>
                                </a>

                                <a href="/poetry-music">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Thơ văn - nhạc
                                    </div>
                                </a>

                                <a href="/relax-page">
                                    <div className="px-4 py-3 hover:bg-green-100 cursor-pointer">
                                        Thư giãn
                                    </div>
                                </a>
                            </div>
                        </div>
                        {/* Các menu thường */}
                        <a href="/contact">
                            <div className="px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-green-600 transition">
                                Liên hệ
                            </div>
                        </a>

                        <a href="/qa">
                            <div className="px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-green-600 transition">
                                Hỏi đáp
                            </div>
                        </a>

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
