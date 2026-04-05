/**
 * FaceAttendancePage.jsx
 *
 * Dashboard trạng thái đăng ký khuôn mặt AI — nhóm theo Khối → Lớp.
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleLayout from '../../layouts/RoleLayout';
import { get } from '../../service/api';
import { SCHOOL_ADMIN_MENU_ITEMS, createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';

// ── Màu theo mức coverage ────────────────────────────────────────────────────
function getCoverageStyle(pct) {
  if (pct === 100) return { bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700',   border: 'border-green-200' };
  if (pct >= 70)   return { bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' };
  if (pct >= 30)   return { bar: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700', border: 'border-orange-200' };
  return            { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700',     border: 'border-red-300' };
}

function pctLabel(pct) {
  if (pct === 100) return 'Đầy đủ';
  if (pct >= 70)   return 'Tốt';
  if (pct >= 30)   return 'Thiếu';
  return 'Rất thấp';
}

function calcPct(registered, total) {
  return total === 0 ? 0 : Math.round((registered / total) * 100);
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, barClass }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${barClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Danh sách học sinh chưa đăng ký trong 1 lớp ──────────────────────────────
function UnregisteredList({ students }) {
  const list = students.filter((s) => !s.hasFaceEmbedding);
  if (list.length === 0) {
    return (
      <div className="text-center py-5 text-green-600 text-sm font-medium">
        ✓ Tất cả học sinh đã đăng ký khuôn mặt
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
      {list.map((s) => (
        <div key={s._id} className="flex items-center gap-2.5 bg-white rounded-lg border border-gray-200 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold text-xs flex-shrink-0 overflow-hidden">
            {s.avatar
              ? <img src={s.avatar} alt="" className="w-full h-full object-cover rounded-full" />
              : (s.fullName?.[0] || '?')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{s.fullName}</div>
            <div className="text-xs text-red-400">Chưa đăng ký</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Card 1 lớp ───────────────────────────────────────────────────────────────
function ClassCard({ cls }) {
  const [expanded, setExpanded] = useState(false);
  const pct = calcPct(cls.registered, cls.total);
  const style = getCoverageStyle(pct);

  return (
    <div className={`rounded-xl border-2 ${style.border} bg-white overflow-hidden`}>
      <div className="p-4">
        {/* Tên lớp + badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-bold text-gray-800">{cls.className}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
            {pctLabel(pct)} {pct}%
          </span>
        </div>

        {/* Số liệu */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
          <span>Tổng <strong className="text-gray-700">{cls.total}</strong></span>
          <span className="text-green-600">Đăng ký <strong>{cls.registered}</strong></span>
          {cls.total - cls.registered > 0 && (
            <span className="text-red-500">Thiếu <strong>{cls.total - cls.registered}</strong></span>
          )}
        </div>

        <ProgressBar pct={pct} barClass={style.bar} />

        {/* Nút mở rộng */}
        {cls.total > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2.5 w-full text-xs text-gray-400 hover:text-indigo-600 transition-colors py-0.5"
          >
            {expanded ? '▲ Thu gọn' : '▼ Xem học sinh chưa đăng ký'}
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 pb-4 pt-3">
          <UnregisteredList students={cls.students} />
        </div>
      )}
    </div>
  );
}

// ── Block 1 khối (collapsible) ────────────────────────────────────────────────
const GRADE_COLORS = [
  { bg: 'from-indigo-500 to-violet-600',  light: 'bg-indigo-50',  ring: 'ring-indigo-200' },
  { bg: 'from-emerald-500 to-teal-600',   light: 'bg-emerald-50', ring: 'ring-emerald-200' },
  { bg: 'from-orange-500 to-red-500',     light: 'bg-orange-50',  ring: 'ring-orange-200' },
  { bg: 'from-sky-500 to-blue-600',       light: 'bg-sky-50',     ring: 'ring-sky-200' },
  { bg: 'from-pink-500 to-rose-600',      light: 'bg-pink-50',    ring: 'ring-pink-200' },
  { bg: 'from-amber-500 to-yellow-500',   light: 'bg-amber-50',   ring: 'ring-amber-200' },
];

