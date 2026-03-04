import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, ENDPOINTS } from "../../service/api";

const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, "");

function DepartmentNews() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const resp = await get(ENDPOINTS.BLOGS.CATEGORIES);
        const list = resp.data || resp;
        const cat = list.find((c) => c.name === 'Tin tức từ Phòng');
        if (cat) setCategoryId(cat._id);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategory();
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await get(
          `${ENDPOINTS.BLOGS.PUBLISHED}?category=${categoryId}&limit=999`
        );
        const blogs = response.data.items || [];
        const mapped = blogs.map((blog) => ({
          id: blog._id,
          title: blog.code,
          description: blog.description,
          date: new Date(blog.createdAt).toLocaleDateString('vi-VN'),
          image: blog.images && blog.images.length > 0 ? blog.images[0] : null,
        }));
        setData(mapped);
      } catch (err) {
        setError(err.message || 'Lỗi khi tải tin tức');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [categoryId]);

  const ITEMS_PER_PAGE = 5;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const currentData = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 flex flex-wrap items-center gap-1">
        <span className="hover:text-green-600 cursor-pointer" onClick={() => navigate("/")}>Trang chủ</span>
        <span className="mx-1">›</span>
        Tin tức
        <span className="mx-1">›</span>
        <span className="font-medium text-gray-800">Tin tức từ Phòng</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Tin tức từ Phòng</h1>

      {loading && <div className="text-center py-8 text-gray-500">Đang tải...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-red-700 text-sm">{error}</div>
      )}
      {!loading && data.length === 0 && (
        <div className="text-center py-8 text-gray-500">Chưa có tin tức nào</div>
      )}

      {!loading && data.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          {currentData.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row gap-4 border-b pb-4 sm:pb-6">
              <div className="w-full sm:w-[220px] h-[180px] sm:h-[140px] flex-shrink-0 bg-gray-100 border flex items-center justify-center overflow-hidden rounded">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-sm text-center px-2">KHÔNG CÓ HÌNH</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className="text-base sm:text-lg font-semibold hover:text-green-600 cursor-pointer mb-2 leading-snug"
                  onClick={() => navigate(`/news/${item.id}`)}
                >
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{stripHtml(item.description)}</p>
                <div className="text-xs sm:text-sm text-gray-500">Tin tức từ Phòng | {item.date}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-1 sm:gap-2 mt-6 sm:mt-8 flex-wrap">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-1 border rounded text-sm ${page === 1 ? "text-gray-400 cursor-not-allowed" : "hover:bg-green-500 hover:text-white"}`}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 border rounded text-sm ${page === i + 1 ? "bg-green-600 text-white" : "hover:bg-gray-100"}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={`px-3 py-1 border rounded text-sm ${page === totalPages ? "text-gray-400 cursor-not-allowed" : "hover:bg-green-500 hover:text-white"}`}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export default DepartmentNews;
