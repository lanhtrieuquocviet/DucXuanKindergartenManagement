import { useState } from "react";

function LegalDocuments() {
  const data = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `Công văn số ${i + 1}/SGDĐT-QLCL`,
    description:
      "Công văn chỉ đạo, hướng dẫn chuyên môn từ Phòng/Sở Giáo dục và Đào tạo.",
    issuedDate: "01/07/2015",
    effectiveDate: "01/07/2015",
    expiredDate: "---",
    status: "Đã có hiệu lực",
  }));

  const ITEMS_PER_PAGE = 3;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  const currentData = data.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-6">
        Trang chủ <span className="mx-2">›</span>
        Văn bản <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">
          Văn bản pháp quy
        </span>
      </div>

      <h1 className="text-3xl font-bold mb-6">
        Văn bản pháp quy
      </h1>

      {/* Danh sách văn bản */}
      <div className="space-y-5">
        {currentData.map((item) => (
          <div
            key={item.id}
            className="border border-gray-300 bg-white"
          >
            {/* Header */}
            <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-orange-500">➤</span>
              {item.title}
            </div>

            {/* Content */}
            <div className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
              {/* Left */}
              <div className="col-span-2 text-gray-700">
                {item.description}
              </div>

              {/* Right */}
              <div className="space-y-1 text-gray-700">
                <div>
                  Ngày ban hành:{" "}
                  <span className="text-green-600">
                    {item.issuedDate}
                  </span>
                </div>
                <div>
                  Ngày hiệu lực:{" "}
                  <span className="text-green-600">
                    {item.effectiveDate}
                  </span>
                </div>
                <div>
                  Ngày hết hạn:{" "}
                  <span className="text-gray-500">
                    {item.expiredDate}
                  </span>
                </div>
                <div>
                  Trạng thái:{" "}
                  <span className="text-green-600 font-semibold">
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 border rounded text-sm ${
              page === i + 1
                ? "bg-green-600 text-white"
                : "hover:bg-gray-100"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LegalDocuments;