function GradeBlock({ grade, colorIdx }) {
  const [collapsed, setCollapsed] = useState(false);
  const color = GRADE_COLORS[colorIdx % GRADE_COLORS.length];

  const totalStudents  = grade.classes.reduce((s, c) => s + c.total, 0);
  const totalReg       = grade.classes.reduce((s, c) => s + c.registered, 0);
  const pct            = calcPct(totalReg, totalStudents);
  const style          = getCoverageStyle(pct);
  const classesOk      = grade.classes.filter((c) => c.total > 0 && c.registered === c.total).length;

  return (
    <div className={`rounded-2xl ring-2 ${color.ring} overflow-hidden`}>
      {/* Header khối */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={`w-full text-left bg-gradient-to-r ${color.bg} px-5 py-4 flex items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-3">
          <div className="text-white">
            <div className="text-lg font-black">Khối {grade.gradeName}</div>
            {grade.ageRange && (
              <div className="text-white/70 text-xs mt-0.5">{grade.ageRange}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-white text-right">
          <div className="hidden sm:block text-xs text-white/80 space-y-0.5">
            <div>{grade.classes.length} lớp · {totalStudents} học sinh</div>
            <div>{classesOk}/{grade.classes.length} lớp đầy đủ</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black">{pct}%</div>
            <div className={`text-xs px-2 py-0.5 rounded-full font-semibold ${style.badge}`}>
              {pctLabel(pct)}
            </div>
          </div>
          <span className="text-white/70 text-lg">{collapsed ? '▶' : '▼'}</span>
        </div>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className={`${color.light} p-4`}>
          {/* Progress tổng khối */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Tỷ lệ đăng ký toàn khối</span>
              <span>{totalReg}/{totalStudents}</span>
            </div>
            <ProgressBar pct={pct} barClass={style.bar} />
          </div>

          {/* Grid các lớp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {grade.classes.map((cls) => (
              <ClassCard key={cls._id} cls={cls} />
            ))}
          </div>

          {grade.classes.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Khối này chưa có lớp nào
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, borderColor }) {
  return (
    <div className={`bg-white rounded-2xl border-2 ${borderColor} p-4`}>
      <div className="text-2xl font-black text-gray-800">{value}</div>
      <div className="text-sm font-semibold text-gray-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FaceAttendancePage() {
  const navigate = useNavigate();
  const { user, logout, hasRole, isInitializing } = useAuth();
  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  const [gradeGroups, setGradeGroups] = useState([]); // [{ gradeId, gradeName, ageRange, classes }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) navigate('/', { replace: true });
  }, [navigate, user, hasRole, isInitializing]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Lấy tất cả lớp (đã populate gradeId)
      const classRes = await get('/classes');
      const classes = classRes.data || classRes.classes || [];

      // 2. Tải học sinh song song
      const studentResults = await Promise.all(
        classes.map((cls) =>
          get(`/students?classId=${cls._id}`)
            .then((res) => ({ classId: cls._id, students: res.data || [] }))
            .catch(() => ({ classId: cls._id, students: [] }))
        )
      );
      const studentMap = {};
      studentResults.forEach(({ classId, students }) => {
        studentMap[classId] = students;
      });

      // 3. Nhóm theo khối
      const gradeMap = {}; // gradeId → { gradeName, ageRange, classes[] }

      classes.forEach((cls) => {
        const gradeId   = cls.gradeId?._id || 'unknown';
        const gradeName = cls.gradeId?.gradeName || 'Chưa phân khối';
        const ageRange  = cls.gradeId?.ageRange  || '';

        if (!gradeMap[gradeId]) {
          gradeMap[gradeId] = { gradeId, gradeName, ageRange, classes: [] };
        }

        const students   = studentMap[cls._id] || [];
        const registered = students.filter((s) => s.hasFaceEmbedding).length;

        gradeMap[gradeId].classes.push({
          _id:        cls._id,
          className:  cls.className,
          total:      students.length,
          registered,
          students,
        });
      });

      // 4. Sắp xếp lớp trong mỗi khối theo tên
      const groups = Object.values(gradeMap).map((g) => ({
        ...g,
        classes: g.classes.sort((a, b) => a.className.localeCompare(b.className, 'vi')),
      }));

      // Sắp xếp khối: Chưa phân khối xuống cuối, còn lại theo tên
      groups.sort((a, b) => {
        if (a.gradeId === 'unknown') return 1;
        if (b.gradeId === 'unknown') return -1;
        return a.gradeName.localeCompare(b.gradeName, 'vi');
      });

      setGradeGroups(groups);
    } catch {
      setError('Không tải được dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && !isInitializing) loadData();
  }, [user, isInitializing, loadData]);

  // Tổng hợp
  const allClasses     = gradeGroups.flatMap((g) => g.classes);
  const totalStudents  = allClasses.reduce((s, c) => s + c.total, 0);
  const totalReg       = allClasses.reduce((s, c) => s + c.registered, 0);
  const totalUnreg     = totalStudents - totalReg;
  const overallPct     = calcPct(totalReg, totalStudents);
  const classesUnready = allClasses.filter((c) => c.registered < c.total).length;

  return (
    <RoleLayout
      title="Trạng thái khuôn mặt AI"
      description="Theo dõi tỷ lệ đăng ký khuôn mặt để hệ thống điểm danh AI hoạt động hiệu quả."
      menuItems={SCHOOL_ADMIN_MENU_ITEMS}
      activeKey="face-attendance"
      onLogout={() => { logout(); navigate('/login'); }}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
      userName={user?.fullName || user?.username || 'Admin'}
      userAvatar={user?.avatar}
    >
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🧠</span>
            <div>
              <h1 className="text-xl font-bold">Trạng thái đăng ký khuôn mặt AI</h1>
              <p className="text-violet-200 text-sm mt-0.5">
                Học sinh chưa có khuôn mặt sẽ không được AI điểm danh tự động
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin inline-block" />
              : '↻'}
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Lỗi ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
          ⚠ {error}
          <button onClick={loadData} className="ml-auto underline text-xs">Thử lại</button>
        </div>
      )}

      {/* ── Summary ── */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="Tổng học sinh"    value={totalStudents}                borderColor="border-gray-200" />
          <SummaryCard label="Đã đăng ký"       value={`${totalReg} (${overallPct}%)`} borderColor="border-green-200"  sub="có face embedding" />
          <SummaryCard label="Chưa đăng ký"     value={totalUnreg}                   borderColor={totalUnreg > 0 ? 'border-red-200' : 'border-gray-200'} sub="AI không nhận diện được" />
          <SummaryCard label="Lớp chưa đầy đủ" value={classesUnready}               borderColor={classesUnready > 0 ? 'border-orange-200' : 'border-gray-200'} sub={`/ ${allClasses.length} lớp`} />
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Danh sách khối ── */}
      {!loading && gradeGroups.length === 0 && !error && (
        <div className="text-center py-20 text-gray-400">
          <span className="text-5xl block mb-3">🏫</span>
          <p className="font-medium">Chưa có lớp nào trong năm học hiện tại</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-5">
          {gradeGroups.map((grade, idx) => (
            <GradeBlock key={grade.gradeId} grade={grade} colorIdx={idx} />
          ))}
        </div>
      )}

      {/* ── Chú thích ── */}
      {!loading && gradeGroups.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-600">
          <strong>Lưu ý:</strong> Học sinh chưa đăng ký khuôn mặt vẫn điểm danh được thủ công.
          Giáo viên đăng ký khuôn mặt tại màn hình điểm danh để AI nhận diện tự động.
          Nhấn vào tiêu đề khối để thu gọn/mở rộng.
        </div>
      )}
    </RoleLayout>
  );
}
