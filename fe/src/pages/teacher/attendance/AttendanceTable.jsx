// Bảng danh sách điểm danh học sinh theo lớp
import { memo, useMemo, useRef, useState } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Chip, Alert, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, Tooltip, Avatar, LinearProgress, IconButton, Dialog, useMediaQuery, useTheme,
  InputAdornment,
} from '@mui/material';
import {
  Login as CheckInIcon,
  Logout as CheckOutIcon,
  Visibility as ViewIcon,
  PersonOff as AbsentIcon,
  HowToReg as PresentIcon,
  People as PeopleIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  CalendarMonth as CalendarIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  Search as SearchIcon,
  EventBusy as EventBusyIcon,
} from '@mui/icons-material';
import { defaultRecord } from './attendanceUtils';

const STATUS_CHIP = {
  empty:            { label: 'Chưa điểm danh', color: 'default',  dotColor: '#9ca3af' },
  checked_in:       { label: 'Đã đến',          color: 'success',  dotColor: '#10b981' },
  late_checked_in:  { label: 'Đi học muộn',     color: 'warning',  dotColor: '#f59e0b' },
  checked_out:      { label: 'Đã về',            color: 'info',     dotColor: '#0ea5e9' },
  late_checked_out: { label: 'Đi học muộn',     color: 'warning',  dotColor: '#f59e0b' },
  absent:           { label: 'Vắng mặt',         color: 'error',    dotColor: '#ef4444' },
};

function getChipProps(status) {
  return STATUS_CHIP[status] || { label: status || 'Không rõ', color: 'default', dotColor: '#9ca3af' };
}

const STATUS_SORT_ORDER = { empty: 0, checked_in: 1, late_checked_in: 1, absent: 2, checked_out: 3, late_checked_out: 3 };

const SummaryBar = memo(function SummaryBar({ students, attendanceByStudent }) {
  const counts = useMemo(() => {
    const c = { present: 0, out: 0, absent: 0, empty: 0 };
    (students || []).forEach((s) => {
      const st = attendanceByStudent?.[s._id]?.status || 'empty';
      if (st === 'checked_in' || st === 'late_checked_in') c.present++;
      else if (st === 'checked_out' || st === 'late_checked_out') c.out++;
      else if (st === 'absent') c.absent++;
      else c.empty++;
    });
    return c;
  }, [students, attendanceByStudent]);
  const total = students?.length || 0;
  const attended = counts.present + counts.out;

  const items = [
    { label: 'Có mặt', value: counts.present, color: 'success.main', bg: '#dcfce7' },
    { label: 'Đã về',  value: counts.out,     color: 'info.main',    bg: '#e0f2fe' },
    { label: 'Vắng',   value: counts.absent,  color: 'error.main',   bg: '#fee2e2' },
    { label: 'Chưa',   value: counts.empty,   color: 'text.disabled', bg: '#f3f4f6' },
  ];

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Tổng quan: <strong style={{ color: '#111' }}>{attended}/{total}</strong> học sinh điểm danh
        </Typography>
        {total > 0 && (
          <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ ml: 'auto' }}>
            {Math.round((attended / total) * 100)}%
          </Typography>
        )}
      </Box>
      {total > 0 && (
        <LinearProgress
          variant="determinate"
          value={(attended / total) * 100}
          sx={{ height: 5, borderRadius: 3, mb: 1.5, bgcolor: '#e5e7eb' }}
          color="success"
        />
      )}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {items.map((item) => (
          <Box
            key={item.label}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: 1.5, bgcolor: item.bg }}
          >
            <Typography variant="caption" fontWeight={700} sx={{ color: item.color }}>{item.value}</Typography>
            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
});

