import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Avatar,
  Box,
  Typography,
  Chip,
  IconButton,
  Divider,
  Grid,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import { calcAge, fmtDate, attendanceColor } from './helpers';

export default function StudentDetailDialog({ open, onClose, student, classDetail, attendanceMap }) {
  if (!student) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1, pr: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: student.gender === 'female' ? '#fbcfe8' : '#bfdbfe',
              color: student.gender === 'female' ? '#be185d' : '#1d4ed8',
              fontWeight: 700,
              fontSize: '1.2rem',
            }}
          >
            {student.fullName?.charAt(0)?.toUpperCase() || <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {student.fullName}
            </Typography>
            <Stack direction="row" spacing={0.75}>
              <Chip
                label={student.gender === 'male' ? 'Nam' : student.gender === 'female' ? 'Nữ' : 'Khác'}
                size="small"
                sx={{
                  fontSize: '0.65rem',
                  height: 20,
                  bgcolor: student.gender === 'female' ? '#fdf2f8' : '#eff6ff',
                  color: student.gender === 'female' ? '#be185d' : '#1d4ed8',
                  fontWeight: 600,
                }}
              />
              <Chip
                label={attendanceColor(attendanceMap[student._id]).label}
                size="small"
                sx={{
                  fontSize: '0.65rem',
                  height: 20,
                  bgcolor: attendanceColor(attendanceMap[student._id]).bg,
                  color: attendanceColor(attendanceMap[student._id]).color,
                  fontWeight: 600,
                }}
              />
            </Stack>
          </Box>
        </Stack>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Thông tin cá nhân */}
          <Box>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ letterSpacing: 0.5, mb: 1, display: 'block' }}
            >
              THÔNG TIN CÁ NHÂN
            </Typography>
            <Grid container spacing={1.5}>
              {[
                { label: 'Ngày sinh', value: fmtDate(student.dateOfBirth) },
                {
                  label: 'Tuổi',
                  value: calcAge(student.dateOfBirth) !== null ? `${calcAge(student.dateOfBirth)} tuổi` : 'N/A',
                },
                { label: 'Lớp', value: classDetail?.className || 'N/A' },
                { label: 'Trạng thái', value: student.status === 'active' ? 'Đang học' : 'Nghỉ học' },
              ].map(({ label, value }) => (
                <Grid item xs={6} key={label}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider />

          {/* Thông tin phụ huynh */}
          <Box>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ letterSpacing: 0.5, mb: 1, display: 'block' }}
            >
              THÔNG TIN PHỤ HUYNH
            </Typography>
            {student.parentId ? (
              <Stack spacing={1}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    sx={{ width: 36, height: 36, bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 700, fontSize: '0.9rem' }}
                  >
                    {student.parentId.fullName?.charAt(0)?.toUpperCase() || 'P'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {student.parentId.fullName || 'N/A'}
                    </Typography>
                    {student.parentId.email && (
                      <Typography variant="caption" color="text.secondary">
                        {student.parentId.email}
                      </Typography>
                    )}
                  </Box>
                </Stack>
                {student.parentId.phone && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">{student.parentId.phone}</Typography>
                  </Stack>
                )}
                {student.address && (
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <HomeIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                    <Typography variant="body2" color="text.secondary">
                      {student.address}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Chưa có thông tin phụ huynh
              </Typography>
            )}
          </Box>

          {/* SĐT phụ huynh (từ student trực tiếp) */}
          {student.parentPhone && !student.parentId?.phone && (
            <>
              <Divider />
              <Stack direction="row" spacing={1} alignItems="center">
                <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">SĐT phụ huynh: {student.parentPhone}</Typography>
              </Stack>
            </>
          )}

          <Divider />

          {/* Chú ý đặc biệt */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <WarningAmberIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 0.5 }}>
                CHÚ Ý ĐẶC BIỆT
              </Typography>
            </Stack>
            {student.needsSpecialAttention ? (
              <Box sx={{ bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 1.5, px: 1.5, py: 1 }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <WarningAmberIcon sx={{ fontSize: 16, color: '#d97706', mt: 0.2, flexShrink: 0 }} />
                  <Typography variant="body2" color="#92400e" sx={{ whiteSpace: 'pre-wrap' }}>
                    {student.specialNote || 'Học sinh cần được chú ý đặc biệt'}
                  </Typography>
                </Stack>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Không có
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="outlined" size="small">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
