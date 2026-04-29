import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ENDPOINTS, get } from '../../service/api';

const WEEK_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

function toDMY(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function TeacherAcademicPlan() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        setLoading(true);
        const resp = await get(ENDPOINTS.TEACHER.ACADEMIC_PLAN_TOPICS());
        setTopics(Array.isArray(resp?.data) ? resp.data : []);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading teacher academic plan topics:', error);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };
    loadTopics();
  }, []);

  const groupedByGrade = useMemo(() => {
    const map = new Map();
    topics.forEach((topic) => {
      const key = String(topic.gradeId || 'unknown');
      const label = topic.gradeName || 'Khối lớp';
      if (!map.has(key)) map.set(key, { key, label, rows: [] });
      map.get(key).rows.push(topic);
    });
    return Array.from(map.values());
  }, [topics]);

  const handleOpenDetailDialog = (topic) => {
    setSelectedTopic(topic);
    setOpenDetailDialog(true);
  };

  return (
    <Box>
      <Stack spacing={2.5}>
        <Typography variant="h5" fontWeight={800} color="#1f3b5b">
          Kế hoạch học tập
        </Typography>

        {groupedByGrade.map((group) => (
          <Paper
            key={group.key}
            elevation={0}
            sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
          >
            <Typography variant="h6" fontWeight={800} color="#1f3b5b" sx={{ mb: 1.5 }}>
              Khối lớp {group.label}
            </Typography>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: '#3794d1' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>STT</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Tên chủ đề</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Thời gian</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Số tuần</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.rows.map((topic, index) => (
                    <TableRow key={topic.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{topic.topicName}</TableCell>
                      <TableCell>{`${toDMY(topic.startDate)} - ${toDMY(topic.endDate)}`}</TableCell>
                      <TableCell>{topic.weeks}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleOpenDetailDialog(topic)}
                          sx={{ textTransform: 'none', minWidth: 90 }}
                        >
                          Xem chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))}

        {!loading && groupedByGrade.length === 0 && (
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 2, border: '1px dashed', borderColor: '#a5b4fc', bgcolor: '#eef2ff' }}
          >
            <Typography variant="body1" fontWeight={700} sx={{ color: '#4338ca' }}>
              Bạn chưa được phân công chủ đề kế hoạch học tập nào.
            </Typography>
          </Paper>
        )}

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Đang tải kế hoạch học tập...
          </Typography>
        )}
      </Stack>

      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f4f6f8' }}>
          <IconButton
            aria-label="Đóng"
            onClick={() => setOpenDetailDialog(false)}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <CloseIcon />
          </IconButton>
          {selectedTopic && (
            <Stack spacing={2}>
              <Typography variant="h5" textAlign="center" fontWeight={800}>
                {selectedTopic.topicName?.toUpperCase() || 'CHI TIẾT CHỦ ĐỀ'}
              </Typography>
              <Typography variant="h6" textAlign="center" fontWeight={700}>
                Thời gian thực hiện {selectedTopic.weeks} tuần: (Từ {toDMY(selectedTopic.startDate)} đến {toDMY(selectedTopic.endDate)})
              </Typography>

              <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#2f3ea8' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>Thứ</TableCell>
                      {(selectedTopic.weeklyDetails || []).map((week, idx) => (
                        <TableCell key={`w-${idx}`} sx={{ color: 'white', fontWeight: 700, minWidth: 180 }}>
                          {week.weekName || `Tuần ${idx + 1}`}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#3a4bc0' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }} />
                      {(selectedTopic.weeklyDetails || []).map((week, idx) => (
                        <TableCell key={`wh-${idx}`} sx={{ color: 'white', fontWeight: 700 }}>
                          {week.weekTopic || 'Chưa cập nhật'}
                          {week.weekRange ? ` (${week.weekRange})` : ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {WEEK_DAYS.map((day) => (
                      <TableRow key={day}>
                        <TableCell sx={{ fontWeight: 700 }}>{day}</TableCell>
                        {(selectedTopic.weeklyDetails || []).map((week, idx) => (
                          <TableCell key={`${day}-${idx}`}>
                            {week?.dayPlans?.[
                              day === 'Thứ 2'
                                ? 'thu2'
                                : day === 'Thứ 3'
                                  ? 'thu3'
                                  : day === 'Thứ 4'
                                    ? 'thu4'
                                    : day === 'Thứ 5'
                                      ? 'thu5'
                                      : 'thu6'
                            ] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
