export default function VideoGallery() {
  const videos = [
    {
      title: "Video khám sức khỏe học sinh năm học 2022-2023",
      thumbnail: "https://via.placeholder.com/400x250?text=Video+Kham+suc+khoe",
      url: "https://www.youtube.com/watch?v=xxxx",
    },
    {
      title: 'Hội thi "bé tập làm nội trợ" cấp trường',
      thumbnail: "https://via.placeholder.com/400x250?text=Video+Noi+tro",
      url: "https://www.youtube.com/watch?v=xxxx",
    },
    {
      title: "Chương trình tình nguyện của Đoàn thanh niên",
      thumbnail: "https://via.placeholder.com/400x250?text=Video+Tinh+nguyen",
      url: "https://www.youtube.com/watch?v=xxxx",
    },
    {
      title: "Hội xuân Quý Mão 2023",
      thumbnail: "https://via.placeholder.com/400x250?text=Video+Hoi+xuan",
      url: "https://www.youtube.com/watch?v=xxxx",
    },
    {
      title: "Lễ chào cờ sáng thứ 2 hàng tuần",
      thumbnail: "https://via.placeholder.com/400x250?text=Video+Chao+co",
      url: "https://www.youtube.com/watch?v=xxxx",
    },
    {
      title: "Lễ Khai giảng năm học 2022-2023",
      thumbnail: "https://via.placeholder.com/400x250?text=Video+Khai+giang",
      url: "https://www.youtube.com/watch?v=xxxx",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-white px-6 py-4 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        🏠 Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Video clip</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((item, index) => (
          <a
            key={index}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative overflow-hidden border">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Play icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Title */}
            <p className="mt-3 text-sm leading-relaxed group-hover:text-green-600">
              {item.title}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
