import { useState } from "react";

function ExtracurricularActivities() {
  const data = Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    title: `Hoạt động ngoại khóa ${i + 1}`,
    description:
      "Hoạt động trải nghiệm, vui chơi, giáo dục kỹ năng sống dành cho trẻ.",
    date: "20/11/2025",
    image: `https://picsum.photos/300/180?random=${i + 50}`,
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
      <div className="text-sm text-gray-600 mb-6">
        Trang chủ <span className="mx-2">›</span>
        Tin tức <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">
          Hoạt động ngoại khóa
        </span>
      </div>

      <h1 className="text-3xl font-bold mb-8">Hoạt động ngoại khóa</h1>

      <div className="space-y-6">
        {currentData.map((item) => (
          <div key={item.id} className="flex gap-6 border-b pb-6">
            <div className="w-[220px] h-[140px] border bg-gray-100">
              <img
                src={item.image}
                alt=""
                className="w-full h-full object-cover"
              />
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

export default ExtracurricularActivities;
