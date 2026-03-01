import { useState, useEffect } from "react";
import { get, ENDPOINTS } from "../../service/api";

function ExtracurricularActivities() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const resp = await get(ENDPOINTS.BLOGS.CATEGORIES);
        const list = resp.data || resp;
        const cat = list.find((c) => c.name === 'Hoạt động ngoại khóa');
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
        setError(err.message || 'Lỗi khi tải hoạt động');
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

  const currentData = data.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-sm text-gray-600 mb-6">
        Trang chủ <span className="mx-2">›</span>
        Tin tức <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">
          Hoạt động ngoại khóa
        </span>
      </div>

      <h1 className="text-3xl font-bold mb-8">Hoạt động ngoại khóa</h1>

      {loading && (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-red-700">
          {error}
        </div>
      )}
      {!loading && data.length === 0 && (
        <div className="text-center py-8 text-gray-500">Chưa có hoạt động nào</div>
      )}

      {!loading && data.length > 0 && (
      <div className="space-y-6">
        {currentData.map((item) => (
          <div key={item.id} className="flex gap-6 border-b pb-6">
            <div className="w-[220px] h-[140px] border bg-gray-100 flex items-center justify-center">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">KHÔNG CÓ HÌNH</span>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold hover:text-green-600 cursor-pointer mb-2">
                {item.title}
              </h3>
              <p className="text-gray-700 mb-2 line-clamp-2">{item.description}</p>
              <div className="text-sm text-gray-500">
                Hoạt động ngoại khóa | {item.date}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 border rounded ${
              page === i + 1
                ? "bg-green-600 text-white"
                : "hover:bg-gray-100"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ExtracurricularActivities;
