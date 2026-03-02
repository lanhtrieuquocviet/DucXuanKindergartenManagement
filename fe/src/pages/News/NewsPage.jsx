import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, ENDPOINTS } from "../../service/api";

const ITEMS_PER_PAGE = 5;

function NewsPage({ categoryName }) {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    setData([]);
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const resp = await get(ENDPOINTS.BLOGS.CATEGORIES);
        const list = resp.data || resp;
        const cat = list.find((c) => c.name === categoryName);
        if (!cat) {
          setLoading(false);
          return;
        }
        const response = await get(
          `${ENDPOINTS.BLOGS.PUBLISHED}?category=${cat._id}&limit=999`
        );
        const blogs = response.data?.items || [];
        setData(
          blogs.map((blog) => ({
            id: blog._id,
            title: blog.code,
            description: blog.description,
            date: new Date(blog.createdAt).toLocaleDateString("vi-VN"),
            image: blog.images?.[0] || null,
            attachmentUrl: blog.attachmentUrl || null,
            attachmentType: blog.attachmentType || null,
          }))
        );
      } catch (err) {
        setError(err.message || "Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [categoryName]);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const current = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-6">
        Trang chủ <span className="mx-2">›</span>
        Tin tức <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">{categoryName}</span>
      </div>

      <h1 className="text-3xl font-bold mb-8">{categoryName}</h1>

      {loading && (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-red-700">
          {error}
        </div>
      )}
      {!loading && data.length === 0 && (
        <div className="text-center py-8 text-gray-500">Chưa có nội dung nào</div>
      )}

      {!loading && current.length > 0 && (
        <div className="space-y-6">
          {current.map((item) => (
            <div key={item.id} className="flex gap-6 border-b pb-6">
              {/* Ảnh */}
              <div className="w-[220px] h-[140px] flex-shrink-0 bg-gray-100 border flex items-center justify-center">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm text-center">
                    KHÔNG CÓ HÌNH
                  </span>
                )}
              </div>

              {/* Nội dung */}
              <div className="flex-1">
                <h3
                  className="text-lg font-semibold mb-2 hover:text-green-600 cursor-pointer"
                  onClick={() => navigate(`/news/${item.id}`)}
                >
                  {item.title}
                </h3>
                <p className="text-gray-700 mb-3 line-clamp-2">
                  {item.description}
                </p>
                <div className="text-sm text-gray-500 flex flex-wrap items-center gap-4">
                  <span>🏷 {categoryName}</span>
                  <span>🕒 {item.date}</span>
                  {item.attachmentUrl && (
                    <a
                      href={item.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {item.attachmentType === "pdf" ? "📄 PDF" : "📝 Word"}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-1 border rounded ${
              page === 1
                ? "text-gray-400 cursor-not-allowed"
                : "hover:bg-green-500 hover:text-white"
            }`}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 border rounded ${
                page === i + 1
                  ? "bg-green-600 text-white"
                  : "hover:bg-green-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={`px-3 py-1 border rounded ${
              page === totalPages
                ? "text-gray-400 cursor-not-allowed"
                : "hover:bg-green-500 hover:text-white"
            }`}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export default NewsPage;
