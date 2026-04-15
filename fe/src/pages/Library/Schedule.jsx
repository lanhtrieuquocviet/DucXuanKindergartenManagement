import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, ENDPOINTS } from '../../service/api';

function SeasonTable({ title, activities, isActive }) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`px-4 py-3 flex items-center gap-3 ${isActive ? 'bg-indigo-600' : 'bg-gray-500'}`}>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {isActive && (
          <span className="text-xs font-bold bg-white text-indigo-600 px-2 py-0.5 rounded-full">
            Đang áp dụng
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm text-center">
          <thead className={`text-white ${isActive ? 'bg-indigo-700' : 'bg-gray-600'}`}>
            <tr>
              <th className="border border-gray-300/30 px-3 py-2 w-40 font-semibold">GIỜ</th>
              <th className="border border-gray-300/30 px-3 py-2 font-semibold">NỘI DUNG HOẠT ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan={2} className="border border-gray-200 px-3 py-6 text-gray-400 italic">
                  Chưa có hoạt động.
                </td>
              </tr>
            ) : (
              activities.map((a) => (
                <tr key={a._id} className="even:bg-gray-50">
                  <td className={`border border-gray-200 px-3 py-2 font-medium ${isActive ? 'bg-sky-50' : 'bg-gray-50'}`}>
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
}

export default function Schedule() {
  const navigate = useNavigate();
  const [activities,      setActivities]      = useState([]);
  const [effectiveSeason, setEffectiveSeason] = useState(null);
  const [yearName,        setYearName]        = useState('');
  const [loading,         setLoading]         = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await get(ENDPOINTS.TIMETABLE_PUBLIC());
        if (cancelled) return;
        if (res?.status === 'success') {
          setActivities(Array.isArray(res.data) ? res.data : []);
          setEffectiveSeason(res.effectiveSeason ?? null);
          setYearName(res.yearName || '');
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

  const grouped = useMemo(() => ({
    summer: activities.filter((a) => a.appliesToSeason === 'summer' || a.appliesToSeason === 'both'),
    winter: activities.filter((a) => a.appliesToSeason === 'winter' || a.appliesToSeason === 'both'),
  }), [activities]);

  const seasonDesc =
    effectiveSeason === 'summer' ? ' — đang áp dụng lịch mùa hè'
    : effectiveSeason === 'winter' ? ' — đang áp dụng lịch mùa đông'
    : '';

  return (
    <div className="w-full min-h-screen bg-white px-4 sm:px-6 py-4 sm:py-6 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <span className="hover:text-green-600 cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
        <span className="mx-1">›</span>
        Thư viện
        <span className="mx-1">›</span>
        <span className="text-gray-700">Thời khóa biểu</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-1">Thời gian biểu hoạt động hằng ngày</h1>
      {yearName && (
        <p className="text-sm font-medium text-indigo-600 mb-1">Năm học: {yearName}</p>
      )}
      <p className="text-gray-500 text-sm mb-6">
        Lịch đang áp dụng theo thiết lập của nhà trường{seasonDesc}.
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
        <div className="space-y-6">
          <SeasonTable
            title="MÙA HÈ"
            activities={grouped.summer}
            isActive={effectiveSeason === 'summer'}
          />
          <SeasonTable
            title="MÙA ĐÔNG"
            activities={grouped.winter}
            isActive={effectiveSeason === 'winter'}
          />
        </div>
      )}
    </div>
  );
}
