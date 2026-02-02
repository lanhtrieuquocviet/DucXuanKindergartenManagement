import { useState } from "react";

function SchoolNews() {
  // ===== DATA GIẢ =====
  const newsData = Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    title: `Bản tin số ${i + 1} của Trường Mầm non Đức Xuân`,
    description:
      "Đây là nội dung tóm tắt bản tin, phục vụ công tác thông tin – tuyên truyền của nhà trường.",
    date: "20/11/2025",
    category: "Thông tin công khai",
    image:
      i % 2 === 0
        ? `https://picsum.photos/300/180?random=${i}`
        : null,
  }));

  // ===== PAGINATION =====
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(newsData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentNews = newsData.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-6">
        Trang chủ <span className="mx-2">›</span>
        Tin tức <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">
          Bản tin trường
        </span>
      </div>

      <h1 className="text-3xl font-bold mb-8">Bản tin trường</h1>

      {/* Danh sách bản tin */}
      <div className="space-y-6">
        {currentNews.map((item) => (
          <div
            key={item.id}
            className="flex gap-6 border-b pb-6"
          >
            {/* Ảnh */}
            <div className="w-[220px] h-[140px] flex-shrink-0 bg-gray-100 border flex items-center justify-center">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-sm text-center">
                  KHÔNG CÓ HÌNH
                </div>
              )}
            </div>

            {/* Nội dung */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 hover:text-green-600 cursor-pointer">
                {item.title}
              </h3>

              <p className="text-gray-700 mb-3 line-clamp-2">
                {item.description}
              </p>

              <div className="text-sm text-gray-500 flex items-center gap-4">
                <span>🏷 {item.category}</span>
                <span>🕒 {item.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Phân trang */}
      <div className="flex justify-center items-center gap-2 mt-8">
        {/* Prev */}
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className={`px-3 py-1 border rounded
            ${
              currentPage === 1
                ? "text-gray-400 cursor-not-allowed"
                : "hover:bg-green-500 hover:text-white"
            }`}
        >
          ‹
        </button>

        {/* Page number */}
        {Array.from({ length: totalPages }).map((_, index) => {
          const page = index + 1;
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border rounded
                ${
                  currentPage === page
                    ? "bg-green-600 text-white"
                    : "hover:bg-green-100"
                }`}
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
            ${
              currentPage === totalPages
                ? "text-gray-400 cursor-not-allowed"
                : "hover:bg-green-500 hover:text-white"
            }`}
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default SchoolNews;
