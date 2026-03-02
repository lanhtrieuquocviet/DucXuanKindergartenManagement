// Modal đánh vắng mặt học sinh + dialog xác nhận
import ConfirmDialog from '../../../components/ConfirmDialog';
import { ABSENT_REASONS, MAX_NOTE_LEN, sanitizeMultiLineText } from './attendanceUtils';

function AbsentModal({
  isOpen,
  studentId,
  students,
  absentForm,
  setAbsentForm,
  absentError,
  onSubmit,
  onClose,
  isConfirmOpen,
  selectedDate,
  onConfirm,
  onCancelConfirm,
}) {
  const studentName = students.find((s) => s._id === studentId)?.fullName || studentId || '';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="border-b px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Học sinh vắng mặt</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-red-600 hover:text-red-800"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-5">
              {absentError && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
                  {absentError}
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-3">
                  Học sinh:{' '}
                  <span className="font-semibold text-gray-900">{studentName}</span>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Lý do</label>
                <select
                  value={absentForm.reason}
                  onChange={(e) => setAbsentForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">--Chọn--</option>
                  {ABSENT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Ghi chú</label>
                <textarea
                  rows={4}
                  value={absentForm.note}
                  onChange={(e) =>
                    setAbsentForm((prev) => ({
                      ...prev,
                      note: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                    }))
                  }
                  placeholder="Nhập ghi chú nếu có"
                  maxLength={MAX_NOTE_LEN}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        title="Xác nhận lưu vắng mặt"
        message={`Bạn có chắc muốn lưu vắng mặt cho học sinh "${studentName}" vào ngày ${selectedDate}?`}
        confirmText="Lưu"
        cancelText="Hủy"
        onConfirm={onConfirm}
        onCancel={onCancelConfirm}
      />
    </>
  );
}

export default AbsentModal;
