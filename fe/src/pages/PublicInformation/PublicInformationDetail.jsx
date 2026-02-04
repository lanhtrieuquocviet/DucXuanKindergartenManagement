import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";

export default function PublicInformationDetail() {

    const PUBLIC_INFO_MAP = {
        "financial-disclosure": "Công khai thu chi tài chính",
        "education-quality": "Điều kiện đảm bảo chất lượng hoạt động giáo dục",
        "education-plan-result": "Kế hoạch và kết quả hoạt động giáo dục",
        "annual-report": "Báo cáo thường niên",
    };
    const { slug, year } = useParams();
    const baseTitle = PUBLIC_INFO_MAP[slug] || "Thông tin công khai";

    const title = `${baseTitle} năm ${year}`;
    const MOCK_DATA = {
        "financial-disclosure": {
            2026: [
                {
                    title: "Thông báo công khai thu chi tài chính năm 2026",
                    desc: "Thông báo công khai thu chi tài chính của nhà trường năm 2026",
                    category: "CÔNG KHAI",
                    date: "30/09/2026",
                    image: null,
                },
                {
                    title: "Quyết định phê duyệt dự toán ngân sách năm 2026",
                    desc: "Quyết định phê duyệt dự toán ngân sách nhà trường năm 2026",
                    category: "CÔNG KHAI",
                    date: "15/08/2026",
                    image: null,
                },
                {
                    title: "Báo cáo quyết toán ngân sách năm 2026",
                    desc: "Báo cáo quyết toán ngân sách nhà trường năm 2026",
                    category: "CÔNG KHAI",
                    date: "10/07/2026",
                    image: "https://via.placeholder.com/80x100",
                },
                {
                    title: "Công khai các khoản thu đầu năm học 2026–2027",
                    desc: "Danh mục các khoản thu đầu năm học 2026–2027",
                    category: "CÔNG KHAI",
                    date: "01/07/2026",
                    image: null,
                },
            ],
            2025: [
                {
                    title: "Thông báo công khai thu chi tài chính năm 2025",
                    desc: "Thông báo công khai thu chi tài chính của nhà trường năm 2025",
                    category: "CÔNG KHAI",
                    date: "28/09/2025",
                    image: null,
                },
                {
                    title: "Báo cáo quyết toán ngân sách năm 2025",
                    desc: "Báo cáo quyết toán ngân sách nhà trường năm 2025",
                    category: "CÔNG KHAI",
                    date: "12/07/2025",
                    image: null,
                },
            ],
        },

        "education-quality": {
            2026: [
                {
                    title: "Điều kiện cơ sở vật chất năm 2026",
                    desc: "Báo cáo điều kiện cơ sở vật chất phục vụ hoạt động giáo dục năm 2026",
                    category: "CHẤT LƯỢNG",
                    date: "20/09/2026",
                    image: null,
                },
                {
                    title: "Đội ngũ giáo viên và cán bộ quản lý năm 2026",
                    desc: "Danh sách và trình độ đội ngũ giáo viên, cán bộ quản lý năm 2026",
                    category: "CHẤT LƯỢNG",
                    date: "05/09/2026",
                    image: null,
                },
            ],
            2025: [
                {
                    title: "Điều kiện đảm bảo chất lượng giáo dục năm 2025",
                    desc: "Báo cáo tổng hợp điều kiện đảm bảo chất lượng giáo dục năm 2025",
                    category: "CHẤT LƯỢNG",
                    date: "18/09/2025",
                    image: null,
                },
            ],
        },

        "education-plan-result": {
            2026: [
                {
                    title: "Kế hoạch hoạt động giáo dục năm học 2026–2027",
                    desc: "Kế hoạch tổ chức các hoạt động giáo dục năm học 2026–2027",
                    category: "KẾ HOẠCH",
                    date: "25/08/2026",
                    image: null,
                },
                {
                    title: "Kết quả thực hiện nhiệm vụ giáo dục học kỳ I",
                    desc: "Báo cáo kết quả thực hiện nhiệm vụ giáo dục học kỳ I năm học 2026–2027",
                    category: "KẾT QUẢ",
                    date: "20/12/2026",
                    image: null,
                },
            ],
            2025: [
                {
                    title: "Kế hoạch hoạt động giáo dục năm học 2025–2026",
                    desc: "Kế hoạch hoạt động giáo dục năm học 2025–2026",
                    category: "KẾ HOẠCH",
                    date: "28/08/2025",
                    image: null,
                },
            ],
        },

        "annual-report": {
            2026: [
                {
                    title: "Báo cáo thường niên năm 2026",
                    desc: "Báo cáo tổng hợp tình hình hoạt động của nhà trường năm 2026",
                    category: "BÁO CÁO",
                    date: "31/12/2026",
                    image: null,
                },
            ],
            2025: [
                {
                    title: "Báo cáo thường niên năm 2025",
                    desc: "Báo cáo tổng hợp tình hình hoạt động của nhà trường năm 2025",
                    category: "BÁO CÁO",
                    date: "31/12/2025",
                    image: null,
                },
            ],
        },
    };

    const data = useMemo(() => {
        return MOCK_DATA[slug]?.[year] || [];
    }, [slug, year]);


    /* Pagination */
    const pageSize = 4;
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(data.length / pageSize);
    const list = data.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Breadcrumb */}
                <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span>Trang chủ</span>
                    <span>›</span>
                    <span>Thông tin công khai</span>
                    <span>›</span>
                    <span className="font-semibold text-gray-800">
                        {baseTitle}
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-800">
                    {title}
                </h1>

                {/* List */}
                <div className="bg-white border border-gray-300 rounded-lg divide-y">
                    {list.map((item, index) => (
                        <div
                            key={index}
                            className="flex gap-5 p-5 hover:bg-gray-50 transition"
                        >
                            {/* Image */}
                            <div className="w-28 h-36 flex-shrink-0 border border-gray-400 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    "KHÔNG CÓ HÌNH"
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-2">
                                <h2 className="font-semibold text-gray-900 hover:text-green-700 cursor-pointer">
                                    {item.title}
                                </h2>

                                <p className="text-sm text-gray-700 line-clamp-2">
                                    {item.desc}
                                </p>

                                <div className="text-xs text-gray-500 flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        🏷 {item.category}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        🕒 {item.date}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-2 pt-2">

                    {/* Prev */}
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className={`w-9 h-9 border rounded flex items-center justify-center
          ${page === 1
                                ? "text-gray-400 border-gray-300 cursor-not-allowed"
                                : "border-gray-400 hover:bg-gray-100"}`}
                    >
                        «
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }).map((_, i) => {
                        const p = i + 1;
                        return (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-9 h-9 border rounded flex items-center justify-center font-medium
              ${page === p
                                        ? "bg-green-600 text-white border-green-600"
                                        : "border-gray-400 hover:bg-gray-100"}`}
                            >
                                {p}
                            </button>
                        );
                    })}

                    {/* Next */}
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className={`w-9 h-9 border rounded flex items-center justify-center
          ${page === totalPages
                                ? "text-gray-400 border-gray-300 cursor-not-allowed"
                                : "border-gray-400 hover:bg-gray-100"}`}
                    >
                        »
                    </button>
                </div>

            </div>
        </div>
    );
}
