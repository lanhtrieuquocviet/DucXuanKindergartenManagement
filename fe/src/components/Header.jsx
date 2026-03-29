import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, ENDPOINTS } from "../service/api";
import LeftNav from "./LeftNav";
import RightNav from "./RightNav";

const CLOSE_DELAY = 300; // 30 tích tắc
const FALLBACK_BANNERS = [
    "https://scontent.fhan18-1.fna.fbcdn.net/v/t39.30808-6/618702160_1461727552619714_6463649032824992629_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=7b2446&_nc_ohc=8UXWgBpzLxMQ7kNvwFsL2cd&_nc_oc=Adn2GokDE7vW5jDYFVhEl_A53mJ7nAlgyDGYyPr8OGuGVg9YN_oKx-ccfJ9rZUkXBgc&_nc_zt=23&_nc_ht=scontent.fhan18-1.fna&_nc_gid=WI4fgCQc9CPNue1S1l_lfQ&_nc_ss=8&oh=00_AfznI0DF0gohfCHL4Qg33uKR3Xx9Kty4YmKoH1Ktob_Qew&oe=69AEDF05",
    "https://scontent.fhan18-1.fna.fbcdn.net/v/t39.30808-6/605784091_1450941177031685_6354221922736986229_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=7b2446&_nc_ohc=Qp6WlASTTo4Q7kNvwGzxwyj&_nc_oc=AdmOk6t9GPWsJ-T7vZbkB2-5s99RtYwZn1_2mSICMFA9y9uXx3xw8_LrVXyyw4hjJnc&_nc_zt=23&_nc_ht=scontent.fhan18-1.fna&_nc_gid=Y9vLx29hQie4KSWmrMHBoQ&_nc_ss=8&oh=00_AfxDbY9JZvb3B2QwMZYeqYpCO2V3r9gsbZbUjKKIgouhvQ&oe=69AEE281",
    "https://scontent.fhan18-1.fna.fbcdn.net/v/t39.30808-6/499477487_1247164254076046_8931851791991323309_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=2a1932&_nc_ohc=6lJx5z9dK8YQ7kNvwGY3aZJ&_nc_oc=AdlHBCPQgn8gdJnHiZaW9oiNn8F9PHdjGKD_4P0dqaY0Fz2sLihiSN3d4RIlbOUEc2g&_nc_zt=23&_nc_ht=scontent.fhan18-1.fna&_nc_gid=qKaxPIWOGGOZBr5Ax9LlPA&_nc_ss=8&oh=00_AfxiCUy42tIEH9To5fdvdqqWM9u6KXVLalRAFbxNwkqFLQ&oe=69AEF39A",
];

