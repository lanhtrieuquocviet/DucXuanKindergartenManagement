import {
  Alert, AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack, TextField, Typography
} from '@mui/material';
import {
  AutoFixHigh as MagicIcon,
} from '@mui/icons-material';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

// Sub-components
import StudentAssignmentHeader from './StudentAssignment/StudentAssignmentHeader';
import StudentAssignmentStats from './StudentAssignment/StudentAssignmentStats';
import StudentGroup from './StudentAssignment/StudentGroup';

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
  suggestions = [],
  loadingSuggestions = false,
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
      toast.warning('Lớp đã đạt sĩ số tối đa');
      return;
    }

    const newPlacement = isImported
      ? { studentTempId: studentId, classTempId }
      : { studentId: String(studentId), classTempId };

    onChange([...existing, newPlacement]);
  };

  const applySuggestions = () => {
    if (!suggestions || suggestions.length === 0) {
      toast.info('Hệ thống chưa tìm thấy lộ trình xếp lớp phù hợp cho danh sách này. Vui lòng kiểm tra lại độ tuổi của bé và cấu hình khối lớp.');
      return;
    }

    const newPlacements = [...placements];
    let appliedCount = 0;

    suggestions.forEach(s => {
      if (s.status === 'suggested' && s.targetClassId) {
        // Kiểm tra xem học sinh này đã được xếp lớp chưa (Cả cũ và mới)
        const alreadyPlaced = newPlacements.some(p => 
          s.studentTempId ? p.studentTempId === s.studentTempId : String(p.studentId) === String(s.studentId)
        );

        if (!alreadyPlaced) {
          const targetClass = (classes || []).find(c => c.tempId === s.targetClassId || c._id === s.targetClassId);
          if (targetClass) {
            const classTempId = targetClass.tempId || targetClass._id;
            const currentCount = newPlacements.filter(p => p.classTempId === classTempId).length;
            if (currentCount < (targetClass.maxStudents || 25)) {
              if (s.studentTempId) {
                newPlacements.push({ studentTempId: s.studentTempId, classTempId });
              } else {
                newPlacements.push({ studentId: String(s.studentId), classTempId });
              }
              appliedCount++;
            }
          }
        }
      }
    });

    if (appliedCount > 0) {
      onChange(newPlacements);
      toast.success(`Đã áp dụng ${appliedCount} gợi ý xếp lớp thông minh`);
    } else {
      toast.info('Không có gợi ý nào mới có thể áp dụng (có thể lớp đã đầy)');
    }
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

  const groups = useMemo(() => {
    const g = {};
    allDisplayStudents.forEach(s => {
      const groupName = s.isImported ? 'Học sinh mới (Import)' : (s.classId?.className || 'Chưa rõ lớp cũ');
      if (!g[groupName]) g[groupName] = [];
      g[groupName].push(s);
    });
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allDisplayStudents]);

  return (
    <Stack spacing={2}>
      <StudentAssignmentHeader
        carryOverCount={carryOverStudents?.length || 0}
        importedCount={importedStudents?.length || 0}
        totalCount={totalCount}
        assignedCount={assignedCount}
        onAutoPlace={applySuggestions}
        onImportExcel={handleFileUpload}
        fileInputRef={fileInputRef}
      />

      {loadingSuggestions ? (
        <Alert icon={<CircularProgress size={20} />} severity="info" sx={{ borderRadius: 2 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>Hệ thống đang tính toán lộ trình xếp lớp...</AlertTitle>
          Vui lòng đợi trong giây lát để nhận gợi ý xếp lớp thông minh dựa trên kết quả học tập và độ tuổi.
        </Alert>
      ) : suggestions.length > 0 && (
        <Alert 
          severity="success" 
          icon={<MagicIcon />}
          action={
            <Button color="inherit" size="small" onClick={applySuggestions} sx={{ fontWeight: 700 }}>
              Áp dụng ngay
            </Button>
          }
          sx={{ borderRadius: 2 }}
        >
          <AlertTitle sx={{ fontWeight: 700 }}>Tìm thấy lộ trình xếp lớp thông minh!</AlertTitle>
          Hệ thống đã phân tích và tìm thấy <b>{suggestions.filter(s => s.status === 'suggested').length}</b> gợi ý xếp lớp hợp lệ.
        </Alert>
      )}

      {errors.students && (
        <Typography variant="body2" color="error">{errors.students}</Typography>
      )}

      <StudentAssignmentStats
        assignedCount={assignedCount}
        totalCount={totalCount}
        importedCount={importedStudents?.length || 0}
      />

      {totalCount === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <Typography color="text.secondary" mb={2}>
            Chưa có học sinh nào. Bạn có thể import danh sách học sinh mới từ file Excel.
          </Typography>
          <Button
            variant="contained"
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
            sx={{ mb: 1 }}
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

          <Box sx={{ mt: 1 }}>
            {groups.map(([groupName, studentsInGroup]) => (
              <StudentGroup
                key={groupName}
                groupName={groupName}
                studentsInGroup={studentsInGroup}
                classes={classes}
                classCounts={classCounts}
                placements={placements}
                selectedBlocks={selectedBlocks}
                onSetClass={setStudentClass}
                onRemove={removeImportedStudent}
                onChange={onChange}
                getPlacement={getPlacement}
                calcAge={calcAge}
              />
            ))}
          </Box>
        </>
      )}
    </Stack>
  );
}
