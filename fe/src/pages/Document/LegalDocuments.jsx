import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get, ENDPOINTS } from "../../service/api";

const ITEMS_PER_PAGE = 10;

function LegalDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const loadDocuments = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", ITEMS_PER_PAGE);
      params.append("category", "văn bản pháp quy");
      const resp = await get(`${ENDPOINTS.DOCUMENTS.PUBLISHED}?${params.toString()}`);
      if (resp.status === "success") {
        setDocuments(resp.data.items);
        setPagination(resp.data.pagination);
      } else {
        setError("Không tải được danh sách văn bản");
      }
    } catch (err) {
      setError(err.message || "Không tải được danh sách văn bản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments(1);
  }, []);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "---";

  const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, "");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumb */}
      <div className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 flex flex-wrap items-center gap-1">
        <span
          className="hover:text-green-600 cursor-pointer"
          onClick={() => navigate("/")}
        >
          Trang chủ
        </span>
        <span className="mx-1">›</span>
        Văn bản
        <span className="mx-1">›</span>
        <span className="font-medium text-gray-800">Văn bản pháp quy</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-6">Văn bản pháp quy</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Chưa có văn bản nào.
        </div>
      ) : (
        <>
          <div className="space-y-4 sm:space-y-5">
            {documents.map((item) => (
              <div
                key={item._id}
                className="border border-gray-300 bg-white overflow-hidden rounded"
              >
                {/* Header */}
                <div
                  className="bg-gray-100 px-3 sm:px-4 py-2 font-semibold text-gray-800 flex items-start gap-2 cursor-pointer hover:bg-gray-200 transition text-sm sm:text-base"
                  onClick={() => navigate(`/documents/${item._id}`)}
                >
                  <span className="text-orange-500 mt-0.5 shrink-0">➤</span>
                  <span className="line-clamp-2">{item.title}</span>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-3 sm:px-4 py-3 text-sm">
                  {/* Left */}
                  <div className="md:col-span-2 text-gray-700">
                    {item.description ? (
                      <p className="line-clamp-2 mb-2 text-xs sm:text-sm">
                        {stripHtml(item.description)}
                      </p>
                    ) : null}
                    {item.attachmentUrl ? (
                      <a
                        href={item.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 text-xs sm:text-sm"
                      >
                        {item.attachmentType === "pdf" ? "📄" : "📝"} File đính kèm
                      </a>
                    ) : (
                      <button
                        onClick={() => navigate(`/documents/${item._id}`)}
                        className="text-blue-600 hover:underline text-xs sm:text-sm"
                      >
                        Xem chi tiết
                      </button>
                    )}
                  </div>

                  {/* Right */}
                  <div className="space-y-1 text-gray-700 text-xs sm:text-sm pt-2 md:pt-0 border-t md:border-t-0">
                    <div>
                      Ngày đăng:{" "}
                      <span className="text-green-600">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    {item.author?.fullName && (
                      <div>Tác giả: {item.author.fullName}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-1 sm:gap-2 mt-6 sm:mt-8 flex-wrap">
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => loadDocuments(i + 1)}
                  className={`px-3 py-1 border rounded text-sm ${
                    pagination.page === i + 1
                      ? "bg-green-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LegalDocuments;
