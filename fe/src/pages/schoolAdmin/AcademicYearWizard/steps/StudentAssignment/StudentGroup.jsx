import {
  Box,
  Chip,
  Divider,
  FormControl,
  InputLabel, MenuItem, Paper, Select,
  Stack, Typography
} from '@mui/material';
import StudentRow from './StudentRow';
import { toast } from 'react-toastify';

export default function StudentGroup({ 
  groupName, 
  studentsInGroup, 
  classes, 
  classCounts, 
  placements, 
  selectedBlocks,
  onSetClass,
  onRemove,
  onChange,
  getPlacement,
  calcAge
}) {
  const unassignedInGroup = studentsInGroup.filter(s => !getPlacement(s._id, s.isImported)).length;

  const handleBulkAssign = (classTempId) => {
    if (!classTempId) return;

    const newPlacements = [...placements];
    let addedCount = 0;

    studentsInGroup.forEach(s => {
      const alreadyPlaced = newPlacements.some(p => s.isImported ? p.studentTempId === s._id : String(p.studentId) === String(s._id));
      if (!alreadyPlaced) {
        const targetClass = classes.find(c => c.tempId === classTempId);
        const currentCount = newPlacements.filter(p => p.classTempId === classTempId).length;
        if (targetClass && currentCount < (targetClass.maxStudents || 25)) {
          newPlacements.push(s.isImported
            ? { studentTempId: s._id, classTempId }
            : { studentId: String(s._id), classTempId }
          );
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      onChange(newPlacements);
      toast.success(`Đã xếp lớp cho ${addedCount} học sinh vào lớp mới`);
    } else {
      toast.warning('Lớp đã đầy hoặc học sinh đã có lớp');
    }
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, mb: 2, overflow: 'hidden' }}>
      <Box sx={{
        px: 2, py: 1.5,
        bgcolor: unassignedInGroup > 0 ? '#f8fafc' : '#f0fdf4',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" fontWeight={800} color="#334155">
            {groupName}
          </Typography>
          <Chip
            label={`${studentsInGroup.length} học sinh`}
            size="small"
            sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: '#fff', border: '1px solid #e2e8f0' }}
          />
          {unassignedInGroup > 0 && (
            <Chip
              label={`${unassignedInGroup} chưa xếp lớp`}
              size="small" color="warning"
              sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
            />
          )}
        </Stack>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel sx={{ fontSize: 13 }}>Xếp nhanh cả nhóm</InputLabel>
          <Select
            label="Xếp nhanh cả nhóm"
            value=""
            onChange={(e) => handleBulkAssign(e.target.value)}
            sx={{ height: 32, fontSize: 13, borderRadius: 2 }}
          >
            <MenuItem value=""><em>— Chọn lớp —</em></MenuItem>
            {classes.map(cls => (
              <MenuItem key={cls.tempId} value={cls.tempId} disabled={(classCounts[cls.tempId] || 0) >= (cls.maxStudents || 25)}>
                {cls.className} ({classCounts[cls.tempId] || 0}/{cls.maxStudents || 25})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Stack spacing={0} divider={<Divider />}>
        {studentsInGroup.map(student => (
          <StudentRow
            key={student._id}
            student={student}
            placement={getPlacement(student._id, student.isImported)}
            classes={classes}
            classCounts={classCounts}
            selectedBlocks={selectedBlocks}
            onSetClass={onSetClass}
            onRemove={onRemove}
            calcAge={calcAge}
          />
        ))}
      </Stack>
    </Paper>
  );
}
