import { PeopleAlt as PeopleAltIcon } from '@mui/icons-material';
import { Box, CircularProgress, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import { ENDPOINTS, get, patch, postFormData } from '../../service/api';
import SuccessAccountDialog from '../../components/SuccessAccountDialog';
import ExcelJS from 'exceljs';

// Sub-components
import AddStudentDialog from './StudentManagement/AddStudentDialog';
import ChangeRequestDialog from './StudentManagement/ChangeRequestDialog';
import EditStudentDialog from './StudentManagement/EditStudentDialog';
import { handleDownloadTemplate as downloadTemplateHelper } from './StudentManagement/excelTemplateHelper';
import ImportExcelSection from './StudentManagement/ImportExcelSection';
import StudentFilter from './StudentManagement/StudentFilter';
import StudentTable from './StudentManagement/StudentTable';

// Dialogs
import ImportResultDialog from './StudentManagement/ImportResultDialog';
import DuplicateConfirmDialog from './StudentManagement/DuplicateConfirmDialog';
import DeleteConfirmDialog from './StudentManagement/DeleteConfirmDialog';
import ParentMergeConfirmDialog from './StudentManagement/ParentMergeConfirmDialog';
import PreviewImportDialog from './StudentManagement/PreviewImportDialog';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
];

const PHONE_REGEX = /^[0-9]{10,11}$/;

