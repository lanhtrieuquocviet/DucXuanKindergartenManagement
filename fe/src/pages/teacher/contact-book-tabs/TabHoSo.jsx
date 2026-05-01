import { 
  Box, Paper, Stack, Typography, Grid 
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Cake as CakeIcon, 
  Home as HomeIcon, 
  People as PeopleIcon, 
  Phone as PhoneIcon, 
  StickyNote2 as NoteIcon 
} from '@mui/icons-material';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function genderLabel(g) {
  if (g === 'male') return 'Nam';
  if (g === 'female') return 'Nữ';
  return 'Khác';
}

function InfoRow({ icon, label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.75}>
        {icon && <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>}
        <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
      </Stack>
    </Box>
  );
}

export default function TabHoSo({ student }) {
  return (
    <Box>
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
          <PersonIcon sx={{ fontSize: 18, color: '#e11d48' }} />
          <Typography variant="subtitle2" fontWeight={700}>Thông tin cơ bản</Typography>
        </Stack>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 6 }}>
            <InfoRow label="Họ và tên" value={student.fullName} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <InfoRow label="Ngày sinh" value={fmtDate(student.dateOfBirth)} icon={<CakeIcon sx={{ fontSize: 14 }} />} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <InfoRow label="Giới tính" value={genderLabel(student.gender)} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <InfoRow label="Địa chỉ" value={student.address} icon={<HomeIcon sx={{ fontSize: 14 }} />} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <InfoRow label="Phụ huynh" value={student.parentId?.fullName} icon={<PeopleIcon sx={{ fontSize: 14 }} />} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <InfoRow
              label="SĐT"
              value={student.parentId?.phone || student.parentPhone || student.phone}
              icon={<PhoneIcon sx={{ fontSize: 14 }} />}
            />
          </Grid>
          {student.specialNote && (
            <Grid size={{ xs: 12 }}>
              <InfoRow label="Ghi chú đặc biệt" value={student.specialNote} icon={<NoteIcon sx={{ fontSize: 14 }} />} />
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" fontStyle="italic">
            Giáo viên chỉ được chỉnh sửa sau khi Ban Giám hiệu duyệt
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
