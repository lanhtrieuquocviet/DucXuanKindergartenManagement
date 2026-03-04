import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, ENDPOINTS } from "../../service/api";

const CATEGORIES = [
  'Thông tin chung về cơ sở giáo dục',
  'Công khai thu chi tài chính',
  'Điều kiện đảm bảo chất lượng hoạt động giáo dục',
  'Kế hoạch và kết quả hoạt động giáo dục',
  'Báo cáo thường niên',
];

const CATEGORY_COLORS = {
  'Thông tin chung về cơ sở giáo dục': 'bg-purple-600',
  'Công khai thu chi tài chính': 'bg-blue-500',
  'Điều kiện đảm bảo chất lượng hoạt động giáo dục': 'bg-orange-500',
  'Kế hoạch và kết quả hoạt động giáo dục': 'bg-green-600',
  'Báo cáo thường niên': 'bg-blue-800',
};

const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, "");
const ITEMS_PER_PAGE = 8;

function PublicInfoPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const loadItems = async (cat, pg) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', pg);
      params.append('limit', ITEMS_PER_PAGE);
      if (cat) params.append('category', cat);
      const resp = await get(`${ENDPOINTS.PUBLIC_INFO.LIST}?${params.toString()}`);
      if (resp.status === 'success') {
        setItems(resp.data.items);
        setPagination(resp.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadItems(selectedCategory, 1);
  }, [selectedCategory]); // eslint-disable-line

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadItems(selectedCategory, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumb */}
      <div className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 flex flex-wrap items-center gap-1">
        <span className="hover:text-green-600 cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
        <span className="mx-1">›</span>
        <span className="font-medium text-gray-800">Thông tin công khai</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-6">Thông tin công khai</h1>

      {/* Category filter - button group (desktop) */}
      <div className="hidden sm:flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded text-sm font-medium text-white transition ${selectedCategory === '' ? 'bg-gray-800 ring-2 ring-offset-1 ring-gray-400' : 'bg-gray-500 hover:bg-gray-600'}`}
        >
          Tất cả
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-2 rounded text-xs font-medium text-white transition ${CATEGORY_COLORS[cat]} ${selectedCategory === cat ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-90 hover:opacity-100'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Category filter - native select (mobile) */}
      <div className="sm:hidden mb-5">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Tất cả danh mục</option>
          {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm mb-6">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Chưa có thông tin nào.</div>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4">
            {items.map((item) => (
              <div
                key={item._id}
                className="border border-gray-200 bg-white rounded overflow-hidden hover:shadow transition cursor-pointer"
                onClick={() => navigate(`/public-info/${item._id}`)}
              >
                {/* Category bar */}
                <div className={`${CATEGORY_COLORS[item.category] || 'bg-gray-600'} px-3 sm:px-4 py-1.5`}>
                  <span className="text-white text-xs font-medium">{item.category}</span>
                </div>
                {/* Content */}
                <div className="px-3 sm:px-4 py-3">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 hover:text-green-700 leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">
                      {stripHtml(item.description)}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>🕒 {formatDate(item.createdAt)}</span>
                    {item.attachmentUrl && (
                      <a
                        href={item.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.attachmentType === 'pdf' ? '📄 PDF' : '📝 Word'}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-1 sm:gap-2 mt-6 sm:mt-8 flex-wrap">
              <button
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
                className={`px-3 py-1 border rounded text-sm ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-green-500 hover:text-white'}`}
              >‹</button>
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1 border rounded text-sm ${page === i + 1 ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page === pagination.totalPages}
                onClick={() => handlePageChange(page + 1)}
                className={`px-3 py-1 border rounded text-sm ${page === pagination.totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-green-500 hover:text-white'}`}
              >›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PublicInfoPage;
