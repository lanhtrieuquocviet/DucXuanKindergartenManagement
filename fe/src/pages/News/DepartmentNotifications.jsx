import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, ENDPOINTS } from "../../service/api";

const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, "");

function DepartmentNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const resp = await get(ENDPOINTS.BLOGS.CATEGORIES);
        const list = resp.data || resp;
        const cat = list.find((c) => c.name === 'Thông báo từ Phòng');
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
          date: new Date(blog.createdAt).toLocaleDateString('vi-VN'),
          summary: blog.description,
        }));
        setNotifications(mapped);
      } catch (err) {
        setError(err.message || 'Lỗi khi tải thông báo');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [categoryId]);

  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);
  const totalPage = Math.ceil(notifications.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const data = notifications.slice(start, start + PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs sm:text-sm text-gray-600 flex flex-wrap items-center gap-1">
        <span className="hover:text-green-600 cursor-pointer" onClick={() => navigate("/")}>Trang chủ</span>
        <span className="mx-1">›</span>
        <span className="hover:text-green-600 cursor-pointer">Tin tức</span>
        <span className="mx-1">›</span>
        <span className="font-medium text-gray-800">Thông báo từ Phòng</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Thông báo từ Phòng</h1>

      {loading && <div className="text-center py-8 text-gray-500">Đang tải...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">{error}</div>
      )}
      {!loading && notifications.length === 0 && (
        <div className="text-center py-8 text-gray-500">Chưa có thông báo nào</div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          {data.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg bg-white p-4 sm:p-5 hover:shadow transition cursor-pointer"
              onClick={() => navigate(`/news/${item.id}`)}
            >
              <h3 className="text-base sm:text-lg font-semibold text-green-700 hover:underline leading-snug">
                {item.title}
              </h3>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Ngày ban hành: {item.date}</div>
              <p className="text-sm text-gray-700 mt-2 sm:mt-3 line-clamp-3">{stripHtml(item.summary)}</p>
            </div>
          ))}
        </div>
      )}

      {totalPage > 1 && (
        <div className="flex justify-center gap-1 sm:gap-2 pt-4 flex-wrap">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-1 border rounded text-sm ${page === 1 ? "text-gray-400 cursor-not-allowed" : "hover:bg-green-500 hover:text-white"}`}
          >
            ‹
          </button>
          {Array.from({ length: totalPage }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-4 py-1 border rounded text-sm ${page === i + 1 ? "bg-green-600 text-white" : "bg-white hover:bg-gray-100"}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page === totalPage}
            onClick={() => setPage(page + 1)}
            className={`px-3 py-1 border rounded text-sm ${page === totalPage ? "text-gray-400 cursor-not-allowed" : "hover:bg-green-500 hover:text-white"}`}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export default DepartmentNotifications;
