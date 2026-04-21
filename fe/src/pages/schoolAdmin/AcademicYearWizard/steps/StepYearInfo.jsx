import { Box, Paper, Stack, TextField, Typography, InputAdornment } from '@mui/material';
import { 
  CalendarToday as CalendarIcon, 
  Edit as EditIcon, 
  Description as DescriptionIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

export default function StepYearInfo({ data, onChange, errors }) {
  const set = (field, value) => onChange({ ...data, [field]: value });

  return (
    <Stack spacing={4}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
          <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(99, 102, 241, 0.1)' }}>
            <CalendarIcon sx={{ color: '#6366f1', fontSize: 22, display: 'block' }} />
          </Box>
          <Typography variant="h6" fontWeight={800} color="#1e293b">
            Thông tin năm học
          </Typography>
        </Stack>
        
        <Stack spacing={2.5}>
          <TextField
            label="Tên năm học"
            placeholder="Ví dụ: 2025 – 2026"
            required
            fullWidth size="small"
            value={data.yearName}
            onChange={e => set('yearName', e.target.value)}
            error={!!errors.yearName}
            helperText={errors.yearName}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EditIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
            <TextField
              label="Ngày bắt đầu" type="date"
              required
              InputLabelProps={{ shrink: true }} fullWidth size="small"
              value={data.startDate}
              onChange={e => set('startDate', e.target.value)}
              error={!!errors.startDate} helperText={errors.startDate}
            />
            <TextField
              label="Ngày kết thúc" type="date"
              required
              InputLabelProps={{ shrink: true }} fullWidth size="small"
              value={data.endDate}
              inputProps={{ min: data.startDate || undefined }}
              onChange={e => set('endDate', e.target.value)}
              error={!!errors.endDate} helperText={errors.endDate}
            />
          </Stack>
          
          <TextField
            label="Mô tả / Mục tiêu năm học"
            placeholder="Ví dụ: Tập trung phát triển kỹ năng mềm cho trẻ..."
            required
            fullWidth size="small" multiline minRows={3}
            value={data.description}
            onChange={e => set('description', e.target.value)}
            error={!!errors.description} helperText={errors.description}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                  <DescriptionIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Box>

      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
          <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(139, 92, 246, 0.1)' }}>
            <TimelineIcon sx={{ color: '#8b5cf6', fontSize: 22, display: 'block' }} />
          </Box>
          <Typography variant="h6" fontWeight={800} color="#1e293b">
            Cấu trúc học kỳ (cố định 2 kỳ)
          </Typography>
        </Stack>

        <Stack spacing={2.5}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              border: '1px solid', 
              borderColor: errors.term1StartDate || errors.term1EndDate ? 'error.main' : 'divider', 
              borderRadius: 3,
              bgcolor: 'grey.50'
            }}
          >
            <Typography variant="subtitle2" fontWeight={800} color="#6366f1" mb={2}>KỲ HỌC 1</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
              <TextField
                label="Ngày bắt đầu kỳ 1" type="date"
                required
                InputLabelProps={{ shrink: true }} fullWidth size="small"
                value={data.term1StartDate}
                inputProps={{ min: data.startDate || undefined, max: data.endDate || undefined }}
                onChange={e => set('term1StartDate', e.target.value)}
                error={!!errors.term1StartDate} helperText={errors.term1StartDate}
                sx={{ bgcolor: 'white' }}
              />
              <TextField
                label="Ngày kết thúc kỳ 1" type="date"
                required
                InputLabelProps={{ shrink: true }} fullWidth size="small"
                value={data.term1EndDate}
                inputProps={{ min: data.term1StartDate || data.startDate || undefined, max: data.endDate || undefined }}
                onChange={e => set('term1EndDate', e.target.value)}
                error={!!errors.term1EndDate} helperText={errors.term1EndDate}
                sx={{ bgcolor: 'white' }}
              />
            </Stack>
          </Paper>

          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              border: '1px solid', 
              borderColor: errors.term2StartDate || errors.term2EndDate ? 'error.main' : 'divider', 
              borderRadius: 3,
              bgcolor: 'grey.50'
            }}
          >
            <Typography variant="subtitle2" fontWeight={800} color="#8b5cf6" mb={2}>KỲ HỌC 2</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
              <TextField
                label="Ngày bắt đầu kỳ 2" type="date"
                required
                InputLabelProps={{ shrink: true }} fullWidth size="small"
                value={data.term2StartDate}
                inputProps={{ min: data.term1EndDate || data.startDate || undefined, max: data.endDate || undefined }}
                onChange={e => set('term2StartDate', e.target.value)}
                error={!!errors.term2StartDate} helperText={errors.term2StartDate}
                sx={{ bgcolor: 'white' }}
              />
              <TextField
                label="Ngày kết thúc kỳ 2" type="date"
                required
                InputLabelProps={{ shrink: true }} fullWidth size="small"
                value={data.term2EndDate}
                inputProps={{ min: data.term2StartDate || data.startDate || undefined, max: data.endDate || undefined }}
                onChange={e => set('term2EndDate', e.target.value)}
                error={!!errors.term2EndDate} helperText={errors.term2EndDate}
                sx={{ bgcolor: 'white' }}
              />
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Stack>
  );
}
