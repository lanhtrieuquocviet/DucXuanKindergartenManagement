import {
  Box, Checkbox, Chip, FormControlLabel, Paper,
  Stack, Tooltip, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid,
} from '@mui/material';
import {
  School as SchoolIcon, CheckCircle as CheckIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { post, ENDPOINTS } from '../../../../service/api';
import { toast } from 'react-toastify';
import { useState } from 'react';

export default function StepGradeSelect({ staticBlocks, selectedBlockIds, onChange, errors, onRefresh }) {
  const [openAdd, setOpenAdd] = useState(false);
  const [newBlock, setNewBlock] = useState({ name: '', description: '', minAge: '', maxAge: '', maxClasses: 10 });
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newBlock.name.trim() || !newBlock.minAge || !newBlock.maxAge) {
      toast.warn('Vui lòng nhập đầy đủ tên và độ tuổi');
      return;
    }
    if (Number(newBlock.minAge) >= Number(newBlock.maxAge)) {
      toast.warn('Tuổi tối thiểu phải nhỏ hơn tuổi tối đa');
      return;
    }
    setSubmitting(true);
    try {
      const resp = await post(ENDPOINTS.STATIC_BLOCKS.CREATE, {
        ...newBlock,
        description: newBlock.description || `Khối học cho độ tuổi ${newBlock.minAge}-${newBlock.maxAge}`,
        minAge: Number(newBlock.minAge),
        maxAge: Number(newBlock.maxAge),
        maxClasses: Number(newBlock.maxClasses),
      });
      if (resp?.status === 'success') {
        toast.success('Đã thêm khối mới');
        setOpenAdd(false);
        setNewBlock({ name: '', description: '', minAge: '', maxAge: '', maxClasses: 10 });
        onRefresh?.();
      } else {
        toast.error(resp?.message || 'Lỗi khi thêm khối');
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi hệ thống');
    } finally {
      setSubmitting(false);
    }
  };

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

        {/* Nút thêm khối mới */}
        <Paper
          elevation={0}
          onClick={() => setOpenAdd(true)}
          sx={{
            p: 2, borderRadius: 2, cursor: 'pointer',
            border: '2px dashed',
            borderColor: 'divider',
            bgcolor: 'rgba(0,0,0,0.01)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 100,
            transition: 'all 0.15s ease',
            '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.04)', color: '#6366f1' },
          }}
        >
          <AddIcon sx={{ mb: 0.5, fontSize: 24 }} />
          <Typography variant="subtitle2" fontWeight={700}>Thêm khối mới</Typography>
        </Paper>
      </Box>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>🆕 Thêm Khối học mới</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Khối này sẽ được lưu vào hệ thống và có thể sử dụng cho tất cả các năm học.
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth label="Tên khối (VD: Khối Mầm, Khối 4-5...)"
              value={newBlock.name}
              onChange={e => setNewBlock({ ...newBlock, name: e.target.value })}
              size="small"
            />
            <TextField
              fullWidth label="Mô tả"
              value={newBlock.description}
              onChange={e => setNewBlock({ ...newBlock, description: e.target.value })}
              size="small"
              multiline rows={2}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth label="Từ (tuổi)" type="number"
                  value={newBlock.minAge}
                  onChange={e => setNewBlock({ ...newBlock, minAge: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth label="Đến (tuổi)" type="number"
                  value={newBlock.maxAge}
                  onChange={e => setNewBlock({ ...newBlock, maxAge: e.target.value })}
                  size="small"
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth label="Số lớp tối đa" type="number"
              value={newBlock.maxClasses}
              onChange={e => setNewBlock({ ...newBlock, maxClasses: e.target.value })}
              size="small"
              helperText="Số lượng lớp tối đa cho phép trong một năm học"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenAdd(false)} color="inherit">Hủy</Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={submitting}
            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
          >
            {submitting ? 'Đang lưu...' : 'Thêm khối'}
          </Button>
        </DialogActions>
      </Dialog>

      {selectedBlockIds.length > 0 && (
        <Typography variant="body2" color="success.main" fontWeight={600}>
          ✓ Đã chọn {selectedBlockIds.length} khối học
        </Typography>
      )}
    </Stack>
  );
}
