export default function LessonPlan() {
  const lessonPlans = [
    {
      title: "Giáo án: Nhận biết màu sắc",
      age: "Mẫu giáo bé (3 – 4 tuổi)",
      subject: "Phát triển nhận thức",
      teacher: "Võ Thị Kiều Nhiên",
      file: "#",
    },
    {
      title: "Giáo án: Bé làm quen chữ cái A",
      age: "Mẫu giáo nhỡ (4 – 5 tuổi)",
      subject: "Phát triển ngôn ngữ",
      teacher: "Nguyễn Thị Hoa",
      file: "#",
    },
    {
      title: "Giáo án: Vận động bật xa",
      age: "Mẫu giáo lớn (5 – 6 tuổi)",
      subject: "Phát triển thể chất",
      teacher: "Trần Văn Minh",
      file: "#",
    },
    {
      title: "Giáo án: Hát múa theo nhạc",
      age: "Nhà trẻ",
      subject: "Phát triển thẩm mỹ",
      teacher: "Phạm Thị Lan",
      file: "#",
    },
    {
      title: "Giáo án: Kỹ năng rửa tay đúng cách",
      age: "Mẫu giáo bé (3 – 4 tuổi)",
      subject: "Kỹ năng sống",
      teacher: "Đỗ Thị Hạnh",
      file: "#",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-white px-6 py-4 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Giáo án điện tử</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-6">
        Giáo án điện tử
      </h1>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-green-100 text-center">
            <tr>
              <th className="border px-3 py-2">STT</th>
              <th className="border px-3 py-2">Tên giáo án</th>
              <th className="border px-3 py-2">Độ tuổi</th>
              <th className="border px-3 py-2">Lĩnh vực</th>
              <th className="border px-3 py-2">Giáo viên</th>
              <th className="border px-3 py-2">Tài liệu</th>
            </tr>
          </thead>
          <tbody>
            {lessonPlans.map((item, index) => (
              <tr
                key={index}
                className="even:bg-gray-50 text-center"
              >
                <td className="border px-3 py-2">
                  {index + 1}
                </td>
                <td className="border px-3 py-2 text-left">
                  {item.title}
                </td>
                <td className="border px-3 py-2">
                  {item.age}
                </td>
                <td className="border px-3 py-2">
                  {item.subject}
                </td>
                <td className="border px-3 py-2">
                  {item.teacher}
                </td>
                <td className="border px-3 py-2">
                  <a
                    href={item.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline"
                  >
                    📥 Xem / Tải
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
