import { useEffect, useState } from 'react';
import { get, ENDPOINTS } from '../../service/api';

const DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const ROWS = [
  { key: 'sang', label: 'Sáng' },
  { key: 'chieu', label: 'Chiều' },
];

export default function Schedule() {
  const [timetablesByGrade, setTimetablesByGrade] = useState({});
  const [gradeNames, setGradeNames] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await get(ENDPOINTS.TIMETABLE_PUBLIC(), { includeAuth: false });
        if (cancelled) return;
        if (res?.status === 'success') {
          const byGrade = {};
          (res.data || []).forEach((item) => {
            const id = String(item.gradeId?._id ?? item.gradeId);
            if (id) {
              byGrade[id] = {
                sang: Array.isArray(item.sang) ? item.sang.slice(0, 6) : ['', '', '', '', '', ''],
                chieu: Array.isArray(item.chieu) ? item.chieu.slice(0, 6) : ['', '', '', '', '', ''],
              };
              while (byGrade[id].sang.length < 6) byGrade[id].sang.push('');
              while (byGrade[id].chieu.length < 6) byGrade[id].chieu.push('');
            }
          });
          setTimetablesByGrade(byGrade);
          setGradeNames(res.gradeNames || {});
        }
      } catch (_) {
        if (!cancelled) {
          setTimetablesByGrade({});
          setGradeNames({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const entries = Object.entries(timetablesByGrade).filter(
    ([_, t]) => t?.sang?.length === 6 && t?.chieu?.length === 6
  );

  return (
    <div className="w-full min-h-screen bg-white px-4 sm:px-6 py-4 sm:py-6 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Thời khóa biểu</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-2">
        Thời khóa biểu các khối
      </h1>
      <p className="text-gray-600 text-sm mb-6">
        Thời khóa biểu theo từng khối lớp do nhà trường thiết lập.
      </p>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500">
          Đang tải...
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500">
          Chưa có thời khóa biểu nào. Nhà trường sẽ cập nhật tại mục Quản lý năm học → Thời khóa biểu.
        </div>
      ) : (
        <div className="space-y-8">
          {entries.map(([gradeId, timetable]) => {
            const gradeName = gradeNames[gradeId] || `Khối ${gradeId.slice(-4)}`;
            return (
              <div key={gradeId} className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-indigo-600 px-4 py-3">
                  <h2 className="text-lg font-semibold text-white">
                    Thời khóa biểu khối {gradeName}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm text-center">
                    <thead className="bg-indigo-700 text-white">
                      <tr>
                        <th className="border border-indigo-600 px-3 py-2 w-24 font-semibold">Buổi</th>
                        {DAYS.map((d) => (
                          <th key={d} className="border border-indigo-600 px-3 py-2 font-semibold">
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ROWS.map((row) => (
                        <tr key={row.key} className="even:bg-gray-50">
                          <td className="border border-gray-200 px-3 py-2 font-medium bg-sky-50">
                            {row.label}
                          </td>
                          {(timetable[row.key] || Array(6).fill('')).map((cell, i) => (
                            <td key={i} className="border border-gray-200 px-3 py-2 align-middle">
                              {cell || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
