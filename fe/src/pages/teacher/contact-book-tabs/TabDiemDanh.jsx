import { useState, useEffect } from 'react';
import { 
  Box, Paper, Stack, Typography, Select, MenuItem, 
  Skeleton, LinearProgress, Chip, Divider 
} from '@mui/material';
import { 
  CalendarMonth as CalendarIcon, 
  CheckCircle as PresentIcon, 
  Cancel as AbsentIcon, 
  EventBusy as LeaveIcon 
} from '@mui/icons-material';
import { get, ENDPOINTS } from '../../../service/api';

export default function TabDiemDanh({ classId, studentId }) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data,  setData]  = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    get(`${ENDPOINTS.TEACHER.CONTACT_BOOK_ATTENDANCE(classId, studentId)}?year=${year}&month=${month}`)
      .then(res => setData(res.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [classId, studentId, year, month]);

  const STATUS_CONFIG = {
    present: { label: 'Có mặt', color: '#16a34a', bg: '#dcfce7', icon: <PresentIcon sx={{ fontSize: 14 }} /> },
    absent:  { label: 'Vắng',   color: '#dc2626', bg: '#fee2e2', icon: <AbsentIcon  sx={{ fontSize: 14 }} /> },
    leave:   { label: 'Nghỉ phép', color: '#d97706', bg: '#fef3c7', icon: <LeaveIcon sx={{ fontSize: 14 }} /> },
  };

  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
  const YEARS  = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <Box>
      <Stack direction="row" spacing={1.5} mb={2} alignItems="center">
        <CalendarIcon sx={{ fontSize: 18, color: '#0891b2' }} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>Lịch sử điểm danh</Typography>
        <Select
          size="small" value={month}
          onChange={e => setMonth(e.target.value)}
          sx={{ minWidth: 110, fontSize: 13, borderRadius: 2 }}
        >
          {MONTHS.map(m => (
            <MenuItem key={m} value={m} sx={{ fontSize: 13 }}>Tháng {m}</MenuItem>
          ))}
        </Select>
        <Select
          size="small" value={year}
          onChange={e => setYear(e.target.value)}
          sx={{ minWidth: 80, fontSize: 13, borderRadius: 2 }}
        >
          {YEARS.map(y => (
            <MenuItem key={y} value={y} sx={{ fontSize: 13 }}>{y}</MenuItem>
          ))}
        </Select>
      </Stack>

      {loading ? (
        <Box>
          {[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 2, mb: 1 }} />)}
        </Box>
      ) : !data || data.records.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
          <CalendarIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
          <Typography color="text.secondary" variant="body2">Không có dữ liệu điểm danh tháng {month}/{year}</Typography>
        </Paper>
      ) : (
        <>
          <Paper elevation={0} sx={{ borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', p: 2, mb: 2 }}>
            <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography variant="caption" color="text.secondary">Tỷ lệ đi học tháng {month}</Typography>
                <Stack direction="row" alignItems="baseline" spacing={0.5}>
                  <Typography variant="h5" fontWeight={800} color="#16a34a">{data.rate ?? '—'}%</Typography>
                  <Typography variant="caption" color="text.secondary">({data.present}/{data.total} ngày)</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={data.rate ?? 0}
                  sx={{ mt: 0.75, height: 6, borderRadius: 3, bgcolor: '#dcfce7', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a', borderRadius: 3 } }}
                />
              </Box>
              <Stack direction="row" spacing={2}>
                {[
                  { key: 'present', label: 'Có mặt', val: data.present },
                  { key: 'absent',  label: 'Vắng',   val: data.absent  },
                  { key: 'leave',   label: 'Phép',   val: data.leave   },
                ].map(s => (
                  <Box key={s.key} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={700} color={STATUS_CONFIG[s.key].color}>{s.val}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Paper>

          <Stack spacing={0.5}>
            {data.records.map((r, idx) => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.present;
              const dateLabel = new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              return (
                <Box key={r._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 1.25, px: 0.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{dateLabel}</Typography>
                      <Typography variant="caption" color={cfg.color}>
                        {cfg.label}
                        {r.timeString?.checkIn ? ` · ${r.timeString.checkIn}` : ''}
                        {r.absentReason ? ` · ${r.absentReason}` : ''}
                      </Typography>
                    </Box>
                    <Chip
                      label={cfg.label}
                      size="small"
                      icon={cfg.icon}
                      sx={{
                        bgcolor: cfg.bg, color: cfg.color, fontWeight: 700,
                        fontSize: '0.72rem', border: `1px solid ${cfg.bg}`,
                        '& .MuiChip-icon': { color: cfg.color },
                      }}
                    />
                  </Box>
                  {idx < data.records.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Stack>
        </>
      )}
    </Box>
  );
}
