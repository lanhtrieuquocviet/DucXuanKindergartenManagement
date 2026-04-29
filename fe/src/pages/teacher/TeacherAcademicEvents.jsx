import { Box, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ENDPOINTS, get } from '../../service/api';

function toDMY(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function toRange(startDateStr, endDateStr) {
  const start = toDMY(startDateStr);
  const end = toDMY(endDateStr || startDateStr);
  if (!start) return '';
  return start === end ? start : `${start} - ${end}`;
}

function normalizeDateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getStatusInfo(startDateStr, endDateStr) {
  const start = normalizeDateOnly(startDateStr);
  const end = normalizeDateOnly(endDateStr || startDateStr);
  const today = normalizeDateOnly(new Date());
  if (!start || !end || !today) return { label: 'Sắp diễn ra', tone: 'upcoming' };
  if (today >= start && today <= end) return { label: 'Đang diễn ra', tone: 'ongoing' };
  if (end < today) return { label: 'Đã tổ chức', tone: 'done' };
  return { label: 'Sắp diễn ra', tone: 'upcoming' };
}

function getChipStyles(tone) {
  if (tone === 'done') {
    return {
      bgcolor: '#dcfce7',
      color: '#16a34a',
      border: '1px solid',
      borderColor: '#86efac',
      fontWeight: 700,
    };
  }
  if (tone === 'ongoing') {
    return {
      bgcolor: '#dbeafe',
      color: '#1d4ed8',
      border: '1px solid',
      borderColor: '#93c5fd',
      fontWeight: 700,
    };
  }
  return {
    bgcolor: '#fef9c3',
    color: '#ca8a04',
    border: '1px solid',
    borderColor: '#facc15',
    fontWeight: 700,
  };
}

export default function TeacherAcademicEvents() {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const resp = await get(ENDPOINTS.TEACHER.ACADEMIC_EVENTS());
        const rows = Array.isArray(resp?.data?.months) ? resp.data.months : [];
        setMonths(rows);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading teacher academic events:', error);
        toast.error(error?.message || 'Không tải được sự kiện năm học');
        setMonths([]);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const events = useMemo(
    () =>
      months.flatMap((m) =>
        (m?.items || []).map((it) => ({
          name: it?.name || '',
          time: toRange(it?.startDate || it?.date, it?.endDate || it?.startDate || it?.date),
          gradeName: it?.gradeName || 'Khối lớp',
          status: getStatusInfo(it?.startDate || it?.date, it?.endDate || it?.startDate || it?.date),
        })),
      ),
    [months],
  );

  return (
    <Box>
      <Stack spacing={2.5}>
        <Typography variant="h5" fontWeight={800} color="#1f3b5b">
          Sự kiện năm học
        </Typography>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#3794d1' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>STT</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Tên sự kiện</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Thời gian</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Khối lớp liên quan</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((ev, index) => (
                <TableRow key={`${ev.name}-${index}`} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{ev.name}</TableCell>
                  <TableCell>{ev.time}</TableCell>
                  <TableCell>{ev.gradeName}</TableCell>
                  <TableCell>
                    <Chip label={ev.status.label} size="small" sx={getChipStyles(ev.status.tone)} />
                  </TableCell>
                </TableRow>
              ))}
              {!loading && events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Chưa có sự kiện năm học.
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Đang tải danh sách sự kiện...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Box>
  );
}
