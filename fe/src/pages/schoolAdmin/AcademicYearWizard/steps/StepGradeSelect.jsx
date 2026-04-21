import {
  Box, Checkbox, Chip, FormControlLabel, Paper,
  Stack, Tooltip, Typography,
} from '@mui/material';
import { School as SchoolIcon, CheckCircle as CheckIcon } from '@mui/icons-material';

export default function StepGradeSelect({ staticBlocks, selectedBlockIds, onChange, errors }) {
  const toggle = (id) => {
    const next = selectedBlockIds.includes(id)
      ? selectedBlockIds.filter(x => x !== id)
      : [...selectedBlockIds, id];
    onChange(next);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <SchoolIcon sx={{ color: '#6366f1', fontSize: 20 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="#6366f1">
            Kích hoạt Khối học
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Chọn các khối sẽ hoạt động trong năm học này. Thông tin độ tuổi sẽ được chụp lại (Snapshot) tại thời điểm tạo.
          </Typography>
        </Box>
      </Stack>

      {errors.grades && (
        <Typography variant="body2" color="error">{errors.grades}</Typography>
      )}

      {staticBlocks.length === 0 && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Không có danh mục khối nào đang hoạt động. Vui lòng thiết lập StaticBlock trước.
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
        {staticBlocks.map(sb => {
          const selected = selectedBlockIds.includes(sb._id);
          return (
            <Tooltip
              key={sb._id}
              title={`Độ tuổi: ${sb.minAge} – ${sb.maxAge} tuổi · Tối đa ${sb.maxClasses} lớp`}
              placement="top"
            >
              <Paper
                elevation={0}
                onClick={() => toggle(sb._id)}
                sx={{
                  p: 2, borderRadius: 2, cursor: 'pointer',
                  border: '2px solid',
                  borderColor: selected ? '#6366f1' : 'divider',
                  bgcolor: selected ? 'rgba(99,102,241,0.06)' : 'white',
                  transition: 'all 0.15s ease',
                  '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.04)' },
                  position: 'relative',
                }}
              >
                {selected && (
                  <CheckIcon sx={{ position: 'absolute', top: 8, right: 8, color: '#6366f1', fontSize: 18 }} />
                )}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selected}
                      onChange={() => toggle(sb._id)}
                      onClick={e => e.stopPropagation()}
                      size="small"
                      sx={{ color: '#6366f1', '&.Mui-checked': { color: '#6366f1' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>{sb.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sb.minAge}–{sb.maxAge} tuổi · tối đa {sb.maxClasses} lớp
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0 }}
                />
                {sb.minAge >= 5 && sb.maxAge >= 6 && (
                  <Chip
                    label="Khối năm cuối"
                    size="small"
                    sx={{ mt: 1, bgcolor: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700 }}
                  />
                )}
              </Paper>
            </Tooltip>
          );
        })}
      </Box>

      {selectedBlockIds.length > 0 && (
        <Typography variant="body2" color="success.main" fontWeight={600}>
          ✓ Đã chọn {selectedBlockIds.length} khối học
        </Typography>
      )}
    </Stack>
  );
}
