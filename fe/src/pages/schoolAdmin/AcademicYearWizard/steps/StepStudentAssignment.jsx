import { useMemo, useState, useRef } from 'react';
import {
  Avatar, Box, Chip, FormControl,
  InputLabel, MenuItem, Paper, Select,
  Stack, TextField, Typography, Button,
  Tooltip, IconButton, Divider
} from '@mui/material';
import { 
  Person as PersonIcon, 
  WarningAmber as WarningIcon,
  FileUpload as ImportIcon,
  Delete as DeleteIcon,
  InfoOutlined as InfoIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default function StepStudentAssignment({
  carryOverStudents = [],
  importedStudents = [],
  onImportedStudentsChange,
  classes = [],
  selectedBlocks = [],
  placements = [],
  onChange,
  errors,
}) {
  const [search, setSearch] = useState('');
  const fileInputRef = useRef(null);

  const classCounts = useMemo(() => {
    const counts = {};
    (placements || []).forEach(p => {
      counts[p.classTempId] = (counts[p.classTempId] || 0) + 1;
    });
    return counts;
  }, [placements]);

  const getPlacement = (studentId, isImported = false) => {
    if (isImported) {
      return (placements || []).find(p => p.studentTempId === studentId);
    }
    return (placements || []).find(p => String(p.studentId) === String(studentId));
  };

  const setStudentClass = (studentId, classTempId, isImported = false) => {
    let existing;
    if (isImported) {
      existing = (placements || []).filter(p => p.studentTempId !== studentId);
    } else {
      existing = (placements || []).filter(p => String(p.studentId) !== String(studentId));
    }

    if (!classTempId) {
      onChange(existing);
      return;
    }

    const targetClass = (classes || []).find(c => c.tempId === classTempId);
    const count = classCounts[classTempId] || 0;
    if (targetClass && count >= (targetClass.maxStudents || 25)) {
      return;
    }

    const newPlacement = isImported 
      ? { studentTempId: studentId, classTempId }
      : { studentId: String(studentId), classTempId };

    onChange([...existing, newPlacement]);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const newStudents = data.map((row, idx) => {
        const fullName = row['Họ tên'] || row['Full Name'] || row['Name'];
        let dob = row['Ngày sinh'] || row['Date of Birth'] || row['DOB'];
        if (typeof dob === 'number') {
          const date = new Date((dob - 25569) * 86400 * 1000);
          dob = date.toISOString().split('T')[0];
        }
        
        const genderRaw = String(row['Giới tính'] || row['Gender'] || '').toLowerCase();
        const gender = (genderRaw.includes('nam') || genderRaw === 'male') ? 'male' : 'female';
        
        const className = row['Lớp'] || row['Class'];
        const tempId = `imported_${Date.now()}_${idx}`;

        return { tempId, fullName, dateOfBirth: dob, gender, preferredClassName: className };
      }).filter(s => s.fullName);

      onImportedStudentsChange([...importedStudents, ...newStudents]);
      
      const newPlacements = [];
      newStudents.forEach(s => {
        if (s.preferredClassName) {
          const matchedClass = (classes || []).find(c => 
            c.className.toLowerCase() === String(s.preferredClassName).toLowerCase()
          );
          if (matchedClass) {
            newPlacements.push({ studentTempId: s.tempId, classTempId: matchedClass.tempId });
          }
        }
      });
      if (newPlacements.length > 0) {
        onChange([...placements, ...newPlacements]);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const removeImportedStudent = (tempId) => {
    onImportedStudentsChange(importedStudents.filter(s => s.tempId !== tempId));
    onChange(placements.filter(p => p.studentTempId !== tempId));
  };

  const allDisplayStudents = useMemo(() => {
    const carryOver = (carryOverStudents || []).map(s => ({ ...s, isImported: false }));
    const imported = (importedStudents || []).map(s => ({ 
      _id: s.tempId, 
      fullName: s.fullName, 
      dateOfBirth: s.dateOfBirth, 
      gender: s.gender,
      isImported: true 
    }));
    
    return [...carryOver, ...imported].filter(s => {
      if (search) {
        const q = search.toLowerCase();
        return (s.fullName || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [carryOverStudents, importedStudents, search]);

  const assignedCount = placements.length;
  const totalCount = (carryOverStudents?.length || 0) + (importedStudents?.length || 0);

  const handleAutoPlacement = () => {
    const newPlacements = [...placements];
    
    // 1. Process Carry-over students (Promotion logic)
    carryOverStudents.forEach(student => {
      // Skip if already placed
      if (newPlacements.some(p => String(p.studentId) === String(student._id))) return;
      
      const prevClass = student.classId; // This would need to be passed from backend
      if (prevClass) {
        // Try to find a class with a similar name in the new year
        // e.g., if prev was "Mầm 1", try to find "Chồi 1"
        const matchedClass = (classes || []).find(c => 
          c.className.split(' ').pop() === prevClass.className?.split(' ').pop()
        );
        if (matchedClass) {
          const currentInClass = [...newPlacements, ...placements].filter(p => p.classTempId === matchedClass.tempId).length;
          if (currentInClass < (matchedClass.maxStudents || 25)) {
            newPlacements.push({ studentId: String(student._id), classTempId: matchedClass.tempId });
          }
        }
      }
    });

    // 2. Process Imported students (Preferred class logic)
    importedStudents.forEach(student => {
      // Skip if already placed
      if (newPlacements.some(p => p.studentTempId === student.tempId)) return;
      
      if (student.preferredClassName) {
        const matchedClass = (classes || []).find(c => 
          c.className.toLowerCase().includes(String(student.preferredClassName).toLowerCase())
        );
        if (matchedClass) {
          const currentInClass = [...newPlacements, ...placements].filter(p => p.classTempId === matchedClass.tempId).length;
          if (currentInClass < (matchedClass.maxStudents || 25)) {
            newPlacements.push({ studentTempId: student.tempId, classTempId: matchedClass.tempId });
          }
        }
      }
    });

    onChange(newPlacements);
    toast.info(`Đã tự động xếp lớp cho thêm ${newPlacements.length - placements.length} học sinh`);
  };

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
              Xếp học sinh chuyển tiếp ({carryOverStudents?.length || 0}) và học sinh mới ({importedStudents?.length || 0}) vào các lớp.
            </Typography>
          </Box>
        </Stack>
        
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            color="secondary"
            startIcon={<CheckIcon />}
            onClick={handleAutoPlacement}
            disabled={totalCount === 0 || assignedCount === totalCount}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
          >
            Tự động xếp lớp
          </Button>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <input
            type="file"
            hidden
            ref={fileInputRef}
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
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

      {errors.students && (
        <Typography variant="body2" color="error">{errors.students}</Typography>
      )}

      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Chip
          label={`${assignedCount}/${totalCount} học sinh đã xếp lớp`}
          color={assignedCount === totalCount && totalCount > 0 ? 'success' : 'warning'}
          sx={{ fontWeight: 700 }}
        />
        {totalCount - assignedCount > 0 && (
          <Chip
            icon={<WarningIcon />}
            label={`${totalCount - assignedCount} học sinh chưa xếp lớp`}
            color="warning" variant="outlined"
          />
        )}
        {(importedStudents?.length || 0) > 0 && (
          <Chip
            label={`Đã import ${importedStudents.length} học sinh mới`}
            color="info" variant="outlined" size="small"
          />
        )}
      </Stack>

      {totalCount === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <Typography color="text.secondary" mb={2}>
            Chưa có học sinh nào. Bạn có thể import danh sách học sinh mới từ file Excel.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ImportIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ bgcolor: '#6366f1', textTransform: 'none', borderRadius: 2 }}
          >
            Tải lên file học sinh
          </Button>
        </Box>
      ) : (
        <>
          <TextField
            placeholder="Tìm theo tên học sinh..."
            size="small" fullWidth
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <Stack direction="row" flexWrap="wrap" gap={1}>
            {(classes || []).map(cls => {
              const count = classCounts[cls.tempId] || 0;
              const max = cls.maxStudents || 25;
              const isFull = count >= max;
              return (
                <Chip
                  key={cls.tempId}
                  label={`${cls.className}: ${count}/${max}`}
                  color={isFull ? 'error' : 'default'}
                  variant={isFull ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              );
            })}
          </Stack>

          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Stack spacing={0} divider={<Divider />}>
              {allDisplayStudents.map(student => {
                const placement = getPlacement(student._id, student.isImported);
                const age = calcAge(student.dateOfBirth);
                const targetClass = (classes || []).find(c => c.tempId === placement?.classTempId);

                let ageWarning = null;
                if (targetClass && age !== null) {
                  const block = (selectedBlocks || []).find(b => b.tempId === targetClass.gradeTempId);
                  if (block && (age < block.minAge || age > block.maxAge + 1)) {
                    ageWarning = `Tuổi (${age}) không khớp với khối ${block.name} (${block.minAge}–${block.maxAge})`;
                  }
                }

                return (
                  <Box
                    key={student._id}
                    sx={{ p: 1.5, bgcolor: placement ? 'white' : '#fffbeb', '&:hover': { bgcolor: '#f9fafb' } }}
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
                        <Avatar src={student.avatar} sx={{ width: 40, height: 40, fontSize: 16, bgcolor: student.isImported ? '#0ea5e9' : '#6366f1' }}>
                          {student.fullName?.[0]}
                        </Avatar>
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight={800} sx={{ color: '#1e293b' }}>{student.fullName}</Typography>
                            {student.isImported ? (
                              <Chip label="Học sinh mới" size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }} />
                            ) : (
                              <Chip label="Chuyển tiếp" size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#f0f9ff', color: '#0284c7', fontWeight: 700 }} />
                            )}
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" mt={0.3}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                              {age !== null ? `${age} tuổi` : '—'} · {student.gender === 'male' ? 'Nam' : 'Nữ'}
                            </Typography>
                            {!student.isImported && student.classId && (
                              <>
                                <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto', mx: 0.5 }} />
                                <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700 }}>
                                  Lớp cũ: {student.classId.className}
                                </Typography>
                              </>
                            )}
                          </Stack>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: { xs: 160, sm: 220 } }}>
                          <InputLabel>Xếp vào lớp</InputLabel>
                          <Select
                            label="Xếp vào lớp"
                            value={placement?.classTempId || ''}
                            onChange={e => setStudentClass(student._id, e.target.value, student.isImported)}
                            sx={{ 
                              borderRadius: 2, 
                              bgcolor: placement ? '#fff' : '#fffbeb',
                              '& .MuiSelect-select': { py: 1 }
                            }}
                          >
                            <MenuItem value=""><em>— Chưa xếp lớp —</em></MenuItem>
                            {(classes || []).map(cls => {
                              const count = classCounts[cls.tempId] || 0;
                              const max = cls.maxStudents || 25;
                              const isFull = count >= max && placement?.classTempId !== cls.tempId;
                              
                              // Check if this class is a "recommended" match based on previous class
                              const isRecommended = !student.isImported && student.classId && 
                                cls.className.split(' ').pop() === student.classId.className?.split(' ').pop();

                              return (
                                <MenuItem key={cls.tempId} value={cls.tempId} disabled={isFull}>
                                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Typography variant="body2" fontWeight={isRecommended ? 800 : 400}>
                                        {cls.className}
                                      </Typography>
                                      {isRecommended && <Chip label="Gợi ý" size="small" sx={{ height: 14, fontSize: 8, bgcolor: '#f0fdf4', color: '#16a34a' }} />}
                                    </Stack>
                                    <Typography variant="caption" color={isFull ? 'error' : 'text.secondary'} sx={{ fontWeight: 700 }}>
                                      {count}/{max}
                                    </Typography>
                                  </Stack>
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                        {student.isImported && (
                          <IconButton size="small" color="error" onClick={() => removeImportedStudent(student._id)} sx={{ bgcolor: '#fee2e2', '&:hover': { bgcolor: '#fecaca' } }}>
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
              })}
            </Stack>
          </Paper>
        </>
      )}
    </Stack>
  );
}
