import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get } from "../service/api";

const PAGE_SIZE = 4;

const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, "").trim();

function Homepage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await get("/blogs/categories");
        const cats = resp.data || resp;
        const posts = [];

        for (const c of cats) {
          try {
            const r2 = await get(`/blogs/published?category=${c._id}&limit=1`);
            const items = r2.data?.items || [];
            if (items.length > 0) {
              const b = items[0];
              posts.push({
                id: b._id,
                title: b.code,
                content: stripHtml(b.description),
                image: b.images?.[0] || null,
                category: c.name,
              });
            }
          } catch {
            // ignore failures for individual categories
          }
        }
        setFeatured(posts);
      } catch (err) {
        setError(err.message || "Không tải được tin nổi bật");
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const totalPage = Math.ceil(featured.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const currentBlogs = featured.slice(startIndex, startIndex + PAGE_SIZE);

  const mainBlog = currentBlogs[0];
  const subBlogs = currentBlogs.slice(1);

  return (
    <div className="space-y-10">

      {/* ===== SLIDER ===== */}
      <div className="h-[160px] sm:h-[260px] border-2 border-gray-400 flex items-center justify-center text-base sm:text-xl font-semibold bg-gray-50">
        Ảnh Slider
      </div>

      {/* ===== TIÊU ĐỀ ===== */}
      <h3 className="text-lg sm:text-xl font-bold border-b pb-2">
        Tin tức nổi bật
      </h3>

      {loading && (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      )}
      {error && (
        <div className="text-center py-8 text-red-600">{error}</div>
      )}
      {!loading && !error && featured.length === 0 && (
        <div className="text-center py-8 text-gray-500">Chưa có bài viết</div>
      )}

      {/* ===== BLOG LỚN ===== */}
      {mainBlog && (
        <div
          className="border-2 border-gray-400 p-4 bg-white space-y-3 cursor-pointer hover:shadow-md transition"
          onClick={() => navigate(`/news/${mainBlog.id}`)}
        >
          {mainBlog.image ? (
            <img
              src={mainBlog.image}
              alt={mainBlog.title}
              className="w-full h-[160px] sm:h-[220px] object-cover"
            />
          ) : (
            <div className="h-[160px] sm:h-[220px] border flex items-center justify-center bg-gray-100 text-sm text-gray-400">
              Không có ảnh
            </div>
          )}

          <span className="text-xs text-green-700 font-medium">{mainBlog.category}</span>

          <h4 className="text-lg font-semibold hover:text-green-700">
            {mainBlog.title}
          </h4>

          <p className="text-sm text-gray-700 line-clamp-4">
            {mainBlog.content}
          </p>
        </div>
      )}

      {/* ===== BLOG NHỎ ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {subBlogs.map((blog) => (
          <div
            key={blog.id}
            className="border p-2 space-y-2 hover:shadow cursor-pointer"
            onClick={() => navigate(`/news/${blog.id}`)}
          >
            {blog.image ? (
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-[140px] object-cover"
              />
            ) : (
              <div className="h-[140px] border flex items-center justify-center bg-gray-100 text-sm text-gray-400">
                Không có ảnh
              </div>
            )}

            <span className="text-xs text-green-600">{blog.category}</span>

            <div className="text-sm font-medium line-clamp-2">
              {blog.title}
            </div>
          </div>
        ))}
      </div>

      {/* ===== PHÂN TRANG ===== */}
      {totalPage > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-1 border rounded ${page === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
          >
            «
          </button>

          {Array.from({ length: totalPage }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-4 py-1 border rounded ${page === i + 1 ? "bg-green-600 text-white" : "bg-white hover:bg-gray-100"}`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={page === totalPage}
            onClick={() => setPage(page + 1)}
            className={`px-3 py-1 border rounded ${page === totalPage ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}

export default Homepage;
