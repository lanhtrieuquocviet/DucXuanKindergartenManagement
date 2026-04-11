/**
 * FaceRegisterClassModal.jsx
 *
 * Modal cho giáo viên đăng ký khuôn mặt AI cho từng học sinh trong lớp.
 * Hiển thị danh sách học sinh kèm trạng thái đăng ký, cho phép đăng ký / cập nhật từng em.
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { get, ENDPOINTS } from '../../service/api';
import { deleteFaceEmbedding, deleteFaceAngle } from '../../service/faceAttendance.api';
import FaceRegisterModal from './FaceRegisterModal';

// ── Mini detail dialog cho học sinh đã đăng ký ────────────────────────────────
function FaceDetailDialog({ student, onClose, onUpdate, onDeleted }) {
  const [previewImg, setPreviewImg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteAngle, setConfirmDeleteAngle] = useState(null); // index góc cần xóa
  const [deleting, setDeleting] = useState(false);
  const [localImageUrls, setLocalImageUrls] = useState(null); // null = dùng student.faceImageUrls
  if (!student) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFaceEmbedding(student._id);
      toast.success(`Đã xóa khuôn mặt của ${student.fullName}`);
      onDeleted?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa khuôn mặt');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const regDate = student.faceRegisteredAt
    ? new Date(student.faceRegisteredAt).toLocaleString('vi-VN')
    : 'Không rõ';

  const handleDeleteAngle = async (idx) => {
    setDeleting(true);
    try {
      const res = await deleteFaceAngle(student._id, idx);
      const newUrls = res.data?.faceImageUrls?.filter(Boolean) || [];
      setLocalImageUrls(newUrls);
      setConfirmDeleteAngle(null);
      toast.success(`Đã xóa góc ${idx + 1}`);
      if (newUrls.length === 0) onDeleted?.();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa góc mặt');
    } finally {
      setDeleting(false);
    }
  };

  // Danh sách ảnh: ưu tiên localImageUrls (sau khi xóa góc), rồi student.faceImageUrls
  const rawUrls = localImageUrls ?? (
    Array.isArray(student.faceImageUrls) && student.faceImageUrls.some(Boolean)
      ? student.faceImageUrls
      : student.faceImageUrl ? [student.faceImageUrl] : []
  );
  const imageUrls = rawUrls.filter(Boolean);

  const angleLabels = ['Góc 1', 'Góc 2', 'Góc 3', 'Góc 4', 'Góc 5'];

  return (
    <>
      {/* Lightbox xem ảnh to */}
      {previewImg && (
        <div
          className="fixed inset-0 z-[1430] flex items-center justify-center bg-black/80"
          onClick={() => setPreviewImg(null)}
        >
          <img src={previewImg} alt="preview" className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain shadow-2xl" />
          <button
            onClick={() => setPreviewImg(null)}
            className="absolute top-4 right-4 text-white text-3xl font-bold leading-none hover:text-gray-300"
          >×</button>
        </div>
      )}

      <div className="fixed inset-0 z-[1420] flex items-start sm:items-center justify-center bg-black/50 p-2 sm:p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl flex flex-col w-full"
          style={{ maxWidth: 400, maxHeight: 'calc(100dvh - 1rem)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 rounded-t-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
          >
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <h2 className="text-sm font-bold text-white">Chi tiết đăng ký khuôn mặt</h2>
            </div>
            <button onClick={onClose} className="text-white text-xl font-bold hover:text-green-200 transition-colors">×</button>
          </div>

          {/* Body */}
          <div className="px-5 py-5 flex flex-col gap-4 overflow-y-auto">
            {/* Avatar + tên */}
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                {student.avatar ? (
                  <img src={student.avatar} alt={student.fullName} className="w-14 h-14 rounded-full object-cover border-4 border-green-200" />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full border-4 border-green-200 flex items-center justify-center text-xl font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
                  >
                    {student.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#10b981', border: '2px solid white' }}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2 6 5 9 10 3"/>
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-base font-bold text-gray-800">{student.fullName}</p>
                <p className="text-xs text-green-600 font-medium">✓ Đã đăng ký khuôn mặt AI</p>
                <p className="text-xs text-gray-400 mt-0.5">{regDate}</p>
              </div>
            </div>

            {/* Ảnh các góc mặt */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                Góc mặt đã đăng ký
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  (student.angleCount || imageUrls.length) > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {student.angleCount || imageUrls.length || 1} góc
                </span>
              </p>

              {imageUrls.length > 0 ? (
                <>
                  <div className={`grid gap-2 ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border-2 border-green-200 hover:border-green-400 transition-all group" style={{ aspectRatio: '3/4' }}>
                        <button onClick={() => setPreviewImg(url)} className="w-full h-full">
                          <img src={url} alt={`Góc ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
                          <span className="text-white text-[10px] font-semibold">{angleLabels[idx] || `Góc ${idx + 1}`}</span>
                        </div>
                        {/* Nút xóa góc */}
                        <button
                          onClick={() => setConfirmDeleteAngle(idx)}
                          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 rounded-full p-1"
                          title={`Xóa góc ${idx + 1}`}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 text-center mt-1.5">Nhấn vào ảnh để xem to · Hover để xóa góc</p>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-3 bg-amber-50 rounded-xl border border-dashed border-amber-200">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p className="text-xs text-amber-700 font-medium">
                    {(student.angleCount || 0) > 0
                      ? `Đã lưu ${student.angleCount} góc nhưng ảnh chưa upload được`
                      : 'Chưa có ảnh khuôn mặt'}
                  </p>
                  <p className="text-[10px] text-amber-600">Đăng ký lại để lưu ảnh</p>
                </div>
              )}
            </div>

            {/* Số góc đăng ký */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Số góc mặt đã lưu</span>
                <span className="text-gray-800 font-semibold">{imageUrls.length || student.angleCount || 1} / 5 góc</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Trạng thái</span>
                <span className="text-green-600 font-semibold">Hoạt động</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 flex gap-2 flex-shrink-0">
            <button onClick={onClose} className="py-2 px-3 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
              Đóng
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="py-2 px-3 rounded-lg text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
            >
              Xóa khuôn mặt
            </button>
            <button
              onClick={onUpdate}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
            >
              Cập nhật
            </button>
          </div>
        </div>
      </div>

      {/* Confirm xóa 1 góc */}
      {confirmDeleteAngle !== null && (
        <div className="fixed inset-0 z-[1440] flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full mx-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
              </div>
              <p className="font-bold text-gray-800">Xóa góc {confirmDeleteAngle + 1}?</p>
              <p className="text-sm text-gray-500">Chỉ xóa góc này, các góc còn lại vẫn giữ nguyên.</p>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setConfirmDeleteAngle(null)}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteAngle(confirmDeleteAngle)}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xóa góc này'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm xóa */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[1440] flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full mx-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <p className="font-bold text-gray-800">Xóa khuôn mặt?</p>
              <p className="text-sm text-gray-500">
                Toàn bộ dữ liệu khuôn mặt của <strong>{student.fullName}</strong> sẽ bị xóa. Cần đăng ký lại để dùng điểm danh AI.
              </p>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────
export default function FaceRegisterClassModal({ open, onClose, classId, className }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [registerTarget, setRegisterTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);

  const fetchStudents = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.CLASSES.STUDENTS(classId));
      const newStudents = res.data || [];
      setStudents(newStudents);
      // Nếu đang mở detail dialog, cập nhật luôn student mới nhất
      setDetailTarget((prev) => {
        if (!prev) return null;
        return newStudents.find((s) => s._id === prev._id) || prev;
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSearch('');
      fetchStudents();
    }
  }, [open, classId]);

  if (!open) return null;

  const filtered = students.filter((s) =>
    s.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const registeredCount = students.filter((s) => s.hasFaceEmbedding).length;
  const total = students.length;
  const pct = total > 0 ? Math.round((registeredCount / total) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 z-[1400] flex items-start sm:items-center justify-center bg-black/60 p-2 sm:p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl flex flex-col w-full"
          style={{ maxWidth: 560, maxHeight: 'calc(100dvh - 1rem)' }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-6 py-4 rounded-t-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}
          >
            <div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
                </svg>
                <h2 className="text-base font-bold text-white">Đăng ký khuôn mặt AI</h2>
                <span
                  style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                    background: 'rgba(255,255,255,0.25)', borderRadius: 4,
                    padding: '2px 6px',
                  }}
                  className="text-white"
                >AI</span>
              </div>
              <p className="text-purple-200 text-xs mt-0.5">Lớp: {className || classId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white text-2xl font-bold leading-none hover:text-purple-200 transition-colors"
            >
              ×
            </button>
          </div>

          {/* ── Tiến độ ── */}
          <div className="px-6 pt-4 pb-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-gray-600 font-medium">
                Đã đăng ký:
                <span className="text-violet-600 font-bold ml-1">{registeredCount}</span>
                <span className="text-gray-400">/{total} học sinh</span>
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: pct === 100 ? '#059669' : '#7c3aed' }}
              >
                {pct}%{pct === 100 ? ' ✓' : ''}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: pct === 100
                    ? 'linear-gradient(90deg, #059669, #10b981)'
                    : 'linear-gradient(90deg, #7c3aed, #6366f1)',
                }}
              />
            </div>

            {/* Tìm kiếm */}
            <div className="relative mt-3">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Tìm học sinh..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* ── Danh sách học sinh ── */}
          <div className="overflow-y-auto flex-1 px-4 py-3">
            {loading ? (
              <div className="flex flex-col gap-3 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3.5 bg-gray-200 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                    <div className="h-8 w-24 bg-gray-200 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-gray-400 py-10 text-sm">
                {search ? 'Không tìm thấy học sinh phù hợp' : 'Lớp chưa có học sinh'}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((student) => {
                  const has = student.hasFaceEmbedding;
                  const regDate = student.faceRegisteredAt
                    ? new Date(student.faceRegisteredAt).toLocaleDateString('vi-VN')
                    : null;

                  return (
                    <div
                      key={student._id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors"
                      style={{
                        borderColor: has ? '#d1fae5' : '#e5e7eb',
                        background: has ? '#f0fdf4' : '#fafafa',
                      }}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.fullName}
                            className="w-10 h-10 rounded-full object-cover border-2"
                            style={{ borderColor: has ? '#10b981' : '#e5e7eb' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-10 h-10 rounded-full border-2 items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{
                            borderColor: has ? '#10b981' : '#e5e7eb',
                            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                            display: student.avatar ? 'none' : 'flex',
                          }}
                        >
                          {student.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        {has && (
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: '#10b981', border: '1.5px solid white' }}
                          >
                            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3"/>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Tên + trạng thái */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{student.fullName}</p>
                        <p className="text-xs" style={{ color: has ? '#059669' : '#9ca3af' }}>
                          {has
                            ? `Đã đăng ký${student.angleCount > 1 ? ` · ${student.angleCount} góc` : ''}${regDate ? ` · ${regDate}` : ''}`
                            : 'Chưa đăng ký khuôn mặt'}
                        </p>
                      </div>

                      {/* Nút hành động */}
                      {has ? (
                        // Đã đăng ký → Xem chi tiết + Cập nhật
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setDetailTarget(student)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: '#d1fae5', color: '#059669' }}
                            title="Xem chi tiết đăng ký"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Chi tiết
                          </button>
                          <button
                            onClick={() => setRegisterTarget(student)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: '#ede9fe', color: '#7c3aed' }}
                            title="Cập nhật khuôn mặt"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Cập nhật
                          </button>
                        </div>
                      ) : (
                        // Chưa đăng ký → Đăng ký
                        <button
                          onClick={() => setRegisterTarget(student)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all"
                          style={{
                            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="4"/>
                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                            <path d="M16 4l2 2 4-4" strokeWidth="2.5"/>
                          </svg>
                          Đăng ký
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-3 border-t bg-gray-50 rounded-b-2xl flex justify-end flex-shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Detail dialog cho học sinh đã đăng ký */}
      <FaceDetailDialog
        student={detailTarget}
        onClose={() => setDetailTarget(null)}
        onUpdate={() => {
          setRegisterTarget(detailTarget);
          setDetailTarget(null);
        }}
        onDeleted={() => {
          setDetailTarget(null);
          fetchStudents();
        }}
      />

      {/* Modal đăng ký khuôn mặt cho 1 học sinh */}
      <FaceRegisterModal
        open={!!registerTarget}
        onClose={() => setRegisterTarget(null)}
        student={registerTarget}
        onSuccess={() => {
          setRegisterTarget(null);
          fetchStudents();
        }}
      />
    </>
  );
}
