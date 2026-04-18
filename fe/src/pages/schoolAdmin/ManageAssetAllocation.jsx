import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Popover,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { del, get, patch, post, postFormData, put, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_INFO = {
  pending_confirmation: { label: 'Chờ xác nhận',  color: 'warning' },
  active:               { label: 'Đang sử dụng',  color: 'success' },
  transferred:          { label: 'Đã chuyển lớp', color: 'info' },
  returned:             { label: 'Đã thu hồi',    color: 'default' },
};

const TARGET_USER_OPTIONS = ['Trẻ', 'Giáo viên', 'Dùng chung'];

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN');
}

let _keyCounter = 1;
const nextKey = () => _keyCounter++;

const emptyAssetRow  = () => ({ _key: nextKey(), category: '', assetCode: '', name: '', unit: 'Cái', quantity: 1, targetUser: 'Trẻ', notes: '' });
const emptySeparator = (name = '') => ({ _key: nextKey(), _isSeparator: true, categoryName: name });

// Chuyển mảng flat (có separator) → mảng assets DB (category field)
function flatToAssets(flat) {
  let cat = '';
  return flat
    .filter(r => r.name?.trim() || r._isSeparator)
    .reduce((acc, r) => {
      if (r._isSeparator) { cat = r.categoryName || ''; return acc; }
      // eslint-disable-next-line no-unused-vars
      const { _key, _isSeparator, ...rest } = r;
      acc.push({ ...rest, category: cat });
      return acc;
    }, []);
}

// Chuyển mảng assets DB → mảng flat có separator
function assetsToFlat(assets) {
  const flat = [];
  let lastCat = null;
  for (const a of (assets || [])) {
    if (a.category !== lastCat) {
      flat.push(emptySeparator(a.category || ''));
      lastCat = a.category;
    }
    flat.push({ _key: nextKey(), ...a });
  }
  return flat.length ? flat : [emptyAssetRow()];
}

const emptyForm = () => ({
  classId:            '',
  className:          '',
  teacherName:        '',
  teacherPosition:    'Giáo viên',
  handoverByName:     '',
  handoverByPosition: 'Hiệu trưởng',
  handoverDate:       new Date().toISOString().slice(0, 10),
  academicYear:       '',
  assets:             [emptySeparator(), emptyAssetRow()],
  extraAssets:        [],
  notes:              '',
});

const emptyTransferForm = () => ({
  toClassId:     '',
  toClassName:   '',
  toTeacherName: '',
  transferDate:  new Date().toISOString().slice(0, 10),
  note:          '',
});


// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title || 'Xác nhận'}</DialogTitle>
      <DialogContent><Typography>{message}</Typography></DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>Hủy</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={18} /> : 'Xác nhận'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Asset Row Editor ─────────────────────────────────────────────────────────
