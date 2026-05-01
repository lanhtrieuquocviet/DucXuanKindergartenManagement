import { useState, useEffect, useCallback } from 'react';
import { 
  Box, Stack, Typography, Paper, Table, TableHead, TableBody, 
  TableRow, TableCell, TableContainer, Chip, Button, Dialog, 
  DialogTitle, DialogContent, DialogActions, Skeleton 
} from '@mui/material';
import { MonitorHeart as HealthIcon } from '@mui/icons-material';
import { get, ENDPOINTS } from '../../../service/api';

const STATUS_HEALTH = {
  healthy:    { label: 'Bình thường',   color: 'success' },
  monitor:    { label: 'Cần theo dõi',  color: 'warning' },
  concerning: { label: 'Đáng lo ngại',  color: 'error'   },
};

function calcBMI(height, weight) {
  if (!height || !weight) return null;
  return +(weight / ((height / 100) ** 2)).toFixed(1);
}

function bmiLabel(bmi) {
  if (!bmi) return null;
  if (bmi < 14.5) return { label: 'Thiếu cân',  color: 'info'    };
  if (bmi < 18)   return { label: 'Bình thường', color: 'success' };
  if (bmi < 25)   return { label: 'Thừa cân',    color: 'warning' };
  return           { label: 'Béo phì',    color: 'error'   };
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function sortHealthRecordsNewestFirst(list) {
  return [...(list || [])].sort((a, b) => {
    const db = new Date(b.checkDate || 0).getTime();
    const da = new Date(a.checkDate || 0).getTime();
    if (db !== da) return db - da;
    return String(b._id || '').localeCompare(String(a._id || ''));
  });
}

function HealthRecordDetailView({ health }) {
  if (!health) return null;
  const bmi    = calcBMI(health.height, health.weight);
  const bmiCfg = bmiLabel(bmi);
  const statusCfg = STATUS_HEALTH[health.generalStatus];
  const recorder = health.recordedBy?.fullName || health.recordedBy?.username;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
        <Chip label={fmtDate(health.checkDate)} size="small" sx={{ height: 22, fontSize: '0.72rem' }} />
        {statusCfg && (
          <Chip label={statusCfg.label} size="small" color={statusCfg.color} sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }} />
        )}
        {recorder && (
          <Typography variant="caption" color="text.secondary">Người ghi: <strong>{recorder}</strong></Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1.5} flexWrap="wrap" mb={2}>
        {health.height != null && health.height !== '' && (
          <Box sx={{ bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Chiều cao</Typography>
            <Typography variant="body1" fontWeight={800} color="#0891b2">{health.height}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>cm</Typography>
          </Box>
        )}
        {health.weight != null && health.weight !== '' && (
          <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Cân nặng</Typography>
            <Typography variant="body1" fontWeight={800} color="#16a34a">{health.weight}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>kg</Typography>
          </Box>
        )}
        {bmi && (
          <Box sx={{ bgcolor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 2, px: 2, py: 1, textAlign: 'center', minWidth: 80 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>BMI</Typography>
            <Typography variant="body1" fontWeight={800} color="#ea580c">{bmi}</Typography>
            {bmiCfg && (
              <Chip label={bmiCfg.label} size="small" color={bmiCfg.color} variant="outlined" sx={{ height: 16, fontSize: '0.6rem', border: 0 }} />
            )}
          </Box>
        )}
      </Stack>

      {health.note && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>NHẬN XÉT</Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{health.note}</Typography>
        </Paper>
      )}
    </Box>
  );
}

export default function TabSucKhoe({ classId, studentId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const fetchHealthHistory = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.TEACHER.CONTACT_BOOK_HEALTH_HISTORY(classId, studentId));
      setRecords(sortHealthRecordsNewestFirst(res.data));
    } catch (_) {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [classId, studentId]);

  useEffect(() => {
    fetchHealthHistory();
  }, [fetchHealthHistory]);

  if (loading) return <Skeleton variant="rounded" height={240} sx={{ borderRadius: 3 }} />;

  if (records.length === 0) {
    return (
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
        <HealthIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} />
        <Typography color="text.secondary" variant="body2">Chưa có dữ liệu khám sức khỏe</Typography>
      </Paper>
    );
  }

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
        <HealthIcon sx={{ fontSize: 18, color: '#059669' }} />
        <Typography variant="subtitle2" fontWeight={700}>Lịch sử khám sức khỏe</Typography>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Ngày khám</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Cân nặng (kg)</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Chiều cao (cm)</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Tình trạng</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r._id} hover>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{fmtDate(r.checkDate)}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>{r.weight || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: '#0891b2', fontWeight: 700 }}>{r.height || '—'}</TableCell>
                  <TableCell>
                    {r.generalStatus && (
                      <Chip 
                        label={STATUS_HEALTH[r.generalStatus]?.label} 
                        color={STATUS_HEALTH[r.generalStatus]?.color}
                        size="small"
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setDetail(r)} sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 700 }}>
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle sx={{ fontWeight: 700, pr: 6 }}>Chi tiết khám sức khỏe</DialogTitle>
        <DialogContent dividers>
          {detail && <HealthRecordDetailView health={detail} />}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => setDetail(null)} variant="contained" color="inherit">Đóng</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
