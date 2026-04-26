import {
  Avatar, Box,
  Chip,
  FormControl,
  IconButton,
  InputLabel, MenuItem, Select,
  Stack, Typography
} from '@mui/material';
import {
  Delete as DeleteIcon,
  WarningAmber as WarningIcon
} from '@mui/icons-material';

export default function StudentRow({ 
  student, 
  placement, 
  classes, 
  classCounts, 
  selectedBlocks, 
  onSetClass, 
  onRemove,
  calcAge 
}) {
  const age = calcAge(student.dateOfBirth);
  const targetClass = classes.find(c => c.tempId === placement?.classTempId);

  let ageWarning = null;
  if (targetClass && age !== null) {
    const block = selectedBlocks.find(b => b.tempId === targetClass.gradeTempId);
    if (block && (age < block.minAge || age > block.maxAge + 1)) {
      ageWarning = `Tuổi (${age}) không khớp với khối ${block.name} (${block.minAge}–${block.maxAge})`;
    }
  }

  return (
    <Box sx={{ p: 1.5, bgcolor: placement ? 'white' : '#fffbeb', '&:hover': { bgcolor: '#f9fafb' } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
          <Avatar src={student.avatar} sx={{ width: 40, height: 40, fontSize: 16, bgcolor: student.isImported ? '#0ea5e9' : '#6366f1' }}>
            {student.fullName?.[0]}
          </Avatar>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight={800} sx={{ color: '#1e293b' }}>{student.fullName}</Typography>
              {student.isImported ? (
                <Chip label="Mới" size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }} />
              ) : (
                <Chip label="Cũ" size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700 }} />
              )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" mt={0.3}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {age !== null ? `${age} tuổi` : '—'} · {student.gender === 'male' ? 'Nam' : 'Nữ'}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: { xs: 160, sm: 220 } }}>
            <InputLabel>Chọn lớp mới</InputLabel>
            <Select
              label="Chọn lớp mới"
              value={placement?.classTempId || ''}
              onChange={e => onSetClass(student._id, e.target.value, student.isImported)}
              sx={{
                borderRadius: 2,
                bgcolor: placement ? '#fff' : '#fffbeb',
                '& .MuiSelect-select': { py: 1 }
              }}
            >
              <MenuItem value=""><em>— Chưa xếp —</em></MenuItem>
              {classes.map(cls => {
                const count = classCounts[cls.tempId] || 0;
                const max = cls.maxStudents || 25;
                const isFull = count >= max && placement?.classTempId !== cls.tempId;
                const isRecommended = !student.isImported && student.classId &&
                  cls.className.split(' ').pop() === student.classId.className?.split(' ').pop();

                return (
                  <MenuItem key={cls.tempId} value={cls.tempId} disabled={isFull}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                      <Typography variant="body2" fontWeight={isRecommended ? 800 : 400}>
                        {cls.className} {isRecommended && '(Gợi ý)'}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{count}/{max}</Typography>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          {student.isImported && (
            <IconButton size="small" color="error" onClick={() => onRemove(student._id)} sx={{ bgcolor: '#fee2e2', '&:hover': { bgcolor: '#fecaca' } }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Stack>
      {ageWarning && (
        <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5} ml={6.5}>
          <WarningIcon sx={{ fontSize: 13, color: 'warning.main' }} />
          <Typography variant="caption" color="warning.main" fontWeight={500}>{ageWarning}</Typography>
        </Stack>
      )}
    </Box>
  );
}