const AssetRowEditor = memo(function AssetRowEditor({ rows, onChange, onMoveToOther, moveLabel }) {
  const dragIdx = useRef(null);
  const [dropIdx, setDropIdx] = useState(null);

  const update  = (i, field, value) => onChange(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const remove  = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const addRow  = () => onChange([...rows, emptyAssetRow()]);
  const addSep  = () => onChange([...rows, emptySeparator()]);

  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragOver  = (e, i) => { e.preventDefault(); setDropIdx(i); };
  const onDragLeave = () => setDropIdx(null);
  const onDragEnd   = () => { dragIdx.current = null; setDropIdx(null); };
  const onDrop      = (e, i) => {
    e.preventDefault();
    setDropIdx(null);
    const from = dragIdx.current;
    if (from === null || from === i) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(i, 0, item);
    onChange(next);
    dragIdx.current = null;
  };

  let assetIdx = 0;

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ mb: 1, minWidth: 700 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell sx={{ width: 28, p: 0 }} />
            <TableCell sx={{ width: 40 }}>TT</TableCell>
            <TableCell sx={{ width: 110 }}>Mã TS</TableCell>
            <TableCell>Tên thiết bị *</TableCell>
            <TableCell sx={{ width: 70 }}>ĐVT</TableCell>
            <TableCell sx={{ width: 70 }}>SL</TableCell>
            <TableCell sx={{ width: 120 }}>Đối tượng SD</TableCell>
            <TableCell>Ghi chú</TableCell>
            <TableCell sx={{ width: onMoveToOther ? 68 : 36 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => {
            const isDrop = dropIdx === i;
            const rKey = r._key || i;
            if (r._isSeparator) {
              return (
                <TableRow
                  key={rKey} draggable
                  onDragStart={() => onDragStart(i)} onDragOver={(e) => onDragOver(e, i)}
                  onDragLeave={onDragLeave} onDragEnd={onDragEnd} onDrop={(e) => onDrop(e, i)}
                  sx={{ bgcolor: isDrop ? 'primary.100' : 'primary.50', outline: isDrop ? '2px dashed' : 'none', outlineColor: 'primary.main' }}
                >
                  <TableCell sx={{ p: 0, cursor: 'grab', color: 'text.disabled', textAlign: 'center' }}>
                    <DragIndicatorIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} />
                  </TableCell>
                  <TableCell colSpan={7} sx={{ py: 0.5 }}>
                    <TextField
                      size="small" fullWidth variant="standard"
                      placeholder="Tên danh mục (VD: I. ĐỒ DÙNG)"
                      defaultValue={r.categoryName || ''}
                      onBlur={(e) => update(i, 'categoryName', e.target.value)}
                      InputProps={{ disableUnderline: false, sx: { fontWeight: 'bold', color: 'primary.main', fontSize: 13 } }}
                    />
                  </TableCell>
                  <TableCell sx={{ p: 0.5 }}>
                    <IconButton size="small" color="error" onClick={() => remove(i)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            }
            assetIdx++;
            return (
              <TableRow
                key={rKey} draggable
                onDragStart={() => onDragStart(i)} onDragOver={(e) => onDragOver(e, i)}
                onDragLeave={onDragLeave} onDragEnd={onDragEnd} onDrop={(e) => onDrop(e, i)}
                sx={{ outline: isDrop ? '2px dashed' : 'none', outlineColor: 'primary.main', bgcolor: isDrop ? 'action.hover' : undefined }}
              >
                <TableCell sx={{ p: 0, cursor: 'grab', color: 'text.disabled', textAlign: 'center' }}>
                  <DragIndicatorIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} />
                </TableCell>
                <TableCell>{assetIdx}</TableCell>
                <TableCell>
                  <TextField size="small" defaultValue={r.assetCode || ''} onBlur={(e) => update(i, 'assetCode', e.target.value)} sx={{ minWidth: 90 }} />
                </TableCell>
                <TableCell>
                  <TextField size="small" defaultValue={r.name || ''} required onBlur={(e) => update(i, 'name', e.target.value)} sx={{ minWidth: 160 }} />
                </TableCell>
                <TableCell>
                  <TextField size="small" defaultValue={r.unit || 'Cái'} onBlur={(e) => update(i, 'unit', e.target.value)} sx={{ minWidth: 55 }} />
                </TableCell>
                <TableCell>
                  <TextField size="small" type="number" defaultValue={r.quantity ?? 1} onBlur={(e) => update(i, 'quantity', Number(e.target.value))} slotProps={{ htmlInput: { min: 0 } }} sx={{ minWidth: 55 }} />
                </TableCell>
                <TableCell>
                  <Select size="small" value={r.targetUser || 'Trẻ'} onChange={(e) => update(i, 'targetUser', e.target.value)} sx={{ minWidth: 110 }}>
                    {TARGET_USER_OPTIONS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </TableCell>
                <TableCell>
                  <TextField size="small" defaultValue={r.notes || ''} onBlur={(e) => update(i, 'notes', e.target.value)} sx={{ minWidth: 90 }} />
                </TableCell>
                <TableCell sx={{ p: 0.5 }}>
                  <Stack direction="row" gap={0}>
                    {onMoveToOther && (
                      <Tooltip title={moveLabel || 'Chuyển sang mục kia'}>
                        <IconButton size="small" color="primary" onClick={() => onMoveToOther(i, r)}>
                          <SwapHorizIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton size="small" color="error" onClick={() => remove(i)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Stack direction="row" gap={1}>
        <Button size="small" startIcon={<AddIcon />} onClick={addRow}>Thêm thiết bị</Button>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addSep} color="primary">
          + Danh mục
        </Button>
      </Stack>
    </Box>
  );
});

// ─── Print / View Document ────────────────────────────────────────────────────
function AllocationDocument({ allocation, onClose }) {
  if (!allocation) return null;
  const { documentCode, className, teacherName, teacherPosition, handoverByName, handoverByPosition, handoverDate, academicYear, assets, extraAssets, notes } = allocation;

  return (
    <Dialog open fullScreen>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Biên bản bàn giao tài sản — {documentCode}</Typography>
        <Button onClick={onClose} startIcon={<ArrowBackIcon />}>Đóng</Button>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ maxWidth: 860, mx: 'auto', p: 2, fontFamily: 'Times New Roman, serif', fontSize: 14 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 'bold' }}>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 'bold' }}>Độc lập - Tự do - Hạnh phúc</Typography>
            <Box sx={{ borderBottom: '2px solid black', width: 200, mx: 'auto', mb: 1 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 'bold', mt: 2, textTransform: 'uppercase' }}>
              Biên bản bàn giao tài sản lớp mẫu giáo
            </Typography>
            {className && <Typography sx={{ fontWeight: 'bold', fontSize: 14 }}>{className}</Typography>}
            <Typography sx={{ fontStyle: 'italic' }}>Đức Xuân, ngày {formatDate(handoverDate)}</Typography>
          </Box>

          {/* Parties */}
          <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>I/ Thành phần:</Typography>
          <Typography>1. {handoverByName || '____________________'} — Chức vụ: {handoverByPosition}</Typography>
          <Typography>2. {teacherName || '____________________'} — Chức vụ: {teacherPosition}</Typography>

          <Typography sx={{ fontWeight: 'bold', mt: 1, mb: 0.5 }}>II/ Lý do bàn giao:</Typography>
          <Typography>Bàn giao tài sản có trong lớp học{academicYear ? ` năm học ${academicYear}` : ''}.</Typography>

          <Typography sx={{ fontWeight: 'bold', mt: 1, mb: 0.5 }}>III/ Nội dung bàn giao:</Typography>

          {/* Assets table */}
          <Table size="small" sx={{ mb: 2, border: '1px solid #000', '& td,& th': { border: '1px solid #000', py: 0.4, px: 0.8, fontSize: 13 } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.200' }}>
                <TableCell align="center">TT</TableCell>
                <TableCell align="center">Mã số</TableCell>
                <TableCell>Tên thiết bị</TableCell>
                <TableCell align="center">ĐVT</TableCell>
                <TableCell align="center">SL</TableCell>
                <TableCell align="center">Đối tượng SD</TableCell>
                <TableCell>Ghi chú</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                let tt = 0;
                let lastCat = null;
                return assets.map((a, i) => {
                  tt++;
                  const rows = [];
                  if (a.category && a.category !== lastCat) {
                    lastCat = a.category;
                    rows.push(
                      <TableRow key={`cat-${i}`} sx={{ bgcolor: 'grey.100' }}>
                        <TableCell colSpan={7} sx={{ fontWeight: 'bold', fontSize: 13 }}>
                          {a.category}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  rows.push(
                    <TableRow key={i}>
                      <TableCell align="center">{tt}</TableCell>
                      <TableCell align="center">{a.assetCode}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell align="center">{a.unit}</TableCell>
                      <TableCell align="center">{a.quantity}</TableCell>
                      <TableCell align="center">{a.targetUser}</TableCell>
                      <TableCell>{a.notes}</TableCell>
                    </TableRow>
                  );
                  return rows;
                });
              })()}
            </TableBody>
          </Table>

          {/* Bảng thiết bị ngoài thông tư */}
          {extraAssets?.length > 0 && (
            <>
              <Typography sx={{ fontWeight: 'bold', mt: 2, mb: 0.5 }}>
                CÁC THIẾT BỊ TÀI SẢN KHÁC NGOÀI THÔNG TƯ
              </Typography>
              <Table size="small" sx={{ mb: 2, border: '1px solid #000', '& td,& th': { border: '1px solid #000', py: 0.4, px: 0.8, fontSize: 13 } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.200' }}>
                    <TableCell align="center">TT</TableCell>
                    <TableCell>Tên đồ dùng, đồ chơi thiết bị</TableCell>
                    <TableCell align="center">ĐV tính</TableCell>
                    <TableCell align="center">Số lượng</TableCell>
                    <TableCell align="center">Đối tượng sử dụng</TableCell>
                    <TableCell>Ghi chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {extraAssets.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell align="center">{i + 1}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell align="center">{a.unit}</TableCell>
                      <TableCell align="center">{a.quantity}</TableCell>
                      <TableCell align="center">{a.targetUser}</TableCell>
                      <TableCell>{a.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}

          {notes && (
            <Typography sx={{ fontStyle: 'italic', mb: 2 }}>Ghi chú: {notes}</Typography>
          )}

          {/* Signatures */}
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 4, textAlign: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 'bold' }}>XÁC NHẬN NHÀ TRƯỜNG</Typography>
              <Typography sx={{ fontStyle: 'italic', fontSize: 12 }}>(Hiệu trưởng)</Typography>
              <Typography sx={{ mt: 4 }}>{handoverByName}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 'bold' }}>NGƯỜI BÀN GIAO</Typography>
              <Typography sx={{ fontStyle: 'italic', fontSize: 12 }}>&nbsp;</Typography>
              <Typography sx={{ mt: 4 }}>&nbsp;</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 'bold' }}>NGƯỜI NHẬN BÀN GIAO</Typography>
              <Typography sx={{ fontStyle: 'italic', fontSize: 12 }}>(Giáo viên)</Typography>
              <Typography sx={{ mt: 4 }}>{teacherName}</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageAssetAllocation() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const menuItems = useSchoolAdminMenu();
  const userName = user?.fullName || user?.username || 'School Admin';

  const [allocations, setAllocations]   = useState([]);
  const [classes, setClasses]           = useState([]);
  const [allTeachers, setAllTeachers]   = useState([]);
  const [currentAcYear, setCurrentAcYear] = useState('');
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClass, setFilterClass]   = useState('');

  // Dialogs
  const [formOpen, setFormOpen]             = useState(false);
  const [editTarget, setEditTarget]         = useState(null); // null = create
  const [form, setForm]                     = useState(emptyForm());

  const [viewTarget, setViewTarget]         = useState(null);

  const [historyTarget, setHistoryTarget]   = useState(null);

  const [transferOpen, setTransferOpen]     = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferForm, setTransferForm]     = useState(emptyTransferForm());

  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [deleteLoading, setDeleteLoading]   = useState(false);
  const [infoAnchor, setInfoAnchor]         = useState(null); // { el, alloc }

  const [importing, setImporting]           = useState(false);
  const excelInputRef                       = useRef(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadAllocations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterClass)  params.set('classId', filterClass);
      const query = params.toString();
      const res = await get(`${ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS}${query ? '?' + query : ''}`);
      setAllocations(res.data.allocations || []);
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách biên bản.');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS_CLASSES);
      setClasses(res.data.classes || []);
    } catch {
      // silent
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS);
      setAllTeachers((res.data?.teachers || []).map((t) => t.fullName).filter(Boolean));
    } catch {
      // silent
    }
  };

  const loadCurrentAcademicYear = async () => {
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT);
      // API trả về: { status, data: { yearName, ... } }
      const name = res.data?.yearName || '';
      setCurrentAcYear(name);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadClasses();
    loadTeachers();
    loadCurrentAcademicYear();
  }, []);
  useEffect(() => { loadAllocations(); }, [filterStatus, filterClass]);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm(), handoverByName: user?.fullName || '', academicYear: currentAcYear });
    setFormOpen(true);
  };

  const openEdit = (alloc) => {
    setEditTarget(alloc);
    setForm({
      classId:            alloc.classId?._id || alloc.classId || '',
      className:          alloc.className || '',
      teacherName:        alloc.teacherName || '',
      teacherPosition:    alloc.teacherPosition || 'Giáo viên',
      handoverByName:     alloc.handoverByName || '',
      handoverByPosition: alloc.handoverByPosition || 'Hiệu trưởng',
      handoverDate:       alloc.handoverDate ? new Date(alloc.handoverDate).toISOString().slice(0, 10) : '',
      academicYear:       alloc.academicYear || '',
      assets:             assetsToFlat(alloc.assets),
      extraAssets:        alloc.extraAssets?.length ? alloc.extraAssets.map(a => ({ ...a })) : [],
      notes:              alloc.notes || '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.assets.some(a => !a._isSeparator && a.name?.trim())) {
      toast.error('Phải có ít nhất một tài sản với tên.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        assets:      flatToAssets(form.assets),
        extraAssets: (form.extraAssets || []).filter(a => a.name?.trim()),
      };
      if (editTarget) {
        await put(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATION_DETAIL(editTarget._id), payload);
        toast.success('Cập nhật biên bản thành công.');
      } else {
        await post(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS, payload);
        toast.success('Tạo biên bản bàn giao thành công.');
      }
      setFormOpen(false);
      loadAllocations();
    } catch (err) {
      toast.error(err.message || 'Lỗi lưu biên bản.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATION_DETAIL(deleteTarget._id));
      toast.success('Xóa biên bản thành công.');
      setDeleteTarget(null);
      loadAllocations();
    } catch (err) {
      toast.error(err.message || 'Lỗi xóa biên bản.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Transfer ───────────────────────────────────────────────────────────────
  const openTransfer = (alloc) => {
    setTransferTarget(alloc);
    setTransferForm(emptyTransferForm());
    setTransferOpen(true);
  };

  const handleTransfer = async () => {
    if (!transferForm.toClassName && !transferForm.toClassId) {
      toast.error('Vui lòng chọn lớp nhận.');
      return;
    }
    setSaving(true);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATION_TRANSFER(transferTarget._id), transferForm);
      toast.success('Chuyển giao tài sản thành công.');
      setTransferOpen(false);
      loadAllocations();
    } catch (err) {
      toast.error(err.message || 'Lỗi chuyển giao.');
    } finally {
      setSaving(false);
    }
  };

  // ── Download Excel template (server-side, exceljs với styling đầy đủ) ────
  const downloadTemplate = async () => {
    try {
      const { getToken } = await import('../../service/api');
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}${ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS_TEMPLATE}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { toast.error('Không tải được mẫu.'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'mau_tai_san_ban_giao.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Lỗi tải mẫu Excel.');
    }
  };

  // ── Import Excel ───────────────────────────────────────────────────────────
  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await postFormData(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS_PARSE_EXCEL, formData);
      applyImportResult(res);
    } catch (err) {
      toast.error('Lỗi đọc file Excel: ' + (err.message || ''));
    } finally {
      setImporting(false);
    }
  };

  // ── Shared: apply parsed result to form ────────────────────────────────────
  const applyImportResult = (res) => {
    const parsed      = res.data?.assets      || [];
    const parsedExtra = res.data?.extraAssets || [];
    if (!parsed.length && !parsedExtra.length) {
      toast.warning('Không tìm thấy dữ liệu tài sản trong file.');
      if (res.debug) console.warn('[Import Debug]', res.debug);
      return;
    }
    setForm((prev) => ({
      ...prev,
      assets:      parsed.length      ? assetsToFlat(parsed) : prev.assets,
      extraAssets: parsedExtra.length ? parsedExtra          : prev.extraAssets,
    }));
    const msg = [
      parsed.length      ? `${parsed.length} thiết bị theo thông tư`      : '',
      parsedExtra.length ? `${parsedExtra.length} thiết bị ngoài thông tư` : '',
    ].filter(Boolean).join(', ');
    toast.success(`Đã import: ${msg}.`);
  };

  // ── Export Word for one allocation ────────────────────────────────────────
  const downloadWord = async (alloc) => {
    try {
      const { getToken } = await import('../../service/api');
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}${ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATION_EXPORT_WORD(alloc._id)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { toast.error('Không xuất được file Word.'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `bien_ban_ban_giao_${alloc.documentCode || alloc._id}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Lỗi xuất Word.');
    }
  };

  // ── Stable callbacks for AssetRowEditor (avoids memo-busting) ──────────────
  const onAssetsChange      = useCallback((assets)      => setForm((prev) => ({ ...prev, assets })),      []);
  const onExtraAssetsChange = useCallback((extraAssets) => setForm((prev) => ({ ...prev, extraAssets })), []);

  // Chuyển 1 hàng từ "theo thông tư" sang "ngoài thông tư" và ngược lại
  const onMoveAssetToExtra = useCallback((i, row) => {
    const { _isSeparator, categoryName, category, ...clean } = row;
    setForm((prev) => ({
      ...prev,
      assets:      prev.assets.filter((_, idx) => idx !== i),
      extraAssets: [...(prev.extraAssets || []), { ...clean, category: '' }],
    }));
  }, []);

  const onMoveExtraToAsset = useCallback((i, row) => {
    setForm((prev) => ({
      ...prev,
      extraAssets: prev.extraAssets.filter((_, idx) => idx !== i),
      assets:      [...prev.assets, { ...row, category: '' }],
    }));
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <RoleLayout
      menuItems={menuItems}
      activeKey="asset-allocation"
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={createSchoolAdminMenuSelect(navigate)}
    >
      <Box sx={{ p: { xs: 1, md: 3 } }}>
        {/* Title */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>Phân bổ & Bàn giao tài sản</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Tạo biên bản bàn giao
          </Button>
        </Stack>

        {/* Filters */}
        <Stack direction="row" gap={2} mb={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select value={filterStatus} label="Trạng thái" onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="pending_confirmation">Chờ xác nhận</MenuItem>
              <MenuItem value="active">Đang sử dụng</MenuItem>
              <MenuItem value="transferred">Đã chuyển lớp</MenuItem>
              <MenuItem value="returned">Đã thu hồi</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Lọc theo lớp</InputLabel>
            <Select value={filterClass} label="Lọc theo lớp" onChange={(e) => setFilterClass(e.target.value)}>
              <MenuItem value="">Tất cả lớp</MenuItem>
              {classes.map((c) => <MenuItem key={c._id} value={c._id}>{c.className}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : allocations.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Chưa có biên bản bàn giao nào.</Typography>
          </Paper>
        ) : (
          <Paper sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  {['Mã biên bản','Lớp','Người bàn giao','Giáo viên nhận','Ngày bàn giao','Năm học','Số TS','Trạng thái','Thao tác'].map((h) => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const grouped = {};
                  for (const alloc of allocations) {
                    const key = alloc.classId?.gradeId?._id ? String(alloc.classId.gradeId._id) : '__none__';
                    const gradeName = alloc.classId?.gradeId?.gradeName || 'Chưa phân khối';
                    if (!grouped[key]) grouped[key] = { gradeName, items: [] };
                    grouped[key].items.push(alloc);
                  }
                  const groups = Object.values(grouped).sort((a, b) => a.gradeName.localeCompare(b.gradeName, 'vi'));
                  return groups.flatMap((group, gi) => [
                    <TableRow key={`gh-${gi}`}>
                      <TableCell colSpan={9} sx={{
                        py: 0.75, pl: 2.5, fontWeight: 700, fontSize: 13,
                        bgcolor: '#dbeafe', color: '#1d4ed8',
                        borderTop: gi > 0 ? '2px solid #93c5fd' : 'none',
                      }}>
                        {group.gradeName} — {group.items.length} biên bản
                      </TableCell>
                    </TableRow>,
                    ...group.items.map((alloc) => {
                  const si = STATUS_INFO[alloc.status] || STATUS_INFO.active;
                  return (
                    <TableRow key={alloc._id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{alloc.documentCode}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{alloc.className || '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{alloc.handoverByName || '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{alloc.teacherName || '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(alloc.handoverDate)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{alloc.academicYear || '—'}</TableCell>
                      <TableCell align="center">{alloc.assets?.length || 0}</TableCell>
                      <TableCell>
                        <Chip label={si.label} color={si.color} size="small" />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" gap={0.5}>
                          <Tooltip title="Thông tin tạo & xác nhận">
                            <IconButton size="small" onClick={(e) => setInfoAnchor({ el: e.currentTarget, alloc })}>
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xem biên bản">
                            <IconButton size="small" onClick={() => setViewTarget(alloc)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Tải về Word (.docx)">
                            <IconButton size="small" color="primary" onClick={() => downloadWord(alloc)}>
                              <FileDownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Lịch sử chuyển giao">
                            <IconButton size="small" onClick={() => setHistoryTarget(alloc)}>
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {alloc.status !== 'returned' && (
                            <>
                              <Tooltip title="Chỉnh sửa">
                                <IconButton size="small" onClick={() => openEdit(alloc)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Chuyển lớp">
                                <IconButton size="small" color="warning" onClick={() => openTransfer(alloc)}>
                                  <SwapHorizIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                    })
                  ]);
                })()}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>

      {/* ── Info Popover ─────────────────────────────────────────────────────── */}
      <Popover
        open={Boolean(infoAnchor)}
        anchorEl={infoAnchor?.el}
        onClose={() => setInfoAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 2, minWidth: 240 } } }}
      >
        {infoAnchor && (() => {
          const a = infoAnchor.alloc;
          return (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>Thông tin biên bản</Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">Người tạo</Typography>
                <Typography variant="body2">{a.createdBy?.fullName || a.createdBy?.username || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Ngày tạo</Typography>
                <Typography variant="body2">{a.createdAt ? new Date(a.createdAt).toLocaleString('vi-VN') : '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Người xác nhận</Typography>
                <Typography variant="body2">
                  {a.confirmedBy?.fullName || a.confirmedBy?.username || <span style={{ color: '#ed6c02' }}>Chưa xác nhận</span>}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Ngày xác nhận bàn giao</Typography>
                <Typography variant="body2">
                  {a.confirmedAt
                    ? new Date(a.confirmedAt).toLocaleString('vi-VN')
                    : <span style={{ color: '#ed6c02' }}>Chưa xác nhận</span>}
                </Typography>
              </Box>
            </Stack>
          );
        })()}
      </Popover>

      {/* ── Create / Edit Form Dialog ───────────────────────────────────────── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="lg" fullWidth fullScreen={isMobile}>
        <DialogTitle>{editTarget ? 'Chỉnh sửa biên bản bàn giao' : 'Tạo biên bản bàn giao tài sản'}</DialogTitle>
        <DialogContent dividers>
          <Stack gap={2}>
            {/* Row 1: Lớp + Năm học */}
            <Stack direction="row" gap={2} flexWrap="wrap">
              <Autocomplete
                options={classes}
                getOptionLabel={(o) => (typeof o === 'string' ? o : o.className)}
                value={classes.find((c) => c._id === form.classId) || null}
                onChange={(_, v) => {
                  const teacherNames = v?.teachers?.join(', ') || '';
                  setForm({
                    ...form,
                    classId: v?._id || '',
                    className: v?.className || '',
                    teacherName: teacherNames,
                  });
                }}
                renderInput={(params) => <TextField {...params} label="Lớp học" size="small" />}
                sx={{ flex: 1, minWidth: 200 }}
                freeSolo={false}
              />
              <TextField
                label="Năm học"
                size="small"
                value={form.academicYear}
                InputProps={{ readOnly: true }}
                sx={{ width: 140 }}
              />
              <TextField
                label="Ngày bàn giao"
                type="date"
                size="small"
                value={form.handoverDate}
                onChange={(e) => setForm({ ...form, handoverDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 180 }}
              />
            </Stack>

            {/* Row 2: Người giao */}
            <Typography variant="subtitle2" color="text.secondary">Người bàn giao</Typography>
            <Stack direction="row" gap={2} flexWrap="wrap">
              <TextField
                label="Họ và tên người giao"
                size="small"
                value={form.handoverByName}
                onChange={(e) => setForm({ ...form, handoverByName: e.target.value })}
                sx={{ flex: 1, minWidth: 200 }}
                helperText="Tự động lấy từ tài khoản đang đăng nhập"
              />
              <TextField
                label="Chức vụ người giao"
                size="small"
                value={form.handoverByPosition}
                onChange={(e) => setForm({ ...form, handoverByPosition: e.target.value })}
                sx={{ flex: 1, minWidth: 160 }}
              />
            </Stack>

            {/* Row 3: Người nhận */}
            <Typography variant="subtitle2" color="text.secondary">Giáo viên nhận bàn giao</Typography>
            <Stack direction="row" gap={2} flexWrap="wrap">
              <Autocomplete
                options={allTeachers}
                value={form.teacherName}
                onChange={(_, v) => setForm({ ...form, teacherName: v || '' })}
                onInputChange={(_, v) => setForm({ ...form, teacherName: v })}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Họ và tên giáo viên"
                    size="small"
                    helperText="Tự động lấy từ lớp đã chọn, hoặc chọn từ danh sách"
                  />
                )}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <TextField
                label="Chức vụ"
                size="small"
                value={form.teacherPosition}
                onChange={(e) => setForm({ ...form, teacherPosition: e.target.value })}
                sx={{ flex: 1, minWidth: 160 }}
              />
            </Stack>

            <Divider />

            {/* Assets theo thông tư */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography variant="subtitle2" fontWeight="bold">Danh sách tài sản bàn giao (theo thông tư)</Typography>
              <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                <Tooltip title="Tải file Excel mẫu đúng định dạng (2 sheet: Theo thông tư / Ngoài thông tư)">
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<DownloadIcon />}
                    onClick={downloadTemplate}
                  >
                    Tải mẫu Excel
                  </Button>
                </Tooltip>
                <input ref={excelInputRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={handleExcelImport} />
                <Tooltip title="Import từ file Excel (.xlsx) — dùng mẫu tải về">
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    startIcon={importing ? <CircularProgress size={14} /> : <UploadFileIcon />}
                    onClick={() => excelInputRef.current?.click()}
                    disabled={importing}
                  >
                    {importing ? 'Đang đọc...' : 'Excel'}
                  </Button>
                </Tooltip>
              </Stack>
            </Stack>
            <AssetRowEditor
              rows={form.assets}
              onChange={onAssetsChange}
              onMoveToOther={onMoveAssetToExtra}
              moveLabel="Chuyển sang ngoài thông tư"
            />

            <Divider />

            {/* Thiết bị ngoài thông tư */}
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={1}>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  Các thiết bị tài sản khác ngoài thông tư
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tùy chọn — để trống nếu không có
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                startIcon={<AddIcon />}
                onClick={() => setForm({ ...form, extraAssets: [...(form.extraAssets || []), emptyAssetRow()] })}
              >
                Thêm mục
              </Button>
            </Stack>
            {(form.extraAssets?.length > 0) && (
              <AssetRowEditor
                rows={form.extraAssets}
                onChange={onExtraAssetsChange}
                onMoveToOther={onMoveExtraToAsset}
                moveLabel="Chuyển sang theo thông tư"
              />
            )}

            <Divider />
            <TextField
              label="Ghi chú chung"
              multiline
              minRows={2}
              size="small"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : (editTarget ? 'Cập nhật' : 'Tạo biên bản')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── View Document ───────────────────────────────────────────────────── */}
      {viewTarget && <AllocationDocument allocation={viewTarget} onClose={() => setViewTarget(null)} />}

      {/* ── Transfer Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Chuyển giao tài sản sang lớp khác</DialogTitle>
        <DialogContent dividers>
          <Stack gap={2} pt={1}>
            <Typography variant="body2" color="text.secondary">
              Đang chuyển từ lớp: <strong>{transferTarget?.className || '—'}</strong> (GV: {transferTarget?.teacherName || '—'})
            </Typography>
            <Autocomplete
              options={classes}
              getOptionLabel={(o) => (typeof o === 'string' ? o : o.className)}
              value={classes.find((c) => c._id === transferForm.toClassId) || null}
              onChange={(_, v) => setTransferForm({ ...transferForm, toClassId: v?._id || '', toClassName: v?.className || '' })}
              renderInput={(params) => <TextField {...params} label="Lớp nhận *" size="small" />}
              freeSolo={false}
            />
            <TextField
              label="Tên lớp nhận (nếu nhập tay)"
              size="small"
              value={transferForm.toClassName}
              onChange={(e) => setTransferForm({ ...transferForm, toClassName: e.target.value })}
            />
            <TextField
              label="Giáo viên nhận"
              size="small"
              value={transferForm.toTeacherName}
              onChange={(e) => setTransferForm({ ...transferForm, toTeacherName: e.target.value })}
            />
            <TextField
              label="Ngày chuyển"
              type="date"
              size="small"
              value={transferForm.transferDate}
              onChange={(e) => setTransferForm({ ...transferForm, transferDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Ghi chú"
              multiline
              minRows={2}
              size="small"
              value={transferForm.note}
              onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferOpen(false)} disabled={saving}>Hủy</Button>
          <Button variant="contained" color="warning" onClick={handleTransfer} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Xác nhận chuyển giao'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── History Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={!!historyTarget} onClose={() => setHistoryTarget(null)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Lịch sử chuyển giao — {historyTarget?.documentCode}</DialogTitle>
        <DialogContent dividers>
          {!historyTarget?.transferHistory?.length ? (
            <Typography color="text.secondary">Chưa có lịch sử chuyển giao.</Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 500 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>Ngày chuyển</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>Từ lớp</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>Sang lớp</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>GV cũ</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>GV mới</TableCell>
                    <TableCell>Ghi chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyTarget.transferHistory.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(h.transferDate)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{h.fromClassName || '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{h.toClassName || '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{h.fromTeacherName || '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{h.toTeacherName || '—'}</TableCell>
                      <TableCell>{h.note || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryTarget(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa biên bản bàn giao"
        message={`Bạn có chắc muốn xóa biên bản "${deleteTarget?.documentCode}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </RoleLayout>
  );
}
