import { useState, useRef } from "react";

const CLOSE_DELAY = 300; // 30 tích tắc

function Header() {
    const timerRef = useRef(null);
    const [activeMenu, setActiveMenu] = useState(null);

    const openMenu = (menuKey) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setActiveMenu(menuKey); // tắt menu cũ, mở menu mới
    };

    const closeMenu = () => {
        timerRef.current = setTimeout(() => {
            setActiveMenu(null);
        }, CLOSE_DELAY);
    };

    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1];

    return (
        <header className="w-full bg-green-50">
            <div className="bg-gradient-to-r from-green-600 to-green-500">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                    <nav className="flex gap-2 text-sm font-semibold text-white">

                        <a href="/" className="px-4 py-2 rounded-full hover:bg-white hover:text-green-600">
                            Trang chủ
                        </a>

                        {/* ===== THÔNG TIN CÔNG KHAI ===== */}
                        <div
                            className="relative"
                            onMouseEnter={() => openMenu("public")}
                            onMouseLeave={closeMenu}
                        >
                            <div className="px-4 py-2 rounded-full hover:bg-white hover:text-green-600 cursor-pointer">
                                Thông tin công khai
                            </div>

                            {activeMenu === "public" && (
                                <div className="absolute top-full left-0 mt-2 bg-white text-gray-800 rounded-xl shadow-xl min-w-[260px] z-50">
                                    <a href="/public-information">
                                        <div className="px-4 py-3 hover:bg-green-100 font-medium">
                                            Thông tin chung về cơ sở giáo dục
                                        </div>
                                    </a>

                                    {[
                                        { label: "Công khai thu chi tài chính", slug: "financial-disclosure" },
                                        { label: "Điều kiện đảm bảo chất lượng hoạt động giáo dục", slug: "education-quality" },
                                        { label: "Kế hoạch và kết quả hoạt động giáo dục", slug: "education-plan-result" },
                                        { label: "Báo cáo thường niên", slug: "annual-report" },
                                    ].map((item) => (
                                        <div key={item.slug} className="relative group">
                                            <div className="px-4 py-3 hover:bg-green-100 flex justify-between cursor-pointer">
                                                {item.label}
                                                <span>▶</span>
                                            </div>

                                            <div className="absolute top-0 left-full ml-1 hidden group-hover:block bg-white rounded-xl shadow-xl min-w-[140px]">
                                                {years.map((y) => (
                                                    <a
                                                        key={y}
                                                        href={`/public-information/${item.slug}/${y}`}
                                                    >
                                                        <div className="px-4 py-3 hover:bg-green-100">
                                                            Năm {y}
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ===== GIỚI THIỆU ===== */}
                        <div
                            className="relative"
                            onMouseEnter={() => openMenu("intro")}
                            onMouseLeave={closeMenu}
                        >
                            <div className="px-4 py-2 rounded-full hover:bg-white hover:text-green-600 cursor-pointer">
                                Giới thiệu
                            </div>

                            {activeMenu === "intro" && (
                                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg min-w-[260px] z-50 text-gray-800">
                                    <a href="/introduce-school"><div className="px-4 py-3 hover:bg-green-100">Giới thiệu trường</div></a>
                                    <a href="/teacher-team"><div className="px-4 py-3 hover:bg-green-100">Đội ngũ giáo viên</div></a>
                                    <a href="/facilities"><div className="px-4 py-3 hover:bg-green-100">Cơ sở vật chất</div></a>
                                    <a href="/study-schedule"><div className="px-4 py-3 hover:bg-green-100">Lịch học tập</div></a>

                                    <div className="relative group">
                                        <div className="px-4 py-3 hover:bg-green-50 flex justify-between cursor-pointer">
                                            Cơ cấu tổ chức
                                            <span>▶</span>
                                        </div>

                                        <div className="absolute top-0 left-full ml-1 hidden group-hover:block bg-white rounded-xl shadow-lg min-w-[260px]">
                                            <a href="/board-of-directors"><div className="px-4 py-3 hover:bg-green-100">Ban giám hiệu</div></a>
                                            <a href="/professional-group"><div className="px-4 py-3 hover:bg-green-100">Tổ Chuyên môn</div></a>
                                            <a href="/administrative-staff"><div className="px-4 py-3 hover:bg-green-100">Tổ Hành chính - Văn phòng</div></a>
                                            <a href="/parent-council"><div className="px-4 py-3 hover:bg-green-100">Hội Thường trực PHHS</div></a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ===== TIN TỨC ===== */}
                        <div
                            className="relative"
                            onMouseEnter={() => openMenu("news")}
                            onMouseLeave={closeMenu}
                        >
                            <div className="px-4 py-2 rounded-full hover:bg-white hover:text-green-600 cursor-pointer">
                                Tin tức
                            </div>

                            {activeMenu === "news" && (
                                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl min-w-[220px] z-50 text-gray-800">
                                    <a href="/school-news"><div className="px-4 py-3 hover:bg-green-100">Bản tin trường</div></a>
                                    <a href="/notifications-news"><div className="px-4 py-3 hover:bg-green-100">Thông báo</div></a>
                                    <a href="/department-news"><div className="px-4 py-3 hover:bg-green-100">Tin tức từ Phòng</div></a>
                                    <a href="/department-notifications"><div className="px-4 py-3 hover:bg-green-100">Thông báo từ Phòng</div></a>
                                    <a href="/extracurricular-activities"><div className="px-4 py-3 hover:bg-green-100">Hoạt động ngoại khóa</div></a>
                                </div>
                            )}
                        </div>

                        {/* ===== VĂN BẢN ===== */}
                        <div
                            className="relative"
                            onMouseEnter={() => openMenu("docs")}
                            onMouseLeave={closeMenu}
                        >
                            <div className="px-4 py-2 rounded-full hover:bg-white hover:text-green-600 cursor-pointer">
                                Văn bản
                            </div>

                            {activeMenu === "docs" && (
                                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl min-w-[220px] z-50 text-gray-800">
                                    <a href="/legal-documents"><div className="px-4 py-3 hover:bg-green-100">Văn bản pháp quy</div></a>
                                    <a href="/department-documents"><div className="px-4 py-3 hover:bg-green-100">Văn bản từ Phòng</div></a>
                                </div>
                            )}
                        </div>

                        {/* ===== THƯ VIỆN ===== */}
                        <div
                            className="relative"
                            onMouseEnter={() => openMenu("library")}
                            onMouseLeave={closeMenu}
                        >
                            <div className="px-4 py-2 rounded-full hover:bg-white hover:text-green-600 cursor-pointer">
                                Thư viện
                            </div>

                            {activeMenu === "library" && (
                                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl min-w-[220px] z-50 text-gray-800">
                                    <a href="https://k12online.vn/" target="_blank" rel="noreferrer"><div className="px-4 py-3 hover:bg-green-100">Học trực tuyến</div></a>
                                    <a href="/weekly-program"><div className="px-4 py-3 hover:bg-green-100">Chương trình tuần</div></a>
                                    <a href="/weekly-menu"><div className="px-4 py-3 hover:bg-green-100">Thực đơn tuần</div></a>
                                    <a href="/photo-gallery"><div className="px-4 py-3 hover:bg-green-100">Thư viện ảnh</div></a>
                                    <a href="/video-gallery"><div className="px-4 py-3 hover:bg-green-100">Video clip</div></a>
                                    <a href="/document-library"><div className="px-4 py-3 hover:bg-green-100">Tài liệu</div></a>
                                    <a href="/schedule"><div className="px-4 py-3 hover:bg-green-100">Thời khóa biểu</div></a>
                                    <a href="/lesson-plan"><div className="px-4 py-3 hover:bg-green-100">Giáo án điện tử</div></a>
                                    <a href="/experience-sharing"><div className="px-4 py-3 hover:bg-green-100">Chia sẻ kinh nghiệm</div></a>
                                    <a href="/things-to-know"><div className="px-4 py-3 hover:bg-green-100">Điều cần biết</div></a>
                                    <a href="/poetry-music"><div className="px-4 py-3 hover:bg-green-100">Thơ văn - nhạc</div></a>
                                    <a href="/relax-page"><div className="px-4 py-3 hover:bg-green-100">Thư giãn</div></a>
                                </div>
                            )}
                        </div>

                        <a href="/contact" className="px-4 py-2 rounded-full hover:bg-white hover:text-green-600">Liên hệ</a>
                        <a href="/qa" className="px-4 py-2 rounded-full hover:bg-white hover:text-green-600">Hỏi đáp</a>
                    </nav>
                    {/* ===== SEARCH + LOGIN ===== */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white rounded-full px-4 py-2 text-sm shadow">
                            <input
                                className="outline-none text-gray-700 w-36"
                                placeholder="Tìm kiếm..."
                            /> 
                        </div>
                        <a href="/login">
                            <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-full transition">
                                Đăng nhập
                            </button>
                        </a>
                    </div>

                </div>

            </div>

            {/* ===== BANNER ===== */}
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

