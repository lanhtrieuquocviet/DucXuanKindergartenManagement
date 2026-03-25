/**
 * FaceRegisterClassModal.jsx
 *
 * Modal cho giáo viên đăng ký khuôn mặt AI cho từng học sinh trong lớp.
 * Hiển thị danh sách học sinh kèm trạng thái đăng ký, cho phép đăng ký / cập nhật từng em.
 */

import { useState, useEffect } from 'react';
import { get, ENDPOINTS } from '../../service/api';
import FaceRegisterModal from './FaceRegisterModal';

export default function FaceRegisterClassModal({ open, onClose, classId, className }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [registerTarget, setRegisterTarget] = useState(null); // student object

  const fetchStudents = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.CLASSES.STUDENTS(classId));
      setStudents(res.data || []);
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
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
        <div
          className="bg-white rounded-2xl shadow-2xl flex flex-col"
          style={{ width: '100%', maxWidth: 560, maxHeight: '88vh', margin: '0 16px' }}
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
              <span className="text-sm font-bold text-violet-600">{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #7c3aed, #6366f1)',
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
                        <img
                          src={student.avatar || '/default-avatar.png'}
                          alt={student.fullName}
                          className="w-10 h-10 rounded-full object-cover border-2"
                          style={{ borderColor: has ? '#10b981' : '#e5e7eb' }}
                          onError={(e) => { e.target.src = '/default-avatar.png'; }}
                        />
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
                          {has ? `Đã đăng ký${regDate ? ` · ${regDate}` : ''}` : 'Chưa đăng ký khuôn mặt'}
                        </p>
                      </div>

                      {/* Nút đăng ký */}
                      <button
                        onClick={() => setRegisterTarget(student)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all"
                        style={
                          has
                            ? { background: '#ede9fe', color: '#7c3aed' }
                            : { background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }
                        }
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          {has
                            ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
                            : <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M16 4l2 2 4-4" strokeWidth="2.5"/></>
                          }
                        </svg>
                        {has ? 'Cập nhật' : 'Đăng ký'}
                      </button>
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

      {/* Modal đăng ký khuôn mặt cho 1 học sinh */}
      <FaceRegisterModal
        open={!!registerTarget}
        onClose={() => setRegisterTarget(null)}
        student={registerTarget}
        onSuccess={() => {
          setRegisterTarget(null);
          fetchStudents(); // refresh danh sách sau khi đăng ký
        }}
      />
    </>
  );
}
