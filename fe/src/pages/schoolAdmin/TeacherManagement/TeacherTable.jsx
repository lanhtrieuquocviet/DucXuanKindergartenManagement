import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';

const calcExperienceYears = (hireDate) => {
  if (!hireDate) return null;
  const hire = new Date(hireDate);
  if (isNaN(hire.getTime())) return null;
  const now = new Date();
  const years = (now - hire) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, Math.floor(years));
};

const ExperienceBadge = ({ hireDate }) => {
  const years = calcExperienceYears(hireDate);
  if (years === null) return null;
  return (
    <Stack spacing={0.5} mt={0.75}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="caption" color="text.secondary">
          Kinh nghiệm tính được:
        </Typography>
        <Chip
          label={years === 0 ? 'Dưới 1 năm' : `${years} năm`}
          size="small"
          sx={{ bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 700, fontSize: '0.75rem' }}
        />
      </Stack>
      {years >= 5 && (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <WarningAmberIcon sx={{ fontSize: 15, color: '#d97706' }} />
          <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600 }}>
            Giáo viên đã công tác tại trường trên 5 năm
          </Typography>
        </Stack>
      )}
    </Stack>
  );
};

const TeacherTable = ({
  teachers,
  page,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
}) => {
  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#eff6ff' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Giáo viên</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Điện thoại</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Bằng cấp</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Loại hình</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Kinh nghiệm</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ngày vào</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map((t) => (
              <TableRow key={t._id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: '#dbeafe',
                        color: '#2563eb',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    >
                      {t.fullName?.charAt(0)?.toUpperCase() || <PersonIcon />}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>
                      {t.fullName}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{t.email || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{t.phone || '—'}</Typography>
                </TableCell>
                <TableCell>
                  {t.degree ? (
                    <Chip label={t.degree} size="small" sx={{ bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 600 }} />
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={t.employmentType === 'permanent' ? 'Biên chế' : 'Hợp đồng'}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontWeight: 600,
                      borderColor: t.employmentType === 'permanent' ? '#2563eb' : '#94a3b8',
                      color: t.employmentType === 'permanent' ? '#2563eb' : '#64748b',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <ExperienceBadge hireDate={t.hireDate} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {t.hireDate ? new Date(t.hireDate).toLocaleDateString('vi-VN') : '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={t.status === 'active' ? 'Đang làm việc' : 'Nghỉ việc'}
                    size="small"
                    sx={{
                      bgcolor: t.status === 'active' ? '#dcfce7' : '#fee2e2',
                      color: t.status === 'active' ? '#166534' : '#991b1b',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Chỉnh sửa">
                      <IconButton size="small" onClick={() => onEdit(t)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton size="small" onClick={() => onDelete(t)} color="error">
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={teachers.length} // This should ideally be the total count from state
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[pageSize]}
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count} giáo viên`}
        sx={{ borderTop: '1px solid', borderColor: 'divider' }}
      />
    </>
  );
};

export default TeacherTable;
