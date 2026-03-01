import { useState, useEffect } from "react";
import { get } from "../service/api";

// we'll fetch latest published blogs to display in news section

const PAGE_SIZE = 4;

function Homepage() {
  // load categories and their latest published blog
  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await get('/blogs/categories');
        const cats = resp.data || resp;
        const posts = [];

        // fetch one blog per category
        for (const c of cats) {
          try {
            const r2 = await get(`/blogs/published?category=${c._id}&limit=1`);
            const items = r2.data?.items || [];
            if (items.length > 0) {
              const b = items[0];
              posts.push({
                id: b._id,
                title: b.code,
                content: b.description,
                category: c.name,
              });
            }
          } catch (e) {
            // ignore failures for individual categories
          }
        }
        setFeatured(posts);
      } catch (err) {
        setError(err.message || 'Không tải được tin nổi bật');
        console.error('Failed to load featured blogs', err);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);
  const [page, setPage] = useState(1);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // load categories with latest post (see above useEffect)

  const totalPage = Math.ceil(featured.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const currentBlogs = featured.slice(startIndex, startIndex + PAGE_SIZE);

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
      {loading && (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      )}
      {error && (
        <div className="text-center py-8 text-red-600">{error}</div>
      )}
      {!loading && !error && featured.length === 0 && (
        <div className="text-center py-8 text-gray-500">Chưa có bài viết</div>
      )}
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
