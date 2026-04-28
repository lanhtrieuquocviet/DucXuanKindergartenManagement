import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Tooltip,
  Chip,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  NotificationsActive as RequestAlertIcon,
} from '@mui/icons-material';

const StudentTable = ({
  students,
  pendingMap,
  formatDate,
  formatPhoneDisplay,
  getAcademicYearLabel,
  GENDER_OPTIONS,
  onOpenReqView,
  onOpenEdit,
  onOpenDelete,
  onOpenDetail,
}) => {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f8fafc' }}>
            <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Mã HS</TableCell>
            <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Họ tên</TableCell>
            <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Ngày sinh</TableCell>
            <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Giới tính</TableCell>
            <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Năm học</TableCell>
            <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Lớp</TableCell>
            <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Phụ huynh</TableCell>
            <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>SĐT</TableCell>
            <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Trạng thái</TableCell>
            <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((row) => {
            const pendingCount = pendingMap[String(row._id)] || 0;
            const parentName = row.parentId?.fullName || row.parentFullName || '—';
            const parentPhone = row.parentId?.phone || row.parentPhone || row.phone || '';

            return (
              <TableRow key={row._id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.studentCode || '—'}</TableCell>
                <TableCell sx={{ minWidth: 170 }}>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    {pendingCount > 0 && (
                      <Tooltip title={`${pendingCount} yêu cầu chờ xử lý từ giáo viên`}>
                        <IconButton size="small" onClick={() => onOpenReqView(row)} sx={{ p: 0 }}>
                          <RequestAlertIcon sx={{ fontSize: 16, color: '#d97706', flexShrink: 0 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <span>{row.fullName || '—'}</span>
                  </Stack>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.dateOfBirth)}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {GENDER_OPTIONS.find((g) => g.value === row.gender)?.label || row.gender || '—'}
                </TableCell>
                <TableCell sx={{ minWidth: 120 }}>
                  {(() => {
                    const yearLabel = getAcademicYearLabel(row);
                    return (
                      <Chip
                        label={yearLabel === '—' ? 'Chưa xác định' : yearLabel}
                        size="small"
                        variant="outlined"
                        color={yearLabel === '—' ? 'default' : 'primary'}
                        sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                      />
                    );
                  })()}
                </TableCell>
                <TableCell sx={{ minWidth: 130 }}>
                  {row.classId?.className ? (
                    <Chip
                      label={row.classId.className}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Chưa xếp lớp
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ minWidth: 160 }}>{parentName}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 120 }}>{formatPhoneDisplay(parentPhone)}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Chip
                    label={
                      row.status === 'graduated' ? 'Đã tốt nghiệp' :
                      row.status === 'inactive' ? 'Nghỉ học' : 'Đang học'
                    }
                    size="small"
                    color={
                      row.status === 'graduated' ? 'success' :
                      row.status === 'inactive' ? 'error' : 'primary'
                    }
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                    <Tooltip title="Xem chi tiết">
                      <IconButton size="small" onClick={() => onOpenDetail(row)} color="primary">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton size="small" onClick={() => onOpenEdit(row)} color="info">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton size="small" onClick={() => onOpenDelete(row)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default StudentTable;
