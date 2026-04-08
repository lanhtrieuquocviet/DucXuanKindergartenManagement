import { useEffect, useState } from 'react';
import { get, ENDPOINTS } from '../../service/api';

export default function PhotoGallery() {
  const [photos, setPhotos] = useState([]);
  const [viewer, setViewer] = useState({ open: false, albumIndex: 0, imageIndex: 0 });

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const resp = await get(ENDPOINTS.IMAGE_LIBRARY.LIST, { includeAuth: false });
        const list = resp?.data || [];
        const normalized = list
          .filter((item) => (item?.imageUrls?.length || 0) > 0 || item?.imageUrl)
          .map((item) => ({
            title: item.title || 'Ảnh thư viện',
            images: item.imageUrls?.length > 0 ? item.imageUrls : [item.imageUrl],
            img: item.imageUrls?.[0] || item.imageUrl,
            id: item._id || item.imageUrl,
          }));
        setPhotos(normalized);
      } catch {
        setPhotos([]);
      }
    };
    loadPhotos();
  }, []);

  return (
    <div className="w-full min-h-screen bg-white px-4 sm:px-6 py-4 sm:py-6 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Thư viện ảnh</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((item, index) => (
          <div
            key={item.id || index}
            className="cursor-pointer group"
            onClick={() => setViewer({ open: true, albumIndex: index, imageIndex: 0 })}
          >
            {/* Image */}
            <div className="overflow-hidden border">
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Title */}
            <p className="mt-3 text-lg font-semibold text-center leading-relaxed group-hover:text-green-600 select-none">
              {item.title}
            </p>
          </div>
        ))}
      </div>

      {photos.length === 0 && (
        <div className="text-sm text-gray-500 mt-8 text-center">
          Chưa có ảnh nào trong thư viện.
        </div>
      )}

      {viewer.open && photos[viewer.albumIndex] && (
        <div className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{photos[viewer.albumIndex].title}</h3>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 select-none caret-transparent"
                onClick={() => setViewer((prev) => ({ ...prev, open: false }))}
              >
                X
              </button>
            </div>
            <div className="p-4">
              <img
                src={photos[viewer.albumIndex].images[viewer.imageIndex]}
                alt={photos[viewer.albumIndex].title}
                className="w-full max-h-[70vh] object-contain bg-gray-50"
              />
              {photos[viewer.albumIndex].images.length > 1 && (
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded border hover:bg-gray-50 select-none caret-transparent"
                    onClick={() =>
                      setViewer((prev) => ({
                        ...prev,
                        imageIndex:
                          (prev.imageIndex - 1 + photos[prev.albumIndex].images.length) %
                          photos[prev.albumIndex].images.length,
                      }))
                    }
                  >
                    &lt;
                  </button>
                  <span className="text-sm text-gray-600">
                    {viewer.imageIndex + 1}/{photos[viewer.albumIndex].images.length}
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded border hover:bg-gray-50 select-none caret-transparent"
                    onClick={() =>
                      setViewer((prev) => ({
                        ...prev,
                        imageIndex: (prev.imageIndex + 1) % photos[prev.albumIndex].images.length,
                      }))
                    }
                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
