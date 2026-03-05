export default function PoetryMusic() {
  const contents = [
    {
      type: "Thơ",
      title: "Bé tới trường",
      author: "Phạm Hổ",
      description:
        "Bài thơ nhẹ nhàng giúp trẻ thêm yêu trường lớp, bạn bè và thầy cô.",
    },
    {
      type: "Thơ",
      title: "Bàn tay cô giáo",
      author: "Định Hải",
      description:
        "Bài thơ ca ngợi tình cảm yêu thương, chăm sóc của cô giáo mầm non.",
    },
    {
      type: "Văn",
      title: "Câu chuyện: Thỏ con không vâng lời",
      author: "Truyện thiếu nhi",
      description:
        "Câu chuyện giáo dục trẻ biết nghe lời người lớn và giữ an toàn cho bản thân.",
    },
    {
      type: "Văn",
      title: "Sự tích cây vú sữa",
      author: "Truyện dân gian",
      description:
        "Câu chuyện cảm động về tình mẫu tử, phù hợp kể cho trẻ mầm non.",
    },
    {
      type: "Nhạc",
      title: "Cháu yêu cô chú công nhân",
      author: "Hoàng Văn Yến",
      description:
        "Bài hát vui tươi giúp trẻ hiểu về các ngành nghề trong xã hội.",
    },
    {
      type: "Nhạc",
      title: "Đi học về",
      author: "Bùi Đình Thảo",
      description:
        "Bài hát quen thuộc, giai điệu nhẹ nhàng dành cho trẻ mầm non.",
    },
  ];

  const typeColor = {
    Thơ: "bg-pink-100 text-pink-700",
    Văn: "bg-blue-100 text-blue-700",
    Nhạc: "bg-green-100 text-green-700",
  };

  return (
    <div className="w-full min-h-screen bg-white px-4 sm:px-6 py-4 sm:py-6 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Thơ – Văn – Nhạc</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-6">
        Thơ – Văn – Nhạc dành cho trẻ mầm non
      </h1>

      {/* List */}
      <div className="space-y-5">
        {contents.map((item, index) => (
          <div
            key={index}
            className="border p-4 hover:bg-gray-50 transition"
          >
            {/* Type */}
            <span
              className={`inline-block text-xs px-2 py-1 mb-2 font-medium ${typeColor[item.type]}`}
            >
              {item.type}
            </span>

            {/* Title */}
            <h2 className="text-lg font-semibold mb-1">
              {item.title}
            </h2>

            {/* Author */}
            <p className="text-xs text-gray-500 mb-2">
              ✍️ {item.author}
            </p>

            {/* Description */}
            <p className="text-sm text-gray-700 leading-relaxed">
              {item.description}
            </p>

            {/* Action */}
            <div className="mt-2">
              <span className="text-sm text-green-600 hover:underline cursor-pointer">
                Xem chi tiết →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
