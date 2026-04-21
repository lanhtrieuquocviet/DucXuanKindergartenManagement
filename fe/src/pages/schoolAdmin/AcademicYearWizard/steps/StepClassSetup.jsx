import { useState } from 'react';
import {
  Alert, Box, Button, Chip, FormControl,
  IconButton, InputLabel, MenuItem, Paper,
  Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CloneIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

export default function StepClassSetup({
  classes, onChange, errors,
  selectedBlocks,    // [{ _id, name, maxClasses, minAge, maxAge, tempId }]
  cloneClasses,      // Gợi ý nhân bản từ năm cũ (không có teacherIds)
  teacherOptions,    // [{ _id, fullName }]
}) {
  const [cloned, setCloned] = useState(false);

  // Map teacherId → tên để kiểm tra trùng
  const assignedTeacherIds = new Set(
    classes.flatMap(c => c.teacherIds || [])
  );

  const addClass = (gradeTempId) => {
    const block = selectedBlocks.find(b => b.tempId === gradeTempId);
    const currentCount = classes.filter(c => c.gradeTempId === gradeTempId).length;
    if (block && currentCount >= block.maxClasses) {
      return; // Đã đạt sĩ số tối đa
    }
    const newClass = {
      tempId: `class_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      gradeTempId,
      className: '',
      teacherIds: [],
      maxStudents: 25,
    };
    onChange([...classes, newClass]);
  };

  const updateClass = (tempId, field, value) => {
    onChange(classes.map(c => c.tempId === tempId ? { ...c, [field]: value } : c));
  };

  const removeClassItem = (tempId) => {
    onChange(classes.filter(c => c.tempId !== tempId));
  };

  const handleClone = () => {
    if (!cloneClasses || cloneClasses.length === 0) return;
    const cloned = cloneClasses.map(cc => {
      // Tìm khối tương ứng theo staticBlockId
      const matchedBlock = selectedBlocks.find(b => String(b._id) === String(cc.staticBlockId));
      return {
        tempId: `class_clone_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        gradeTempId: matchedBlock?.tempId || '',
        className: cc.className,
        teacherIds: [], // Bắt buộc gán lại
        maxStudents: cc.maxStudents || 25,
        isCloned: true,
      };
    }).filter(c => c.gradeTempId); // Loại bỏ những cái không map được khối
    onChange(cloned);
    setCloned(true);
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="#6366f1">
            Thiết lập Lớp học & Phân công Giáo viên
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mỗi lớp <strong>bắt buộc</strong> phải có ít nhất 1 giáo viên. Giáo viên không được trùng giữa các lớp.
          </Typography>
        </Box>
        {cloneClasses?.length > 0 && !cloned && (
          <Button
            variant="outlined" size="small" startIcon={<CloneIcon />}
            onClick={handleClone}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#6366f1', color: '#6366f1' }}
          >
            Nhân bản từ năm cũ ({cloneClasses.length} lớp)
          </Button>
        )}
      </Stack>

      {cloned && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Đã nhân bản <strong>{classes.length} lớp</strong> từ năm học cũ.
          Tên lớp và sĩ số được giữ nguyên. Vui lòng <strong>gán lại giáo viên</strong> cho mỗi lớp.
        </Alert>
      )}

      {errors.classes && (
        <Typography variant="body2" color="error">{errors.classes}</Typography>
      )}

      {selectedBlocks.map(block => {
        const blockClasses = classes.filter(c => c.gradeTempId === block.tempId);
        const maxClasses = block.maxClasses || 10;
        const atMax = blockClasses.length >= maxClasses;

        return (
          <Paper key={block.tempId} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, bgcolor: '#f8f9ff', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2" fontWeight={700}>{block.name}</Typography>
                  <Chip label={`${block.minAge}–${block.maxAge} tuổi`} size="small" sx={{ bgcolor: '#e0e7ff', color: '#3730a3', fontSize: 11 }} />
                  <Typography variant="caption" color="text.secondary">
                    {blockClasses.length}/{maxClasses} lớp
                  </Typography>
                </Stack>
                <Button
                  size="small" startIcon={<AddIcon />}
                  onClick={() => addClass(block.tempId)}
                  disabled={atMax}
                  sx={{ textTransform: 'none', fontWeight: 600, color: '#6366f1' }}
                >
                  Thêm lớp
                </Button>
              </Stack>
              {atMax && (
                <Typography variant="caption" color="warning.main">
                  ⚠ Đã đạt số lớp tối đa của khối này ({maxClasses} lớp)
                </Typography>
              )}
            </Box>

            <Stack spacing={0} divider={<Box sx={{ height: '1px', bgcolor: 'divider' }} />}>
              {blockClasses.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có lớp nào. Nhấn "Thêm lớp" để tạo.
                  </Typography>
                </Box>
              ) : (
                blockClasses.map((cls, idx) => {
                  const hasNoTeacher = !cls.teacherIds || cls.teacherIds.length === 0;
                  return (
                    <Box key={cls.tempId} sx={{ p: 2, bgcolor: hasNoTeacher ? '#fffbeb' : 'white' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                        {/* Tên lớp */}
                        <TextField
                          label={`Tên lớp ${idx + 1} *`}
                          size="small" fullWidth
                          value={cls.className}
                          placeholder={`Ví dụ: ${block.name} ${idx + 1}`}
                          onChange={e => updateClass(cls.tempId, 'className', e.target.value)}
                          error={!!errors[`class_${cls.tempId}_name`]}
                          helperText={errors[`class_${cls.tempId}_name`]}
                          sx={{ flex: 2 }}
                        />

                        {/* Sĩ số */}
                        <TextField
                          label="Sĩ số tối đa" type="number"
                          size="small"
                          value={cls.maxStudents}
                          onChange={e => updateClass(cls.tempId, 'maxStudents', Number(e.target.value))}
                          inputProps={{ min: 1, max: 100 }}
                          sx={{ flex: '0 0 110px' }}
                        />

                        {/* Chọn giáo viên */}
                        <FormControl size="small" sx={{ flex: 3 }} error={hasNoTeacher}>
                          <InputLabel>Giáo viên *</InputLabel>
                          <Select
                            label="Giáo viên *"
                            multiple
                            value={cls.teacherIds || []}
                            onChange={e => updateClass(cls.tempId, 'teacherIds', e.target.value)}
                            renderValue={selected => (
                              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                {selected.map(id => {
                                  const t = teacherOptions.find(t => String(t._id) === String(id));
                                  return <Chip key={id} label={t?.fullName || id} size="small" />;
                                })}
                              </Stack>
                            )}
                          >
                            {teacherOptions.map(t => {
                              // Giáo viên đã được gán vào lớp khác thì disable
                              const isAssignedElsewhere =
                                assignedTeacherIds.has(String(t._id)) &&
                                !(cls.teacherIds || []).map(String).includes(String(t._id));
                              return (
                                <MenuItem key={t._id} value={String(t._id)} disabled={isAssignedElsewhere}>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <span>{t.fullName}</span>
                                    {isAssignedElsewhere && (
                                      <Chip label="Đã có lớp" size="small" color="warning" sx={{ fontSize: 10 }} />
                                    )}
                                  </Stack>
                                </MenuItem>
                              );
                            })}
                          </Select>
                          {hasNoTeacher && (
                            <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
                              <WarningIcon sx={{ fontSize: 13, color: 'warning.main' }} />
                              <Typography variant="caption" color="warning.main">Chưa có giáo viên</Typography>
                            </Stack>
                          )}
                        </FormControl>

                        <Tooltip title="Xóa lớp này">
                          <IconButton size="small" color="error" onClick={() => removeClassItem(cls.tempId)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  );
                })
              )}
            </Stack>
          </Paper>
        );
      })}

      {selectedBlocks.length === 0 && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Vui lòng quay lại Bước 2 để chọn khối học trước.
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
