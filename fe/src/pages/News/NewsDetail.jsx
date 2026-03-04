import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get, ENDPOINTS } from "../../service/api";
import 'quill/dist/quill.snow.css';

function NewsDetail() {
  const { blogId } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await get(ENDPOINTS.BLOGS.DETAIL(blogId));
        setBlog(resp.data);
      } catch (err) {
        setError(err.message || "Không tìm thấy bài viết");
      } finally {
        setLoading(false);
      }
    };
    if (blogId) load();
  }, [blogId]);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "-";

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center text-gray-500">
        Đang tải...
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 mb-4 text-sm">
          {error || "Không tìm thấy bài viết"}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-green-700 hover:underline"
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumb */}
      <div className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 flex flex-wrap items-center gap-1">
        <span
          className="hover:text-green-600 cursor-pointer"
          onClick={() => navigate("/")}
        >
          Trang chủ
        </span>
        <span>›</span>
        <span
          className="hover:text-green-600 cursor-pointer"
          onClick={() => navigate(-1)}
        >
          {blog.category?.name || "Tin tức"}
        </span>
        <span>›</span>
        <span className="text-gray-800 font-medium line-clamp-1">
          {blog.code}
        </span>
      </div>

      {/* Tiêu đề */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-snug">
        {blog.code}
      </h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6">
        {blog.category?.name && (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-green-700 font-medium text-xs">
            {blog.category.name}
          </span>
        )}
        <span>🕒 {formatDate(blog.createdAt)}</span>
        {blog.author?.fullName && <span>✍ {blog.author.fullName}</span>}
      </div>

      {/* Ảnh chính (nếu có) */}
      {blog.images && blog.images.length > 0 && (
        <div className="mb-5 sm:mb-6">
          <img
            src={blog.images[selectedImageIdx]}
            alt={blog.code}
            className="w-full max-h-[260px] sm:max-h-[420px] object-cover rounded-lg shadow"
          />
          {blog.images.length > 1 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {blog.images.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`${idx + 1}`}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-14 h-14 sm:w-20 sm:h-20 object-cover rounded cursor-pointer border-2 transition ${
                    selectedImageIdx === idx
                      ? "border-green-500 scale-105"
                      : "border-transparent hover:border-gray-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nội dung */}
      <div
        className="prose max-w-none text-gray-800 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 ql-editor"
        dangerouslySetInnerHTML={{ __html: blog.description || '' }}
      />

      {/* Tệp đính kèm */}
      {blog.attachmentUrl && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
            Tệp đính kèm ({blog.attachmentType === "pdf" ? "PDF" : "Word"})
          </h2>
          {blog.attachmentType === "pdf" ? (
            <iframe
              src={blog.attachmentUrl}
              className="w-full border border-gray-200 rounded-lg h-[320px] sm:h-[480px] md:h-[600px]"
              title="PDF Viewer"
            />
          ) : (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                blog.attachmentUrl
              )}`}
              className="w-full border border-gray-200 rounded-lg h-[320px] sm:h-[480px] md:h-[600px]"
              title="Word Viewer"
            />
          )}
          <a
            href={blog.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {blog.attachmentType === "pdf" ? "📄" : "📝"} Tải xuống tệp{" "}
            {blog.attachmentType === "pdf" ? "PDF" : "Word"}
          </a>
        </div>
      )}

      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-900 border border-green-200 rounded-lg px-4 py-2 hover:bg-green-50 transition"
      >
        ← Quay lại
      </button>
    </div>
  );
}

export default NewsDetail;
