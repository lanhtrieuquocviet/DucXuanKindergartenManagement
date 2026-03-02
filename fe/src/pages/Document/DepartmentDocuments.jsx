import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get, ENDPOINTS } from "../../service/api";

const ITEMS_PER_PAGE = 10;

function DepartmentDocuments() {
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-6">
        <span
          className="hover:text-green-600 cursor-pointer"
          onClick={() => navigate("/")}
        >
          Trang chủ
        </span>
        <span className="mx-2">›</span>
        Văn bản <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">Văn bản từ Phòng</span>
      </div>

      <h1 className="text-3xl font-bold mb-8">Văn bản từ Phòng</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 mb-6">
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
          <div className="space-y-6">
            {documents.map((item) => (
              <div key={item._id} className="border rounded">
                {/* Header */}
                <div
                  className="bg-gray-100 px-4 py-3 font-semibold text-red-600 flex items-center gap-2 cursor-pointer hover:bg-gray-200 transition"
                  onClick={() => navigate(`/documents/${item._id}`)}
                >
                  <span>⭕</span>
                  {item.title}
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 text-sm">
                  {/* Left */}
                  <div className="md:col-span-2">
                    {item.description && (
                      <p className="text-gray-600 line-clamp-2 mb-2">
                        {item.description.replace(/<[^>]*>/g, "")}
                      </p>
                    )}
                    {item.attachmentUrl ? (
                      <a
                        href={item.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        {item.attachmentType === "pdf" ? "📄" : "📝"} File đính kèm
                      </a>
                    ) : (
                      <button
                        onClick={() => navigate(`/documents/${item._id}`)}
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Xem chi tiết
                      </button>
                    )}
                  </div>

                  {/* Right */}
                  <div className="border-l pl-4 space-y-1">
                    <div>
                      Ngày đăng:{" "}
                      <span className="text-green-600 font-medium">
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
            <div className="flex justify-center gap-2 mt-8">
              <button
                disabled={pagination.page === 1}
                onClick={() => loadDocuments(pagination.page - 1)}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                ‹
              </button>
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => loadDocuments(i + 1)}
                  className={`px-3 py-1 border rounded ${
                    pagination.page === i + 1
                      ? "bg-green-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => loadDocuments(pagination.page + 1)}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DepartmentDocuments;
