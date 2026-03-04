import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get, ENDPOINTS } from "../../service/api";
import 'quill/dist/quill.snow.css';

const CATEGORY_COLORS = {
  'Thông tin chung về cơ sở giáo dục': 'bg-purple-600',
  'Công khai thu chi tài chính': 'bg-blue-500',
  'Điều kiện đảm bảo chất lượng hoạt động giáo dục': 'bg-orange-500',
  'Kế hoạch và kết quả hoạt động giáo dục': 'bg-green-600',
  'Báo cáo thường niên': 'bg-blue-800',
};

function PublicInfoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await get(ENDPOINTS.PUBLIC_INFO.DETAIL(id));
        setItem(resp.data);
      } catch (err) {
        setError(err.message || 'Không tìm thấy thông tin');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center text-gray-500">
        Đang tải...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm mb-4">
          {error || 'Không tìm thấy thông tin'}
        </div>
        <button onClick={() => navigate(-1)} className="text-sm text-green-700 hover:underline">
          ← Quay lại
        </button>
      </div>
    );
  }

  const catColor = CATEGORY_COLORS[item.category] || 'bg-gray-600';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumb */}
      <div className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 flex flex-wrap items-center gap-1">
        <span className="hover:text-green-600 cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
        <span>›</span>
        <span className="hover:text-green-600 cursor-pointer" onClick={() => navigate('/public-information')}>Thông tin công khai</span>
        <span>›</span>
        <span className="text-gray-800 font-medium line-clamp-1">{item.title}</span>
      </div>

      {/* Category badge */}
      <div className="mb-3">
        <span className={`inline-block px-3 py-1 rounded text-xs font-semibold text-white ${catColor}`}>
          {item.category}
        </span>
      </div>

      {/* Tiêu đề */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-snug">
        {item.title}
      </h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6">
        <span>🕒 {formatDate(item.createdAt)}</span>
        {item.author?.fullName && <span>✍ {item.author.fullName}</span>}
      </div>

      {/* Nội dung */}
      {item.description && (
        <div
          className="prose max-w-none text-gray-800 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 ql-editor"
          dangerouslySetInnerHTML={{ __html: item.description }}
        />
      )}

      {/* Tệp đính kèm */}
      {item.attachmentUrl && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
            Tệp đính kèm ({item.attachmentType === 'pdf' ? 'PDF' : 'Word'})
          </h2>
          {item.attachmentType === 'pdf' ? (
            <iframe
              src={item.attachmentUrl}
              className="w-full border border-gray-200 rounded-lg h-[320px] sm:h-[480px] md:h-[600px]"
              title="PDF Viewer"
            />
          ) : (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(item.attachmentUrl)}`}
              className="w-full border border-gray-200 rounded-lg h-[320px] sm:h-[480px] md:h-[600px]"
              title="Word Viewer"
            />
          )}
          <a
            href={item.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {item.attachmentType === 'pdf' ? '📄' : '📝'} Tải xuống tệp {item.attachmentType === 'pdf' ? 'PDF' : 'Word'}
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

export default PublicInfoDetail;
