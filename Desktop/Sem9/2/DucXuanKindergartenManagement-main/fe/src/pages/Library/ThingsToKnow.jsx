export default function ThingsToKnow() {
  const contents = [
    {
      title: "Thời gian đưa đón trẻ",
      description:
        "Phụ huynh đưa trẻ đến trường từ 7h00 – 8h00 và đón trẻ từ 16h00 – 17h00 hàng ngày. Trường hợp đặc biệt cần báo trước cho giáo viên chủ nhiệm.",
    },
    {
      title: "Trang phục của trẻ",
      description:
        "Trẻ mặc đồng phục theo quy định của nhà trường, đi giày hoặc dép có quai hậu. Trang phục gọn gàng, sạch sẽ, phù hợp thời tiết.",
    },
    {
      title: "Đồ dùng cá nhân",
      description:
        "Phụ huynh chuẩn bị đầy đủ đồ dùng cá nhân cho trẻ như: quần áo dự phòng, khăn mặt, bình nước cá nhân (có ghi tên trẻ).",
    },
    {
      title: "Chế độ ăn uống",
      description:
        "Nhà trường tổ chức bữa ăn bán trú đầy đủ dinh dưỡng. Phụ huynh cần thông báo với giáo viên nếu trẻ bị dị ứng thực phẩm hoặc có chế độ ăn riêng.",
    },
    {
      title: "Chăm sóc sức khỏe",
      description:
        "Khi trẻ có dấu hiệu sốt, ho, mệt mỏi hoặc mắc bệnh truyền nhiễm, phụ huynh không đưa trẻ đến trường và cần thông báo kịp thời cho giáo viên.",
    },
    {
      title: "Phối hợp với nhà trường",
      description:
        "Phụ huynh thường xuyên trao đổi thông tin với giáo viên để cùng phối hợp trong việc chăm sóc, giáo dục và theo dõi sự phát triển của trẻ.",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-white px-6 py-4 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Điều cần biết</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-6">
        Điều cần biết dành cho phụ huynh
      </h1>

      {/* Content list */}
      <div className="space-y-6">
        {contents.map((item, index) => (
          <div
            key={index}
            className="border-l-4 border-green-500 pl-4 py-2"
          >
            <h2 className="text-lg font-semibold mb-1">
              {index + 1}. {item.title}
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
