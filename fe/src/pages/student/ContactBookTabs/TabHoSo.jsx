import { Paper, Stack, Typography, Grid, Skeleton, Box, Button } from '@mui/material';
import { 
  Person as PersonIcon, 
  Cake as CakeIcon, 
  School as SchoolIcon, 
  Home as HomeIcon, 
  People as PeopleIcon, 
  Phone as PhoneIcon, 
  StickyNote2 as NoteIcon,
  ExitToApp as RequestIcon
} from '@mui/icons-material';
import { useState } from 'react';
import InfoRow from './InfoRow';
import { fmtDate, genderLabel } from './ContactBookUtils';
import StudentRequestModal from '../StudentRequestModal';
import { toast } from 'react-toastify';

export default function TabHoSo({ student }) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!student) return <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />;
  return (
    <>
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonIcon sx={{ fontSize: 18, color: '#e11d48' }} />
            <Typography variant="subtitle2" fontWeight={700}>Thông tin cơ bản</Typography>
          </Stack>
        </Stack>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 6 }}><InfoRow label="Họ và tên" value={student.fullName} /></Grid>
          <Grid size={{ xs: 6 }}><InfoRow label="Ngày sinh" value={fmtDate(student.dateOfBirth)} icon={<CakeIcon sx={{ fontSize: 14 }} />} /></Grid>
          <Grid size={{ xs: 6 }}><InfoRow label="Giới tính" value={genderLabel(student.gender)} /></Grid>
          <Grid size={{ xs: 6 }}><InfoRow label="Lớp" value={student.classId?.className} icon={<SchoolIcon sx={{ fontSize: 14 }} />} /></Grid>
          <Grid size={{ xs: 12 }}><InfoRow label="Địa chỉ" value={student.address} icon={<HomeIcon sx={{ fontSize: 14 }} />} /></Grid>
          <Grid size={{ xs: 6 }}><InfoRow label="Phụ huynh" value={student.parentId?.fullName} icon={<PeopleIcon sx={{ fontSize: 14 }} />} /></Grid>
          <Grid size={{ xs: 6 }}><InfoRow label="SĐT" value={student.parentId?.phone || student.parentPhone || student.phone} icon={<PhoneIcon sx={{ fontSize: 14 }} />} /></Grid>
          {student.specialNote && (
            <Grid size={{ xs: 12 }}><InfoRow label="Ghi chú đặc biệt" value={student.specialNote} icon={<NoteIcon sx={{ fontSize: 14 }} />} /></Grid>
          )}
        </Grid>
        
        <Box sx={{ mt: 3, pt: 3, borderTop: '1px dashed', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary" fontStyle="italic" sx={{ maxWidth: 280, textAlign: { xs: 'center', sm: 'left' } }}>
              Phụ huynh có thể gửi yêu cầu chuyển trường hoặc thôi học trực tuyến tại đây.
            </Typography>
            <Button 
              variant="outlined" 
              color="error" 
              size="small" 
              startIcon={<RequestIcon />}
              onClick={() => setModalOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Yêu cầu Chuyển/Nghỉ học
            </Button>
          </Stack>
        </Box>
      </Paper>

      <StudentRequestModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)}
        studentId={student._id}
        studentName={student.fullName}
        onSuccess={() => toast.success('Yêu cầu đã được gửi thành công!')}
      />
    </>
  );
}
