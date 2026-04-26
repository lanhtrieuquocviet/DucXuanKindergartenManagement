import {
  Box,
  Button,
  Divider,
  Stack, Typography
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  FileUpload as ImportIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

export default function StudentAssignmentHeader({ 
  carryOverCount, 
  importedCount, 
  totalCount, 
  assignedCount, 
  onAutoPlace, 
  onImportExcel, 
  fileInputRef 
}) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#eff6ff', color: '#6366f1', display: 'flex' }}>
            <PersonIcon />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="#1e40af">
              Phân lớp Học sinh
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Xếp học sinh chuyển tiếp ({carryOverCount}) và học sinh mới ({importedCount}) vào các lớp.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            color="secondary"
            startIcon={<CheckIcon />}
            onClick={onAutoPlace}
            disabled={totalCount === 0 || assignedCount === totalCount}
            sx={{ 
              textTransform: 'none', 
              borderRadius: 2, 
              fontWeight: 700, 
              bgcolor: '#8b5cf6', 
              '&:hover': { bgcolor: '#7c3aed' } 
            }}
          >
            Tự động xếp lớp
          </Button>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <input
            type="file"
            hidden
            ref={fileInputRef}
            accept=".xlsx, .xls"
            onChange={onImportExcel}
          />
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            Nhập Excel học sinh mới
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
