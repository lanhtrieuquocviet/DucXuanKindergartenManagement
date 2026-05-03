import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Paper,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  UploadFile as UploadFileIcon,
  FormatListBulleted as ListIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { del, get, post, postFormData, put, getBlob, ENDPOINTS } from '../../../service/api';
import { useConfirm } from '../../../hooks/useConfirm';
import {
  emptyWarehouseAsset,
  ConfirmDialog,
  AddCategoryDialog,
  WAREHOUSE_CATEGORY_PREFIX,
  normalizeCondition,
  deriveWarehouseQuantities,
} from './AssetUtils';


export function WarehouseAssetsTab() {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [reportItems, setReportItems] = useState([]); // Danh sách các mục từ Tab Báo cáo
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(emptyWarehouseAsset());
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importItems, setImportItems] = useState([]);
  const [importing, setImporting] = useState(false);
  const [warehouseCategories, setWarehouseCategories] = useState([]);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pageByCategory, setPageByCategory] = useState({});
  const fileInputRef = useRef(null);

  const loadReportItems = async () => {
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ASSETS + '?type=csvc');
      setReportItems(res?.data?.assets || []);
    } catch (err) {
      console.error('Error loading report items:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.GENERAL_CATEGORIES + '?type=Asset');
      if (res?.data?.length) {
        setWarehouseCategories(res.data.map(c => c.name));
      } else {
        setWarehouseCategories(['Đồ dùng', 'Thiết bị dạy học, đồ chơi và học liệu', 'Sách, tài liệu, băng đĩa', 'Thiết bị ngoài thông tư']);
      }
    } catch (err) {
      console.error('loadCategories error:', err);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ASSETS + '?type=asset');
      setAssets((res?.data?.assets || []).map((a) => {
        const q = deriveWarehouseQuantities(a);
        return { ...a, quantity: q.total, goodQuantity: q.good, brokenQuantity: q.broken, condition: normalizeCondition(a.condition) };
      }));
    } catch (err) {
      toast.error(err?.message || 'Không tải được danh sách tài sản.');
    } finally { setLoading(false); }
  };

  useEffect(() => { 
    load(); 
    loadCategories();
    loadReportItems();
  }, []);

  useEffect(() => {
    setSelected((prev) => {
      if (!prev.size) return prev;
      const validIds = new Set(assets.map((a) => String(a._id)));
      const next = new Set([...prev].filter((id) => validIds.has(String(id))));
      return next;
    });
  }, [assets]);

  useEffect(() => { setPageByCategory({}); }, [search]);

  const handleSave = async () => {
    if (editId && !form.assetCode.trim()) return toast.warn('Mã tài sản không được để trống.');
    if (!form.name.trim()) return toast.warn('Tên tài sản không được để trống.');
    if (!form.unit?.trim()) return toast.warn('Đơn vị tính không được để trống.');
    const goodQuantity = Number(form.goodQuantity);
    const brokenQuantity = Number(form.brokenQuantity);
    if (Number.isNaN(goodQuantity) || goodQuantity < 0) return toast.warn('Số lượng còn tốt không hợp lệ.');
    if (Number.isNaN(brokenQuantity) || brokenQuantity < 0) return toast.warn('Số lượng đã hỏng không hợp lệ.');
    const quantity = goodQuantity + brokenQuantity;
    setSaving(true);
    try {
      const payload = {
        type: 'asset',
        assetCode: form.assetCode.trim(),
        name: form.name.trim(),
        category: form.category,
        unit: form.unit.trim(),
        quantity,
        goodQuantity,
        brokenQuantity,
        condition: brokenQuantity > 0 ? 'Đã hỏng' : 'Còn tốt',
        linkedReportId: form.linkedReportId || null,
        notes: form.notes || '',
      };
      if (editId) {
        await put(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(editId), payload);
        setAssets(prev => prev.map(a => a._id === editId ? { ...a, ...payload } : a));
        toast.success('Cập nhật thành công.');
      } else {
        const res = await post(ENDPOINTS.SCHOOL_ADMIN.ASSETS, payload);
        setAssets(prev => [...prev, res.data.asset]);
        toast.success('Thêm tài sản công.');
      }
      setOpenModal(false); setForm(emptyWarehouseAsset()); setEditId(null);
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi lưu.');
    } finally { setSaving(false); }
  };

  const handleQuickDelete = async (asset) => {
    if (!asset?._id) return;
    if (!await confirm(`Bạn có chắc chắn muốn xóa "${asset.name}"?`)) return;
    setDeletingId(asset._id);
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(asset._id));
      setAssets(prev => prev.filter(a => a._id !== asset._id));
      toast.success(`Đã xóa "${asset.name}".`);
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi xóa.');
    } finally { setDeletingId(''); }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectCategory = (rows) => {
    const ids = rows.map((r) => r._id);
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      ids.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      const selectedIds = [...selected];
      const results = await Promise.allSettled(
        selectedIds.map((id) => del(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(id)))
      );
      let deletedCount = 0;
      results.forEach((r) => { if (r.status === 'fulfilled') deletedCount++; });

      if (deletedCount > 0) {
        const deletedIds = selectedIds.filter((_, idx) => results[idx].status === 'fulfilled');
        setAssets((prev) => prev.filter((a) => !deletedIds.includes(String(a._id))));
      }
      setSelected(new Set());
      setBulkDeleteOpen(false);
      toast.success(`Đã xóa ${deletedCount} mục.`);
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi xóa hàng loạt.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await postFormData(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS_PARSE_WORD, formData);
      const normalizeCat = (cat) => {
        if (!cat?.trim()) return '';
        const t = cat.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (/^iii[.\s]/.test(t)) return 'Sách, tài liệu, băng đĩa';
        if (/^ii[.\s]/.test(t)) return 'Thiết bị dạy học, đồ chơi và học liệu';
        if (/^i[.\s]/.test(t)) return 'Đồ dùng';
        return cat.trim();
      };
      const extraWithCategory = (res?.data?.extraAssets || []).map(a => ({ ...a, category: 'Thiết bị ngoài thông tư' }));
      const parsed = (res?.data?.assets || []).map(a => ({ ...a, category: normalizeCat(a.category) }))
        .concat(extraWithCategory).map(a => ({
        ...a,
        condition: 'Còn tốt',
        goodQuantity: a.quantity,
        brokenQuantity: 0,
        notes: a.notes || '',
        linkedReportId: a.linkedReportId || null
      }));
      if (parsed.length === 0) return toast.warn('Không tìm thấy dữ liệu tài sản.');
      setImportItems(parsed);
      setImportOpen(true);
    } catch (err) {
      toast.error('Lỗi đọc file.');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await getBlob(ENDPOINTS.SCHOOL_ADMIN.ASSETS_WAREHOUSE_TEMPLATE);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau_nhap_kho_tai_san.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Không tải được file mẫu.');
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await post(ENDPOINTS.SCHOOL_ADMIN.ASSETS_BULK_WAREHOUSE, { assets: importItems });
      const { created = 0, merged = 0, skipped = 0, errors = [] } = res?.data || {};
      if (created === 0 && merged === 0 && skipped > 0) {
        toast.warn(`Không nhập được mục nào. Bỏ qua ${skipped} mục${errors.length ? ': ' + errors.slice(0, 2).join('; ') : ''}.`);
      } else {
        const parts = [];
        if (created > 0) parts.push(`tạo mới ${created}`);
        if (merged > 0) parts.push(`cập nhật ${merged}`);
        if (skipped > 0) parts.push(`bỏ qua ${skipped}`);
        toast.success(`Nhập thành công — ${parts.join(', ')} tài sản.`);
      }
      setImportOpen(false);
      setImportItems([]);
      load();
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi nhập.');
    } finally { setImporting(false); }
  };

  const filtered = assets.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()) || a.assetCode?.toLowerCase().includes(search.toLowerCase()));
  const grouped = warehouseCategories.map(cat => ({ cat, rows: filtered.filter(a => a.category === cat) }));

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <TextField size="small" placeholder="Tìm theo tên hoặc mã..." value={search} onChange={e => setSearch(e.target.value)} sx={{ width: 280 }} />
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="info" startIcon={<ListIcon />} onClick={() => setCategoryDialog(true)}>
            Quản lý Nhóm
          </Button>
          {/* <Button variant="outlined" color="success" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>
            Tải mẫu
          </Button>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()}>
            Import Word
          </Button> */}
        </Stack>
        <input ref={fileInputRef} type="file" accept=".docx,.doc" style={{ display: 'none' }} onChange={handleFileSelect} />
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        grouped.map(({ cat, rows }) => {
          if (!rows.length && !search) {
             // Show empty category if not searching
          }
          const page = pageByCategory[cat] || 0;
          const pagedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

          return (
            <Box key={cat} sx={{ mb: 3 }}>
              <Box sx={{ bgcolor: '#f8fafc', px: 2, py: 1, border: '1px solid #e2e8f0', borderBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight={800} color="primary">
                   {WAREHOUSE_CATEGORY_PREFIX[cat] || '•'}. {cat} ({rows.length} mục)
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => { setForm({ ...emptyWarehouseAsset(), category: cat }); setEditId(null); setOpenModal(true); }}>Thêm</Button>
              </Box>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox size="small" indeterminate={selected.size > 0 && selected.size < rows.length} checked={rows.length > 0 && rows.every(r => selected.has(r._id))} onChange={() => toggleSelectCategory(rows)} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Mã TS</TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Tên tài sản</TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>ĐVT</TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="center">Tổng kho</TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="center">Đã phân bổ</TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="center">Còn lại</TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="center">Còn tốt</TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="center">Đã hỏng</TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedRows.length === 0 ? (
                      <TableRow><TableCell colSpan={10} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa có dữ liệu – nhấn Thêm để bắt đầu</TableCell></TableRow>
                    ) : (
                      pagedRows.map((a, idx) => {
                        const inUse = a.quantity - (a.goodQuantity + a.brokenQuantity); // This is not quite right in warehouse, but logic depends on app
                        return (
                          <TableRow key={a._id} hover>
                            <TableCell padding="checkbox"><Checkbox size="small" checked={selected.has(a._id)} onChange={() => toggleSelect(a._id)} /></TableCell>
                            <TableCell>{a.assetCode}</TableCell>
                            <TableCell fontWeight={600}>{a.name}</TableCell>
                            <TableCell>{a.unit}</TableCell>
                            <TableCell align="center">{a.quantity}</TableCell>
                            <TableCell align="center">{a.allocatedQty}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.main' }}>{a.remainingQty}</TableCell>
                            <TableCell align="center" sx={{ color: 'success.main' }}>{a.goodQuantity}</TableCell>
                            <TableCell align="center" sx={{ color: 'error.main' }}>{a.brokenQuantity}</TableCell>
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => { setForm({ ...a }); setEditId(a._id); setOpenModal(true); }}><EditIcon fontSize="small" /></IconButton>
<IconButton size="small" color="error" onClick={() => handleQuickDelete(a)} disabled={deletingId === a._id}>
                                {deletingId === a._id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={rows.length}
                page={page}
                onPageChange={(_, p) => setPageByCategory(prev => ({ ...prev, [cat]: p }))}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => setRowsPerPage(parseInt(e.target.value, 10))}
              />
            </Box>
          );
        })
      )}

      {selected.size > 0 && (
        <Paper sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', p: 1.5, display: 'flex', alignItems: 'center', gap: 2, zIndex: 1100, borderRadius: 3, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0' }}>
          <Typography variant="body2" fontWeight={700}>Đã chọn {selected.size} mục</Typography>
          <Button variant="contained" color="error" size="small" onClick={() => setBulkDeleteOpen(true)}>Xóa hàng loạt</Button>
        </Paper>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{editId ? 'Sửa tài sản' : 'Thêm tài sản vào Kho'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField 
                label="Mã tài sản" 
                value={editId ? form.assetCode : (form.assetCode || '')} 
                onChange={e => setForm(f => ({ ...f, assetCode: e.target.value }))} 
                fullWidth 
                size="small" 
                placeholder={!editId ? "Hệ thống tự động sinh" : ""}
                disabled={!!editId}
                helperText={!editId ? "Để trống để hệ thống tự động tạo mã" : ""}
              />
              <TextField label="Đơn vị tính *" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} fullWidth size="small" />
            </Stack>
            <TextField label="Tên tài sản *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" />
            <TextField 
              select 
              label="Nhóm tài sản" 
              value={form.category} 
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))} 
              fullWidth 
              size="small"
            >
              {warehouseCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField label="SL còn tốt" type="number" value={form.goodQuantity} onChange={e => setForm(f => ({ ...f, goodQuantity: Number(e.target.value) }))} inputProps={{ min: 0 }} fullWidth size="small" />
              <TextField label="SL hỏng" type="number" value={form.brokenQuantity} onChange={e => setForm(f => ({ ...f, brokenQuantity: Number(e.target.value) }))} inputProps={{ min: 0 }} fullWidth size="small" />
            </Stack>

            <Autocomplete
              size="small"
              options={reportItems}
              getOptionLabel={(option) => `${option.name} (${option.category})`}
              value={reportItems.find(i => i._id === form.linkedReportId) || null}
              onChange={(event, newValue) => {
                setForm(f => ({ ...f, linkedReportId: newValue ? newValue._id : null }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Liên kết tới mục báo cáo (Tab 1)" 
                  placeholder="Tìm tên mục báo cáo để khớp số liệu tự động..."
                  helperText="Chọn mục này để số lượng trong kho tự động cộng dồn vào Tab Báo cáo"
                />
              )}
            />

            <TextField label="Ghi chú" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} fullWidth multiline rows={2} size="small" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenModal(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ px: 4 }}>{saving ? 'Đang lưu...' : 'Lưu lại'}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={bulkDeleteOpen} title="Xóa hàng loạt" message={`Bạn có chắc muốn xóa ${selected.size} mục đã chọn?`} onConfirm={handleBulkDelete} onCancel={() => setBulkDeleteOpen(false)} loading={bulkDeleting} />

      <AddCategoryDialog 
        open={categoryDialog} 
        onClose={() => setCategoryDialog(false)} 
        onConfirm={async ({ name, code }) => {
          try {
            await post(ENDPOINTS.SCHOOL_ADMIN.GENERAL_CATEGORIES, { name, code, type: 'Asset' });
            toast.success('Thêm nhóm thành công.');
            loadCategories();
          } catch (err) {
            toast.error(err?.message || 'Lỗi khi thêm nhóm.');
          }
        }} 
      />

      <Dialog open={importOpen} onClose={() => { if (!importing) { setImportOpen(false); setImportItems([]); } }} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Xem trước & chỉnh sửa trước khi nhập — {importItems.length} tài sản
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {(() => {
            const knownCats = warehouseCategories;
            const unknownItems = importItems.filter(a => !knownCats.includes(a.category));
            const groups = [
              ...knownCats.map(cat => ({ cat, rows: importItems.filter(a => a.category === cat) })),
              ...(unknownItems.length ? [{ cat: '__unknown__', rows: unknownItems }] : []),
            ];
            return groups.map(({ cat, rows }) => {
              if (!rows.length) return null;
              const idxOffset = importItems.indexOf(rows[0]);
              return (
                <Box key={cat} sx={{ mb: 0 }}>
                  <Typography sx={{ bgcolor: cat === '__unknown__' ? '#fff3cd' : '#f1f5f9', px: 2, py: 1, fontWeight: 700, borderBottom: '1px solid #e2e8f0' }} variant="body2" color={cat === '__unknown__' ? 'warning.dark' : 'primary'}>
                    {cat === '__unknown__' ? '⚠ Nhóm chưa xác định (sẽ vào "Đồ dùng")' : cat} — {rows.length} mục
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Tên tài sản</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 90 }} align="center">Mã TS</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 70 }} align="center">ĐVT</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 80 }} align="center">SL</TableCell>
                          <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>Nhóm</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 40 }} align="center">Xóa</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((r) => {
                          const idx = importItems.indexOf(r);
                          return (
                            <TableRow key={idx} hover sx={cat === '__unknown__' ? { bgcolor: '#fffbf0' } : {}}>
                              <TableCell>
                                <TextField size="small" variant="standard" value={r.name} fullWidth
                                  onChange={e => setImportItems(prev => prev.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))}
                                  inputProps={{ style: { fontSize: 13 } }} />
                              </TableCell>
                              <TableCell align="center">
                                <TextField size="small" variant="standard" value={r.assetCode || ''}
                                  onChange={e => setImportItems(prev => prev.map((it, i) => i === idx ? { ...it, assetCode: e.target.value } : it))}
                                  inputProps={{ style: { fontSize: 13, textAlign: 'center', width: 80 } }}
                                  placeholder="Tự động" />
                              </TableCell>
                              <TableCell align="center">
                                <TextField size="small" variant="standard" value={r.unit || 'Cái'}
                                  onChange={e => setImportItems(prev => prev.map((it, i) => i === idx ? { ...it, unit: e.target.value } : it))}
                                  inputProps={{ style: { fontSize: 13, textAlign: 'center', width: 55 } }} />
                              </TableCell>
                              <TableCell align="center">
                                <TextField size="small" variant="standard" type="number" value={r.quantity || 0}
                                  onChange={e => {
                                    const v = Math.max(0, Number(e.target.value) || 0);
                                    setImportItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: v, goodQuantity: v } : it));
                                  }}
                                  inputProps={{ min: 0, style: { fontSize: 13, textAlign: 'center', width: 60 } }} />
                              </TableCell>
                              <TableCell>
                                <TextField select size="small" variant="standard" value={r.category || ''} fullWidth
                                  onChange={e => setImportItems(prev => prev.map((it, i) => i === idx ? { ...it, category: e.target.value } : it))}>
                                  {warehouseCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                </TextField>
                              </TableCell>
                              <TableCell align="center">
                                <IconButton size="small" color="error" onClick={() => setImportItems(prev => prev.filter((_, i) => i !== idx))}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              );
            });
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            Bạn có thể sửa tên, mã, số lượng, nhóm hoặc xóa từng dòng trước khi nhập.
          </Typography>
          <Button onClick={() => { setImportOpen(false); setImportItems([]); }} disabled={importing}>Hủy bỏ</Button>
          <Button variant="contained" onClick={handleImport} disabled={importing || importItems.length === 0} sx={{ px: 4 }}>
            {importing ? 'Đang xử lý...' : `Xác nhận nhập ${importItems.length} mục`}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
