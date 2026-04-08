import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, ENDPOINTS } from "../service/api";
import LeftNav from "./LeftNav";
import RightNav from "./RightNav";

const CLOSE_DELAY = 300; // 30 tích tắc

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
    const [organizationGroups, setOrganizationGroups] = useState([]);
    // search state
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
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
        const loadOrganization = async () => {
            try {
                const resp = await get(ENDPOINTS.PUBLIC_INFO.ORGANIZATION_STRUCTURE, { includeAuth: false });
                const data = resp?.data || {};
                const groups = [
                    { key: 'boardOfDirectors', label: 'Ban giám hiệu', route: '/board-of-directors' },
                    { key: 'professionalGroup', label: 'Tổ Chuyên môn', route: '/professional-group' },
                    { key: 'administrativeGroup', label: 'Tổ Hành chính - Văn phòng', route: '/administrative-staff' },
                    { key: 'parentCouncil', label: 'Hội Thường trực PHHS', route: '/parent-council' },
                ].map((item) => ({
                    ...item,
                    members: Array.isArray(data?.[item.key]?.members)
                        ? data[item.key].members.map((m) => (typeof m === 'string' ? { fullName: m } : m))
                        : [],
                }));
                setOrganizationGroups(groups);
            } catch (err) {
                console.error('Failed to load organization structure', err);
                setOrganizationGroups([]);
            }
        };
        loadOrganization();
    }, []);

    return (
        <header className="w-full bg-green-50">
            <div className="bg-gradient-to-r from-green-700 to-green-500">
                {/* ===== HÀNG TRÊN: Logo + Search + Login ===== */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
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

                    {/* Logo */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <img
                            src="https://i.pinimg.com/736x/be/c5/3c/bec53c7b30f46d9ad2cecdb48c5e1e1f.jpg"
                            alt="Logo trường"
                            className="w-12 h-12 rounded-full border-2 border-white object-cover shadow"
                        />
                        <div className="leading-tight text-white hidden sm:block">
                            <div className="text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap opacity-90">
                                Ủy ban nhân dân phường Đức Xuân
                            </div>
                            <div className="text-[15px] font-extrabold uppercase whitespace-nowrap tracking-wide">
                                Trường mầm non Đức Xuân
                            </div>
                        </div>
                    </div>

                    {/* Search + Login */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative" ref={searchContainerRef}>
                            <div className="flex items-center bg-white rounded-full px-3 py-1.5 text-sm shadow w-[160px] sm:w-[200px] lg:w-[240px]">
                                <input
                                    className="outline-none text-gray-700 w-full bg-transparent"
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
                                    className="ml-1 p-1 rounded-full hover:bg-gray-100 text-gray-500 shrink-0"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                        <circle cx="11" cy="11" r="7" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </button>
                            </div>

                            {showResults && (
                                <div className="absolute right-0 mt-2 w-[320px] bg-white rounded-xl shadow-xl z-50 text-gray-800">
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
                            <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 sm:px-5 py-2 rounded-full transition whitespace-nowrap shadow-sm text-sm">
                                Đăng nhập
                            </button>
                        </a>
                    </div>
                </div>

                {/* ===== HÀNG DƯỚI: Navigation ===== */}
                <div className="hidden md:block border-t border-white/20">
                    <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-evenly text-[13px] font-semibold text-white">

                        <a href="/" className="px-3 py-2.5 hover:bg-white/15 whitespace-nowrap transition-colors rounded">
                            Trang chủ
                        </a>

                        {/* ===== THÔNG TIN CÔNG KHAI ===== */}
                        <div className="relative" onMouseEnter={() => openMenu("public")} onMouseLeave={closeMenu}>
                            <div className="px-3 py-2.5 hover:bg-white/15 cursor-pointer whitespace-nowrap transition-colors rounded flex items-center gap-1">
                                Thông tin công khai
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-3 h-3 transition-transform duration-200 ${activeMenu === "public" ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            {activeMenu === "public" && (
                                <div className="absolute top-full left-0 mt-1 bg-white text-gray-800 rounded-xl shadow-xl min-w-[260px] z-50">
                                    <a href="/public-information"><div className="px-4 py-3 hover:bg-green-100 font-medium rounded-t-xl">Thông tin chung về cơ sở giáo dục</div></a>
                                    {[
                                        { label: "Công khai thu chi tài chính", slug: "financial-disclosure" },
                                        { label: "Điều kiện đảm bảo chất lượng hoạt động giáo dục", slug: "education-quality" },
                                        { label: "Kế hoạch và kết quả hoạt động giáo dục", slug: "education-plan-result" },
                                        { label: "Báo cáo thường niên", slug: "annual-report" },
                                    ].map((item) => (
                                        <div key={item.slug} className="relative group">
                                            <div className="px-4 py-3 hover:bg-green-100 flex justify-between cursor-pointer">
                                                {item.label}
                                                <span className="text-gray-400 ml-2">▶</span>
                                            </div>
                                            <div className="absolute top-0 left-full ml-1 hidden group-hover:block bg-white rounded-xl shadow-xl min-w-[140px] z-50">
                                                {years.map((y) => (
                                                    <a key={y} href={`/public-information/${item.slug}/${y}`}>
                                                        <div className="px-4 py-3 hover:bg-green-100">Năm {y}</div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ===== GIỚI THIỆU ===== */}
                        <div className="relative" onMouseEnter={() => openMenu("intro")} onMouseLeave={closeMenu}>
                            <div className="px-3 py-2.5 hover:bg-white/15 cursor-pointer whitespace-nowrap transition-colors rounded flex items-center gap-1">
                                Giới thiệu
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-3 h-3 transition-transform duration-200 ${activeMenu === "intro" ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            {activeMenu === "intro" && (
                                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl min-w-[240px] z-50 text-gray-800">
                                    <a href="/introduce-school"><div className="px-4 py-3 hover:bg-green-100 rounded-t-xl">Giới thiệu trường</div></a>
                                    <a href="/teacher-team"><div className="px-4 py-3 hover:bg-green-100">Đội ngũ giáo viên</div></a>
                                    <a href="/facilities"><div className="px-4 py-3 hover:bg-green-100">Cơ sở vật chất</div></a>
                                    <a href="/study-schedule"><div className="px-4 py-3 hover:bg-green-100">Lịch học tập</div></a>
                                    <div className="relative group">
                                        <div className="px-4 py-3 hover:bg-green-50 flex justify-between cursor-pointer">
                                            Cơ cấu tổ chức
                                            <span className="text-gray-400">▶</span>
                                        </div>
                                        <div className="absolute top-0 left-full ml-1 hidden group-hover:block bg-white rounded-xl shadow-xl min-w-[300px] z-50">
                                            {(organizationGroups.length > 0 ? organizationGroups : [
                                                { key: 'boardOfDirectors', label: 'Ban giám hiệu', route: '/board-of-directors', members: [] },
                                                { key: 'professionalGroup', label: 'Tổ Chuyên môn', route: '/professional-group', members: [] },
                                                { key: 'administrativeGroup', label: 'Tổ Hành chính - Văn phòng', route: '/administrative-staff', members: [] },
                                                { key: 'parentCouncil', label: 'Hội Thường trực PHHS', route: '/parent-council', members: [] },
                                            ]).map((group, idx, arr) => (
                                                <div key={group.key} className={`relative group/item ${idx === 0 ? 'rounded-t-xl' : ''} ${idx === arr.length - 1 ? 'rounded-b-xl' : ''}`}>
                                                    <a href={group.route}>
                                                        <div className={`px-4 py-3 hover:bg-green-100 flex justify-between cursor-pointer ${idx === 0 ? 'rounded-t-xl' : ''} ${idx === arr.length - 1 ? 'rounded-b-xl' : ''}`}>
                                                            <span>{group.label}</span>
                                                            <span className="text-gray-400">▶</span>
                                                        </div>
                                                    </a>
                                                    <div className="absolute top-0 left-full ml-1 hidden group-hover/item:block bg-white rounded-xl shadow-xl min-w-[260px] z-50">
                                                        {group.members.length > 0 ? (
                                                            group.members.map((member, memberIdx) => (
                                                                <div
                                                                    key={`${group.key}-${member}-${memberIdx}`}
                                                                    className={`px-4 py-2.5 hover:bg-green-100 text-sm ${memberIdx === 0 ? 'rounded-t-xl' : ''} ${memberIdx === group.members.length - 1 ? 'rounded-b-xl' : ''}`}
                                                                >
                                                                    {member.fullName || '—'}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-2.5 text-sm text-gray-500 rounded-xl">
                                                                Chưa cập nhật nhân sự
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ===== TIN TỨC ===== */}
                        <div className="relative" onMouseEnter={() => openMenu("news")} onMouseLeave={closeMenu}>
                            <div className="px-3 py-2.5 hover:bg-white/15 cursor-pointer whitespace-nowrap transition-colors rounded flex items-center gap-1">
                                Tin tức
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-3 h-3 transition-transform duration-200 ${activeMenu === "news" ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            {activeMenu === "news" && (
                                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl min-w-[220px] z-50 text-gray-800">
                                    {newsCategories.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-gray-500">Đang tải...</div>
                                    ) : (
                                        newsCategories.map((c, idx) => {
                                            const route = NEWS_ROUTE_MAP[c.name] || "/";
                                            return (
                                                <a key={c._id} href={route}>
                                                    <div className={`px-4 py-3 hover:bg-green-100 ${idx === 0 ? "rounded-t-xl" : ""} ${idx === newsCategories.length - 1 ? "rounded-b-xl" : ""}`}>{c.name}</div>
                                                </a>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ===== VĂN BẢN ===== */}
                        <div className="relative" onMouseEnter={() => openMenu("docs")} onMouseLeave={closeMenu}>
                            <div className="px-3 py-2.5 hover:bg-white/15 cursor-pointer whitespace-nowrap transition-colors rounded flex items-center gap-1">
                                Văn bản
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-3 h-3 transition-transform duration-200 ${activeMenu === "docs" ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            {activeMenu === "docs" && (
                                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl min-w-[220px] z-50 text-gray-800">
                                    <a href="/legal-documents"><div className="px-4 py-3 hover:bg-green-100 rounded-t-xl">Văn bản pháp quy</div></a>
                                    <a href="/department-documents"><div className="px-4 py-3 hover:bg-green-100 rounded-b-xl">Văn bản từ Phòng</div></a>
                                </div>
                            )}
                        </div>

                        {/* ===== THƯ VIỆN ===== */}
                        <div className="relative" onMouseEnter={() => openMenu("library")} onMouseLeave={closeMenu}>
                            <div className="px-3 py-2.5 hover:bg-white/15 cursor-pointer whitespace-nowrap transition-colors rounded flex items-center gap-1">
                                Thư viện
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-3 h-3 transition-transform duration-200 ${activeMenu === "library" ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            {activeMenu === "library" && (
                                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl min-w-[220px] z-50 text-gray-800">
                                    <a href="https://k12online.vn/" target="_blank" rel="noreferrer"><div className="px-4 py-3 hover:bg-green-100 rounded-t-xl">Học trực tuyến</div></a>
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
                                    <a href="/relax-page"><div className="px-4 py-3 hover:bg-green-100 rounded-b-xl">Thư giãn</div></a>
                                </div>
                            )}
                        </div>

                        <a href="/contact" className="px-3 py-2.5 hover:bg-white/15 whitespace-nowrap transition-colors rounded">
                            Liên hệ
                        </a>
                        <a href="/qa" className="px-3 py-2.5 hover:bg-white/15 whitespace-nowrap transition-colors rounded">
                            Hỏi đáp
                        </a>
                    </nav>
                </div>
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

