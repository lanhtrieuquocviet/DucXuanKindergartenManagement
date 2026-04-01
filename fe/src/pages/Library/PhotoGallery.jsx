import { useEffect, useState } from 'react';
import { get, ENDPOINTS } from '../../service/api';

export default function PhotoGallery() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const resp = await get(ENDPOINTS.IMAGE_LIBRARY.LIST, { includeAuth: false });
        const list = resp?.data || [];
        const normalized = list
          .filter((item) => item?.imageUrl)
          .map((item) => ({
            title: item.title || 'Ảnh thư viện',
            img: item.imageUrl,
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
            <p className="mt-3 text-lg font-semibold text-center leading-relaxed group-hover:text-green-600">
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
    </div>
  );
}
