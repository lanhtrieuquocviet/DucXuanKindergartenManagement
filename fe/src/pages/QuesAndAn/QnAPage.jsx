import { useEffect, useState, useMemo } from "react";
import AskQuestionModal from "./AskQuestionModal";
import { get, ENDPOINTS } from "../../service/api";

export default function QnAPage() {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchQuestions = async (currentPage = 1, currentKeyword = "", currentCategory = "") => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "5",
      });

      if (currentKeyword) {
        params.set("q", currentKeyword);
      }
      if (currentCategory) {
        params.set("category", currentCategory);
      }

      const res = await get(`${ENDPOINTS.QA.QUESTIONS}?${params.toString()}`, {
        includeAuth: false,
      });

      setQuestions(res?.data?.questions || []);
      setPagination(res?.data?.pagination);
      setPage(currentPage);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(page, keyword, selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, keyword, selectedCategory]);

  const handleSubmitted = (created) => {
    setQuestions((prev) => [created, ...prev]);
  };

  // 🔥 Lọc kết hợp search + category
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchKeyword =
        !keyword ||
        q.title?.toLowerCase().includes(keyword.toLowerCase()) ||
        q.content?.toLowerCase().includes(keyword.toLowerCase());

      const matchCategory =
        !selectedCategory || q.category === selectedCategory;

      return matchKeyword && matchCategory;
    });
  }, [questions, keyword, selectedCategory]);

  // Lấy danh sách category duy nhất
  const categories = [...new Set(questions.map((q) => q.category).filter(Boolean))];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* Hàng trên */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <span className="font-medium text-sm md:text-base">Tìm kiếm theo:</span>

          <div className="w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-56 border-2 border-black rounded px-3 py-2 text-sm"
            >
              <option value="">-- Tất cả danh mục --</option>
              {categories.map((cate, index) => (
                <option key={index} value={cate}>
                  {cate}
                </option>
              ))}
            </select>
          </div>

          <div className="flex md:ml-auto w-full md:w-auto">
            <button
              onClick={() => setOpen(true)}
              className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm"
            >
              Gửi câu hỏi
            </button>
          </div>
        </div>

        {/* Hàng dưới */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
              🔍
            </span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo từ khóa"
              className="w-full border-2 border-black rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="flex w-full md:w-auto">
            <button
              onClick={() => {
                setKeyword("");
                setSelectedCategory("");
                setPage(1);
              }}
              className="w-full md:w-auto bg-red-600 text-white px-6 py-2 rounded shadow hover:bg-red-700 text-sm"
            >
              Xóa lọc
            </button>
          </div>
        </div>

        {/* Box kết quả */}
        <div className="border-2 border-black rounded min-h-[300px] md:min-h-[500px] p-3 md:p-4">
          {error && (
            <p className="text-xs text-red-600 mb-2">{error}</p>
          )}

          {!error && loading && (
            <p className="text-sm text-gray-700">Đang tải câu hỏi...</p>
          )}

          {!error && !loading && filteredQuestions.length === 0 && (
            <p className="text-sm text-gray-700">Không tìm thấy kết quả.</p>
          )}

          {!error && !loading && filteredQuestions.length > 0 && (
            <ul className="space-y-3 text-sm text-gray-800">
              {filteredQuestions.map((q) => (
                <li key={q._id} className="border-b pb-2 last:border-b-0">
                  <p className="font-semibold">{q.title}</p>

                  {/* Hiển thị category */}
                  {q.category && (
                    <p className="text-xs text-blue-600 font-medium">
                      Danh mục: {q.category}
                    </p>
                  )}

                  <p className="text-xs text-gray-500">
                    {q.email || "Ẩn danh"} •{" "}
                    {new Date(q.createdAt).toLocaleString("vi-VN")}
                  </p>

                  <p className="mt-1 whitespace-pre-wrap break-words">{q.content}</p>

                  {Array.isArray(q.answers) && q.answers.length > 0 && (
                    <div className="mt-2 border-l-4 border-green-500 pl-3 space-y-1">
                      {q.answers.map((a, idx) => (
                        <div key={idx} className="text-sm text-gray-700">
                          <span className="font-medium text-green-700">
                            {a.authorName || "Trả lời"}:
                          </span>{" "}
                          <span className="whitespace-pre-wrap">
                            {a.content}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">

          <button
            disabled={page === 1}
            onClick={() => fetchQuestions(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            {"<<"}
          </button>

          {[...Array(pagination.totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            return (
              <button
                key={pageNumber}
                onClick={() => fetchQuestions(pageNumber)}
                className={`px-3 py-1 border rounded ${pageNumber === page
                    ? "bg-blue-600 text-white"
                    : "bg-white"
                  }`}
              >
                {pageNumber}
              </button>
            );
          })}

          <button
            disabled={page === pagination.totalPages}
            onClick={() => fetchQuestions(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            {">>"}
          </button>

        </div>
      )}

      <AskQuestionModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmitted={handleSubmitted}
      />
    </div>
  );
}