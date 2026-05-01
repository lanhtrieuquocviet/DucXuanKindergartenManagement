import { useEffect, useState, useCallback } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton, Alert, Avatar, IconButton, Tooltip,
  Chip, TextField,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  EventBusy as LeaveIcon,
  HelpOutline as EmptyIcon,
  Logout as CheckOutIcon,
} from '@mui/icons-material';
import { get, ENDPOINTS } from '../../../service/api';

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6'];
const isLateByTime = (value) => {
  if (!value) return false;
  try {
    let h; let m;
    if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) {
      [h, m] = value.split(':').map(Number);
    } else {
      const d = new Date(value);
      if (isNaN(d.getTime())) return false;
      h = d.getHours();
      m = d.getMinutes();
    }
    return h > 8 || (h === 8 && m > 0);
  } catch {
    return false;
  }
};

function getWeekDates(weekOffset = 0) {
  const now = new Date();
  now.setDate(now.getDate() + weekOffset * 7);
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
}

const STATUS_CONFIG = {
  present:   { icon: <PresentIcon  sx={{ fontSize: 20, color: '#10b981' }} />, label: 'Có mặt',        bg: '#f0fdf4' },
  checked_in: { icon: <PresentIcon sx={{ fontSize: 20, color: '#10b981' }} />, label: 'Đã đến',         bg: '#f0fdf4' },
  late_checked_in: { icon: <LeaveIcon sx={{ fontSize: 20, color: '#f59e0b' }} />, label: 'Đi học muộn', bg: '#fffbeb' },
  checked_out:{ icon: <CheckOutIcon sx={{ fontSize: 20, color: '#0ea5e9' }} />, label: 'Đã về',         bg: '#f0f9ff' },
  late_checked_out:{ icon: <LeaveIcon sx={{ fontSize: 20, color: '#f59e0b' }} />, label: 'Đi học muộn', bg: '#fffbeb' },
  absent:    { icon: <AbsentIcon   sx={{ fontSize: 20, color: '#ef4444' }} />, label: 'Vắng mặt',       bg: '#fef2f2' },
  leave:     { icon: <AbsentIcon   sx={{ fontSize: 20, color: '#ef4444' }} />, label: 'Vắng mặt',       bg: '#fef2f2' },
  empty:     { icon: <EmptyIcon    sx={{ fontSize: 20, color: '#d1d5db' }} />, label: 'Chưa điểm danh', bg: 'transparent' },
};

function StatusCell({ status, note, absentReason }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.empty;
  const tooltipContent = (
    <Box>
      <Typography variant="caption" fontWeight={700}>{cfg.label}</Typography>
      {absentReason && <><br /><Typography variant="caption">Lý do: {absentReason}</Typography></>}
      {note && <><br /><Typography variant="caption">Ghi chú: {note}</Typography></>}
    </Box>
  );
  return (
    <Tooltip title={tooltipContent} arrow>
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 2,
          bgcolor: cfg.bg,
          mx: 'auto',
          cursor: 'default',
          transition: 'transform 0.15s',
          '&:hover': { transform: 'scale(1.15)' },
        }}
      >
        {cfg.icon}
      </Box>
    </Tooltip>
  );
}

