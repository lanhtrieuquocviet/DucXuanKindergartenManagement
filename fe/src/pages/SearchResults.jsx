import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { get, ENDPOINTS } from '../service/api';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function SearchResults() {
  const query = useQuery();
  const q = query.get('q') || '';
  const pageParam = parseInt(query.get('page') || '1', 10) || 1;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: pageParam, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    const fetch = async () => {
      if (!q || q.trim().length < 1) {
        setResults([]);
        setPagination((p) => ({ ...p, total: 0, totalPages: 1 }));
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const resp = await get(
          `${ENDPOINTS.BLOGS.PUBLISHED}?search=${encodeURIComponent(q.trim())}&page=${pageParam}&limit=${pagination.limit}`,
          { includeAuth: false }
        );
        const data = resp.data || {};
        setResults(data.items || []);
        setPagination((p) => ({ ...p, page: data.pagination?.page || pageParam, limit: data.pagination?.limit || p.limit, total: data.pagination?.total || 0, totalPages: data.pagination?.totalPages || 1 }));
      } catch (err) {
        setError(err.message || 'Lỗi khi tìm kiếm');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pageParam]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="text-sm text-gray-600 mb-6">
        Trang chủ <span className="mx-2">›</span>
        Kết quả tìm kiếm
      </div>

      <h1 className="text-2xl font-bold mb-4">Kết quả tìm kiếm cho "{q}"</h1>

      {loading && <div className="text-center py-8 text-gray-500">Đang tìm...</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-red-700">{error}</div>}

      {!loading && results.length === 0 && (
        <div className="text-center py-8 text-gray-500">Không tìm thấy bài viết phù hợp</div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-6">
          {results.map((b) => (
            <div key={b._id} className="flex flex-col sm:flex-row gap-4 sm:gap-6 border-b pb-5 sm:pb-6">
              <div className="w-full sm:w-[220px] h-[180px] sm:h-[140px] sm:flex-shrink-0 bg-gray-100 border flex items-center justify-center">
                {b.images && b.images.length > 0 ? (
                  <img src={b.images[0]} alt={b.code} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 text-sm text-center">KHÔNG CÓ HÌNH</div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{b.code || 'Không tên'}</h3>
                <p className="text-gray-700 mb-3 line-clamp-2">{b.description}</p>
                <div className="text-sm text-gray-500 flex items-center gap-4">
                  <span>🏷 {b.category?.name || ''}</span>
                  <span>🕒 {new Date(b.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Link
            to={`/search?q=${encodeURIComponent(q)}&page=${Math.max(1, pagination.page - 1)}`}
            className={`px-3 py-1 border rounded ${pagination.page === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-green-500 hover:text-white'}`}
          >
            ‹
          </Link>

          {Array.from({ length: pagination.totalPages }).map((_, idx) => {
            const p = idx + 1;
            return (
              <Link
                key={p}
                to={`/search?q=${encodeURIComponent(q)}&page=${p}`}
                className={`px-3 py-1 border rounded ${pagination.page === p ? 'bg-green-600 text-white' : 'hover:bg-green-100'}`}
              >
                {p}
              </Link>
            );
          })}

          <Link
            to={`/search?q=${encodeURIComponent(q)}&page=${Math.min(pagination.totalPages, pagination.page + 1)}`}
            className={`px-3 py-1 border rounded ${pagination.page === pagination.totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-green-500 hover:text-white'}`}
          >
            ›
          </Link>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
