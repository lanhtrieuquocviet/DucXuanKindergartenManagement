// Bảng danh sách điểm danh học sinh theo lớp
import {
  Box, Paper, Typography, Button, TextField, Chip, Alert, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, Tooltip, Avatar, LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Login as CheckInIcon,
  Logout as CheckOutIcon,
  Visibility as ViewIcon,
  PersonOff as AbsentIcon,
  HowToReg as PresentIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { defaultRecord } from './attendanceUtils';

const STATUS_CHIP = {
  empty:            { label: 'Chưa điểm danh', color: 'default',  dotColor: '#9ca3af' },
  checked_in:       { label: 'Đã đến',          color: 'success',  dotColor: '#10b981' },
  checked_out:      { label: 'Đã về',            color: 'info',     dotColor: '#0ea5e9' },
  absent:           { label: 'Vắng mặt',         color: 'error',    dotColor: '#ef4444' },
  waiting_parent:   { label: 'Chờ PH xác nhận',  color: 'warning',  dotColor: '#f59e0b' },
  parent_confirmed: { label: 'PH đã xác nhận',   color: 'success',  dotColor: '#10b981' },
};

function getChipProps(status) {
  return STATUS_CHIP[status] || { label: status || 'Không rõ', color: 'default', dotColor: '#9ca3af' };
}

function SummaryBar({ students, attendanceByStudent }) {
  const counts = { present: 0, out: 0, absent: 0, empty: 0 };
  (students || []).forEach((s) => {
    const st = attendanceByStudent?.[s._id]?.status || 'empty';
    if (st === 'checked_in' || st === 'waiting_parent' || st === 'parent_confirmed') counts.present++;
    else if (st === 'checked_out') counts.out++;
    else if (st === 'absent') counts.absent++;
    else counts.empty++;
  });
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
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.75,
              px: 1.25, py: 0.5, borderRadius: 1.5, bgcolor: item.bg,
            }}
          >
            <Typography variant="caption" fontWeight={700} sx={{ color: item.color }}>{item.value}</Typography>
            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
          </Box>
        ))}
      </Stack>
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
  onBackToClassList,
}) {
  return (
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

        <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={onBackToClassList}
            variant="contained"
            sx={{
              borderRadius: 2, textTransform: 'none', fontWeight: 600,
              bgcolor: 'rgba(255,255,255,0.18)', color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: 'none',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.28)', boxShadow: 'none' },
            }}
          >
            Chọn lớp khác
          </Button>
          <TextField
            type="date"
            size="small"
            label="Ngày"
            value={selectedDate}
            slotProps={{ htmlInput: { max: todayISO }, inputLabel: { shrink: true } }}
            onChange={(e) => onDateChange(e.target.value)}
            sx={{
              width: 155,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                borderRadius: 2,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.6)' },
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.75)' },
              '& input': { colorScheme: 'dark' },
            }}
          />
        </Stack>
      </Box>

      {/* Summary bar */}
      {!loadingStudents && (students || []).length > 0 && (
        <SummaryBar students={students} attendanceByStudent={attendanceByStudent} />
      )}

      {/* Error */}
      {studentsError && (
        <Alert severity="error" sx={{ mx: 3, mt: 2, borderRadius: 2 }}>{studentsError}</Alert>
      )}

      {/* Content */}
      {loadingStudents ? (
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="rounded" height={52} />)}
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
      ) : (
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
              {(students || []).map((s, idx) => {
                const rec = attendanceByStudent?.[s._id] || defaultRecord();
                const chipProps = getChipProps(rec.status);
                const canCheckIn  = rec.status === 'empty' || rec.status === 'absent';
                const canCheckOut = rec.status === 'checked_in' || rec.status === 'waiting_parent' || rec.status === 'parent_confirmed';
                const canAbsent   = rec.status !== 'checked_out';
                const isAbsent    = rec.status === 'absent';
                const isDone      = rec.status === 'checked_out';

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
                    <TableCell align="center">
                      <Avatar
                        sx={{
                          width: 28, height: 28, fontSize: 12, fontWeight: 700,
                          bgcolor: chipProps.dotColor + '20',
                          color: chipProps.dotColor,
                          mx: 'auto',
                        }}
                      >
                        {idx + 1}
                      </Avatar>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 34, height: 34, fontSize: 13, fontWeight: 700,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white',
                          }}
                        >
                          {s.fullName?.[0] || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {s.fullName || '—'}
                          </Typography>
                          {rec.note && (
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 160, display: 'block' }}>
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
                        {canCheckIn && (
                          <Tooltip title="Check-in" arrow>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => onCheckin(s._id)}
                              startIcon={<CheckInIcon sx={{ fontSize: '13px !important' }} />}
                              sx={{ textTransform: 'none', fontSize: 12, fontWeight: 700, borderRadius: 1.5, px: 1.5, py: 0.5, minWidth: 0, boxShadow: 'none' }}
                            >
                              Check in
                            </Button>
                          </Tooltip>
                        )}
                        {canCheckOut && (
                          <Tooltip title="Check-out" arrow>
                            <Button
                              size="small"
                              variant="contained"
                              color="info"
                              onClick={() => onCheckout(s._id)}
                              startIcon={<CheckOutIcon sx={{ fontSize: '13px !important' }} />}
                              sx={{ textTransform: 'none', fontSize: 12, fontWeight: 700, borderRadius: 1.5, px: 1.5, py: 0.5, minWidth: 0, boxShadow: 'none' }}
                            >
                              Check-out
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip title="Xem chi tiết" arrow>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => onViewDetail(s._id)}
                            startIcon={<ViewIcon sx={{ fontSize: '13px !important' }} />}
                            sx={{ textTransform: 'none', fontSize: 12, fontWeight: 700, borderRadius: 1.5, px: 1.5, py: 0.5, minWidth: 0 }}
                          >
                            Chi tiết
                          </Button>
                        </Tooltip>
                        {canAbsent && (
                          <Tooltip title="Đánh vắng mặt" arrow>
                            <Button
                              size="small"
                              variant={isAbsent ? 'outlined' : 'contained'}
                              color="error"
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
      )}
    </Paper>
  );
}

export default AttendanceTable;
