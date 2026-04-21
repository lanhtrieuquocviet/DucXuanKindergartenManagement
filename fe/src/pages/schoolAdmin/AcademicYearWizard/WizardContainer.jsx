import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, Paper, Stack,
  Step, StepLabel, Stepper, Typography,
} from '@mui/material';
import { get, post, ENDPOINTS } from '../../../service/api';
import { toast } from 'react-toastify';
import StepYearInfo from './steps/StepYearInfo';
import StepGradeSelect from './steps/StepGradeSelect';
import StepClassSetup from './steps/StepClassSetup';
import StepStudentAssignment from './steps/StepStudentAssignment';

const STEPS = ['Thông tin năm học', 'Kích hoạt Khối', 'Thiết lập Lớp học', 'Phân lớp Học sinh'];

const EMPTY_YEAR_INFO = {
  yearName: '', startDate: '', endDate: '', description: '',
  term1StartDate: '', term1EndDate: '', term2StartDate: '', term2EndDate: '',
};

export default function AcademicYearWizard({ open, onClose, onSuccess }) {
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // --- Step 1: Năm học ---
  const [yearInfo, setYearInfo] = useState({ ...EMPTY_YEAR_INFO });

  // --- Step 2: Khối học ---
  const [staticBlocks, setStaticBlocks] = useState([]);
  const [selectedBlockIds, setSelectedBlockIds] = useState([]);

  // --- Step 3: Lớp học ---
  const [classes, setClasses] = useState([]);
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [cloneClasses, setCloneClasses] = useState([]);

  // --- Step 4: Học sinh ---
  const [carryOverStudents, setCarryOverStudents] = useState([]);
  const [importedStudents, setImportedStudents] = useState([]); // Học sinh mới từ file Excel
  const [placements, setPlacements] = useState([]);

  // Fetch dữ liệu khi mở Wizard
  useEffect(() => {
    if (!open) return;
    resetWizard();
    const load = async () => {
      try {
        const [cloneResp, teacherResp] = await Promise.all([
          get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.WIZARD_CLONE_DATA),
          get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS),
        ]);
        if (cloneResp?.status === 'success') {
          setStaticBlocks(cloneResp.data.staticBlocks || []);
          setCloneClasses(cloneResp.data.cloneClasses || []);
          setCarryOverStudents(cloneResp.data.carryOverStudents || []);
        }
        if (teacherResp?.status === 'success' || Array.isArray(teacherResp?.data)) {
          const teachers = Array.isArray(teacherResp.data) ? teacherResp.data : [];
          setTeacherOptions(teachers.map(t => ({
            _id: t._id || t.teacherId,
            fullName: t.userId?.fullName || t.fullName || '',
          })));
        }
      } catch (e) {
        console.error('Wizard load error:', e);
        toast.error('Không thể tải dữ liệu khởi tạo Wizard');
      }
    };
    load();
  }, [open]);

  const resetWizard = () => {
    setActiveStep(0);
    setErrors({});
    setYearInfo({ ...EMPTY_YEAR_INFO });
    setSelectedBlockIds([]);
    setClasses([]);
    setImportedStudents([]);
    setPlacements([]);
  };

  // Danh sách khối đã chọn dưới dạng object đầy đủ + tempId
  const selectedBlocks = staticBlocks
    .filter(sb => selectedBlockIds.includes(sb._id))
    .map(sb => ({ ...sb, tempId: `grade_${sb._id}` }));

  // ── Validate từng bước ─────────────────────────────────────────────────
  const validateStep = (step) => {
    const errs = {};

    if (step === 0) {
      const {
        yearName, startDate, endDate, description,
        term1StartDate, term1EndDate, term2StartDate, term2EndDate
      } = yearInfo;

      if (!yearName.trim()) errs.yearName = 'Vui lòng nhập tên năm học';
      if (!startDate) errs.startDate = 'Vui lòng chọn ngày bắt đầu';
      if (!endDate) errs.endDate = 'Vui lòng chọn ngày kết thúc';
      
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (startDate && endDate && start >= end)
        errs.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      
      if (!description.trim()) errs.description = 'Vui lòng nhập mô tả năm học';

      // Validate Kỳ 1
      if (!term1StartDate) errs.term1StartDate = 'Vui lòng chọn ngày bắt đầu kỳ 1';
      if (!term1EndDate) errs.term1EndDate = 'Vui lòng chọn ngày kết thúc kỳ 1';
      
      const t1Start = new Date(term1StartDate);
      const t1End = new Date(term1EndDate);

      if (term1StartDate && term1EndDate && t1Start >= t1End)
        errs.term1EndDate = 'Ngày kết thúc kỳ 1 phải sau ngày bắt đầu kỳ 1';
      
      if (startDate && term1StartDate && t1Start < start)
        errs.term1StartDate = 'Kỳ 1 không thể bắt đầu trước năm học';

      // Validate Kỳ 2
      if (!term2StartDate) errs.term2StartDate = 'Vui lòng chọn ngày bắt đầu kỳ 2';
      if (!term2EndDate) errs.term2EndDate = 'Vui lòng chọn ngày kết thúc kỳ 2';

      const t2Start = new Date(term2StartDate);
      const t2End = new Date(term2EndDate);

      if (term2StartDate && term2EndDate && t2Start >= t2End)
        errs.term2EndDate = 'Ngày kết thúc kỳ 2 phải sau ngày bắt đầu kỳ 2';

      if (endDate && term2EndDate && t2End > end)
        errs.term2EndDate = 'Kỳ 2 không thể kết thúc sau năm học';

      // Giao thoa giữa 2 kỳ
      if (term1EndDate && term2StartDate && t1End > t2Start)
        errs.term2StartDate = 'Kỳ 2 không thể bắt đầu trước khi kỳ 1 kết thúc';
    }

    if (step === 1) {
      if (selectedBlockIds.length === 0)
        errs.grades = 'Vui lòng chọn ít nhất một khối học';
    }

    if (step === 2) {
      if (classes.length === 0)
        errs.classes = 'Vui lòng tạo ít nhất một lớp học';
      classes.forEach(c => {
        if (!c.className.trim())
          errs[`class_${c.tempId}_name`] = 'Tên lớp không được để trống';
        if (!c.teacherIds || c.teacherIds.length === 0)
          errs[`class_${c.tempId}_teacher`] = 'Chưa có giáo viên';
      });
      // Kiểm tra giáo viên trùng
      const allTeachers = classes.flatMap(c => c.teacherIds || []);
      const seen = new Set();
      allTeachers.forEach(tid => {
        if (seen.has(String(tid)))
          errs.classes = 'Một giáo viên không thể dạy nhiều lớp trong cùng năm học';
        seen.add(String(tid));
      });
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setErrors({});
    setActiveStep(s => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setActiveStep(s => s - 1);
  };

  // ── Submit Wizard ───────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validateStep(2)) return; // Validate lại bước cuối
    setSubmitting(true);
    try {
      const payload = {
        yearInfo: {
          yearName: yearInfo.yearName.trim(),
          startDate: yearInfo.startDate,
          endDate: yearInfo.endDate,
          term1StartDate: yearInfo.term1StartDate,
          term1EndDate: yearInfo.term1EndDate,
          term2StartDate: yearInfo.term2StartDate,
          term2EndDate: yearInfo.term2EndDate,
          description: yearInfo.description.trim(),
        },
        grades: selectedBlocks.map(b => ({
          tempId: b.tempId,
          staticBlockId: b._id,
        })),
        classes: classes.map(c => ({
          tempId: c.tempId,
          className: c.className.trim(),
          gradeTempId: c.gradeTempId,
          teacherIds: c.teacherIds || [],
          maxStudents: c.maxStudents || 25,
        })),
        studentPlacements: placements,
        importedStudents: importedStudents.map(s => ({
          ...s,
          classId: placements.find(p => p.studentTempId === s.tempId)?.classTempId
        })).filter(s => s.classId), // Chỉ gửi những học sinh đã được xếp lớp
      };

      const resp = await post(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.WIZARD_SETUP, payload);
      if (resp?.status === 'success') {
        const d = resp.data;
        toast.success(
          `🎉 Thiết lập năm học "${d.yearName}" thành công! ` +
          `${d.gradesCreated} khối, ${d.classesCreated} lớp, ${d.studentsTransferred} học sinh chuyển tiếp.`
        );
        onSuccess?.(resp.data);
        onClose();
      } else {
        toast.error(resp?.message || 'Có lỗi xảy ra khi tạo năm học');
      }
    } catch (error) {
      toast.error(error?.message || 'Lỗi khi thiết lập năm học mới');
    } finally {
      setSubmitting(false);
    }
  }, [yearInfo, selectedBlocks, classes, placements, onClose, onSuccess]);

  // ── Render ─────────────────────────────────────────────────────────────
  const stepContent = [
    <StepYearInfo key="step1" data={yearInfo} onChange={setYearInfo} errors={errors} />,
    <StepGradeSelect
      key="step2"
      staticBlocks={staticBlocks}
      selectedBlockIds={selectedBlockIds}
      onChange={setSelectedBlockIds}
      errors={errors}
    />,
    <StepClassSetup
      key="step3"
      classes={classes}
      onChange={setClasses}
      errors={errors}
      selectedBlocks={selectedBlocks}
      cloneClasses={cloneClasses}
      teacherOptions={teacherOptions}
    />,
    <StepStudentAssignment
      key="step4"
      carryOverStudents={carryOverStudents}
      importedStudents={importedStudents}
      onImportedStudentsChange={setImportedStudents}
      classes={classes}
      selectedBlocks={selectedBlocks}
      placements={placements}
      onChange={setPlacements}
      errors={errors}
    />,
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, minHeight: 560 } }}
    >
      <DialogTitle
        sx={{
          pb: 0,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h6" fontWeight={800}>🎓 Thiết lập Năm học mới</Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, mb: 2 }}>
          Hoàn thành 4 bước để thiết lập toàn bộ cấu trúc năm học mới một cách an toàn.
        </Typography>
        <Stepper
          activeStep={activeStep}
          sx={{
            pb: 2,
            '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
            '& .MuiStepLabel-label.Mui-active': { color: 'white', fontWeight: 700 },
            '& .MuiStepLabel-label.Mui-completed': { color: 'rgba(255,255,255,0.9)' },
            '& .MuiStepIcon-root': { color: 'rgba(255,255,255,0.3)' },
            '& .MuiStepIcon-root.Mui-active': { color: 'white' },
            '& .MuiStepIcon-root.Mui-completed': { color: '#a5f3fc' },
            '& .MuiStepConnector-line': { borderColor: 'rgba(255,255,255,0.3)' },
          }}
        >
          {STEPS.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, overflow: 'auto' }}>
        {stepContent[activeStep]}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1}>
          <Button
            onClick={onClose}
            disabled={submitting}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Hủy
          </Button>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          {activeStep > 0 && (
            <Button
              onClick={handleBack}
              disabled={submitting}
              variant="outlined"
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
            >
              ← Quay lại
            </Button>
          )}
          {activeStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              sx={{
                textTransform: 'none', borderRadius: 2, fontWeight: 700,
                bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' },
              }}
            >
              Tiếp theo →
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              variant="contained"
              sx={{
                textTransform: 'none', borderRadius: 2, fontWeight: 700,
                bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, minWidth: 140,
              }}
            >
              {submitting ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                  <span>Đang xử lý...</span>
                </Stack>
              ) : '✓ Hoàn tất thiết lập'}
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
