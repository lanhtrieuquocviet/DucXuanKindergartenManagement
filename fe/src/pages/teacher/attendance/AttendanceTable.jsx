// Bảng danh sách điểm danh học sinh theo lớp
import { getStatusBadge, defaultRecord } from './attendanceUtils';

function AttendanceTable({
  students,
  attendanceByStudent,
  loadingStudents,
  studentsError,
  todayISO,
  selectedDate,
  onDateChange,
  onCheckin,
  onCheckout,
  onViewDetail,
  onAbsent,
  selectedClassName,
  classId,
  onBackToClassList,
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Danh sách điểm danh – theo lớp</h3>
          <p className="text-xs text-gray-500 mt-1">
            {selectedClassName ? (
              <>
                Lớp: <span className="font-semibold text-gray-700">{selectedClassName}</span>
              </>
            ) : (
              <>Lớp ID: <span className="font-semibold text-gray-700">{classId}</span></>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBackToClassList}
            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-200 transition-colors"
          >
            ← Chọn lớp khác
          </button>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700">Ngày</label>
            <input
              type="date"
              value={selectedDate}
              max={todayISO}
              onChange={(e) => onDateChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {studentsError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
          {studentsError}
        </div>
      )}

      {loadingStudents ? (
        <p className="text-sm text-gray-500">Đang tải danh sách học sinh...</p>
      ) : (
        <>
        {/* ── Mobile card view (ẩn trên tablet trở lên) ── */}
        <div className="md:hidden space-y-3">
          {(students || []).map((s, idx) => {
            const rec = attendanceByStudent?.[s._id] || defaultRecord();
            const badge = getStatusBadge(rec.status);
            const canCheckIn = rec.status === 'empty' || rec.status === 'absent';
            const canCheckOut =
              rec.status === 'checked_in' ||
              rec.status === 'waiting_parent' ||
              rec.status === 'parent_confirmed';
            return (
              <div key={s._id} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <span className="text-xs text-gray-400 mr-1">{idx + 1}.</span>
                    <span className="text-sm font-semibold text-gray-900">{s.fullName || '—'}</span>
                  </div>
                  <span className={`shrink-0 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${badge.cls}`}>
                    {badge.text}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-gray-600 mb-2">
                  <span>Đến: <span className="font-medium text-gray-800">{rec.timeIn || '—'}</span></span>
                  <span>Về: <span className="font-medium text-gray-800">{rec.timeOut || '—'}</span></span>
                </div>
                {rec.note && (
                  <p className="text-xs text-gray-500 truncate mb-2" title={rec.note}>{rec.note}</p>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                  {canCheckIn && (
                    <button
                      type="button"
                      onClick={() => onCheckin(s._id)}
                      className="py-1.5 text-xs font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      Check in
                    </button>
                  )}
                  {canCheckOut && (
                    <button
                      type="button"
                      onClick={() => onCheckout(s._id)}
                      className="py-1.5 text-xs font-semibold rounded-md bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                    >
                      Check-out
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onViewDetail(s._id)}
                    className="py-1.5 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    Chi tiết
                  </button>
                  <button
                    type="button"
                    onClick={() => onAbsent(s._id)}
                    className="py-1.5 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Vắng mặt
                  </button>
                </div>
              </div>
            );
          })}
          {(students || []).length === 0 && (
            <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center">
              <p className="text-sm text-gray-600">Lớp chưa có học sinh.</p>
            </div>
          )}
        </div>

        {/* ── Desktop table view (ẩn trên mobile) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-800 w-[70px]">STT</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Họ tên</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Giờ đến</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Giờ về</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Ghi chú</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-800 min-w-[220px]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(students || []).map((s, idx) => {
                const rec = attendanceByStudent?.[s._id] || defaultRecord();
                const badge = getStatusBadge(rec.status);
                const canCheckIn = rec.status === 'empty' || rec.status === 'absent';
                const canCheckOut =
                  rec.status === 'checked_in' ||
                  rec.status === 'waiting_parent' ||
                  rec.status === 'parent_confirmed';
                return (
                  <tr key={s._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.fullName || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${badge.cls}`}>
                        {badge.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{rec.timeIn || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{rec.timeOut || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="max-w-xs truncate" title={rec.note || ''}>
                        {rec.note || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {canCheckIn && (
                          <button
                            type="button"
                            onClick={() => onCheckin(s._id)}
                            className="px-3 py-2 text-xs font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                          >
                            Check in
                          </button>
                        )}
                        {canCheckOut && (
                          <button
                            type="button"
                            onClick={() => onCheckout(s._id)}
                            className="px-3 py-2 text-xs font-semibold rounded-md bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                          >
                            Check-out
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewDetail(s._id)}
                          className="px-3 py-2 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => onAbsent(s._id)}
                          className="px-3 py-2 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                          Vắng mặt
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(students || []).length === 0 && (
            <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center mt-4">
              <p className="text-sm text-gray-600">Lớp chưa có học sinh.</p>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}

export default AttendanceTable;
