import { Box, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ENDPOINTS, get } from '../../service/api';

export default function TeacherTimetable() {
  const [rows, setRows] = useState([]);
  const [yearName, setYearName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTimetable = async () => {
      try {
        setLoading(true);
        const resp = await get(ENDPOINTS.TEACHER.TIMETABLE());
        setRows(Array.isArray(resp?.data) ? resp.data : []);
        setYearName(resp?.yearName || '');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading teacher timetable:', error);
        toast.error(error?.message || 'Không tải được thời khóa biểu');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    loadTimetable();
  }, []);

  const grouped = useMemo(() => {
    const summer = rows.filter((a) => a.appliesToSeason === 'summer' || a.appliesToSeason === 'both');
    const winter = rows.filter((a) => a.appliesToSeason === 'winter' || a.appliesToSeason === 'both');
    return { summer, winter };
  }, [rows]);

  const renderTable = (title, items) => (
    <Box>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1, color: '#1f3b5b' }}>
        {title}
      </Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#3794d1' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Giờ</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Nội dung hoạt động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell sx={{ fontWeight: 700 }}>{item.startLabel} - {item.endLabel}</TableCell>
                <TableCell>{item.content || '—'}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Chưa có hoạt động.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box>
      <Stack spacing={2.5}>
        <Typography variant="h5" fontWeight={800} color="#1f3b5b">
          Thời khóa biểu {yearName ? `(${yearName})` : ''}
        </Typography>

        {loading ? (
          <Typography variant="body2" color="text.secondary">Đang tải thời khóa biểu...</Typography>
        ) : (
          <Stack spacing={2.5}>
            {renderTable('Mùa Hè', grouped.summer)}
            {renderTable('Mùa Đông', grouped.winter)}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
