export default function PhotoGallery() {
  const photos = [
    {
      title: "Ảnh khám sức khỏe học sinh học kỳ II năm học 2022-2023",
      img: "https://via.placeholder.com/400x250?text=Kham+suc+khoe",
    },
    {
      title: 'Hội thi "bé tập làm nội trợ" cấp trường năm học 2022-2023',
      img: "https://via.placeholder.com/400x250?text=Be+tap+lam+noi+tro",
    },
    {
      title:
        "Chương trình tình nguyện của Đoàn thanh niên với học sinh Trung tâm khuyết tật tỉnh Bắc Kạn",
      img: "https://via.placeholder.com/400x250?text=Tinh+nguyen",
    },
    {
      title: "Hội xuân năm Quý Mão 2023",
      img: "https://via.placeholder.com/400x250?text=Hoi+xuan",
    },
    {
      title: "Ảnh lễ chào cờ sáng thứ 2 hàng tuần",
      img: "https://via.placeholder.com/400x250?text=Chao+co",
    },
    {
      title: "Ảnh Lễ Khai giảng năm học 2022-2023",
      img: "https://via.placeholder.com/400x250?text=Khai+giang",
    },
    {
      title: "Ảnh ngày tựu trường năm học 2022-2023",
      img: "https://via.placeholder.com/400x250?text=Tuu+truong",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-white px-6 py-4 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Thư viện ảnh</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((item, index) => (
          <div
            key={index}
            className="cursor-pointer group"
          >
            {/* Image */}
            <div className="overflow-hidden border">
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Title */}
            <p className="mt-3 text-sm leading-relaxed group-hover:text-green-600">
              {item.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
