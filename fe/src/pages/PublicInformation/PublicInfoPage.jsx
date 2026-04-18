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

const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, "");
const ITEMS_PER_PAGE = 8;

const chipBase =
  'inline-flex items-center justify-center rounded-full border px-3.5 py-2 text-xs sm:text-sm font-medium transition-all duration-200';
const chipIdle =
  'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50';
const chipActive = 'border-slate-800 bg-slate-800 text-white shadow-sm';

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <nav className="text-sm text-slate-500 mb-6 flex flex-wrap items-center gap-1.5" aria-label="Breadcrumb">
        <button type="button" className="hover:text-slate-800 transition-colors" onClick={() => navigate('/')}>
          Trang chủ
        </button>
        <span className="text-slate-300" aria-hidden>›</span>
        <span className="font-medium text-slate-800">Thông tin công khai</span>
      </nav>

      <header className="mb-8 pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Thông tin công khai
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
          Tra cứu các văn bản và thông tin được công khai theo quy định.
        </p>
      </header>

      <section aria-label="Lọc theo danh mục" className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Danh mục</p>
        <div className="hidden sm:flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`${chipBase} ${selectedCategory === '' ? chipActive : chipIdle}`}
          >
            Tất cả
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`${chipBase} max-w-full text-left sm:text-center ${selectedCategory === cat ? chipActive : chipIdle}`}
              title={cat}
            >
              <span className="line-clamp-2 sm:line-clamp-none">{cat}</span>
            </button>
          ))}
        </div>
        <div className="sm:hidden">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Tất cả danh mục</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800 mb-6" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">Đang tải…</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-500 text-sm">
          Chưa có thông tin trong mục này.
        </div>
      ) : (
        <>
          <ul className="space-y-3 list-none p-0 m-0">
            {items.map((item) => (
              <li key={item._id}>
                <article
                  className="group rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow hover:shadow-md hover:border-slate-300 cursor-pointer"
                  onClick={() => navigate(`/public-info/${item._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/public-info/${item._id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    {item.category && (
                      <span className="inline-flex w-fit rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200/80">
                        {item.category}
                      </span>
                    )}
                    <time className="text-xs text-slate-400 tabular-nums sm:shrink-0" dateTime={item.createdAt}>
                      {formatDate(item.createdAt)}
                    </time>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug group-hover:text-slate-700 line-clamp-2">
                    {item.title}
                  </h2>
                  {item.description && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {stripHtml(item.description)}
                    </p>
                  )}
                  {item.attachmentUrl && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <a
                        href={item.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.attachmentType === 'pdf' ? 'Tệp đính kèm (PDF)' : 'Tệp đính kèm (Word)'}
                      </a>
                    </div>
                  )}
                </article>
              </li>
            ))}
          </ul>

          {pagination.totalPages > 1 && (
            <nav className="flex justify-center items-center gap-1 mt-10 flex-wrap" aria-label="Phân trang">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
                className="min-w-[2.25rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                ‹
              </button>
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePageChange(i + 1)}
                  className={`min-w-[2.25rem] rounded-lg border px-3 py-2 text-sm transition-colors ${
                    page === i + 1
                      ? 'border-slate-800 bg-slate-800 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={page === pagination.totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="min-w-[2.25rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                ›
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default PublicInfoPage;
