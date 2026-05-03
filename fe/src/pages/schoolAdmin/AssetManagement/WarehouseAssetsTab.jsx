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
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { del, get, post, postFormData, put, ENDPOINTS } from '../../../service/api';
import {
  emptyWarehouseAsset,
  ConfirmDialog,
  AddCategoryDialog,
  WAREHOUSE_CATEGORY_PREFIX,
  normalizeCondition,
  deriveWarehouseQuantities,
} from './AssetUtils';


export function WarehouseAssetsTab() {
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
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${asset.name}"?`)) return;
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
      const parsed = (res?.data?.assets || []).concat(res?.data?.extraAssets || []).map(a => ({
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

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await post(ENDPOINTS.SCHOOL_ADMIN.ASSETS_BULK_WAREHOUSE, { assets: importItems });
      toast.success('Nhập thành công.');
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
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()}>
            Import Word
          </Button>
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

      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Xem trước dữ liệu import — {importItems.length} tài sản</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {warehouseCategories.map(cat => {
            const rows = importItems.filter(a => a.category === cat);
            if (!rows.length) return null;
            return (
              <Box key={cat} sx={{ mb: 2 }}>
                <Typography sx={{ bgcolor: '#f1f5f9', px: 2, py: 1, fontWeight: 700 }} variant="body2">{cat}</Typography>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Tên</TableCell><TableCell align="center">Mã</TableCell><TableCell align="center">SL</TableCell></TableRow></TableHead>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i}><TableCell>{r.name}</TableCell><TableCell align="center">{r.assetCode}</TableCell><TableCell align="center">{r.quantity}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setImportOpen(false)}>Hủy bỏ</Button>
          <Button variant="contained" onClick={handleImport} disabled={importing} sx={{ px: 4 }}>{importing ? 'Đang xử lý...' : 'Xác nhận Nhập'}</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
