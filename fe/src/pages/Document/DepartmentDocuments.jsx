import { useState } from "react";

function DepartmentDocuments() {
  // Fake dữ liệu 20 văn bản
  const documents = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    title: `Công văn số ${i + 1}: Văn bản chỉ đạo từ Phòng GD&ĐT`,
    issuedDate: i % 2 === 0 ? "11/05/2023" : "24/04/2023",
    effectiveDate: "---",
    expireDate: "---",
    status: "Đã có hiệu lực",
  }));

  const ITEMS_PER_PAGE = 5;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(documents.length / ITEMS_PER_PAGE);

  const currentData = documents.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-6">
        Trang chủ <span className="mx-2">›</span>
        Văn bản <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">Văn bản từ Phòng</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-8">Văn bản từ Phòng</h1>

      {/* List */}
      <div className="space-y-6">
        {currentData.map((item) => (
          <div key={item.id} className="border rounded">
            {/* Header */}
            <div className="bg-gray-100 px-4 py-3 font-semibold text-red-600 flex items-center gap-2">
              <span>⭕</span>
              {item.title}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 text-sm">
              {/* Left */}
              <div className="md:col-span-2">
                <a
                  href="#"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  ⬇ File đính kèm
                </a>
              </div>

              {/* Right */}
              <div className="border-l pl-4 space-y-1">
                <div>
                  Ngày ban hành:{" "}
                  <span className="text-green-600 font-medium">
                    {item.issuedDate}
                  </span>
                </div>
                <div>Ngày hiệu lực: {item.effectiveDate}</div>
                <div>Ngày hết hạn: {item.expireDate}</div>
                <div>
                  Trạng thái:{" "}
                  <span className="text-green-600 font-medium">
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
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
        >
          ‹
        </button>

        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 border rounded ${
              page === i + 1
                ? "bg-green-600 text-white"
                : "hover:bg-gray-100"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default DepartmentDocuments;
