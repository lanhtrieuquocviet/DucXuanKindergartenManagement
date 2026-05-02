import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { del, get, patch, post, postFormData, put, ENDPOINTS } from '../../service/api';

// Shared Components & Utils
import {
  emptyForm,
  emptyTransferForm,
  flatToAssets,
  assetsToFlat,
  nextKey,
  emptySeparator,
  emptyAssetRow,
  normalizeLabel,
  ConfirmDialog,
} from './AssetAllocation/AllocationUtils';

import {
  InfoPopover,
  RoomPickerDialog,
  TransferDialog,
  HistoryDialog,
} from './AssetAllocation/AllocationDialogs';

import { AllocationForm } from './AssetAllocation/AllocationForm';
import { AllocationTable } from './AssetAllocation/AllocationTable';
import AllocationDocument from './AssetAllocation/AllocationDocument';

export default function ManageAssetAllocation() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [allocations, setAllocations]   = useState([]);
  const [classes, setClasses]           = useState([]);
  const [allTeachers, setAllTeachers]   = useState([]);
  const [currentAcYear, setCurrentAcYear] = useState('');
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [blockedClassIds, setBlockedClassIds] = useState(new Set());

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClass, setFilterClass]   = useState('');

  // Dialog States
  const [formOpen, setFormOpen]             = useState(false);
  const [editTarget, setEditTarget]         = useState(null);
  const [form, setForm]                     = useState(emptyForm());
  const [viewTarget, setViewTarget]         = useState(null);
  const [historyTarget, setHistoryTarget]   = useState(null);
  const [transferOpen, setTransferOpen]     = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferForm, setTransferForm]     = useState(emptyTransferForm());
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [deleteLoading, setDeleteLoading]   = useState(false);
  const [infoAnchor, setInfoAnchor]         = useState(null);
  const [importing, setImporting]           = useState(false);

  const wordInputRef  = useRef(null);
  const excelInputRef = useRef(null);

  // Room Picker States
  const [roomPickerOpen, setRoomPickerOpen] = useState(false);
  const [roomList, setRoomList]             = useState([]);
  const [loadingRooms, setLoadingRooms]     = useState(false);
  const [pickedRoom, setPickedRoom]         = useState(null);
  const [loadingRoomAssets, setLoadingRoomAssets] = useState(false);
  const [assignedRoomIds, setAssignedRoomIds] = useState({});

  // ── Data Loaders ───────────────────────────────────────────────────────────
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

  const loadInitialData = async () => {
    try {
      const [clsRes, tRes, acRes] = await Promise.all([
        get(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS_CLASSES),
        get(ENDPOINTS.SCHOOL_ADMIN.TEACHERS),
        get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.CURRENT),
      ]);
      setClasses(clsRes.data.classes || []);
      setAllTeachers((tRes.data?.teachers || []).map((t) => t.fullName).filter(Boolean));
      setCurrentAcYear(acRes.data?.yearName || '');
    } catch { /* silent */ }
  };

  const loadBlockedClasses = async () => {
    try {
      const [activeRes, pendingRes] = await Promise.all([
        get(`${ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS}?status=active`),
        get(`${ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS}?status=pending_confirmation`),
      ]);
      const blockedIds = new Set();
      [...(activeRes?.data?.allocations || []), ...(pendingRes?.data?.allocations || [])].forEach(alloc => {
        const id = alloc.classId?._id || alloc.classId;
        if (id) blockedIds.add(String(id));
      });
      setBlockedClassIds(blockedIds);
    } catch { setBlockedClassIds(new Set()); }
  };

  useEffect(() => { loadInitialData(); loadBlockedClasses(); }, []);
  useEffect(() => { loadAllocations(); }, [filterStatus, filterClass]);

  // ── Handlers ───────────────────────────────────────────────────────────────
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
      return toast.error('Phải có ít nhất một tài sản với tên.');
    }
    setSaving(true);
    try {
      const payload = { ...form, assets: flatToAssets(form.assets), extraAssets: (form.extraAssets || []).filter(a => a.name?.trim()) };
      if (editTarget) {
        await put(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATION_DETAIL(editTarget._id), payload);
        toast.success('Cập nhật biên bản thành công.');
      } else {
        await post(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS, payload);
        toast.success('Tạo biên bản bàn giao thành công.');
      }
      setFormOpen(false); loadAllocations(); loadBlockedClasses();
    } catch (err) { toast.error(err.message || 'Lỗi lưu biên bản.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATION_DETAIL(deleteTarget._id));
      toast.success('Xóa biên bản thành công.'); setDeleteTarget(null); loadAllocations(); loadBlockedClasses();
    } catch (err) { toast.error(err.message || 'Lỗi xóa biên bản.'); }
    finally { setDeleteLoading(false); }
  };

  const openRoomPicker = async () => {
    setPickedRoom(null); setRoomPickerOpen(true); setLoadingRooms(true);
    try {
      const [roomRes, activeRes, pendingRes] = await Promise.all([
        get(ENDPOINTS.SCHOOL_ADMIN.ROOM_ASSETS),
        get(`${ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS}?status=active`),
        get(`${ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS}?status=pending_confirmation`),
      ]);
      if (roomRes.status === 'success') setRoomList(roomRes.data.classrooms || []);
      const occupied = {};
      [...(activeRes?.data?.allocations || []), ...(pendingRes?.data?.allocations || [])].forEach(alloc => {
        const rid = alloc.sourceRoomId?._id || alloc.sourceRoomId || alloc.classId?.roomId?._id || alloc.classId?.roomId;
        if (rid) occupied[String(rid)] = { className: alloc.className || '?' };
      });
      setAssignedRoomIds(occupied);
    } catch { toast.error('Không thể tải danh sách phòng.'); }
    finally { setLoadingRooms(false); }
  };

  const handleImportFromRoom = async () => {
    if (!pickedRoom) return toast.warn('Vui lòng chọn phòng.');
    setLoadingRoomAssets(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ROOM_ASSETS_BY_ROOM(pickedRoom._id));
      if (res.status !== 'success') return;
      const items = res.data.items || [];
      if (!items.length) return toast.warn('Phòng này chưa có tài sản nào.');
      const grouped = {};
      items.forEach(item => {
        const cat = item.assetId?.category || '';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ _key: nextKey(), category: cat, assetCode: item.assetId?.assetCode || '', name: item.assetId?.name || '', unit: item.assetId?.unit || 'Cái', quantity: item.quantity, targetUser: 'Trẻ', notes: item.notes || '' });
      });
      const flat = []; Object.entries(grouped).forEach(([cat, rows]) => { flat.push(emptySeparator(cat)); flat.push(...rows); });
      setForm(f => ({ ...f, assets: flat, pickedRoomId: pickedRoom._id, pickedRoomName: pickedRoom.roomName }));
      toast.success(`Đã nhập ${items.length} loại tài sản từ phòng "${pickedRoom.roomName}".`);
      setRoomPickerOpen(false);
    } catch { toast.error('Không thể tải tài sản của phòng.'); }
    finally { setLoadingRoomAssets(false); }
  };

  const handleTransfer = async () => {
    if (!transferForm.toClassId) return toast.error('Vui lòng chọn lớp nhận.');
    setSaving(true);
    try {
      await patch(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATION_TRANSFER(transferTarget._id), transferForm);
      toast.success('Chuyển giao tài sản thành công.'); setTransferOpen(false); loadAllocations(); loadBlockedClasses();
    } catch (err) { toast.error(err.message || 'Lỗi chuyển giao.'); }
    finally { setSaving(false); }
  };

  const downloadTemplate = async () => {
    try {
      const { getToken } = await import('../../service/api');
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}${ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS_TEMPLATE}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) return toast.error('Không tải được mẫu.');
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'mau_tai_san_ban_giao.xlsx'; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Lỗi tải mẫu Excel.'); }
  };

  const handleImport = async (e, type) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = ''; setImporting(true);
    try {
      const formData = new FormData(); formData.append('file', file);
      const endpoint = type === 'word' ? ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS_PARSE_WORD : ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS_PARSE_EXCEL;
      const res = await postFormData(endpoint, formData);
      const { assets: parsed = [], extraAssets: parsedExtra = [] } = res.data || {};
      if (!parsed.length && !parsedExtra.length) return toast.warning('Không tìm thấy dữ liệu tài sản.');
      setForm(prev => ({ ...prev, assets: parsed.length ? assetsToFlat(parsed) : prev.assets, extraAssets: parsedExtra.length ? parsedExtra : prev.extraAssets }));
      toast.success(`Đã import: ${[parsed.length ? `${parsed.length} TS theo TT` : '', parsedExtra.length ? `${parsedExtra.length} TS ngoài TT` : ''].filter(Boolean).join(', ')}.`);
    } catch (err) { toast.error(`Lỗi đọc file: ${err.message || ''}`); }
    finally { setImporting(false); }
  };

  const downloadWord = async (alloc) => {
    try {
      const { getToken } = await import('../../service/api');
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}${ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATION_EXPORT_WORD(alloc._id)}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) return toast.error('Không xuất được file Word.');
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `bien_ban_ban_giao_${alloc.documentCode || alloc._id}.docx`; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Lỗi xuất Word.'); }
  };

  const onAssetsChange      = useCallback((assets)      => setForm((prev) => ({ ...prev, assets })),      []);
  const onExtraAssetsChange = useCallback((extraAssets) => setForm((prev) => ({ ...prev, extraAssets })), []);

  const onMoveAssetToExtra = useCallback((i, row) => {
    const { _isSeparator, categoryName, category, ...clean } = row;
    setForm(prev => ({ ...prev, assets: prev.assets.filter((_, idx) => idx !== i), extraAssets: [...(prev.extraAssets || []), { ...clean, category: '' }] }));
  }, []);

  const onMoveExtraToAsset = useCallback((i, row) => {
    setForm(prev => ({ ...prev, extraAssets: prev.extraAssets.filter((_, idx) => idx !== i), assets: [...prev.assets, { ...row, category: '' }] }));
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const availableClassOptions = editTarget ? classes : classes.filter(c => !blockedClassIds.has(String(c._id)));
  const transferClassOptions = classes.filter(c => String(c._id) !== String(transferTarget?.classId?._id || transferTarget?.classId || ''));
  const transferHistoryRows = (() => {
    return (historyTarget?.transferHistory || []).map((h, idx) => ({ ...h, _idx: idx }))
      .filter(h => normalizeLabel(h.fromClassName) !== normalizeLabel(h.toClassName))
      .sort((a, b) => (new Date(b.transferDate).getTime() || 0) - (new Date(a.transferDate).getTime() || 0));
  })();

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>Phân bổ & Bàn giao tài sản</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Tạo biên bản bàn giao</Button>
      </Stack>

      <AllocationTable
        loading={loading} allocations={allocations} classes={classes}
        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
        filterClass={filterClass} setFilterClass={setFilterClass}
        setInfoAnchor={setInfoAnchor} setViewTarget={setViewTarget}
        downloadWord={downloadWord} setHistoryTarget={setHistoryTarget}
        openEdit={openEdit} openTransfer={alloc => { setTransferTarget(alloc); setTransferForm(emptyTransferForm()); setTransferOpen(true); }}
        setDeleteTarget={setDeleteTarget}
      />

      <InfoPopover anchor={infoAnchor} onClose={() => setInfoAnchor(null)} />

      <AllocationForm
        open={formOpen} onClose={() => setFormOpen(false)} isMobile={isMobile}
        editTarget={editTarget} availableClassOptions={availableClassOptions}
        form={form} setForm={setForm} allTeachers={allTeachers}
        openRoomPicker={openRoomPicker} downloadTemplate={downloadTemplate}
        wordInputRef={wordInputRef} excelInputRef={excelInputRef}
        handleWordImport={e => handleImport(e, 'word')} handleExcelImport={e => handleImport(e, 'excel')}
        importing={importing} onAssetsChange={onAssetsChange} onMoveAssetToExtra={onMoveAssetToExtra}
        onExtraAssetsChange={onExtraAssetsChange} onMoveExtraToAsset={onMoveExtraToAsset}
        handleSave={handleSave} saving={saving}
      />

      {viewTarget && <AllocationDocument allocation={viewTarget} onClose={() => setViewTarget(null)} />}

      <RoomPickerDialog
        open={roomPickerOpen} onClose={() => setRoomPickerOpen(false)}
        loadingRooms={loadingRooms} roomList={roomList} assignedRoomIds={assignedRoomIds}
        pickedRoom={pickedRoom} setPickedRoom={setPickedRoom}
        handleImportFromRoom={handleImportFromRoom} loadingRoomAssets={loadingRoomAssets}
      />

      <TransferDialog
        open={transferOpen} onClose={() => setTransferOpen(false)} isMobile={isMobile}
        transferTarget={transferTarget} transferClassOptions={transferClassOptions}
        transferForm={transferForm} setTransferForm={setTransferForm}
        handleTransfer={handleTransfer} saving={saving}
      />

      <HistoryDialog
        open={!!historyTarget} onClose={() => setHistoryTarget(null)} isMobile={isMobile}
        historyTarget={historyTarget} transferHistoryRows={transferHistoryRows}
      />

      <ConfirmDialog
        open={!!deleteTarget} title="Xóa biên bản bàn giao"
        message={`Bạn có chắc muốn xóa biên bản "${deleteTarget?.documentCode}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading}
      />
    </Box>
  );
}
