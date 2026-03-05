export default function ExperienceSharing() {
  const posts = [
    {
      title: "Kinh nghiệm tổ chức hoạt động ngoài trời cho trẻ mầm non",
      author: "Nguyễn Thị Hoa",
      date: "12/03/2023",
      summary:
        "Chia sẻ cách tổ chức các hoạt động ngoài trời an toàn, hấp dẫn, giúp trẻ phát triển thể chất và kỹ năng xã hội.",
    },
    {
      title: "Phương pháp giúp trẻ mạnh dạn, tự tin hơn khi đến lớp",
      author: "Võ Thị Kiều Nhiên",
      date: "20/03/2023",
      summary:
        "Một số biện pháp tâm lý và hoạt động thực tế giúp trẻ giảm lo lắng, sớm hòa nhập môi trường mầm non.",
    },
    {
      title: "Kinh nghiệm phối hợp với phụ huynh trong chăm sóc trẻ",
      author: "Phạm Thị Lan",
      date: "28/03/2023",
      summary:
        "Chia sẻ cách trao đổi thông tin, xây dựng mối quan hệ tích cực giữa giáo viên và phụ huynh.",
    },
    {
      title: "Rèn kỹ năng tự phục vụ cho trẻ 4–5 tuổi",
      author: "Trần Văn Minh",
      date: "05/04/2023",
      summary:
        "Hướng dẫn giáo viên và phụ huynh rèn cho trẻ các kỹ năng tự phục vụ phù hợp với độ tuổi.",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-white px-4 sm:px-6 py-4 sm:py-6 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Chia sẻ kinh nghiệm</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-6">
        Chia sẻ kinh nghiệm
      </h1>

      {/* List */}
      <div className="space-y-6">
        {posts.map((post, index) => (
          <div
            key={index}
            className="border-b pb-4 hover:bg-gray-50 transition cursor-pointer"
          >
            <h2 className="text-lg font-semibold text-green-700 mb-1">
              {post.title}
            </h2>

            <div className="text-xs text-gray-500 mb-2">
              👩‍🏫 {post.author} &nbsp; | &nbsp; 📅 {post.date}
            </div>

            <p className="text-sm text-gray-700 leading-relaxed">
              {post.summary}
            </p>

            <div className="mt-2">
              <span className="text-sm text-green-600 hover:underline">
                Xem chi tiết →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