export default function WeeklyAttendanceView({ classId, students = [] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const weekDates = getWeekDates(weekOffset);
  const _t = new Date();
  const today = `${_t.getFullYear()}-${String(_t.getMonth() + 1).padStart(2, '0')}-${String(_t.getDate()).padStart(2, '0')}`;

  const fetchWeek = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const from = weekDates[0];
      const to = weekDates[4];
      const res = await get(
        `${ENDPOINTS.STUDENTS.ATTENDANCE_LIST}?classId=${classId}&from=${from}&to=${to}`
      );
      const records = res.data || [];
      // Build map: studentId -> { date -> record }
      const map = {};
      records.forEach((r) => {
        const sid = r.studentId?._id?.toString() || r.studentId?.toString();
        if (!sid) return;
        if (!map[sid]) map[sid] = {};
        const _rd = new Date(r.date);
        const dateKey = `${_rd.getFullYear()}-${String(_rd.getMonth() + 1).padStart(2, '0')}-${String(_rd.getDate()).padStart(2, '0')}`;
        // Map server status to display status
        let displayStatus;
        if (r.status === 'absent' || r.status === 'leave') {
          displayStatus = r.status;
        } else if (r.status === 'present') {
          const isLate = r.arrivalStatus === 'late'
            || (r.arrivalStatus !== 'on_time' && isLateByTime(r.timeString?.checkIn || r.time?.checkIn));
          if (r.timeString?.checkOut) {
            displayStatus = isLate ? 'late_checked_out' : 'checked_out';
          } else {
            displayStatus = isLate ? 'late_checked_in' : 'checked_in';
          }
        } else {
          displayStatus = 'empty';
        }
        map[sid][dateKey] = {
          status: displayStatus,
          note: r.note || '',
          absentReason: r.absentReason || '',
          timeIn: r.timeString?.checkIn || '',
          timeOut: r.timeString?.checkOut || '',
        };
      });
      setAttendanceMap(map);
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu điểm danh tuần này');
    } finally {
      setLoading(false);
    }
  }, [classId, weekOffset]);

  useEffect(() => { fetchWeek(); }, [fetchWeek]);

  const filteredStudents = students.filter((s) =>
    !search.trim() || s.fullName?.toLowerCase().includes(search.trim().toLowerCase())
  );

  // Summary per day
  const daySummary = weekDates.map((date) => {
    let present = 0, absent = 0, leave = 0, empty = 0;
    students.forEach((s) => {
      const r = attendanceMap[s._id]?.[date];
      if (!r) { empty++; return; }
      if (r.status === 'checked_in' || r.status === 'checked_out' || r.status === 'late_checked_in' || r.status === 'late_checked_out') present++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'leave') leave++;
      else empty++;
    });
    return { present, absent, leave, empty };
  });

  const formatWeekLabel = () => {
    const d0 = weekDates[0];
    const d4 = weekDates[4];
    const fmt = (s) => s.slice(8, 10) + '/' + s.slice(5, 7);
    return `${fmt(d0)} – ${fmt(d4)}/${d4.slice(0, 4)}`;
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: { xs: 1.25, sm: 1.75 }, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Row 1: date nav + "Tuần này" chip + search (desktop) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <IconButton size="small" onClick={() => setWeekOffset((o) => o - 1)}>
              <PrevIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle2" fontWeight={700} sx={{ minWidth: { xs: 110, sm: 130 }, textAlign: 'center', fontSize: { xs: 12, sm: 14 } }}>
              {formatWeekLabel()}
            </Typography>
            <IconButton size="small" onClick={() => setWeekOffset((o) => o + 1)} disabled={weekOffset >= 0}>
              <NextIcon fontSize="small" />
            </IconButton>
          </Box>
          {weekOffset !== 0 && (
            <Chip label="Tuần này" size="small" variant="outlined" onClick={() => setWeekOffset(0)} sx={{ height: 22, fontSize: 11, cursor: 'pointer' }} />
          )}
          {/* Search — chỉ hiện inline trên desktop */}
          <Box sx={{ ml: 'auto', display: { xs: 'none', sm: 'block' } }}>
            <TextField
              size="small"
              placeholder="Tìm học sinh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 180, '& .MuiInputBase-root': { borderRadius: 2, fontSize: 13 } }}
            />
          </Box>
        </Box>
        {/* Row 2: search full-width trên mobile */}
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <TextField
            size="small"
            placeholder="Tìm học sinh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{ '& .MuiInputBase-root': { borderRadius: 2, fontSize: 13 } }}
          />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>{error}</Alert>}

      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 700, fontSize: 12, bgcolor: 'grey.50',
                  minWidth: { xs: 120, sm: 160 },
                  position: 'sticky', left: 0, zIndex: 3,
                  borderRight: '1px solid', borderColor: 'divider',
                  px: { xs: 1, sm: 2 },
                }}
              >
                Học sinh
              </TableCell>
              {weekDates.map((date, i) => {
                const isToday = date === today;
                const isFuture = date > today;
                const [, m, d] = date.split('-');
                return (
                  <TableCell
                    key={date}
                    align="center"
                    sx={{
                      fontWeight: 700, fontSize: 12,
                      bgcolor: isToday ? '#eff6ff' : 'grey.50',
                      minWidth: { xs: 56, sm: 80 },
                      px: { xs: 0.5, sm: 1 },
                      borderLeft: isToday ? '2px solid #3b82f6' : undefined,
                      color: isFuture ? 'text.disabled' : isToday ? 'primary.main' : 'text.primary',
                    }}
                  >
                    <Box sx={{ fontSize: { xs: 11, sm: 12 } }}>{DAY_LABELS[i]}</Box>
                    <Box sx={{ fontSize: { xs: 9, sm: 10 }, fontWeight: 400, color: 'text.secondary' }}>{`${d}/${m}`}</Box>
                    {!loading && !isFuture && (
                      <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center', mt: 0.25, flexWrap: 'wrap' }}>
                        <Chip label={daySummary[i].present} size="small"
                          sx={{ height: 14, fontSize: 9, bgcolor: '#dcfce7', color: '#166534', px: 0.25, '& .MuiChip-label': { px: 0.5 } }} />
                        {daySummary[i].absent > 0 && (
                          <Chip label={daySummary[i].absent} size="small"
                            sx={{ height: 14, fontSize: 9, bgcolor: '#fee2e2', color: '#991b1b', px: 0.25, '& .MuiChip-label': { px: 0.5 } }} />
                        )}
                      </Box>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider', px: { xs: 1, sm: 2 } }}>
                      <Skeleton width={120} height={28} />
                    </TableCell>
                    {weekDates.map((d) => (
                      <TableCell key={d} align="center">
                        <Skeleton variant="circular" width={24} height={24} sx={{ mx: 'auto' }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : filteredStudents.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: 13 }}>
                    {students.length === 0 ? 'Chưa có học sinh trong lớp' : 'Không tìm thấy học sinh'}
                  </TableCell>
                </TableRow>
              )
              : filteredStudents.map((student, idx) => (
                  <TableRow
                    key={student._id}
                    sx={{ bgcolor: idx % 2 === 0 ? 'background.paper' : 'grey.50', '&:hover': { bgcolor: '#f0f9ff' } }}
                  >
                    <TableCell
                      sx={{
                        position: 'sticky', left: 0, zIndex: 1,
                        bgcolor: 'inherit',
                        borderRight: '1px solid', borderColor: 'divider',
                        px: { xs: 1, sm: 2 }, py: { xs: 0.75, sm: 1 },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
                        <Avatar
                          src={student.avatar}
                          sx={{ width: { xs: 24, sm: 28 }, height: { xs: 24, sm: 28 }, fontSize: 10, bgcolor: '#e0e7ff', color: '#4f46e5', flexShrink: 0 }}
                        >
                          {student.fullName?.[0]}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: { xs: 80, sm: 120 }, fontSize: { xs: 12, sm: 13 } }}>
                          {student.fullName}
                        </Typography>
                      </Box>
                    </TableCell>
                    {weekDates.map((date) => {
                      const isFuture = date > today;
                      const rec = attendanceMap[student._id]?.[date];
                      return (
                        <TableCell key={date} align="center" sx={{ py: { xs: 0.75, sm: 1 }, px: { xs: 0.5, sm: 1 } }}>
                          {isFuture
                            ? <Box sx={{ width: 16, height: 2, bgcolor: 'divider', mx: 'auto', borderRadius: 1 }} />
                            : <StatusCell status={rec?.status || 'empty'} note={rec?.note} absentReason={rec?.absentReason} />
                          }
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
            }
          </TableBody>
        </Table>
      </TableContainer>

      {/* Legend */}
      <Box sx={{
        px: { xs: 1.5, sm: 2.5 }, py: { xs: 1, sm: 1.5 },
        borderTop: '1px solid', borderColor: 'divider',
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(5, auto)' },
        gap: { xs: 0.75, sm: 2 },
      }}>
        {[
          ['checked_in', 'Đã đến'],
          ['late_checked_in', 'Đi muộn'],
          ['checked_out', 'Đã về'],
          ['absent', 'Vắng'],
          ['empty', 'Chưa điểm danh'],
        ].map(([key, label]) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ fontSize: 0, lineHeight: 0, '& svg': { fontSize: { xs: 16, sm: 18 } } }}>
              {STATUS_CONFIG[key].icon}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: 10, sm: 12 }, lineHeight: 1.3 }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
