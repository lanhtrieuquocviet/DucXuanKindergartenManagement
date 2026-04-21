import { memo, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  AssignmentInd as AssignmentIcon,
  Class as ClassIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

const GradeDialog = memo(({ 
  open, 
  onClose, 
  mode, 
  form, 
  setForm, 
  errors, 
  submitting, 
  onSubmit,
  staticBlocks,
  staticBlocksLoading,
  teachers,
  teachersLoading,
}) => {
  // Find selected block to show details
  const selectedBlock = useMemo(() => 
    staticBlocks.find(b => b._id === form.staticBlockId),
    [staticBlocks, form.staticBlockId]
  );

  const handleBlockChange = (e) => {
    const blockId = e.target.value;
    const block = staticBlocks.find(b => b._id === blockId);
    
    setForm((f) => ({ 
      ...f, 
      staticBlockId: blockId,
      // Auto-fill fixed info from template
      gradeName: block ? block.name : '',
      description: block ? block.description : '',
      maxClasses: block ? block.maxClasses : 10,
      ageRange: block ? `${block.minAge} - ${block.maxAge} tuổi` : ''
    }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm" 
      PaperProps={{ 
        sx: { borderRadius: 4, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' } 
      }}
    >
      <DialogTitle sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: '#2563eb', width: 40, height: 40 }}>
            <ClassIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {mode === 'create' ? 'Tạo Khối lớp mới' : 'Cập nhật Khối lớp'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Thiết lập cấu hình và nhân sự cho Khối lớp trong năm học
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {errors.submit && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errors.submit}</Alert>}
        
        <Stack spacing={3} mt={1}>
          {/* Section 1: Template Selection */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <SettingsIcon sx={{ fontSize: 18, color: '#64748b' }} />
              <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Loại Khối (Danh mục cố định)
              </Typography>
            </Stack>
            
            <FormControl size="small" fullWidth error={!!errors.staticBlockId}>
              <InputLabel>Chọn loại khối từ hệ thống *</InputLabel>
              <Select
                label="Chọn loại khối từ hệ thống *"
                value={form.staticBlockId}
                onChange={handleBlockChange}
                disabled={staticBlocksLoading || mode === 'edit'} 
                sx={{ borderRadius: 2, bgcolor: '#fff' }}
              >
                <MenuItem value=""><em>— Chọn một loại khối —</em></MenuItem>
                {staticBlocks.map(block => (
                  <MenuItem key={block._id} value={block._id}>
                    {block.name} ({block.minAge}-{block.maxAge} tuổi)
                  </MenuItem>
                ))}
              </Select>
              {errors.staticBlockId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>{errors.staticBlockId}</Typography>
              )}
            </FormControl>
          </Box>

          {/* Section 2: Fixed Configuration Info */}
          <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid', borderColor: '#e2e8f0' }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <InfoIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
              <Typography variant="subtitle2" fontWeight={800} color="#1e40af">
                Thông tin cấu hình
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <TextField
                label="Tên hiển thị"
                required
                fullWidth
                size="small"
                value={form.gradeName}
                onChange={(e) => setForm((f) => ({ ...f, gradeName: e.target.value }))}
                error={!!errors.gradeName}
                helperText={errors.gradeName}
                sx={{ bgcolor: '#fff' }}
              />

              <TextField
                label="Mô tả Khối"
                fullWidth
                size="small"
                multiline
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                sx={{ bgcolor: '#fff' }}
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Số lớp tối đa"
                  required
                  fullWidth
                  size="small"
                  type="number"
                  value={form.maxClasses}
                  onChange={(e) => setForm((f) => ({ ...f, maxClasses: e.target.value }))}
                  sx={{ bgcolor: '#fff' }}
                />
                <TextField
                  label="Độ tuổi quy định"
                  fullWidth
                  size="small"
                  value={form.ageRange}
                  onChange={(e) => setForm((f) => ({ ...f, ageRange: e.target.value }))}
                  sx={{ bgcolor: '#fff' }}
                />
              </Stack>
            </Stack>
          </Box>

          <Divider />

          {/* Section 3: Year-Specific Assignment */}
          <Box sx={{ p: 2.5, bgcolor: '#eff6ff', borderRadius: 3, border: '1px solid', borderColor: '#bfdbfe' }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <AssignmentIcon sx={{ fontSize: 18, color: '#2563eb' }} />
              <Typography variant="subtitle2" fontWeight={800} color="#1e40af">
                Phân công Năm học
              </Typography>
            </Stack>

            <FormControl size="small" fullWidth>
              <InputLabel>Tổ trưởng khối *</InputLabel>
              <Select
                label="Tổ trưởng khối *"
                value={form.headTeacherId}
                onChange={(e) => setForm((f) => ({ ...f, headTeacherId: e.target.value }))}
                disabled={teachersLoading}
                sx={{ bgcolor: '#fff', borderRadius: 2 }}
              >
                <MenuItem value=""><em>— Chưa phân công —</em></MenuItem>
                {teachers.filter(t => t.status === 'active').map(t => (
                  <MenuItem key={t._id} value={t._id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar src={t.avatar} sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{t.fullName?.charAt(0)}</Avatar>
                      <Typography variant="body2">{t.fullName}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary', display: 'block', fontStyle: 'italic' }}>
                * Tổ trưởng khối có thể thay đổi tùy theo từng năm học.
              </Typography>
            </FormControl>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600, textTransform: 'none' }}>
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={submitting}
          sx={{ 
            bgcolor: '#2563eb', 
            '&:hover': { bgcolor: '#1d4ed8' }, 
            textTransform: 'none', 
            fontWeight: 700, 
            borderRadius: 2, 
            px: 4,
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
          }}
        >
          {submitting ? <CircularProgress size={20} color="inherit" /> : (mode === 'create' ? 'Tạo Khối lớp' : 'Lưu thay đổi')}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default GradeDialog;
