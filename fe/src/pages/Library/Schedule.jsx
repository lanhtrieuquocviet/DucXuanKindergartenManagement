import { useMemo } from 'react';

const STORAGE_KEY = 'school_timetable_by_grade';
const DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const ROWS = [
  { key: 'sang', label: 'Sáng' },
  { key: 'chieu', label: 'Chiều' },
];

function getTimetablesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: {}, gradeNames: {} };
    const parsed = JSON.parse(raw);
    if (parsed?.data && typeof parsed.data === 'object') {
      return { data: parsed.data, gradeNames: parsed.gradeNames || {} };
    }
    return { data: parsed || {}, gradeNames: {} };
  } catch (_) {
    return { data: {}, gradeNames: {} };
  }
}

export default function Schedule() {
  const { data: timetablesByGrade, gradeNames } = useMemo(() => getTimetablesFromStorage(), []);

  const entries = useMemo(() => {
    return Object.entries(timetablesByGrade).filter(
      ([_, t]) => t?.sang?.length === 6 && t?.chieu?.length === 6
    );
  }, [timetablesByGrade]);

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

      {entries.length === 0 ? (
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
