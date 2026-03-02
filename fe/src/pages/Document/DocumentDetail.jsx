import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get, ENDPOINTS } from "../../service/api";
import 'quill/dist/quill.snow.css';

function DocumentDetail() {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await get(ENDPOINTS.DOCUMENTS.DETAIL(documentId));
        setDoc(resp.data);
      } catch (err) {
        setError(err.message || "Không tìm thấy tài liệu");
      } finally {
        setLoading(false);
      }
    };
    if (documentId) load();
  }, [documentId]);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "-";

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center text-gray-500">
        Đang tải...
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 mb-4">
          {error || "Không tìm thấy tài liệu"}
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
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6 flex flex-wrap items-center gap-1">
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
          Văn bản
        </span>
        <span>›</span>
        <span className="text-gray-800 font-medium line-clamp-1">
          {doc.title}
        </span>
      </div>

      {/* Tiêu đề */}
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{doc.title}</h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6">
        <span>🕒 {formatDate(doc.createdAt)}</span>
        {doc.author?.fullName && <span>✍ {doc.author.fullName}</span>}
      </div>

      {/* Nội dung */}
      {doc.description && (
        <div
          className="prose max-w-none text-gray-800 text-base leading-relaxed mb-8 ql-editor"
          dangerouslySetInnerHTML={{ __html: doc.description }}
        />
      )}

      {/* Tệp đính kèm */}
      {doc.attachmentUrl && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Tệp đính kèm ({doc.attachmentType === "pdf" ? "PDF" : "Word"})
          </h2>
          {doc.attachmentType === "pdf" ? (
            <iframe
              src={doc.attachmentUrl}
              className="w-full border border-gray-200 rounded-lg"
              style={{ height: "600px" }}
              title="PDF Viewer"
            />
          ) : (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                doc.attachmentUrl
              )}`}
              className="w-full border border-gray-200 rounded-lg"
              style={{ height: "600px" }}
              title="Word Viewer"
            />
          )}
          <a
            href={doc.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {doc.attachmentType === "pdf" ? "📄" : "📝"} Tải xuống tệp{" "}
            {doc.attachmentType === "pdf" ? "PDF" : "Word"}
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

export default DocumentDetail;
