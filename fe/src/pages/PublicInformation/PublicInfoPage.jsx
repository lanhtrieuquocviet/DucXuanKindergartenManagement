import { useState } from "react";

function PublicInfoPage() {
  const items = [
    {
      title: "Thông báo công khai thông tin chung về cơ sở giáo dục",
      date: "30/09/2025",
      category: "CÔNG KHAI",
    },
    {
      title:
        "Quyết định về việc công nhận thành viên Hội đồng trường 03 trường học trực thuộc UBND thành phố năm học 2024-2025 (nhiệm kỳ 2021-2026)",
      date: "16/10/2024",
      category: "CÔNG KHAI",
    },
    {
      title:
        "Quyết định v/v ban hành Quy chế thực hiện dân chủ của trường Mầm non Đức Xuân năm học 2024-2025",
      date: "14/10/2024",
      category: "Thông tin công khai",
    },
    {
      title: "Quyết định thành lập trường",
      date: "14/10/2024",
      category: "Thông tin công khai",
      hasImage: true,
    },
    {
      title: "Kế hoạch năm học 2025 – 2026",
      date: "01/09/2025",
      category: "Thông tin công khai",
    },
    {
      title: "Báo cáo công khai tài chính năm 2025",
      date: "20/08/2025",
      category: "CÔNG KHAI",
    },
  ];

  /* ===== PHÂN TRANG ===== */
  const pageSize = 4;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentItems = items.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 flex items-center gap-2">
        <span>Trang chủ</span>
        <span>›</span>
        <span>Thông tin công khai</span>
        <span>›</span>
        <span className="font-semibold text-gray-800">
          Thông tin chung về cơ sở giáo dục
        </span>
      </div>

      <h1 className="text-xl font-bold text-gray-800">
        Thông tin chung về cơ sở giáo dục
      </h1>

      {/* Danh sách bài */}
      <div className="divide-y border rounded bg-white">
        {currentItems.map((item, index) => (
          <div key={index} className="flex gap-4 p-4">

            {/* Ảnh */}
            <div className="w-32 h-24 flex items-center justify-center border bg-gray-100 text-gray-500 text-sm">
              {item.hasImage ? "Ảnh" : "KHÔNG CÓ HÌNH"}
            </div>

            {/* Nội dung */}
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-gray-800 hover:text-green-700 cursor-pointer">
                {item.title}
              </h3>

              <p className="text-sm text-gray-600 line-clamp-2">
                {item.title}
              </p>

              <div className="text-xs text-gray-500 flex gap-4">
                <span>🏷 {item.category}</span>
                <span>🕒 {item.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PHÂN TRANG */}
      <div className="flex justify-center items-center gap-2 mt-6">

        {/* Prev */}
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className={`px-3 py-1 border rounded 
            ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
        >
          «
        </button>

        {/* Page numbers */}
        {[...Array(totalPages)].map((_, index) => {
          const page = index + 1;
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border rounded 
                ${page === currentPage
                  ? "bg-green-600 text-white"
                  : "hover:bg-gray-100"}`}
            >
              {page}
            </button>
          );
        })}

        {/* Next */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          className={`px-3 py-1 border rounded 
            ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
        >
          »
        </button>
      </div>
    </div>
  );
}

export default PublicInfoPage;
