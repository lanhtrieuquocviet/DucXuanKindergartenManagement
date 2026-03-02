// Modal chi tiết điểm danh: hỗ trợ 3 chế độ view / checkin / checkout
import { signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../../config/firebase';
import { post, postFormData, ENDPOINTS } from '../../../service/api';
import {
  formatPhoneForFirebase,
  sanitizeSingleLineText,
  sanitizeMultiLineText,
  MAX_NOTE_LEN,
  MAX_BELONGINGS_NOTE_LEN,
  MAX_PERSON_NAME_LEN,
  MAX_PERSON_PHONE_LEN,
} from './attendanceUtils';

// Helper hiển thị ảnh preview (URL hoặc tên file)
const renderImagePreview = (imageValue, altText) => {
  if (!imageValue) return null;
  if (!/^https?:\/\//i.test(imageValue)) {
    return <p className="mt-1 text-xs text-gray-500">Đã chọn: {imageValue}</p>;
  }
  return (
    <a href={imageValue} target="_blank" rel="noreferrer" className="mt-2 inline-block">
      <img
        src={imageValue}
        alt={altText}
        className="h-20 w-20 rounded border border-gray-200 object-cover"
      />
    </a>
  );
};

// ── OTP Section dùng chung cho cả checkin và checkout ──
// Phải định nghĩa bên ngoài component cha để tránh bị unmount/remount khi re-render
function OtpSection({ radioName, mode, detailForm, setDetailForm, student, onSendOtp, otpTimeLeft, otpExpired, onResetOtp }) {
  return (
    <div className={mode === 'checkin' ? 'md:col-span-2 border-t border-gray-100 pt-4 mt-2' : 'border-t border-gray-100 pt-4'}>
      <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span>📱</span>
        Phương thức gửi OTP
      </p>

      <div className="space-y-3 mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            name={radioName}
            checked={detailForm.sendOtpSchoolAccount || false}
            onChange={() =>
              setDetailForm((prev) => ({ ...prev, sendOtpSchoolAccount: true, sendOtpViaSms: false }))
            }
          />
          Tài khoản trường cấp
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            name={radioName}
            checked={detailForm.sendOtpViaSms || false}
            onChange={() =>
              setDetailForm((prev) => ({ ...prev, sendOtpSchoolAccount: false, sendOtpViaSms: true }))
            }
          />
          Gửi qua SMS
        </label>
      </div>

      {(detailForm.sendOtpSchoolAccount || detailForm.sendOtpViaSms) && (
        <>
          {detailForm.sendOtpViaSms && (
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Chọn phụ huynh nhận SMS</label>
              <select
                value={detailForm.selectedParentForOtp || ''}
                onChange={(e) =>
                  setDetailForm((prev) => ({ ...prev, selectedParentForOtp: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">--Chọn--</option>
                {student?.parentId?.phone && (
                  <option value={student.parentId.phone}>
                    {student.parentId.fullName || 'Phụ huynh'} - {student.parentId.phone}
                  </option>
                )}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onSendOtp}
            disabled={detailForm.otpSent && !otpExpired}
            className={`w-full px-3 py-2 text-sm font-semibold text-white rounded-md transition-colors mb-3 ${
              detailForm.otpSent && !otpExpired
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {detailForm.otpSent && !otpExpired ? `Đã gửi (${Math.floor(otpTimeLeft / 60)}:${String(otpTimeLeft % 60).padStart(2, '0')})` : 'Gửi mã OTP'}
          </button>

          {detailForm.otpSent && (
            <div className={`rounded-md p-3 ${otpExpired ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700">Nhập mã OTP</label>
                <span className={`text-xs font-semibold ${otpExpired ? 'text-red-600' : 'text-blue-600'}`}>
                  {otpExpired ? '❌ Hết hạn' : `⏱️ ${Math.floor(otpTimeLeft / 60)}:${String(otpTimeLeft % 60).padStart(2, '0')}`}
                </span>
              </div>
              <input
                type="text"
                value={detailForm.otpCode || ''}
                onChange={(e) =>
                  setDetailForm((prev) => ({ ...prev, otpCode: e.target.value.slice(0, 6) }))
                }
                placeholder="Mã 6 số"
                maxLength={6}
                disabled={otpExpired}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none ${
                  otpExpired
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              {otpExpired && (
                <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-xs text-red-700">
                  <p className="font-semibold mb-2">⚠️ Mã OTP đã hết hạn</p>
                  {student?.parentId?.phone && (
                    <p className="text-red-600 font-semibold mb-2">
                      📱 {student.parentId.fullName || 'Phụ huynh'}: {student.parentId.phone}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={onResetOtp}
                    className="w-full mt-2 px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                  >
                    Gửi lại mã OTP
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AttendanceDetailModal({
  isOpen,
  mode,
  student,
  studentId,
  selectedDate,
  detailForm,
  setDetailForm,
  submitError,
  setSubmitError,
  studentsError,
  approvedPickupPersons,
  confirmationResult,
  setConfirmationResult,
  recaptchaVerifierRef,
  otpTimeLeft,
  setOtpTimeLeft,
  otpExpired,
  setOtpExpired,
  attendanceByStudent,
  onClose,
  onSave,
  onSendToParent,
  onResetOtp,
}) {
  if (!isOpen) return null;

  const isCheckoutMode = mode === 'checkout';
  const isReceiverOther = detailForm.receiverType === 'Khác';

  const canSaveCheckout =
    isCheckoutMode &&
    !!detailForm.receiverType &&
    !!detailForm.checkoutImageName &&
    !isReceiverOther;

  const canSendToParent =
    isCheckoutMode &&
    isReceiverOther &&
    !!detailForm.checkoutImageName &&
    !!detailForm.receiverName?.trim() &&
    !!detailForm.receiverPhone?.trim() &&
    !!detailForm.receiverOtherImageName;

  const canSubmitCheckin = mode === 'checkin' ? !!detailForm.checkinImageName : true;

  const uploadAttendanceImage = async (file, fieldName) => {
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)) {
      throw new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP).');
    }
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_AVATAR, formData);
    const url = response?.data?.url;
    if (!url) throw new Error('Không nhận được đường dẫn ảnh từ server.');
    setDetailForm((prev) => ({ ...prev, [fieldName]: url }));
  };

  const handleSendOtp = async () => {
    setSubmitError(null);
    try {
      if (detailForm.sendOtpSchoolAccount && !detailForm.sendOtpViaSms) {
        await post(ENDPOINTS.OTP.SEND, { studentId, method: 'school' });
        setDetailForm((prev) => ({ ...prev, otpSent: true, otpCode: '' }));
        setOtpTimeLeft(60);
        setOtpExpired(false);
      } else {
        const phone = detailForm.sendOtpViaSms
          ? detailForm.selectedParentForOtp
          : student?.parentId?.phone;
        if (!phone) {
          setSubmitError('Vui lòng chọn phụ huynh nhận SMS.');
          return;
        }
        const phoneE164 = formatPhoneForFirebase(phone);
        const result = await signInWithPhoneNumber(auth, phoneE164, recaptchaVerifierRef.current);
        setConfirmationResult(result);
        setDetailForm((prev) => ({ ...prev, otpSent: true, otpCode: '' }));
        setOtpTimeLeft(120);
        setOtpExpired(false);
      }
    } catch (err) {
      setSubmitError(err.message || 'Lỗi khi gửi OTP');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`bg-white rounded-xl shadow-2xl mx-4 max-h-[90vh] overflow-y-auto ${mode === 'view' ? 'w-full max-w-4xl' : 'w-full max-w-2xl'}`}>

        {/* ── CHẾ ĐỘ XEM CHI TIẾT (VIEW) ── */}
        {mode === 'view' ? (
          <>
            <div className="border-b px-6 py-4 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-2"> Chi tiết điểm danh</h2>
              <p className="text-sm text-gray-600">Cho phép View và Edit trong màn này</p>
            </div>

            <form onSubmit={onSave} className="p-6">
              {(submitError || studentsError) && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
                  {submitError || studentsError}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📄</span>
                  Chi tiết & chỉnh sửa điểm danh
                </h3>

                {detailForm.status === 'absent' && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm font-semibold text-red-700 mb-1">Trạng thái: Vắng mặt</p>
                    <p className="text-xs text-red-700">
                      Lý do:{' '}
                      <span className="font-medium">
                        {attendanceByStudent?.[studentId]?.absentReason || 'Không rõ'}
                      </span>
                    </p>
                    {attendanceByStudent?.[studentId]?.note && (
                      <p className="mt-1 text-xs text-gray-700">
                        Ghi chú: {attendanceByStudent[studentId].note}
                      </p>
                    )}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Học sinh</label>
                  <input
                    type="text"
                    value={student?.fullName || ''}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  />
                </div>

                {/* Check-in Section */}
                <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-green-50/30">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold">
                      ✓
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">Check-in</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Giờ đến</label>
                      <div className="relative">
                        <input
                          type="time"
                          value={detailForm.timeIn}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed focus:outline-none pl-10"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🕐</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Giờ đến được hệ thống lưu lại theo lúc check-in, không chỉnh sửa tại đây.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Người đưa</label>
                      <div className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 min-h-[38px]">
                        {detailForm.delivererOtherInfo ? (
                          <span>
                            {detailForm.delivererOtherInfo}
                            {detailForm.delivererType && (
                              <span className="ml-2 text-xs text-gray-500">({detailForm.delivererType})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Chưa ghi nhận</span>
                        )}
                      </div>
                      {detailForm.delivererOtherImageName && (
                        <div className="mt-2">
                          <label className="block text-xs text-gray-500 mb-1">Ảnh người đưa</label>
                          {renderImagePreview(detailForm.delivererOtherImageName, 'Ảnh người đưa')}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh check-in</label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🖼️</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            try {
                              setSubmitError(null);
                              await uploadAttendanceImage(e.target.files?.[0], 'checkinImageName');
                            } catch (err) {
                              setSubmitError(err.message || 'Không tải lên được ảnh check-in.');
                            } finally {
                              e.target.value = '';
                            }
                          }}
                          className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                        />
                      </div>
                      {renderImagePreview(detailForm.checkinImageName, 'Ảnh check-in')}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Đồ mang theo</label>
                      <input
                        type="text"
                        value={detailForm.belongingsNote}
                        onChange={(e) =>
                          setDetailForm((prev) => ({
                            ...prev,
                            belongingsNote: sanitizeSingleLineText(e.target.value, MAX_BELONGINGS_NOTE_LEN),
                          }))
                        }
                        placeholder="Bình nước, balo..."
                        maxLength={MAX_BELONGINGS_NOTE_LEN}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú</label>
                      <textarea
                        rows={3}
                        value={detailForm.note}
                        onChange={(e) =>
                          setDetailForm((prev) => ({
                            ...prev,
                            note: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                          }))
                        }
                        placeholder="Trẻ hơi mệt..."
                        maxLength={MAX_NOTE_LEN}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Check-out Section */}
                <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-blue-50/30">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                      ✓
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">Check-out</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Giờ về</label>
                      <div className="relative">
                        <input
                          type="time"
                          value={detailForm.timeOut}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed focus:outline-none pl-10"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🕐</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Giờ về được hệ thống lưu lại theo lúc check-out, không chỉnh sửa tại đây.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Người đón</label>
                      <div className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 min-h-[38px]">
                        {detailForm.receiverOtherInfo ? (
                          <span>
                            {detailForm.receiverOtherInfo}
                            {detailForm.receiverType && (
                              <span className="ml-2 text-xs text-gray-500">({detailForm.receiverType})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Chưa ghi nhận</span>
                        )}
                      </div>
                      {detailForm.receiverOtherImageName && (
                        <div className="mt-2">
                          <label className="block text-xs text-gray-500 mb-1">Ảnh người đón</label>
                          {renderImagePreview(detailForm.receiverOtherImageName, 'Ảnh người đón')}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh check-out</label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🖼️</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            try {
                              setSubmitError(null);
                              await uploadAttendanceImage(e.target.files?.[0], 'checkoutImageName');
                            } catch (err) {
                              setSubmitError(err.message || 'Không tải lên được ảnh check-out.');
                            } finally {
                              e.target.value = '';
                            }
                          }}
                          className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                        />
                      </div>
                      {renderImagePreview(detailForm.checkoutImageName, 'Ảnh check-out')}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú</label>
                      <textarea
                        rows={3}
                        value={detailForm.checkoutNote}
                        onChange={(e) =>
                          setDetailForm((prev) => ({
                            ...prev,
                            checkoutNote: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                          }))
                        }
                        placeholder="Ví dụ: Bé về sớm..."
                        maxLength={MAX_NOTE_LEN}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                {isCheckoutMode && (
                  <button
                    type="button"
                    onClick={onSendToParent}
                    disabled={!canSendToParent}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                      canSendToParent
                        ? 'text-white bg-sky-600 hover:bg-sky-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    Gửi PH
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <span>💾</span>
                  Lưu chỉnh sửa
                </button>
              </div>
            </form>
          </>
        ) : (
          /* ── CHẾ ĐỘ CHECK-IN / CHECK-OUT ── */
          <>
            <div className="border-b px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {mode === 'checkin' ? 'Check-in' : mode === 'checkout' ? 'Check-out' : 'Chi tiết điểm danh'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {student?.fullName ? (
                    <>Học sinh: <span className="font-semibold text-gray-700">{student.fullName}</span></>
                  ) : (
                    <>Học sinh ID: <span className="font-semibold text-gray-700">{studentId}</span></>
                  )}
                  {' · '}
                  Ngày: <span className="font-semibold text-gray-700">{selectedDate}</span>
                </p>
              </div>
              <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-900" aria-label="Đóng">
                ✕
              </button>
            </div>

            <form onSubmit={onSave} className="p-5">
              {(submitError || studentsError) && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
                  {submitError || studentsError}
                </div>
              )}

              {isCheckoutMode ? (
                /* ── CHECKOUT FORM ── */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Giờ về</label>
                    <div className="relative">
                      <input
                        type="time"
                        value={detailForm.timeOut}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed focus:outline-none pr-10"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-400">🕐</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Giờ về được tự động lấy theo thời điểm check-out, không thể chỉnh sửa ở đây.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh đón trẻ</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        try {
                          setSubmitError(null);
                          await uploadAttendanceImage(e.target.files?.[0], 'checkoutImageName');
                        } catch (err) {
                          setSubmitError(err.message || 'Không tải lên được ảnh check-out.');
                        } finally {
                          e.target.value = '';
                        }
                      }}
                      className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                    />
                    {detailForm.checkoutImageName && renderImagePreview(detailForm.checkoutImageName, 'Ảnh check-out')}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Người đón</label>
                    <select
                      value={detailForm.receiverPickupPersonId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'KHAC') {
                          setDetailForm((prev) => ({
                            ...prev,
                            receiverPickupPersonId: 'KHAC',
                            receiverType: 'Khác',
                            receiverOtherInfo: '',
                            receiverName: '',
                            receiverPhone: '',
                            receiverOtherImageName: '',
                          }));
                        } else {
                          const pickedPerson = approvedPickupPersons.find((p) => p._id === val);
                          setDetailForm((prev) => ({
                            ...prev,
                            receiverPickupPersonId: val,
                            receiverType: pickedPerson ? pickedPerson.relation : '',
                            receiverOtherInfo: pickedPerson ? `${pickedPerson.fullName} - ${pickedPerson.phone}` : '',
                            receiverName: '',
                            receiverPhone: '',
                            receiverOtherImageName: pickedPerson ? (pickedPerson.imageUrl || '') : '',
                          }));
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">--Chọn--</option>
                      {approvedPickupPersons.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.fullName} ({p.relation})
                        </option>
                      ))}
                      <option value="KHAC">Khác</option>
                    </select>
                  </div>

                  {detailForm.receiverType === 'Khác' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tên người đón</label>
                        <input
                          type="text"
                          value={detailForm.receiverName}
                          onChange={(e) =>
                            setDetailForm((prev) => ({
                              ...prev,
                              receiverName: sanitizeSingleLineText(e.target.value, MAX_PERSON_NAME_LEN),
                            }))
                          }
                          placeholder="VD: Nguyễn Văn B"
                          maxLength={MAX_PERSON_NAME_LEN}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại người đón</label>
                        <input
                          type="tel"
                          value={detailForm.receiverPhone}
                          onChange={(e) =>
                            setDetailForm((prev) => ({
                              ...prev,
                              receiverPhone: e.target.value.replace(/[^0-9+\-\s()]/g, '').slice(0, MAX_PERSON_PHONE_LEN),
                            }))
                          }
                          placeholder="VD: 0912345678"
                          maxLength={MAX_PERSON_PHONE_LEN}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh người đón</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            try {
                              setSubmitError(null);
                              await uploadAttendanceImage(e.target.files?.[0], 'receiverOtherImageName');
                            } catch (err) {
                              setSubmitError(err.message || 'Không tải lên được ảnh người đón.');
                            } finally {
                              e.target.value = '';
                            }
                          }}
                          className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                        />
                        {detailForm.receiverOtherImageName && renderImagePreview(detailForm.receiverOtherImageName, 'Ảnh người đón')}
                      </div>
                    </>
                  )}

                  <OtpSection
                    radioName="otpMethodCheckout"
                    mode={mode}
                    detailForm={detailForm}
                    setDetailForm={setDetailForm}
                    student={student}
                    onSendOtp={handleSendOtp}
                    otpTimeLeft={otpTimeLeft}
                    otpExpired={otpExpired}
                    onResetOtp={onResetOtp}
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú</label>
                    <textarea
                      rows={3}
                      value={detailForm.checkoutNote}
                      onChange={(e) =>
                        setDetailForm((prev) => ({
                          ...prev,
                          checkoutNote: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                        }))
                      }
                      placeholder="Ví dụ: Bé về sớm..."
                      maxLength={MAX_NOTE_LEN}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                    />
                  </div>
                </div>
              ) : (
                /* ── CHECKIN FORM ── */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Giờ đến</label>
                    <input
                      type="time"
                      value={detailForm.timeIn}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Giờ đến được tự động lấy theo thời điểm check-in, không thể chỉnh sửa ở đây.
                    </p>
                  </div>

                  <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Ảnh điểm danh / người đưa</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ảnh điểm danh (Check-in)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            try {
                              setSubmitError(null);
                              await uploadAttendanceImage(e.target.files?.[0], 'checkinImageName');
                            } catch (err) {
                              setSubmitError(err.message || 'Không tải lên được ảnh check-in.');
                            } finally {
                              e.target.value = '';
                            }
                          }}
                          className="block w-full text-xs text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                        />
                        {detailForm.checkinImageName && renderImagePreview(detailForm.checkinImageName, 'Ảnh check-in')}
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">Người đưa *</label>
                        <select
                          value={detailForm.delivererPickupPersonId}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'KHAC') {
                              setDetailForm((prev) => ({
                                ...prev,
                                delivererPickupPersonId: 'KHAC',
                                delivererType: 'Khác',
                                delivererOtherInfo: '',
                                delivererName: '',
                                delivererPhone: '',
                                delivererOtherImageName: '',
                              }));
                            } else {
                              const pickedPerson = approvedPickupPersons.find((p) => p._id === val);
                              setDetailForm((prev) => ({
                                ...prev,
                                delivererPickupPersonId: val,
                                delivererType: pickedPerson ? pickedPerson.relation : '',
                                delivererOtherInfo: pickedPerson ? `${pickedPerson.fullName} - ${pickedPerson.phone}` : '',
                                delivererName: '',
                                delivererPhone: '',
                                delivererOtherImageName: pickedPerson ? (pickedPerson.imageUrl || '') : '',
                              }));
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">--Chọn--</option>
                          {approvedPickupPersons.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.fullName} ({p.relation} - {p.phone})
                            </option>
                          ))}
                          <option value="KHAC">Khác</option>
                        </select>
                      </div>
                    </div>

                    {detailForm.delivererType === 'Khác' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 mb-1">Tên người đưa</label>
                          <input
                            type="text"
                            value={detailForm.delivererName}
                            onChange={(e) =>
                              setDetailForm((prev) => ({
                                ...prev,
                                delivererName: sanitizeSingleLineText(e.target.value, MAX_PERSON_NAME_LEN),
                              }))
                            }
                            placeholder="VD: Nguyễn Văn A"
                            maxLength={MAX_PERSON_NAME_LEN}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 mb-1">Số điện thoại người đưa</label>
                          <input
                            type="tel"
                            value={detailForm.delivererPhone}
                            onChange={(e) =>
                              setDetailForm((prev) => ({
                                ...prev,
                                delivererPhone: e.target.value.replace(/[^0-9+\-\s()]/g, '').slice(0, MAX_PERSON_PHONE_LEN),
                              }))
                            }
                            placeholder="VD: 0912345678"
                            maxLength={MAX_PERSON_PHONE_LEN}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ảnh người đưa</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              try {
                                setSubmitError(null);
                                await uploadAttendanceImage(e.target.files?.[0], 'delivererOtherImageName');
                              } catch (err) {
                                setSubmitError(err.message || 'Không tải lên được ảnh người đưa.');
                              } finally {
                                e.target.value = '';
                              }
                            }}
                            className="block w-full text-xs text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                          />
                          {detailForm.delivererOtherImageName && renderImagePreview(detailForm.delivererOtherImageName, 'Ảnh người đưa')}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                      <input
                        type="checkbox"
                        checked={detailForm.hasBelongings}
                        onChange={(e) =>
                          setDetailForm((prev) => ({
                            ...prev,
                            hasBelongings: e.target.checked,
                            belongingsNote: e.target.checked ? prev.belongingsNote : '',
                          }))
                        }
                      />
                      Có đồ mang theo
                    </label>
                    {detailForm.hasBelongings && (
                      <textarea
                        rows={2}
                        value={detailForm.belongingsNote}
                        onChange={(e) =>
                          setDetailForm((prev) => ({
                            ...prev,
                            belongingsNote: sanitizeMultiLineText(e.target.value, MAX_BELONGINGS_NOTE_LEN),
                          }))
                        }
                        placeholder="Ghi chú đồ dùng (VD: mang theo balo, thú bông...)"
                        maxLength={MAX_BELONGINGS_NOTE_LEN}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                      />
                    )}
                  </div>

                  <OtpSection
                    radioName="otpMethodCheckin"
                    mode={mode}
                    detailForm={detailForm}
                    setDetailForm={setDetailForm}
                    student={student}
                    onSendOtp={handleSendOtp}
                    otpTimeLeft={otpTimeLeft}
                    otpExpired={otpExpired}
                    onResetOtp={onResetOtp}
                  />

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Note chung</label>
                    <textarea
                      rows={3}
                      value={detailForm.note}
                      onChange={(e) =>
                        setDetailForm((prev) => ({
                          ...prev,
                          note: sanitizeMultiLineText(e.target.value, MAX_NOTE_LEN),
                        }))
                      }
                      placeholder="Ví dụ: Bé đến muộn 10 phút..."
                      maxLength={MAX_NOTE_LEN}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                {isCheckoutMode ? (
                  <>
                    <button
                      type="submit"
                      disabled={!canSaveCheckout}
                      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                        canSaveCheckout
                          ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                          : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                      }`}
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={onSendToParent}
                      disabled={!canSendToParent}
                      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                        canSendToParent
                          ? 'text-white bg-sky-600 hover:bg-sky-700'
                          : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                      }`}
                    >
                      Gửi PH
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={!canSubmitCheckin}
                    title={canSubmitCheckin ? 'Lưu check-in' : 'Vui lòng chọn ảnh check-in'}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                      canSubmitCheckin
                        ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    Lưu
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default AttendanceDetailModal;