const FILTER_OPTIONS = [
  { key: 'all',         label: 'Tất cả',             color: 'default' },
  { key: 'empty',       label: 'Chưa điểm danh',     color: 'default' },
  { key: 'present',     label: 'Có mặt',              color: 'success' },
  { key: 'late',        label: 'Đi học muộn',         color: 'warning' },
  { key: 'not_left',    label: 'Chưa điểm danh về',  color: 'warning' },
  { key: 'checked_out', label: 'Đã điểm danh về',    color: 'info'    },
  { key: 'absent',      label: 'Vắng mặt',            color: 'error'   },
];

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function addDays(dateStr, delta) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function DateNavigator({ selectedDate, todayISO, onDateChange }) {
  const inputRef = useRef(null);
  const isToday = selectedDate >= todayISO;

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: 0.5,
        bgcolor: 'rgba(255,255,255,0.15)',
        borderRadius: 2.5,
        border: '1px solid rgba(255,255,255,0.3)',
        px: 0.5,
        py: 0.25,
      }}
    >
      <Tooltip title="Ngày trước" arrow>
        <IconButton
          size="small"
          onClick={() => onDateChange(addDays(selectedDate, -1))}
          sx={{ color: 'white', p: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          <PrevIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Chọn ngày" arrow>
        <Box
          onClick={() => inputRef.current?.showPicker?.()}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.75,
            cursor: 'pointer', px: 1, py: 0.5, borderRadius: 1.5,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
            transition: 'background 0.15s',
          }}
        >
          <CalendarIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.85)' }} />
          <Typography variant="body2" fontWeight={700} color="white" sx={{ letterSpacing: 0.3, userSelect: 'none' }}>
            {formatDisplayDate(selectedDate)}
          </Typography>
        </Box>
      </Tooltip>

      <Tooltip title="Ngày sau" arrow>
        <span>
          <IconButton
            size="small"
            disabled={isToday}
            onClick={() => onDateChange(addDays(selectedDate, 1))}
            sx={{
              color: isToday ? 'rgba(255,255,255,0.3)' : 'white',
              p: 0.5,
              '&:hover': { bgcolor: isToday ? 'transparent' : 'rgba(255,255,255,0.2)' },
            }}
          >
            <NextIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      {/* Hidden native date input */}
      <TextField
        inputRef={inputRef}
        type="date"
        value={selectedDate}
        slotProps={{ htmlInput: { max: todayISO } }}
        onChange={(e) => onDateChange(e.target.value)}
        sx={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
      />
    </Box>
  );
}

function PhotoLightbox({ src, name, onClose }) {
  if (!src) return null;
  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible',
            m: 2,
          },
        },
        backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.85)' } },
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <Box
          component="img"
          src={src}
          alt={name}
          sx={{
            display: 'block',
            maxWidth: '80vw',
            maxHeight: '80vh',
            borderRadius: 3,
            objectFit: 'contain',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          }}
        />
        {/* Tên học sinh */}
        <Box
          sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
            background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
            px: 2.5, py: 1.5,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} color="white">
            {name}
          </Typography>
        </Box>
        {/* Nút đóng */}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: 'absolute', top: -14, right: -14,
            bgcolor: 'white', color: 'grey.800',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            '&:hover': { bgcolor: 'grey.100' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Dialog>
  );
}

