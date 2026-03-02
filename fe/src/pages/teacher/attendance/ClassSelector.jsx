// Màn hình chọn lớp để bắt đầu điểm danh
function ClassSelector({ classes, loadingClasses, classesError, onSelect }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Chọn lớp để điểm danh</h3>
          <p className="text-xs text-gray-500 mt-1">Chỉ hiển thị các lớp bạn phụ trách.</p>
        </div>
      </div>

      {classesError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
          {classesError}
        </div>
      )}

      {loadingClasses ? (
        <p className="text-sm text-gray-500">Đang tải danh sách lớp...</p>
      ) : classes.length === 0 ? (
        <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center">
          <p className="text-sm text-gray-600">Bạn chưa được phân công lớp nào.</p>
          <p className="text-xs text-gray-500 mt-1">Vui lòng liên hệ admin để phân công lớp cho giáo viên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {classes.map((c) => (
            <button
              key={c._id || c.id}
              type="button"
              onClick={() => onSelect(c._id || c.id)}
              className="text-left p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{c.className}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {c.gradeId?.gradeName ? `Khối: ${c.gradeId.gradeName}` : '—'}
                    {c.academicYearId?.yearName ? ` · Năm: ${c.academicYearId.yearName}` : ''}
                  </div>
                </div>
                <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full">
                  Vào điểm danh →
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClassSelector;
