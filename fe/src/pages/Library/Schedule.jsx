export default function Schedule() {
  const schedule = [
    {
      time: "07:00 - 08:00",
      monday: "Đón trẻ – Trò chuyện – Chơi tự do",
      tuesday: "Đón trẻ – Trò chuyện – Chơi tự do",
      wednesday: "Đón trẻ – Trò chuyện – Chơi tự do",
      thursday: "Đón trẻ – Trò chuyện – Chơi tự do",
      friday: "Đón trẻ – Trò chuyện – Chơi tự do",
    },
    {
      time: "08:00 - 08:30",
      monday: "Thể dục sáng",
      tuesday: "Thể dục sáng",
      wednesday: "Thể dục sáng",
      thursday: "Thể dục sáng",
      friday: "Thể dục sáng",
    },
    {
      time: "08:30 - 09:15",
      monday: "Hoạt động học",
      tuesday: "Hoạt động học",
      wednesday: "Hoạt động học",
      thursday: "Hoạt động học",
      friday: "Hoạt động học",
    },
    {
      time: "09:15 - 09:45",
      monday: "Hoạt động ngoài trời",
      tuesday: "Hoạt động ngoài trời",
      wednesday: "Hoạt động ngoài trời",
      thursday: "Hoạt động ngoài trời",
      friday: "Hoạt động ngoài trời",
    },
    {
      time: "09:45 - 10:15",
      monday: "Ăn nhẹ",
      tuesday: "Ăn nhẹ",
      wednesday: "Ăn nhẹ",
      thursday: "Ăn nhẹ",
      friday: "Ăn nhẹ",
    },
    {
      time: "10:15 - 11:00",
      monday: "Chơi – Hoạt động góc",
      tuesday: "Chơi – Hoạt động góc",
      wednesday: "Chơi – Hoạt động góc",
      thursday: "Chơi – Hoạt động góc",
      friday: "Chơi – Hoạt động góc",
    },
    {
      time: "11:00 - 12:00",
      monday: "Ăn trưa – Vệ sinh",
      tuesday: "Ăn trưa – Vệ sinh",
      wednesday: "Ăn trưa – Vệ sinh",
      thursday: "Ăn trưa – Vệ sinh",
      friday: "Ăn trưa – Vệ sinh",
    },
    {
      time: "12:00 - 14:00",
      monday: "Ngủ trưa",
      tuesday: "Ngủ trưa",
      wednesday: "Ngủ trưa",
      thursday: "Ngủ trưa",
      friday: "Ngủ trưa",
    },
    {
      time: "14:00 - 15:00",
      monday: "Thức dậy – Ăn xế",
      tuesday: "Thức dậy – Ăn xế",
      wednesday: "Thức dậy – Ăn xế",
      thursday: "Thức dậy – Ăn xế",
      friday: "Thức dậy – Ăn xế",
    },
    {
      time: "15:00 - 16:00",
      monday: "Hoạt động chiều",
      tuesday: "Hoạt động chiều",
      wednesday: "Hoạt động chiều",
      thursday: "Hoạt động chiều",
      friday: "Hoạt động chiều",
    },
    {
      time: "16:00 - 17:00",
      monday: "Chơi tự do – Trả trẻ",
      tuesday: "Chơi tự do – Trả trẻ",
      wednesday: "Chơi tự do – Trả trẻ",
      thursday: "Chơi tự do – Trả trẻ",
      friday: "Chơi tự do – Trả trẻ",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-white px-6 py-4 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Thời khóa biểu</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-4">
        Thời khóa biểu
      </h1>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm text-center">
          <thead className="bg-green-100">
            <tr>
              <th className="border px-3 py-2">Thời gian</th>
              <th className="border px-3 py-2">Thứ 2</th>
              <th className="border px-3 py-2">Thứ 3</th>
              <th className="border px-3 py-2">Thứ 4</th>
              <th className="border px-3 py-2">Thứ 5</th>
              <th className="border px-3 py-2">Thứ 6</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row, index) => (
              <tr key={index} className="even:bg-gray-50">
                <td className="border px-3 py-2 font-medium">
                  {row.time}
                </td>
                <td className="border px-3 py-2">{row.monday}</td>
                <td className="border px-3 py-2">{row.tuesday}</td>
                <td className="border px-3 py-2">{row.wednesday}</td>
                <td className="border px-3 py-2">{row.thursday}</td>
                <td className="border px-3 py-2">{row.friday}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
