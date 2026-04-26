import { Box, Paper, Typography, Stack, Avatar, Chip, Tooltip, IconButton } from '@mui/material';
import {
  Person as PersonIcon,
  DeleteOutline as DeleteOutlineIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import { calcAge, attendanceColor } from './helpers';

export default function StudentCard({ student, attendanceStatus, onClick, onRemove }) {
  const att = attendanceColor(attendanceStatus);
  const age = calcAge(student.dateOfBirth);

  return (
    <Paper
      variant="outlined"
      onClick={() => onClick(student)}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: 'pointer',
        borderColor: 'grey.200',
        transition: 'all 0.15s',
        position: 'relative',
        '&:hover': { boxShadow: 3, borderColor: '#a78bfa', transform: 'translateY(-1px)' },
        '&:hover .remove-btn': { opacity: 1 },
      }}
    >
      <Tooltip title="Xóa khỏi lớp">
        <IconButton
          className="remove-btn"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(student);
          }}
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            opacity: 0,
            transition: 'opacity 0.15s',
            color: 'error.main',
            bgcolor: 'rgba(255,255,255,0.85)',
            '&:hover': { bgcolor: '#fee2e2' },
            p: 0.5,
          }}
        >
          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: student.gender === 'female' ? '#fbcfe8' : '#bfdbfe',
            color: student.gender === 'female' ? '#be185d' : '#1d4ed8',
            fontWeight: 700,
            fontSize: '1rem',
            flexShrink: 0,
          }}
        >
          {student.fullName?.charAt(0)?.toUpperCase() || <PersonIcon />}
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 0.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {student.fullName}
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
            <Chip
              label={att.label}
              size="small"
              sx={{ fontSize: '0.65rem', fontWeight: 600, bgcolor: att.bg, color: att.color, height: 20 }}
            />
            {age !== null && (
              <Chip
                label={`${age} tuổi`}
                size="small"
                sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#f3f4f6', color: '#4b5563' }}
              />
            )}
          </Stack>
          {student.needsSpecialAttention && (
            <Tooltip title={student.specialNote || 'Cần chú ý đặc biệt'} arrow>
              <Chip
                icon={<WarningAmberIcon sx={{ fontSize: '0.7rem !important' }} />}
                label={student.specialNote ? 'Chú ý' : 'Cần chú ý'}
                size="small"
                sx={{
                  fontSize: '0.65rem',
                  height: 20,
                  mt: 0.5,
                  bgcolor: '#fef3c7',
                  color: '#92400e',
                  fontWeight: 600,
                  cursor: 'help',
                }}
              />
            </Tooltip>
          )}
          {student.parentId?.phone && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.4, display: 'block' }}>
              PH: {student.parentId.phone}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
