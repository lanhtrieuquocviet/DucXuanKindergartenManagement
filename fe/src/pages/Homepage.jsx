import { useState } from "react";

/* ===== BLOG GIẢ ===== */
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
trí tuệ, ngôn ngữ, tình cảm và kỹ năng xã hội.
  `,
}));

const PAGE_SIZE = 4;

function Homepage() {
  const [page, setPage] = useState(1);

  const totalPage = Math.ceil(mockBlogs.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const currentBlogs = mockBlogs.slice(startIndex, startIndex + PAGE_SIZE);

  const mainBlog = currentBlogs[0];
  const subBlogs = currentBlogs.slice(1);

  return (
    <div className="space-y-10">

      {/* ===== SLIDER ===== */}
      <div className="h-[260px] border-2 border-gray-400 flex items-center justify-center text-xl font-semibold bg-gray-50">
        Ảnh Slider
      </div>

      {/* ===== TIÊU ĐỀ ===== */}
      <h3 className="text-xl font-bold border-b pb-2">
        Tin tức nổi bật
      </h3>

      {/* ===== BLOG LỚN ===== */}
      {mainBlog && (
        <div className="border-2 border-gray-400 p-4 bg-white space-y-3">
          <div className="h-[220px] border flex items-center justify-center bg-gray-100">
            Ảnh bài viết
          </div>

          <h4 className="text-lg font-semibold hover:text-green-700 cursor-pointer">
            {mainBlog.title}
          </h4>

          <p className="text-sm text-gray-700 line-clamp-4">
            {mainBlog.content}
          </p>
        </div>
      )}

      {/* ===== BLOG NHỎ ===== */}
      <div className="grid grid-cols-3 gap-6">
        {subBlogs.map((blog) => (
          <div
            key={blog.id}
            className="border p-2 space-y-2 hover:shadow cursor-pointer"
          >
            <div className="h-[140px] border flex items-center justify-center bg-gray-100">
              Ảnh blog
            </div>

            <div className="text-sm font-medium line-clamp-2">
              {blog.title}
            </div>
          </div>
        ))}
      </div>

      {/* ===== PHÂN TRANG ===== */}
      <div className="flex justify-center items-center gap-2 pt-6">

        {/* Prev */}
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className={`px-3 py-1 border rounded
            ${page === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
        >
          «
        </button>

        {/* Page number */}
        {Array.from({ length: totalPage }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-4 py-1 border rounded
              ${page === i + 1
                ? "bg-green-600 text-white"
                : "bg-white hover:bg-gray-100"}`}
          >
            {i + 1}
          </button>
        ))}

        {/* Next */}
        <button
          disabled={page === totalPage}
          onClick={() => setPage(page + 1)}
          className={`px-3 py-1 border rounded
            ${page === totalPage ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
        >
          »
        </button>
      </div>
    </div>
  );
}

export default Homepage;
