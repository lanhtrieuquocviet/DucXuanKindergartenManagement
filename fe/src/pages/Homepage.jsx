import { useState } from "react";

const mockBlogs = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  title: `Hoạt động giáo dục nổi bật tháng ${i + 1}`,
  content: `
Trường Mầm non Đức Xuân luôn chú trọng đổi mới phương pháp giáo dục nhằm tạo
môi trường học tập thân thiện, an toàn và hiệu quả cho trẻ.

Trong tháng ${i + 1}, nhà trường đã tổ chức nhiều hoạt động giáo dục bổ ích
như: hoạt động trải nghiệm, vui chơi ngoài trời, sinh hoạt tập thể và các
chương trình giáo dục kỹ năng sống phù hợp với lứa tuổi mầm non.

Thông qua các hoạt động này, trẻ được phát triển toàn diện về thể chất,
trí tuệ, ngôn ngữ, tình cảm và kỹ năng xã hội. Đội ngũ giáo viên luôn tận tâm,
sáng tạo trong từng bài giảng, chú trọng cá nhân hóa việc chăm sóc và giáo dục trẻ.

Bên cạnh đó, nhà trường cũng tăng cường phối hợp với phụ huynh trong công tác
chăm sóc – giáo dục trẻ, đảm bảo sự thống nhất giữa gia đình và nhà trường.

Trong thời gian tới, Trường Mầm non Đức Xuân sẽ tiếp tục nâng cao chất lượng
giáo dục, đầu tư cơ sở vật chất, đổi mới phương pháp giảng dạy, hướng tới mục
tiêu xây dựng môi trường giáo dục hạnh phúc cho trẻ em.
  `,
}));

const PAGE_SIZE = 4;

function Homepage() {
  const [page, setPage] = useState(1);

  const totalPage = Math.ceil(mockBlogs.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const blogs = mockBlogs.slice(start, start + PAGE_SIZE);

  const mainBlog = blogs[0];
  const subBlogs = blogs.slice(1);

  return (
    <div className="space-y-8">

      {/* Ảnh Slider (mockup) */}
      <div className="h-[260px] border-2 border-gray-400 flex items-center justify-center text-xl font-semibold bg-gray-50">
        Ảnh Slider
      </div>

      {/* Blog nổi bật */}
      <h3 className="text-xl font-bold">Tin tức nổi bật</h3>

      {/* Blog lớn */}
      {mainBlog && (
        <div className="border-2 border-gray-400 p-4 bg-white space-y-3">
          <div className="h-[220px] border flex items-center justify-center bg-gray-100">
            Ảnh bài viết
          </div>

          <h4 className="text-lg font-semibold">{mainBlog.title}</h4>
          <p className="text-sm text-gray-700 line-clamp-4">
            {mainBlog.content}
          </p>
        </div>
      )}

      {/* 3 blog nhỏ */}
      <div className="grid grid-cols-3 gap-6">
        {subBlogs.map((blog) => (
          <div key={blog.id} className="space-y-2">
            <div className="h-[140px] border flex items-center justify-center bg-gray-100">
              Ảnh blog
            </div>
            <div className="border px-3 py-2 text-sm font-medium">
              {blog.title}
            </div>
          </div>
        ))}
      </div>

      {/* Phân trang */}
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

export default Homepage;