function isValidPhone(value) {
  if (!value || !value.trim()) return true;
  return PHONE_REGEX.test(value.trim().replace(/\s/g, ''));
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(value) {
  if (!value || !value.trim()) return false;
  return EMAIL_REGEX.test(value.trim());
}

function formatPhoneDisplay(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '—';
  if (digits.length === 9) return `0${digits}`;
  return digits;
}

function ManageStudents() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasRole, isInitializing } = useAuth();
  const {
    getAllStudents,
    getClasses,
    createStudentWithParent,
    updateStudent,
    deleteStudent,
    loading: ctxLoading,
    setError: setCtxError,
  } = useSchoolAdmin();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [viewAcademicYear, setViewAcademicYear] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Pending change requests
  const [pendingMap, setPendingMap] = useState({});
  const [reqViewStudent, setReqViewStudent] = useState(null);
  const [reqViewData, setReqViewData] = useState([]);
  const [reqViewLoading, setReqViewLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  // Dialog states
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form states
  const [formAdd, setFormAdd] = useState({
    parent: { username: '', password: '', fullName: '', email: '', phone: '' },
    student: { fullName: '', dateOfBirth: '', gender: 'male', address: '', avatar: '' },
  });
  const [formAddErrors, setFormAddErrors] = useState({});
  const [addError, setAddError] = useState(null);
  const [existingParentFound, setExistingParentFound] = useState(null);
  const [showParentConfirm, setShowParentConfirm] = useState(false);
  const [checkingParentPhone, setCheckingParentPhone] = useState(false);
  const [isParentInfoLocked, setIsParentInfoLocked] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const addImageInputRef = useRef(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [openImportResult, setOpenImportResult] = useState(false);
  const importInputRef = useRef(null);

  // States cho Preview & Duplicate
  const [previewData, setPreviewData] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState(null);

  const [formEdit, setFormEdit] = useState({
    fullName: '', dateOfBirth: '', gender: 'male', classId: '', address: '', status: 'active',
    parentFullName: '', parentEmail: '', parentPhone: '',
    needsSpecialAttention: false, specialNote: '',
  });
  const [formEditErrors, setFormEditErrors] = useState({});
  const [editError, setEditError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Success Dialog for single add
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const requestedYearId = new URLSearchParams(location.search).get('yearId') || '';

  const fetchPendingMap = async () => {
    try {
      const res = await get(ENDPOINTS.STUDENTS.CHANGE_REQUESTS_PENDING_MAP);
      setPendingMap(res.data || {});
    } catch { /* silent */ }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [classesRes, currentYearRes, allYearsRes] = await Promise.all([
        getClasses(),
        get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT).catch(() => null),
        get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.HISTORY + '?all=true'),
      ]);

      const activeAY = currentYearRes?.status === 'success' ? currentYearRes.data : null;
      setActiveAcademicYear(activeAY);

      if (requestedYearId) {
        const viewRes = await get(`${ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.HISTORY}?yearId=${requestedYearId}`).catch(() => null);
        const yearRow = viewRes?.status === 'success' ? (Array.isArray(viewRes.data) ? viewRes.data[0] : viewRes.data) : null;
        setViewAcademicYear(yearRow || null);
      } else {
        setViewAcademicYear(activeAY);
      }

      if (allYearsRes?.status === 'success') {
        const historyYears = Array.isArray(allYearsRes.data) ? allYearsRes.data : [];
        const allYears = activeAY ? [activeAY, ...historyYears] : historyYears;
        const uniqueYears = Array.from(new Map(allYears.map(y => [String(y._id), y])).values());
        setAcademicYears(uniqueYears);
      }

      let currentFilterId = yearFilter;
      if (!currentFilterId || currentFilterId === 'active') {
        if (activeAY?._id) {
          currentFilterId = activeAY._id;
          setYearFilter(activeAY._id);
        } else {
          currentFilterId = 'all';
          setYearFilter('all');
        }
      }

      const studentParams = {
        ...(classFilter ? { classId: classFilter } : {}),
        ...(currentFilterId !== 'all' ? { academicYearId: currentFilterId } : {}),
        ...(genderFilter ? { gender: genderFilter } : {}),
      };
      const studentsRes = await getAllStudents(studentParams);
      setStudents(studentsRes?.data || []);
      setClasses(classesRes?.data || []);
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
    fetchPendingMap();
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!hasRole('SchoolAdmin') && !hasRole('SystemAdmin')) {
      navigate('/', { replace: true });
      return;
    }
    fetchData();
  }, [navigate, user, hasRole, isInitializing, requestedYearId, yearFilter, classFilter, genderFilter]); // eslint-disable-line

  const handleOpenAdd = () => {
    setFormAdd({
      parent: { username: '', password: '', fullName: '', email: '', phone: '' },
      student: { fullName: '', dateOfBirth: '', gender: 'male', address: '', avatar: '' },
    });
    setFormAddErrors({});
    setAddError(null);
    setExistingParentFound(null);
    setShowParentConfirm(false);
    setIsParentInfoLocked(false);
    setOpenAdd(true);
  };

  const handleCheckExistingParent = async (rawPhone) => {
    const phone = String(rawPhone || '').replace(/\D/g, '');
    if (!PHONE_REGEX.test(phone)) return;
    try {
      setCheckingParentPhone(true);
      const res = await get(`${ENDPOINTS.STUDENTS.CHECK_PARENT_PHONE}?phone=${phone}`);
      if (res?.exists && res?.data) {
        setExistingParentFound(res.data);
        setShowParentConfirm(true);
      } else {
        setExistingParentFound(null);
        setIsParentInfoLocked(false);
      }
    } catch {
      setExistingParentFound(null);
    } finally {
      setCheckingParentPhone(false);
    }
  };

  const handleConfirmExistingParent = () => {
    if (!existingParentFound) return;
    setFormAdd((prev) => ({
      ...prev,
      parent: {
        ...prev.parent,
        fullName: existingParentFound.fullName || prev.parent.fullName,
        email: existingParentFound.email || prev.parent.email,
        phone: existingParentFound.phone || prev.parent.phone,
      },
    }));
    setIsParentInfoLocked(true);
    setShowParentConfirm(false);
  };

  const handleAddImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingImage(true);
    setCtxError(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_AVATAR, formData);
      const url = response?.data?.url;
      if (url) {
        setFormAdd((prev) => ({ ...prev, student: { ...prev.student, avatar: url } }));
      }
    } catch (err) {
      setCtxError(err?.data?.message || err.message || 'Tải ảnh lên thất bại');
    } finally {
      setUploadingImage(false);
      if (addImageInputRef.current) addImageInputRef.current.value = '';
    }
  };

  const handleSubmitAdd = async (forceUpdate = false) => {
    setCtxError(null);
    const errs = {};
    if (!isValidPhone(formAdd.parent.phone)) errs.parentPhone = 'Số điện thoại phải 10–11 chữ số';
    if (!(formAdd.parent.fullName || '').trim()) errs.parentFullName = 'Vui lòng nhập họ tên phụ huynh';
    if (!isValidEmail(formAdd.parent.email)) errs.parentEmail = 'Email không hợp lệ';
    if (!(formAdd.student.fullName || '').trim()) errs.studentFullName = 'Vui lòng nhập họ tên học sinh';
    if (!formAdd.student.dateOfBirth) errs.studentDateOfBirth = 'Vui lòng chọn ngày sinh';
    else if (new Date(formAdd.student.dateOfBirth) >= new Date()) errs.studentDateOfBirth = 'Ngày sinh phải nhỏ hơn ngày hiện tại';
    if (Object.keys(errs).length) {
      setFormAddErrors(errs);
      return;
    }
    setFormAddErrors({});
    setAddError(null);
    try {
      const payload = {
        ...formAdd,
        parent: {
          ...formAdd.parent,
          username: (formAdd.parent.phone || '').trim(),
        },
        student: {
          ...formAdd.student,
          status: 'active',
          forceUpdate
        },
      };
      const res = await createStudentWithParent(payload);
      
      if (res?.duplicateDetected) {
        setDuplicateData([{ rowIndex: 'Thủ công', studentName: formAdd.student.fullName, parentName: formAdd.parent.fullName, phone: formAdd.parent.phone }]);
        setShowDuplicateDialog(true);
        return;
      }

      setOpenAdd(false);
      fetchData();
      
      if (res?.isNewParent && res?.generatedPassword) {
        setSuccessData({
          username: res.parentUser.username,
          password: res.generatedPassword,
          fullName: res.parentUser.fullName,
          phone: res.parentUser.phone
        });
        setShowSuccessDialog(true);
      } else {
        toast.success('Lưu học sinh thành công');
      }
    } catch (err) {
      setAddError(err?.message || 'Tạo học sinh thất bại');
    }
  };

  const downloadImportResults = async (results) => {
    if (!results || results.length === 0) return;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('KetQuaImport');

    worksheet.columns = [
      { header: 'Họ tên học sinh', key: 'studentName', width: 25 },
      { header: 'Họ tên phụ huynh', key: 'parentName', width: 25 },
      { header: 'Số điện thoại', key: 'phone', width: 15 },
      { header: 'Tên đăng nhập', key: 'username', width: 20 },
      { header: 'Mật khẩu tạm', key: 'password', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 25 },
    ];

    results.forEach(item => worksheet.addRow(item));
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Ket_qua_import_tai_khoan_${new Date().toLocaleDateString()}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportExcel = async (e, allowUnassignedClass = false) => {
    const file = e?.target?.files?.[0] || pendingImportFile;
    if (!file) return;
    setPendingImportFile(file);
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dryRun', true); // Bước Xem trước
      formData.append('allowUnassignedClass', allowUnassignedClass);
      const res = await postFormData(ENDPOINTS.STUDENTS.IMPORT_WITH_PARENT_EXCEL, formData);
      
      if (res?.status === 'success') {
        setPreviewData(res.data.previewData || []);
        setOpenPreview(true);
      } else {
        toast.error(res?.message || 'Không thể đọc dữ liệu file');
      }
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi kiểm tra file Excel');
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const confirmImport = async (arg1, arg2) => {
    let forceUpdate = false;
    let skipDuplicates = false;
    let selectedRowIndexes = null;
    let allowUnassignedClass = false;

    if (typeof arg1 === 'object' && arg1 !== null) {
      forceUpdate = arg1.forceUpdate ?? false;
      skipDuplicates = arg1.skipDuplicates ?? false;
      selectedRowIndexes = arg1.selectedRowIndexes || null;
      allowUnassignedClass = arg1.allowUnassignedClass ?? false;
    } else {
      forceUpdate = arg1 ?? false;
      skipDuplicates = arg2 ?? false;
    }

    if (duplicateData?.[0]?.rowIndex === 'Thủ công') {
      setShowDuplicateDialog(false);
      if (forceUpdate) handleSubmitAdd(true);
      return;
    }

    if (!pendingImportFile) return;
    setOpenPreview(false); // Đóng preview nếu đang mở
    setShowDuplicateDialog(false);
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', pendingImportFile);
      formData.append('forceUpdate', forceUpdate);
      formData.append('skipDuplicates', skipDuplicates);
      formData.append('allowUnassignedClass', allowUnassignedClass);
      if (selectedRowIndexes) {
        formData.append('selectedRowIndexes', JSON.stringify(selectedRowIndexes));
      }

      const res = await postFormData(ENDPOINTS.STUDENTS.IMPORT_WITH_PARENT_EXCEL, formData);
      
      if (res?.status === 'warning') {
        setDuplicateData(res.data.duplicates);
        setShowDuplicateDialog(true);
      } else {
        const data = res?.data || {};
        setImportResult({
          createdStudents: data.createdStudents || 0,
          createdParents: data.createdParents || 0,
          linkedExistingParents: data.linkedExistingParents || 0,
          errors: Array.isArray(data.errors) ? data.errors : [],
          importResults: data.importResults || []
        });
        setOpenImportResult(true);
        fetchData();
      }
    } catch (err) {
      toast.error(err?.message || 'Thao tác thất bại');
    } finally {
      setImporting(false);
      // Giữ pendingImportFile để nếu user cần confirm trùng lặp sau bước này
    }
  };

  const handleOpenEdit = (row) => {
    setSelectedStudent(row);
    const d = row.dateOfBirth ? new Date(row.dateOfBirth) : null;
    setFormEdit({
      fullName: row.fullName || '',
      dateOfBirth: d ? d.toISOString().slice(0, 10) : '',
      gender: row.gender || 'male',
      classId: row.classId?._id || row.classId || '',
      address: row.address || '',
      status: row.status || 'active',
      parentFullName: row.parentId?.fullName || '',
      parentEmail: row.parentId?.email || '',
      parentPhone: row.parentId?.phone || row.parentPhone || row.phone || '',
      needsSpecialAttention: row.needsSpecialAttention || false,
      specialNote: row.specialNote || '',
    });
    setFormEditErrors({});
    setEditError(null);
    setOpenEdit(true);
  };

  const handleSubmitEdit = async () => {
    if (!selectedStudent?._id) return;
    setCtxError(null);
    const err = {};
    if (!(formEdit.fullName || '').trim()) err.fullName = 'Vui lòng nhập họ tên học sinh';
    if (!formEdit.dateOfBirth) err.dateOfBirth = 'Vui lòng chọn ngày sinh';
    else if (new Date(formEdit.dateOfBirth) >= new Date()) err.dateOfBirth = 'Ngày sinh phải nhỏ hơn ngày hiện tại';
    if (formEdit.parentEmail && !isValidEmail(formEdit.parentEmail)) err.parentEmail = 'Email không hợp lệ';
    if (formEdit.parentPhone && !isValidPhone(formEdit.parentPhone)) err.parentPhone = 'SĐT phụ huynh 10–11 chữ số';
    if (Object.keys(err).length) {
      setFormEditErrors(err);
      return;
    }
    setFormEditErrors({});
    setEditError(null);
    try {
      const payload = {
        fullName: formEdit.fullName,
        dateOfBirth: formEdit.dateOfBirth,
        gender: formEdit.gender,
        address: formEdit.address,
        status: formEdit.status,
        parentFullName: formEdit.parentFullName,
        parentPhone: formEdit.parentPhone,
        needsSpecialAttention: formEdit.needsSpecialAttention,
        specialNote: formEdit.specialNote,
      };
      if (formEdit.parentEmail) payload.parentEmail = formEdit.parentEmail;
      await updateStudent(selectedStudent._id, payload);
      setOpenEdit(false);
      setSelectedStudent(null);
      fetchData();
    } catch (err) {
      setEditError(err?.message || 'Lỗi khi cập nhật học sinh');
    }
  };

  const handleOpenDelete = (row) => {
    setSelectedStudent(row);
    setDeleteError(null);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedStudent?._id) return;
    setCtxError(null);
    setDeleteError(null);
    try {
      await deleteStudent(selectedStudent._id);
      setOpenDelete(false);
      setSelectedStudent(null);
      fetchData();
    } catch (err) {
      setDeleteError(err?.message || 'Xóa học sinh thất bại');
    }
  };

  const openReqView = async (student) => {
    setReqViewStudent(student);
    setReqViewData([]);
    setReqViewLoading(true);
    try {
      const res = await get(`${ENDPOINTS.STUDENTS.CHANGE_REQUESTS}?status=pending`);
      const filtered = (res.data || []).filter(r => String(r.studentId?._id || r.studentId) === String(student._id));
      setReqViewData(filtered);
    } catch { setReqViewData([]); }
    finally { setReqViewLoading(false); }
  };

  const handleResolveRequest = async (reqId) => {
    setResolvingId(reqId);
    try {
      await patch(ENDPOINTS.STUDENTS.CHANGE_REQUEST_RESOLVE(reqId), {});
      setReqViewData(prev => prev.filter(r => r._id !== reqId));
      setPendingMap(prev => {
        const sid = String(reqViewStudent._id);
        const newCount = (prev[sid] || 1) - 1;
        const next = { ...prev };
        if (newCount <= 0) delete next[sid]; else next[sid] = newCount;
        return next;
      });
      toast.success('Đã giải quyết yêu cầu');
    } catch (err) {
      toast.error(err.message || 'Thao tác thất bại');
    } finally {
      setResolvingId(null);
    }
  };

  const filteredStudents = students.filter((s) => {
    // Search filter
    const matchSearch = !searchTerm || (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
      || (s.parentId?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
      || (s.studentCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Year filter
    const sYearId = s.academicYearId?._id || s.academicYearId || s.classId?.academicYearId?._id || s.classId?.academicYearId;
    const matchYear = !yearFilter || yearFilter === 'all' || yearFilter === 'active' || String(sYearId) === String(yearFilter);
    
    // Class filter
    const sClassId = s.classId?._id || s.classId;
    const matchClass = !classFilter || classFilter === 'all' || String(sClassId) === String(classFilter);
    
    // Gender filter
    const matchGender = !genderFilter || genderFilter === 'all' || String(s.gender) === String(genderFilter);
    
    return matchSearch && matchYear && matchClass && matchGender;
  });

  const formatDate = (d) => {
    if (!d) return '—';
    const x = new Date(d);
    return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`;
  };

  const getAcademicYearLabel = (student) => {
    const yearId = student.academicYearId?._id || student.academicYearId || student.classId?.academicYearId?._id || student.classId?.academicYearId;
    if (!yearId) return '—';
    const yearObj = academicYears.find(y => String(y._id) === String(yearId));
    return yearObj?.yearName || student.academicYearId?.yearName || student.classId?.academicYearId?.yearName || '—';
  };

  // const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="primary" gutterBottom>
          Quản lý học sinh
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Danh sách toàn bộ học sinh trong hệ thống. Bạn có thể lọc theo niên khóa để xem chi tiết.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={0}
          onChange={(_, v) => { if (v === 1) navigate('/school-admin/students/health-report'); }}
          sx={{ px: 1, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13 }, '& .Mui-selected': { color: '#6366f1' }, '& .MuiTabs-indicator': { bgcolor: '#6366f1' } }}
        >
          <Tab icon={<PeopleAltIcon fontSize="small" />} iconPosition="start" label="Danh sách học sinh" />
        </Tabs>
      </Paper>

      <Paper elevation={1} sx={{ borderRadius: 2, p: 3 }}>
        <ImportExcelSection
          importInputRef={importInputRef}
          onDownloadTemplate={downloadTemplateHelper}
          onImportExcel={handleImportExcel}
          importing={importing}
        />

        <StudentFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          yearFilter={yearFilter}
          setYearFilter={setYearFilter}
          academicYears={academicYears}
          classFilter={classFilter}
          setClassFilter={setClassFilter}
          genderFilter={genderFilter}
          setGenderFilter={setGenderFilter}
          classes={classes}
          onRefresh={fetchData}
          onAddStudent={handleOpenAdd}
          totalCount={filteredStudents.length}
          loading={loading}
          ctxLoading={ctxLoading}
        />

        {loading ? (
          <Stack alignItems="center" py={4}><CircularProgress /></Stack>
        ) : (
          <>
            <StudentTable
              students={filteredStudents}
              pendingMap={pendingMap}
              formatDate={formatDate}
              formatPhoneDisplay={formatPhoneDisplay}
              getAcademicYearLabel={getAcademicYearLabel}
              GENDER_OPTIONS={GENDER_OPTIONS}
              onOpenReqView={openReqView}
              onOpenEdit={handleOpenEdit}
              onOpenDelete={handleOpenDelete}
              onOpenDetail={(row) => navigate(`/school-admin/students/${row._id}/detail`)}
            />
            {!loading && filteredStudents.length === 0 && (
              <Typography color="text.secondary" align="center" py={3}>Chưa có học sinh nào.</Typography>
            )}
          </>
        )}
      </Paper>

      {/* Main Dialogs */}
      <AddStudentDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        formAdd={formAdd}
        setFormAdd={setFormAdd}
        formAddErrors={formAddErrors}
        addError={addError}
        setAddError={setAddError}
        checkingParentPhone={checkingParentPhone}
        isParentInfoLocked={isParentInfoLocked}
        activeAcademicYear={activeAcademicYear}
        GENDER_OPTIONS={GENDER_OPTIONS}
        uploadingImage={uploadingImage}
        addImageInputRef={addImageInputRef}
        onCheckExistingParent={handleCheckExistingParent}
        onAddImageChange={handleAddImageChange}
        onSubmit={() => handleSubmitAdd(false)}
        ctxLoading={ctxLoading}
      />

      <EditStudentDialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        formEdit={formEdit}
        setFormEdit={setFormEdit}
        formEditErrors={formEditErrors}
        editError={editError}
        setEditError={setEditError}
        classes={classes}
        GENDER_OPTIONS={GENDER_OPTIONS}
        onSubmit={handleSubmitEdit}
        ctxLoading={ctxLoading}
      />

      <ChangeRequestDialog
        student={reqViewStudent}
        requests={reqViewData}
        loading={reqViewLoading}
        onClose={() => setReqViewStudent(null)}
        onResolve={handleResolveRequest}
        resolvingId={resolvingId}
      />

      {/* Extracted Helper Dialogs */}
      <DeleteConfirmDialog 
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        studentName={selectedStudent?.fullName}
        onDelete={handleConfirmDelete}
        loading={ctxLoading}
        error={deleteError}
      />

      <ParentMergeConfirmDialog 
        open={showParentConfirm}
        onClose={() => setShowParentConfirm(false)}
        phone={formAdd.parent.phone}
        parentName={existingParentFound?.fullName}
        onConfirm={handleConfirmExistingParent}
      />

      <PreviewImportDialog 
        open={openPreview}
        onClose={() => { setOpenPreview(false); setPendingImportFile(null); }}
        data={previewData}
        onConfirm={(args) => confirmImport(args)}
        loading={importing}
        onRevalidate={(allowUnassignedClass) => handleImportExcel(null, allowUnassignedClass)}
      />

      <ImportResultDialog 
        open={openImportResult}
        onClose={() => setOpenImportResult(false)}
        result={importResult}
        onDownloadResults={() => downloadImportResults(importResult?.importResults)}
      />

      <DuplicateConfirmDialog 
        open={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        data={duplicateData}
        onConfirm={confirmImport}
      />

      <SuccessAccountDialog 
        open={showSuccessDialog} 
        onClose={() => setShowSuccessDialog(false)} 
        data={successData} 
        roleName="Phụ huynh"
      />
    </Box>
  );
}

export default ManageStudents;
