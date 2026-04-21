import {
  PeopleAlt as PeopleAltIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';
import { ENDPOINTS, get, patch, postFormData } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

// Sub-components
import AddStudentDialog from './StudentManagement/AddStudentDialog';
import ChangeRequestDialog from './StudentManagement/ChangeRequestDialog';
import EditStudentDialog from './StudentManagement/EditStudentDialog';
import { handleDownloadTemplate as downloadTemplateHelper } from './StudentManagement/excelTemplateHelper';
import ImportExcelSection from './StudentManagement/ImportExcelSection';
import StudentFilter from './StudentManagement/StudentFilter';
import StudentTable from './StudentManagement/StudentTable';

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
  const { user, hasRole, logout, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();
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

  const [formEdit, setFormEdit] = useState({
    fullName: '', dateOfBirth: '', gender: 'male', classId: '', address: '', status: 'active',
    parentFullName: '', parentEmail: '', parentPhone: '',
    needsSpecialAttention: false, specialNote: '',
  });
  const [formEditErrors, setFormEditErrors] = useState({});
  const [editError, setEditError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

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

      // 1. Luôn lấy năm học ACTIVE hiện tại của hệ thống để gán khi thêm học sinh mới
      const activeAY = currentYearRes?.status === 'success' ? currentYearRes.data : null;
      setActiveAcademicYear(activeAY);

      // 2. Xác định năm học đang XEM (VIEW) - có thể là năm cũ hoặc năm active
      if (requestedYearId) {
        // Nếu URL có yearId, tìm trong danh sách history hoặc fetch riêng
        const viewRes = await get(`${ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.HISTORY}?yearId=${requestedYearId}`).catch(() => null);
        const yearRow = viewRes?.status === 'success' ? (Array.isArray(viewRes.data) ? viewRes.data[0] : viewRes.data) : null;
        setViewAcademicYear(yearRow || null);
      } else {
        // Nếu không có yearId trong URL, mặc định view năm active
        setViewAcademicYear(activeAY);
      }

      // Xóa bỏ logic cũ gây nhầm lẫn

      if (allYearsRes?.status === 'success') {
        const historyYears = Array.isArray(allYearsRes.data) ? allYearsRes.data : [];
        // Gộp năm active vào danh sách dropdown nếu nó chưa có trong history
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
  }, [navigate, user, hasRole, isInitializing, requestedYearId, yearFilter, classFilter]); // eslint-disable-line

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

  const handleSubmitAdd = async () => {
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
        },
      };
      await createStudentWithParent(payload);
      setOpenAdd(false);
      fetchData();
    } catch (err) {
      setAddError(err?.message || 'Tạo học sinh thất bại');
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await postFormData(ENDPOINTS.STUDENTS.IMPORT_WITH_PARENT_EXCEL, formData);
      const data = res?.data || {};
      setImportResult({
        createdStudents: data.createdStudents || 0,
        createdParents: data.createdParents || 0,
        linkedExistingParents: data.linkedExistingParents || 0,
        errors: Array.isArray(data.errors) ? data.errors : [],
      });
      setOpenImportResult(true);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Import Excel thất bại');
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
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
    const matchSearch = !searchTerm || (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
      || (s.parentId?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
      || (s.studentCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const formatDate = (d) => {
    if (!d) return '—';
    const x = new Date(d);
    return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`;
  };

  const getAcademicYearLabel = (student) => {
    if (student.academicYearId?.yearName) return student.academicYearId.yearName;
    if (student.classId?.academicYearId?.yearName) return student.classId.academicYearId.yearName;
    return 'Chưa xếp lớp';
  };

  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  return (
    <RoleLayout
      menuItems={menuItems}
      activeKey="students"
      onMenuSelect={handleMenuSelect}
      onLogout={logout}
      onViewProfile={() => navigate('/profile')}
      userName={user?.fullName || user?.username}
      userRole="SchoolAdmin"
    >
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
        onSubmit={handleSubmitAdd}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Xác nhận xóa học sinh</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa học sinh <strong>{selectedStudent?.fullName}</strong>?
            Hành động này không thể hoàn tác.
          </Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Hủy</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={ctxLoading}>
            {ctxLoading ? <CircularProgress size={24} /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Parent Existing Confirm */}
      <Dialog open={showParentConfirm} onClose={() => setShowParentConfirm(false)}>
        <DialogTitle>Phụ huynh đã tồn tại</DialogTitle>
        <DialogContent>
          <Typography>
            Số điện thoại <strong>{formAdd.parent.phone}</strong> đã được đăng ký bởi phụ huynh:
            <br />
            <strong>{existingParentFound?.fullName}</strong> ({existingParentFound?.email})
            <br /><br />
            Bạn có muốn sử dụng lại tài khoản này cho học sinh mới không?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowParentConfirm(false)}>Không, nhập số khác</Button>
          <Button onClick={handleConfirmExistingParent} variant="contained" color="primary">Sử dụng tài khoản này</Button>
        </DialogActions>
      </Dialog>

      {/* Import Result Dialog */}
      <Dialog open={openImportResult} onClose={() => setOpenImportResult(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Kết quả import Excel</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <Alert severity="success">
              Tạo học sinh thành công: <strong>{importResult?.createdStudents || 0}</strong>
            </Alert>
            <Alert severity="info">
              Phụ huynh tạo mới: <strong>{importResult?.createdParents || 0}</strong> - Gán phụ huynh đã có: <strong>{importResult?.linkedExistingParents || 0}</strong>
            </Alert>
            {(importResult?.errors || []).length > 0 && (
              <Alert severity="warning">
                Có {(importResult?.errors || []).length} dòng lỗi:
                <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                  {(importResult?.errors || []).slice(0, 8).map((err, i) => (
                    <li key={i}>
                      <Typography variant="caption">{err}</Typography>
                    </li>
                  ))}
                </Box>
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportResult(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}

export default ManageStudents;
