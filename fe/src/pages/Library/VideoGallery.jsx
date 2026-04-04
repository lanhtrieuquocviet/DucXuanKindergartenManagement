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
              className="group block cursor-pointer select-none caret-transparent outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 rounded"
            >
              <div className="relative overflow-hidden rounded-md shadow-sm ring-1 ring-gray-200">
                <img
                  src={item.thumbnail}
                  alt=""
                  className="block w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-center text-lg font-semibold leading-snug text-gray-800 group-hover:text-green-600 sm:text-xl">
                {item.title}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
