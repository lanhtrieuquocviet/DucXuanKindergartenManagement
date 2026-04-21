import { memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Class as ClassIcon,
} from '@mui/icons-material';

const ClassTable = memo(({ 
  classes, 
  loading, 
  onViewStudents, 
  onEdit, 
  onDelete, 
  onAdd 
}) => {
  return (
    <Box sx={{ p: 3 }}>
      {loading ? (
        <Stack alignItems="center" py={10}>
          <CircularProgress size={35} thickness={4} />
          <Typography variant="body2" color="text.secondary" mt={2} fontWeight={500}>
            Đang tải danh sách lớp học...
          </Typography>
        </Stack>
      ) : classes.length === 0 ? (
        <Stack alignItems="center" py={10} spacing={2}>
          <Box sx={{ p: 2, borderRadius: '50%', bgcolor: '#f8fafc', color: '#94a3b8' }}>
            <ClassIcon sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Chưa có lớp học nào trong khối này
          </Typography>
          <Button
            variant="contained"
            startIcon={<ClassIcon />}
            onClick={onAdd}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb' }}
          >
            Tạo lớp học đầu tiên
          </Button>
        </Stack>
      ) : (
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 800, py: 2, whiteSpace: 'nowrap' }}>Tên lớp</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Năm học</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Sĩ số tối đa</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Giáo viên phụ trách</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Phòng học</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={800} color="primary.main">{cls.className}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{cls.academicYearId?.yearName || '—'}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={cls.maxStudents || 0} 
                      size="small" 
                      variant="outlined" 
                      sx={{ fontWeight: 700, fontSize: '0.75rem', borderColor: 'divider', height: 20 }} 
                    />
                  </TableCell>
                  <TableCell>
                    {cls.teacherIds?.length > 0 ? (
                      <Stack spacing={0.5}>
                        {cls.teacherIds.map((t, i) => (
                          <Stack key={t._id || i} direction="row" alignItems="center" spacing={0.5}>
                            <PersonIcon sx={{ fontSize: 14, color: '#64748b' }} />
                            <Typography variant="caption" fontWeight={600} color="text.primary">
                              {t.userId?.fullName || t.fullName || '—'}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.disabled">Chưa phân công</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {cls.roomId ? (
                      <Box>
                        <Typography variant="caption" fontWeight={700} display="block">{cls.roomId.roomName}</Typography>
                        <Typography variant="caption" color="text.secondary">Tầng {cls.roomId.floor}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">Chưa có phòng</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        size="small"
                        variant="contained"
                        disableElevation
                        startIcon={<VisibilityIcon sx={{ fontSize: '1rem !important' }} />}
                        onClick={() => onViewStudents(cls._id)}
                        sx={{ 
                          bgcolor: '#eff6ff', color: '#2563eb', 
                          '&:hover': { bgcolor: '#dbeafe' }, 
                          borderRadius: 2, textTransform: 'none', 
                          fontSize: '0.75rem', fontWeight: 700, py: 0.5 
                        }}
                      >
                        Chi tiết
                      </Button>
                      <IconButton 
                        size="small" 
                        onClick={() => onEdit(cls)} 
                        sx={{ color: '#64748b', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                      >
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => onDelete(cls)} 
                        sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
});

export default ClassTable;
