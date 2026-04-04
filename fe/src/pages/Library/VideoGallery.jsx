import { useEffect, useState } from 'react';
import { get, ENDPOINTS } from '../../service/api';

export default function VideoGallery() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await get(ENDPOINTS.VIDEO_LIBRARY.LIST, { includeAuth: false });
        const list = resp?.data || [];
        setVideos(
          list
            .filter((v) => v?.thumbnailUrl && v?.videoUrl)
            .map((v) => ({
              title: v.title || 'Video',
              thumbnail: v.thumbnailUrl,
              url: v.videoUrl,
              id: v._id,
            }))
        );
      } catch {
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="w-full min-h-screen bg-white px-4 sm:px-6 py-4 sm:py-6 text-gray-800">
      <div className="text-sm text-gray-500 mb-4">
        Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Video clip</span>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-12">Đang tải...</p>
      ) : videos.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Chưa có video-clip nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((item) => (
            <a
              key={item.id || item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden border">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed group-hover:text-green-600">{item.title}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