function Header() {
    const timerRef = useRef(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

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

    // map known category names to specific internal routes
    const NEWS_ROUTE_MAP = {
        'Bản tin trường': '/school-news',
        'Thông báo': '/notifications-news',
        'Tin tức từ Phòng': '/department-news',
        'Thông báo từ Phòng': '/department-notifications',
        'Hoạt động ngoại khóa': '/extracurricular-activities',
    };

    const [newsCategories, setNewsCategories] = useState([]);
    // search state
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [banners, setBanners] = useState(FALLBACK_BANNERS);
    const [currentBanner, setCurrentBanner] = useState(0);
    const searchTimerRef = useRef(null);
    const searchContainerRef = useRef(null);
    const navigate = useNavigate();

    const handleQueryChange = (value) => {
        setQuery(value);
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
            searchTimerRef.current = null;
        }

        if (!value || value.trim().length < 2) {
            setResults([]);
            return;
        }

        // debounce
        searchTimerRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const resp = await get(
                    `${ENDPOINTS.BLOGS.PUBLISHED}?search=${encodeURIComponent(value.trim())}&limit=5`,
                    { includeAuth: false }
                );
                const items = resp.data?.items || [];
                setResults(items);
                setShowResults(true);
            } catch (err) {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    };

    // close results when clicking outside
    useEffect(() => {
        const onDocClick = (e) => {
            if (!searchContainerRef.current) return;
            if (!searchContainerRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    useEffect(() => {
        const loadCats = async () => {
            try {
                const resp = await get('/blogs/categories');
                const list = resp.data || resp;
                setNewsCategories(list);
            } catch (err) {
                console.error('Failed to load news categories', err);
            }
        };
        loadCats();
    }, []);

    useEffect(() => {
        const loadBanners = async () => {
            try {
                const resp = await get(ENDPOINTS.BANNERS.HOMEPAGE, { includeAuth: false });
                const list = resp?.data?.banners || [];
                const urls = list.map((item) => item?.imageUrl).filter(Boolean);
                setBanners(urls);
            } catch {
                setBanners(FALLBACK_BANNERS);
            }
        };
        loadBanners();
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return undefined;
        const id = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(id);
    }, [banners.length]);

    useEffect(() => {
        if (currentBanner >= banners.length) {
            setCurrentBanner(0);
        }
    }, [banners.length, currentBanner]);

    return (
        <header className="w-full bg-green-50">
            <div className="bg-gradient-to-r from-green-600 to-green-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
                    {/* Mobile menu button */}
                    <button
                        type="button"
                        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                        aria-label="Mở menu"
                        onClick={() => setMobileOpen(true)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                            <line x1="4" y1="6" x2="20" y2="6" />
                            <line x1="4" y1="12" x2="20" y2="12" />
                            <line x1="4" y1="18" x2="20" y2="18" />
                        </svg>
                    </button>

                    <div className="hidden xl:flex items-center gap-2 shrink-0 min-w-[215px]">
                        <img
                            src="https://i.pinimg.com/736x/be/c5/3c/bec53c7b30f46d9ad2cecdb48c5e1e1f.jpg"
                            alt="Logo trường"
                            className="w-11 h-11 rounded-full border-2 border-white object-cover shadow-sm"
                        />
                        <div className="leading-tight text-white">
                            <div className="text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap opacity-95">
                                Ủy ban nhân dân phường Đức Xuân
                            </div>
                            <div className="text-[14px] font-extrabold uppercase whitespace-nowrap">
                                Trường mầm non Đức Xuân
                            </div>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-1 text-[14px] font-semibold text-white flex-1 min-w-0">

                        <a href="/" className="px-3 py-2 rounded-full hover:bg-white hover:text-green-600 whitespace-nowrap transition-colors">
                            Trang chủ
                        </a>

                        {/* ===== THÔNG TIN CÔNG KHAI ===== */}
                        <div
                            className="relative"
                            onMouseEnter={() => openMenu("public")}
                            onMouseLeave={closeMenu}
                        >
                            <div className="px-3 py-2 rounded-full hover:bg-white hover:text-green-600 cursor-pointer whitespace-nowrap transition-colors">
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
                            <div className="px-3 py-2 rounded-full hover:bg-white hover:text-green-600 cursor-pointer whitespace-nowrap transition-colors">
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
                            <div className="px-3 py-2 rounded-full hover:bg-white hover:text-green-600 cursor-pointer whitespace-nowrap transition-colors">
                                Tin tức
                            </div>

                            {activeMenu === "news" && (
                                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl min-w-[220px] z-50 text-gray-800">
                                    {newsCategories.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-gray-500">Đang tải...</div>
                                    ) : (
                                        newsCategories.map((c) => {
                                            const route = NEWS_ROUTE_MAP[c.name] || "/";
                                            return (
                                                <a key={c._id} href={route}>
                                                    <div className="px-4 py-3 hover:bg-green-100">
                                                        {c.name}
                                                    </div>
                                                </a>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ===== VĂN BẢN ===== */}
                        <div
                            className="relative"
                            onMouseEnter={() => openMenu("docs")}
                            onMouseLeave={closeMenu}
                        >
                            <div className="px-3 py-2 rounded-full hover:bg-white hover:text-green-600 cursor-pointer whitespace-nowrap transition-colors">
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
                            <div className="px-3 py-2 rounded-full hover:bg-white hover:text-green-600 cursor-pointer whitespace-nowrap transition-colors">
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

                        <a href="/contact" className="px-3 py-2 rounded-full hover:bg-white hover:text-green-600 whitespace-nowrap transition-colors">Liên hệ</a>
                        <a href="/qa" className="px-3 py-2 rounded-full hover:bg-white hover:text-green-600 whitespace-nowrap transition-colors">Hỏi đáp</a>
                    </nav>
                    {/* ===== SEARCH + LOGIN ===== */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 md:flex-none justify-end">
                        <div className="relative flex-1 max-w-[420px] md:flex-none" ref={searchContainerRef}>
                            <div className="flex items-center bg-white rounded-full px-2 py-1.5 text-sm shadow w-full">
                                <input
                                    className="outline-none text-gray-700 w-full md:w-32 px-3"
                                    placeholder="Tìm kiếm..."
                                    value={query}
                                    onChange={(e) => handleQueryChange(e.target.value)}
                                    onFocus={() => { if (results.length > 0) setShowResults(true); }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const q = query.trim();
                                            if (q.length >= 2) {
                                                navigate(`/search?q=${encodeURIComponent(q)}`);
                                                setShowResults(false);
                                            }
                                        }
                                    }}
                                />

                                <button
                                    type="button"
                                    aria-label="Tìm"
                                    onClick={() => {
                                        const q = query.trim();
                                        if (q.length >= 2) {
                                            navigate(`/search?q=${encodeURIComponent(q)}`);
                                            setShowResults(false);
                                        }
                                    }}
                                    className="ml-2 mr-2 p-2 rounded-full hover:bg-gray-100 text-gray-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                        <circle cx="11" cy="11" r="7" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </button>
                            </div>

                            {showResults && (
                                <div className="absolute right-0 mt-2 w-full md:w-[320px] bg-white rounded-xl shadow-xl z-50 text-gray-800">
                                    {loading ? (
                                        <div className="px-4 py-3 text-sm text-gray-500">Đang tìm...</div>
                                    ) : results.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-gray-500">Không có kết quả</div>
                                    ) : (
                                        results.map((r) => {
                                            const route = NEWS_ROUTE_MAP[r.category?.name] || "/";
                                            return (
                                                <a key={r._id} href={route} onClick={() => setShowResults(false)}>
                                                    <div className="px-4 py-3 hover:bg-green-100">
                                                        <div className="font-medium">{r.code || r.title || 'Không tên'}</div>
                                                        <div className="text-sm text-gray-600 line-clamp-2">{r.description}</div>
                                                    </div>
                                                </a>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                        <a href="/login">
                            <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 sm:px-5 py-2 rounded-full transition whitespace-nowrap shadow-sm">
                                Đăng nhập
                            </button>
                        </a>
                    </div>

                </div>

            </div>

            {/* ===== BANNER ===== */}
            <div className="relative h-[220px] sm:h-[220px] md:h-[330px] m-3 sm:m-4 rounded-xl overflow-hidden">
                {banners.length > 0 ? (
                    <img
                        src={banners[currentBanner]}
                        alt="Banner"
                        className="w-full h-full object-cover object-center"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/90 text-sm bg-green-700">
                        Chưa có banner hiển thị
                    </div>
                )}
                {banners.length > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-2 flex gap-2">
                        {banners.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setCurrentBanner(i)}
                                className={`w-2.5 h-2.5 rounded-full transition ${currentBanner === i ? "bg-green-600" : "bg-green-200"}`}
                                aria-label={`Ảnh ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ===== MOBILE MENU OVERLAY (Header + Left/Right nav) ===== */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[9999] md:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        aria-label="Đóng menu"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="absolute left-0 top-0 bottom-0 w-[86%] max-w-[360px] bg-white shadow-2xl overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                            <div className="font-semibold text-gray-800">Menu</div>
                            <button
                                type="button"
                                className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100"
                                aria-label="Đóng"
                                onClick={() => setMobileOpen(false)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="px-4 py-3 space-y-2">
                            <a href="/" className="block px-3 py-2 rounded-lg hover:bg-green-50 text-gray-800" onClick={() => setMobileOpen(false)}>Trang chủ</a>
                            <a href="/public-information" className="block px-3 py-2 rounded-lg hover:bg-green-50 text-gray-800" onClick={() => setMobileOpen(false)}>Thông tin công khai</a>
                            <a href="/introduce-school" className="block px-3 py-2 rounded-lg hover:bg-green-50 text-gray-800" onClick={() => setMobileOpen(false)}>Giới thiệu trường</a>
                            <a href="/school-news" className="block px-3 py-2 rounded-lg hover:bg-green-50 text-gray-800" onClick={() => setMobileOpen(false)}>Tin tức</a>
                            <a href="/legal-documents" className="block px-3 py-2 rounded-lg hover:bg-green-50 text-gray-800" onClick={() => setMobileOpen(false)}>Văn bản</a>
                            <a href="/photo-gallery" className="block px-3 py-2 rounded-lg hover:bg-green-50 text-gray-800" onClick={() => setMobileOpen(false)}>Thư viện</a>
                            <a href="/contact" className="block px-3 py-2 rounded-lg hover:bg-green-50 text-gray-800" onClick={() => setMobileOpen(false)}>Liên hệ</a>
                            <a href="/qa" className="block px-3 py-2 rounded-lg hover:bg-green-50 text-gray-800" onClick={() => setMobileOpen(false)}>Hỏi đáp</a>
                        </div>

                        <div className="px-4 pb-6 space-y-6">
                            <div>
                                <div className="text-xs font-semibold text-gray-500 mb-2">Danh mục</div>
                                <div className="rounded-xl border border-gray-200 bg-gray-50">
                                    <LeftNav />
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-gray-500 mb-2">Thông tin</div>
                                <div className="rounded-xl border border-gray-200 bg-gray-50">
                                    <RightNav />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;

