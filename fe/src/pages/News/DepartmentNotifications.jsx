import { useState } from "react";

/* ===== MOCK DATA: 25 thông báo ===== */
const notifications = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  title: `Thông báo số ${i + 1} về công tác chuyên môn`,
  date: `0${(i % 9) + 1}/09/2026`,
  summary:
    "Phòng Giáo dục và Đào tạo thông báo đến các đơn vị trường học về việc triển khai một số nội dung liên quan đến công tác chuyên môn, kế hoạch giảng dạy và hoạt động giáo dục trong thời gian tới.",
}));

const PAGE_SIZE = 6;

function DepartmentNotifications() {
  const [page, setPage] = useState(1);

  const totalPage = Math.ceil(notifications.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const data = notifications.slice(start, start + PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* ===== Breadcrumb ===== */}
      <div className="text-sm text-gray-600">
        <span className="hover:text-green-600 cursor-pointer">Trang chủ</span>
        <span className="mx-2">›</span>
        <span className="hover:text-green-600 cursor-pointer">Tin tức</span>
        <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">
          Thông báo từ Phòng
        </span>
      </div>

      {/* ===== Title ===== */}
      <h1 className="text-3xl font-bold text-gray-800">
        Thông báo từ Phòng
      </h1>

      {/* ===== List ===== */}
      <div className="space-y-4">
        {data.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg bg-white p-5 hover:shadow transition"
          >
            <h3 className="text-lg font-semibold text-green-700 hover:underline cursor-pointer">
              {item.title}
            </h3>

            <div className="text-sm text-gray-500 mt-1">
              Ngày ban hành: {item.date}
            </div>

            <p className="text-sm text-gray-700 mt-3 line-clamp-3">
              {item.summary}
            </p>
          </div>
        ))}
      </div>

      {/* ===== Pagination ===== */}
      <div className="flex justify-center gap-2 pt-4">
        {Array.from({ length: totalPage }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-4 py-1 border rounded ${
              page === i + 1
                ? "bg-green-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default DepartmentNotifications;
