import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, ENDPOINTS } from "../../service/api";

const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, "");

function SchoolNews() {
  const navigate = useNavigate();
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const resp = await get(ENDPOINTS.BLOGS.CATEGORIES);
        const list = resp.data || resp;
        const cat = list.find((c) => c.name === 'Bản tin trường');
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
          category: blog.category?.name || '',
          image: blog.images && blog.images.length > 0 ? blog.images[0] : null,
        }));
        setNewsData(mapped);
      } catch (err) {
        setError(err.message || 'Lỗi khi tải tin tức');
        setNewsData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [categoryId]);

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(newsData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentNews = newsData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumb */}
      <div className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 flex flex-wrap items-center gap-1">
        <span className="hover:text-green-600 cursor-pointer" onClick={() => navigate("/")}>Trang chủ</span>
        <span className="mx-1">›</span>
        Tin tức
        <span className="mx-1">›</span>
        <span className="font-medium text-gray-800">Bản tin trường</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Bản tin trường</h1>

      {loading && <div className="text-center py-8 text-gray-500">Đang tải...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-red-700 text-sm">{error}</div>
      )}
      {!loading && newsData.length === 0 && (
        <div className="text-center py-8 text-gray-500">Chưa có bản tin nào</div>
      )}

      {!loading && newsData.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          {currentNews.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row gap-4 border-b pb-4 sm:pb-6">
              {/* Ảnh */}
              <div className="w-full sm:w-[220px] h-[180px] sm:h-[140px] flex-shrink-0 bg-gray-100 border flex items-center justify-center overflow-hidden rounded">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-sm text-center px-2">KHÔNG CÓ HÌNH</span>
                )}
              </div>

              {/* Nội dung */}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-base sm:text-lg font-semibold mb-2 hover:text-green-600 cursor-pointer leading-snug"
                  onClick={() => navigate(`/news/${item.id}`)}
                >
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{stripHtml(item.description)}</p>
                <div className="text-xs sm:text-sm text-gray-500 flex flex-wrap items-center gap-2 sm:gap-4">
                  <span>🏷 {item.category}</span>
                  <span>🕒 {item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 sm:gap-2 mt-6 sm:mt-8 flex-wrap">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className={`px-3 py-1 border rounded text-sm ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "hover:bg-green-500 hover:text-white"}`}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-3 py-1 border rounded text-sm ${currentPage === index + 1 ? "bg-green-600 text-white" : "hover:bg-green-100"}`}
            >
              {index + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className={`px-3 py-1 border rounded text-sm ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "hover:bg-green-500 hover:text-white"}`}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export default SchoolNews;
