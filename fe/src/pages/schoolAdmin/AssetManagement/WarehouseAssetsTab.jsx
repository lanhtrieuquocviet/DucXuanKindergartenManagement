import { useEffect, useMemo, useRef, useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { del, get, post, postFormData, put, ENDPOINTS } from '../../../service/api';
import {
  WAREHOUSE_CATEGORIES,
  WAREHOUSE_CATEGORY_PREFIX,
  emptyWarehouseAsset,
  ConfirmDialog
} from './AssetUtils';

export function WarehouseAssetsTab() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(emptyWarehouseAsset());
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importItems, setImportItems] = useState([]);
  const [importing, setImporting] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pageByCategory, setPageByCategory] = useState({});
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ASSETS + '?type=asset');
      setAssets(res?.data?.assets || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được danh sách tài sản.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.assetCode.trim()) return toast.warn('Mã tài sản không được để trống.');
    if (!form.name.trim()) return toast.warn('Tên tài sản không được để trống.');
    setSaving(true);
    try {
      const payload = { ...form, type: 'asset' };
      if (editId) {
        await put(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(editId), payload);
        setAssets(prev => prev.map(a => a._id === editId ? { ...a, ...payload } : a));
        toast.success('Cập nhật thành công.');
      } else {
        const res = await post(ENDPOINTS.SCHOOL_ADMIN.ASSETS, payload);
        setAssets(prev => [...prev, res.data.asset]);
        toast.success('Thêm tài sản thành công.');
      }
      setOpenModal(false); setForm(emptyWarehouseAsset()); setEditId(null);
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi lưu.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(deleteTarget._id));
      setAssets(prev => prev.filter(a => a._id !== deleteTarget._id));
      toast.success('Đã xóa.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi xóa.');
    } finally { setDeleting(false); }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectCategoryRows = (rows) => {
    if (!rows.length) return;
    const allSelected = rows.every((a) => selected.has(a._id));
    setSelected((prev) => {
      const next = new Set(prev);
      rows.forEach((a) => {
        if (allSelected) next.delete(a._id);
        else next.add(a._id);
      });
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map((id) => del(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(id))));
      toast.success(`Đã xóa ${selected.size} tài sản.`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
      load();
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
      const parsedRes = await postFormData(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS_PARSE_WORD, formData);
      const parsedAssets = parsedRes?.data?.assets || [];
      const parsedExtraAssets = parsedRes?.data?.extraAssets || [];
      const parsed = [...parsedAssets, ...parsedExtraAssets]
        .filter((a) => a?.name?.trim())
        .map((a) => ({
          assetCode: a.assetCode || '',
          name: a.name,
          category: a.category || 'Thiết bị ngoài thông tư',
          unit: a.unit || 'Cái',
          quantity: Number(a.quantity) || 0,
          condition: 'Còn tốt',
          notes: a.notes || '',
        }));
      if (parsed.length === 0) return toast.warn('Không tìm thấy dữ liệu tài sản.');
      setImportItems(parsed); setImportOpen(true);
    } catch (err) { toast.error('Không đọc được file.'); }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await post(ENDPOINTS.SCHOOL_ADMIN.ASSETS_BULK_WAREHOUSE, { assets: importItems });
      toast.success('Nhập thành công.'); setImportOpen(false); setImportItems([]); load();
    } catch (err) { toast.error('Lỗi khi nhập.'); }
    finally { setImporting(false); }
  };

  const filtered = useMemo(
    () => assets.filter((a) => a.name?.toLowerCase().includes(search.toLowerCase()) || a.assetCode?.toLowerCase().includes(search.toLowerCase())),
    [assets, search]
  );
  const grouped = useMemo(
    () => WAREHOUSE_CATEGORIES.map((cat) => ({ cat, rows: filtered.filter((a) => a.category === cat) })),
    [filtered]
  );

  useEffect(() => { setPageByCategory({}); setSelected(new Set()); }, [search, rowsPerPage]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <TextField size="small" placeholder="Tìm theo tên hoặc mã..." value={search} onChange={e => setSearch(e.target.value)} sx={{ width: 280 }} />
        <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()}>Import Word</Button>
        <input ref={fileInputRef} type="file" accept=".docx,.doc" style={{ display: 'none' }} onChange={handleFileSelect} />
      </Stack>

      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> : (
        grouped.map(({ cat, rows }) => {
          const page = pageByCategory[cat] || 0;
          const maxPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
          const currentPage = Math.min(page, maxPage);
          const pagedRows = rows.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);
          return (
            <Box key={cat} mb={3}>
              <Box sx={{ backgroundColor: '#e8f0fe', px: 1.5, py: 0.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight={700} variant="body2">{WAREHOUSE_CATEGORY_PREFIX[cat]}. {cat} ({rows.length})</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => { setForm({ ...emptyWarehouseAsset(), category: cat }); setEditId(null); setOpenModal(true); }}>Thêm</Button>
              </Box>
              <TableContainer sx={{ border: '1px solid #c7d7f8' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"><Checkbox size="small" onChange={() => toggleSelectCategoryRows(rows)} /></TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mã</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tên</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Tổng</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Còn lại</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedRows.map((a) => (
                      <TableRow key={a._id} hover selected={selected.has(a._id)}>
                        <TableCell padding="checkbox"><Checkbox size="small" checked={selected.has(a._id)} onChange={() => toggleSelect(a._id)} /></TableCell>
                        <TableCell>{a.assetCode}</TableCell>
                        <TableCell>{a.name}</TableCell>
                        <TableCell align="center">{a.quantity}</TableCell>
                        <TableCell align="center">{a.remainingQty ?? a.quantity}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => { setForm({ ...a }); setEditId(a._id); setOpenModal(true); }}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(a)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination component="div" count={rows.length} page={currentPage} onPageChange={(_, p) => setPageByCategory(prev => ({ ...prev, [cat]: p }))} rowsPerPage={rowsPerPage} onRowsPerPageChange={e => setRowsPerPage(parseInt(e.target.value, 10))} />
            </Box>
          );
        })
      )}

      {selected.size > 0 && (
        <Paper sx={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', p: 2, display: 'flex', alignItems: 'center', gap: 2, zIndex: 1000 }}>
          <Typography variant="body2">Đã chọn <strong>{selected.size}</strong> mục</Typography>
          <Button variant="contained" color="error" size="small" onClick={() => setBulkDeleteOpen(true)}>Xóa hàng loạt</Button>
        </Paper>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Sửa' : 'Thêm'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} pt={1}>
            <TextField label="Mã TS *" value={form.assetCode} onChange={e => setForm(f => ({ ...f, assetCode: e.target.value }))} fullWidth size="small" />
            <TextField label="Tên TS *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" />
            <TextField label="Tổng số lượng" type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} fullWidth size="small" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>Lưu</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} title="Xóa tài sản" message={`Xóa "${deleteTarget?.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      <ConfirmDialog open={bulkDeleteOpen} title="Xóa hàng loạt" message={`Xóa ${selected.size} mục?`} onConfirm={handleBulkDelete} onCancel={() => setBulkDeleteOpen(false)} loading={bulkDeleting} />

      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Xem trước ({importItems.length})</DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead><TableRow><TableCell>Tên</TableCell><TableCell align="center">SL</TableCell></TableRow></TableHead>
            <TableBody>{importItems.slice(0, 10).map((a, i) => (<TableRow key={i}><TableCell>{a.name}</TableCell><TableCell align="center">{a.quantity}</TableCell></TableRow>))}</TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setImportOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleImport} disabled={importing}>Nhập dữ liệu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