// ── Student avatar (dùng chung giữa card và table) ──
function StudentAvatar({ student, chipProps, size = 48, onLightbox }) {
  return (
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
      {student.avatar ? (
        <Tooltip title="Xem ảnh" arrow placement="right">
          <Box
            onClick={() => onLightbox({ src: student.avatar, name: student.fullName })}
            sx={{
              position: 'relative', width: size, height: size,
              borderRadius: 2, overflow: 'hidden', cursor: 'zoom-in',
              border: `2px solid ${chipProps.dotColor}`,
              boxShadow: `0 0 0 2px ${chipProps.dotColor}28, 0 2px 8px rgba(0,0,0,0.12)`,
              '&:hover .zoom-overlay': { opacity: 1 },
              '&:hover img': { transform: 'scale(1.08)' },
            }}
          >
            <Box
              component="img"
              src={student.avatar}
              alt={student.fullName}
              loading="lazy"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s ease' }}
            />
            <Box
              className="zoom-overlay"
              sx={{
                position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.38)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.18s',
              }}
            >
              <ZoomInIcon sx={{ color: 'white', fontSize: size * 0.4 }} />
            </Box>
          </Box>
        </Tooltip>
      ) : (
        <Box
          sx={{
            width: size, height: size, borderRadius: 2,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${chipProps.dotColor}`,
            boxShadow: `0 0 0 2px ${chipProps.dotColor}28`,
            fontSize: size * 0.38, fontWeight: 700, color: 'white', userSelect: 'none',
          }}
        >
          {student.fullName?.[0]?.toUpperCase() || '?'}
        </Box>
      )}
      <Box
        sx={{
          position: 'absolute', bottom: -3, right: -3,
          width: 12, height: 12, borderRadius: '50%',
          bgcolor: chipProps.dotColor, border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </Box>
  );
}

// ── Mobile card cho từng học sinh ──
function StudentCard({ s, idx, rec, chipProps, isPastDate, onCheckin, onCheckout, onViewDetail, onAbsent, onLightbox }) {
  const canCheckIn  = rec.status === 'empty' || rec.status === 'absent';
  const canCheckOut = rec.status === 'checked_in' || rec.status === 'late_checked_in';
  const canAbsent   = rec.status === 'empty' || rec.status === 'absent';
  const isAbsent    = rec.status === 'absent';
  const isDone      = rec.status === 'checked_out' || rec.status === 'late_checked_out';

  return (
    <Box
      sx={{
        px: 2, py: 1.5,
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: isAbsent ? '#fff5f5' : isDone ? '#f0fdf4' : 'white',
        '&:last-child': { borderBottom: 0 },
      }}
    >
      {/* Row 1: Avatar + Tên + Trạng thái */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ minWidth: 18, textAlign: 'center' }}>
          {idx + 1}
        </Typography>
        <StudentAvatar student={s} chipProps={chipProps} size={44} onLightbox={onLightbox} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {s.fullName || '—'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
            <Chip label={chipProps.label} color={chipProps.color} size="small" sx={{ fontSize: 10, height: 20, fontWeight: 700 }} />
            {rec.timeIn && (
              <Chip
                label={rec.timeIn}
                size="small"
                icon={<CheckInIcon sx={{ fontSize: '11px !important' }} />}
                sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: '#dcfce7', color: '#15803d' }}
              />
            )}
            {rec.timeOut && (
              <Chip
                label={rec.timeOut}
                size="small"
                icon={<CheckOutIcon sx={{ fontSize: '11px !important' }} />}
                sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: '#e0f2fe', color: '#0369a1' }}
              />
            )}
          </Box>
          {rec.note && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25 }}>
              {rec.note}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Row 2: Action buttons */}
      <Box sx={{ display: 'flex', gap: 0.75, pl: '30px', flexWrap: 'wrap' }}>
        {!isPastDate && canCheckIn && (
          <Button
            size="small" variant="contained" color="success"
            onClick={() => onCheckin(s._id)}
            startIcon={<CheckInIcon sx={{ fontSize: '12px !important' }} />}
            sx={{ textTransform: 'none', fontSize: 11, fontWeight: 700, borderRadius: 1.5, px: 1.25, py: 0.4, minWidth: 0, boxShadow: 'none' }}
          >
            Điểm danh
          </Button>
        )}
        {!isPastDate && canCheckOut && (
          <Button
            size="small" variant="contained" color="info"
            onClick={() => onCheckout(s._id)}
            startIcon={<CheckOutIcon sx={{ fontSize: '12px !important' }} />}
            sx={{ textTransform: 'none', fontSize: 11, fontWeight: 700, borderRadius: 1.5, px: 1.25, py: 0.4, minWidth: 0, boxShadow: 'none' }}
          >
            Điểm danh về
          </Button>
        )}
        <Button
          size="small" variant="outlined" color="primary"
          onClick={() => onViewDetail(s._id)}
          startIcon={<ViewIcon sx={{ fontSize: '12px !important' }} />}
          sx={{ textTransform: 'none', fontSize: 11, fontWeight: 700, borderRadius: 1.5, px: 1.25, py: 0.4, minWidth: 0 }}
        >
          Chi tiết
        </Button>
        {!isPastDate && canAbsent && (
          <Button
            size="small" variant={isAbsent ? 'outlined' : 'contained'} color="error"
            onClick={() => onAbsent(s._id)}
            startIcon={<AbsentIcon sx={{ fontSize: '12px !important' }} />}
            sx={{ textTransform: 'none', fontSize: 11, fontWeight: 700, borderRadius: 1.5, px: 1.25, py: 0.4, minWidth: 0, boxShadow: 'none' }}
          >
            Vắng
          </Button>
        )}
      </Box>
    </Box>
  );
}

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
  isWeekend,
}) {
  const [lightbox, setLightbox] = useState(null); // { src, name }
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isPastDate = selectedDate < todayISO;

  const filteredStudents = useMemo(() => {
    const lower = searchText.toLowerCase().trim();
    return (students || [])
      .filter((s) => {
        const matchName = s.fullName?.toLowerCase().includes(lower);
        if (!matchName) return false;
        if (filterStatus === 'all') return true;
        const st = attendanceByStudent?.[s._id]?.status || 'empty';
        if (filterStatus === 'empty')       return st === 'empty';
        if (filterStatus === 'present')     return st === 'checked_in' || st === 'late_checked_in' || st === 'checked_out' || st === 'late_checked_out';
        if (filterStatus === 'late')        return st === 'late_checked_in' || st === 'late_checked_out';
        if (filterStatus === 'not_left')    return st === 'checked_in' || st === 'late_checked_in';
        if (filterStatus === 'checked_out') return st === 'checked_out' || st === 'late_checked_out';
        if (filterStatus === 'absent')      return st === 'absent';
        return true;
      })
      .sort((a, b) => {
        const stA = attendanceByStudent?.[a._id]?.status || 'empty';
        const stB = attendanceByStudent?.[b._id]?.status || 'empty';
        return (STATUS_SORT_ORDER[stA] ?? 99) - (STATUS_SORT_ORDER[stB] ?? 99);
      });
  }, [students, attendanceByStudent, searchText, filterStatus]);

  return (
    <>
    {lightbox && (
      <PhotoLightbox src={lightbox.src} name={lightbox.name} onClose={() => setLightbox(null)} />
    )}
    <Paper
      elevation={0}
      sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
    >
      {/* Header toolbar */}
      <Box
        sx={{
          px: { xs: 2, md: 3 }, py: 2,
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between', gap: 2,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="white">
            Danh sách điểm danh
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            Lớp:{' '}
            <Box component="span" sx={{ fontWeight: 700, color: 'white' }}>
              {selectedClassName || classId}
            </Box>
          </Typography>
        </Box>

        <DateNavigator
          selectedDate={selectedDate}
          todayISO={todayISO}
          onDateChange={onDateChange}
        />
      </Box>

      {/* Weekend notice */}
      {isWeekend && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
          <Stack alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: '#fef9c3' }}>
              <EventBusyIcon sx={{ fontSize: 30, color: '#ca8a04' }} />
            </Avatar>
            <Typography variant="subtitle1" fontWeight={700}>Ngày nghỉ cuối tuần</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={320}>
              Thứ 7 và chủ nhật học sinh không đi học. 
            </Typography>
          </Stack>
        </Box>
      )}

      {/* Summary bar */}
      {!isWeekend && !loadingStudents && (students || []).length > 0 && (
        <SummaryBar students={students} attendanceByStudent={attendanceByStudent} />
      )}

      {/* Search + Filter bar */}
      {!isWeekend && !loadingStudents && (students || []).length > 0 && (
        <Box sx={{ px: { xs: 2, md: 3 }, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <TextField
            size="small"
            placeholder="Tìm kiếm học sinh..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: searchText ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchText('')} edge="end">
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{ width: { xs: '100%', sm: 320 } }}
          />
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {FILTER_OPTIONS.map((opt) => (
              <Chip
                key={opt.key}
                label={opt.label}
                size="small"
                color={filterStatus === opt.key ? opt.color : 'default'}
                variant={filterStatus === opt.key ? 'filled' : 'outlined'}
                onClick={() => setFilterStatus(filterStatus === opt.key && opt.key !== 'all' ? 'all' : opt.key)}
                sx={{ fontWeight: filterStatus === opt.key ? 700 : 500, fontSize: 12, cursor: 'pointer' }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Error */}
      {!isWeekend && studentsError && (
        <Alert severity="error" sx={{ mx: 3, mt: 2, borderRadius: 2 }}>{studentsError}</Alert>
      )}

      {/* Content */}
      {!isWeekend && (loadingStudents ? (
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="rounded" height={isMobile ? 90 : 52} />)}
        </Box>
      ) : (students || []).length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'grey.100', mx: 'auto', mb: 2 }}>
            <PresentIcon sx={{ color: 'grey.400', fontSize: 28 }} />
          </Avatar>
          <Typography variant="body1" fontWeight={600} color="text.secondary">
            Lớp chưa có học sinh
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Liên hệ quản trị viên để thêm học sinh vào lớp.
          </Typography>
        </Box>
      ) : filteredStudents.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'grey.100', mx: 'auto', mb: 2 }}>
            <SearchIcon sx={{ color: 'grey.400', fontSize: 28 }} />
          </Avatar>
          <Typography variant="body1" fontWeight={600} color="text.secondary">
            Không tìm thấy học sinh
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Thử thay đổi từ khóa hoặc bỏ bộ lọc trạng thái.
          </Typography>
        </Box>
      ) : isMobile ? (
        /* ── Mobile: Card list ── */
        <Box>
          {filteredStudents.map((s, idx) => {
            const rec = attendanceByStudent?.[s._id] || defaultRecord();
            const chipProps = getChipProps(rec.status);
            return (
              <StudentCard
                key={s._id}
                s={s} idx={idx} rec={rec} chipProps={chipProps}
                isPastDate={isPastDate}
                onCheckin={onCheckin} onCheckout={onCheckout}
                onViewDetail={onViewDetail} onAbsent={onAbsent}
                onLightbox={setLightbox}
              />
            );
          })}
        </Box>
      ) : (
        /* ── Desktop: Table ── */
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    bgcolor: 'grey.50',
                    fontWeight: 700, fontSize: 12,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    py: 1.5,
                    borderBottom: '2px solid', borderColor: 'divider',
                  },
                }}
              >
                <TableCell width={52} align="center">#</TableCell>
                <TableCell>Học sinh</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Giờ đến</TableCell>
                <TableCell align="center">Giờ về</TableCell>
                <TableCell sx={{ minWidth: 260 }} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((s, idx) => {
                const rec = attendanceByStudent?.[s._id] || defaultRecord();
                const chipProps = getChipProps(rec.status);
                const canCheckIn  = rec.status === 'empty' || rec.status === 'absent';
                const canCheckOut = rec.status === 'checked_in' || rec.status === 'late_checked_in';
                const canAbsent   = rec.status === 'empty' || rec.status === 'absent';
                const isAbsent    = rec.status === 'absent';
                const isDone      = rec.status === 'checked_out' || rec.status === 'late_checked_out';

                return (
                  <TableRow
                    key={s._id}
                    hover
                    sx={{
                      '&:last-child td': { border: 0 },
                      bgcolor: isAbsent ? '#fff5f5' : isDone ? '#f0fdf4' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <TableCell align="center" sx={{ width: 48, px: 1 }}>
                      <Typography variant="caption" fontWeight={700} color="text.disabled">
                        {idx + 1}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <StudentAvatar student={s} chipProps={chipProps} size={64} onLightbox={setLightbox} />
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {s.fullName || '—'}
                          </Typography>
                          {rec.note && (
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180, display: 'block' }}>
                              {rec.note}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={chipProps.label}
                        color={chipProps.color}
                        size="small"
                        sx={{ fontSize: 11, height: 22, fontWeight: 700 }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      {rec.timeIn ? (
                        <Chip
                          label={rec.timeIn}
                          size="small"
                          icon={<CheckInIcon sx={{ fontSize: '13px !important' }} />}
                          sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: '#dcfce7', color: '#15803d' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>

                    <TableCell align="center">
                      {rec.timeOut ? (
                        <Chip
                          label={rec.timeOut}
                          size="small"
                          icon={<CheckOutIcon sx={{ fontSize: '13px !important' }} />}
                          sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: '#e0f2fe', color: '#0369a1' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={0.75} justifyContent="center">
                        {!isPastDate && canCheckIn && (
                          <Tooltip title="Điểm danh" arrow>
                            <Button
                              size="small" variant="contained" color="success"
                              onClick={() => onCheckin(s._id)}
                              startIcon={<CheckInIcon sx={{ fontSize: '13px !important' }} />}
                              sx={{ textTransform: 'none', fontSize: 12, fontWeight: 700, borderRadius: 1.5, px: 1.5, py: 0.5, minWidth: 0, boxShadow: 'none' }}
                            >
                              Điểm danh
                            </Button>
                          </Tooltip>
                        )}
                        {!isPastDate && canCheckOut && (
                          <Tooltip title="Điểm danh về" arrow>
                            <Button
                              size="small" variant="contained" color="info"
                              onClick={() => onCheckout(s._id)}
                              startIcon={<CheckOutIcon sx={{ fontSize: '13px !important' }} />}
                              sx={{ textTransform: 'none', fontSize: 12, fontWeight: 700, borderRadius: 1.5, px: 1.5, py: 0.5, minWidth: 0, boxShadow: 'none' }}
                            >
                              Điểm danh về
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip title="Xem chi tiết" arrow>
                          <Button
                            size="small" variant="outlined" color="primary"
                            onClick={() => onViewDetail(s._id)}
                            startIcon={<ViewIcon sx={{ fontSize: '13px !important' }} />}
                            sx={{ textTransform: 'none', fontSize: 12, fontWeight: 700, borderRadius: 1.5, px: 1.5, py: 0.5, minWidth: 0 }}
                          >
                            Chi tiết
                          </Button>
                        </Tooltip>
                        {!isPastDate && canAbsent && (
                          <Tooltip title="Đánh vắng mặt" arrow>
                            <Button
                              size="small" variant={isAbsent ? 'outlined' : 'contained'} color="error"
                              onClick={() => onAbsent(s._id)}
                              startIcon={<AbsentIcon sx={{ fontSize: '13px !important' }} />}
                              sx={{ textTransform: 'none', fontSize: 12, fontWeight: 700, borderRadius: 1.5, px: 1.5, py: 0.5, minWidth: 0, boxShadow: 'none' }}
                            >
                              Vắng
                            </Button>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ))}
    </Paper>
    </>
  );
}

export default memo(AttendanceTable);
