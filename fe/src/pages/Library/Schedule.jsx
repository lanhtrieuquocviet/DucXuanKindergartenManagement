import { useEffect, useState } from 'react';
import { get, ENDPOINTS } from '../../service/api';

export default function Schedule() {
  const [activities, setActivities] = useState([]);
  const [effectiveSeason, setEffectiveSeason] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await get(ENDPOINTS.TIMETABLE_PUBLIC(), { includeAuth: false });
        if (cancelled) return;
        if (res?.status === 'success') {
          setActivities(Array.isArray(res.data) ? res.data : []);
          setEffectiveSeason(res.effectiveSeason ?? null);
        }
      } catch (_) {
        if (!cancelled) {
          setActivities([]);
          setEffectiveSeason(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const seasonHeading =
    effectiveSeason === 'winter' ? 'MÙA ĐÔNG' : effectiveSeason === 'summer' ? 'MÙA HÈ' : 'THỜI GIAN BIỂU';

  const renderSeasonTable = (title, list) => {
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-indigo-600 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-center">
            <thead className="bg-indigo-700 text-white">
              <tr>
                <th className="border border-indigo-600 px-3 py-2 w-40 font-semibold">GIỜ</th>
                <th className="border border-indigo-600 px-3 py-2 font-semibold">NỘI DUNG HOẠT ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={2} className="border border-gray-200 px-3 py-6 text-gray-500">
                    Chưa có hoạt động.
                  </td>
                </tr>
              ) : (
                list.map((a) => (
                  <tr key={a._id} className="even:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2 font-medium bg-sky-50">
                      {a.startLabel} - {a.endLabel}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-800 text-left">
                      {a.content || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-white px-4 sm:px-6 py-4 sm:py-6 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Thời khóa biểu</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-2">Thời gian biểu hoạt động hằng ngày</h1>
      <p className="text-gray-600 text-sm mb-6">
        Lịch đang áp dụng theo thiết lập của nhà trường
        {effectiveSeason === 'summer' && ' (mùa hè)'}
        {effectiveSeason === 'winter' && ' (mùa đông)'}
        .
      </p>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500">
          Đang tải...
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500">
          Chưa có thời khóa biểu nào. Nhà trường sẽ cập nhật tại mục Quản lý năm học → Thời khóa biểu.
        </div>
      ) : (
        <div>{renderSeasonTable(seasonHeading, activities)}</div>
      )}
    </div>
  );
}
