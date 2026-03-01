import { useState } from "react";

function Notifications() {
  const data = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    title: `Thông báo số ${i + 1} của Trường Mầm non Đức Xuân`,
    description:
      "Thông báo về các hoạt động, kế hoạch và nội dung liên quan đến công tác quản lý, chăm sóc và giáo dục trẻ.",
    date: "10/01/2026",
    image: null,
  }));

  const ITEMS_PER_PAGE = 5;
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
        Tin tức <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">Thông báo</span>
      </div>

      <h1 className="text-3xl font-bold mb-8">Thông báo</h1>

      <div className="space-y-6">
        {currentData.map((item) => (
          <div key={item.id} className="flex gap-6 border-b pb-6">
            <div className="w-[220px] h-[140px] border bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-sm">KHÔNG CÓ HÌNH</span>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold hover:text-green-600 cursor-pointer mb-2">
                {item.title}
              </h3>
              <p className="text-gray-700 mb-2">{item.description}</p>
              <div className="text-sm text-gray-500">
                Thông tin công khai | {item.date}
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
            className={`px-3 py-1 border rounded ${
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

export default Notifications;
