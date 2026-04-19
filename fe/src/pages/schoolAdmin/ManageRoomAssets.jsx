import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, InputAdornment, List, ListItemButton,
  ListItemText, MenuItem, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RoleLayout from '../../layouts/RoleLayout';
import { useAuth } from '../../context/AuthContext';
import { del, get, post, postFormData, put, ENDPOINTS } from '../../service/api';
import { createSchoolAdminMenuSelect } from './schoolAdminMenuConfig';
import { useSchoolAdminMenu } from './useSchoolAdminMenu';

const ROOM_STATUS_LABEL = {
  available:   { label: 'Trống',       color: 'success' },
  in_use:      { label: 'Đang dùng',  color: 'primary' },
  maintenance: { label: 'Bảo trì',    color: 'warning' },
};

const emptyRoomForm = () => ({ roomName: '', zone: 'A', floor: 1, capacity: 0, status: 'available', note: '' });
const emptyAssetForm = () => ({ assetId: '', quantity: 1, notes: '' });

function normalizeText(v) {
  return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title || 'Xác nhận xóa'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>Hủy</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={18} /> : 'Xóa'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ManageRoomAssets() {
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const menuItems = useSchoolAdminMenu();
  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const roles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!roles.includes('SchoolAdmin')) navigate('/', { replace: true });
  }, [isInitializing, navigate, user]);

  // ── State phòng ─────────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Dialog CRUD phòng
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editRoom, setEditRoom] = useState(null); // null = tạo mới
  const [roomForm, setRoomForm] = useState(emptyRoomForm());
  const [savingRoom, setSavingRoom] = useState(false);
  const [deleteRoomTarget, setDeleteRoomTarget] = useState(null);
  const [deletingRoom, setDeletingRoom] = useState(false);

  // ── State phòng đang chọn + tài sản ────────────────────────────────────────
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // ── Catalog tài sản ─────────────────────────────────────────────────────────
  const [assetCatalog, setAssetCatalog] = useState([]);

  // Dialog thêm / sửa tài sản trong phòng
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [assetForm, setAssetForm] = useState(emptyAssetForm());
  const [savingAsset, setSavingAsset] = useState(false);
  const [deleteAssetTarget, setDeleteAssetTarget] = useState(null);
  const [deletingAsset, setDeletingAsset] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importSkipped, setImportSkipped] = useState([]);
  const wordInputRef = useRef(null);

  // ── Load phòng ───────────────────────────────────────────────────────────────
  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ROOM_ASSETS);
      if (res.status === 'success') setRooms(res.data.classrooms);
    } catch {
      toast.error('Không thể tải danh sách phòng.');
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadCatalog = async () => {
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ASSETS + '?type=asset');
      if (res.status === 'success') setAssetCatalog(res.data.assets || []);
    } catch { /* silent */ }
  };

  useEffect(() => { loadRooms(); loadCatalog(); }, []);

  // ── CRUD Phòng ───────────────────────────────────────────────────────────────
  const openAddRoom = () => { setEditRoom(null); setRoomForm(emptyRoomForm()); setRoomDialogOpen(true); };
  const openEditRoom = (room, e) => {
    e.stopPropagation();
    setEditRoom(room);
    setRoomForm({ roomName: room.roomName, zone: room.zone || 'A', floor: room.floor || 1, capacity: room.capacity || 0, status: room.status, note: room.note || '' });
    setRoomDialogOpen(true);
  };

  const handleSaveRoom = async () => {
    if (!roomForm.roomName.trim()) return toast.warn('Tên phòng không được để trống.');
    setSavingRoom(true);
    try {
      if (editRoom) {
        const res = await put(ENDPOINTS.SCHOOL_ADMIN.CLASSROOM_UPDATE(editRoom._id), roomForm);
        if (res.status === 'success') {
          await loadRooms();
          if (selectedRoom?._id === editRoom._id) setSelectedRoom((p) => ({ ...p, ...roomForm }));
          toast.success('Cập nhật phòng thành công.');
          setRoomDialogOpen(false);
        }
      } else {
        const res = await post(ENDPOINTS.SCHOOL_ADMIN.CLASSROOMS, roomForm);
        if (res.status === 'success') {
          await loadRooms();
          toast.success('Thêm phòng thành công.');
          setRoomDialogOpen(false);
        }
      }
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi lưu phòng.');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleDeleteRoom = async () => {
    setDeletingRoom(true);
    try {
      const res = await del(ENDPOINTS.SCHOOL_ADMIN.CLASSROOM_DELETE(deleteRoomTarget._id));
      if (res.status === 'success') {
        await loadRooms();
        if (selectedRoom?._id === deleteRoomTarget._id) { setSelectedRoom(null); setItems([]); }
        toast.success('Đã xóa phòng.');
        setDeleteRoomTarget(null);
      }
    } catch {
      toast.error('Lỗi khi xóa phòng.');
    } finally {
      setDeletingRoom(false);
    }
  };

  // ── Load tài sản trong phòng ─────────────────────────────────────────────────
  const loadRoomAssets = async (room) => {
    setSelectedRoom(room);
    setItems([]);
    setLoadingItems(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ROOM_ASSETS_BY_ROOM(room._id));
      if (res.status === 'success') setItems(res.data.items || []);
    } catch {
      toast.error('Không thể tải tài sản của phòng.');
    } finally {
      setLoadingItems(false);
    }
  };

  // ── CRUD Tài sản trong phòng ─────────────────────────────────────────────────
  const openAddAsset = () => { setEditAsset(null); setAssetForm(emptyAssetForm()); setAssetDialogOpen(true); };
  const openEditAsset = (item) => {
    setEditAsset(item);
    setAssetForm({ assetId: item.assetId?._id || '', quantity: item.quantity, notes: item.notes || '' });
    setAssetDialogOpen(true);
  };

  const handleSaveAsset = async () => {
    if (!assetForm.assetId) return toast.warn('Vui lòng chọn loại tài sản.');
    if (assetForm.quantity < 0) return toast.warn('Số lượng không hợp lệ.');
    setSavingAsset(true);
    try {
      if (editAsset) {
        const res = await put(
          ENDPOINTS.SCHOOL_ADMIN.ROOM_ASSET_ITEM(selectedRoom._id, editAsset._id),
          { quantity: assetForm.quantity, notes: assetForm.notes }
        );
        if (res.status === 'success') {
          setItems((prev) => prev.map((i) => (i._id === editAsset._id ? res.data.item : i)));
          toast.success('Cập nhật thành công.');
          setAssetDialogOpen(false);
        }
      } else {
        const res = await post(
          ENDPOINTS.SCHOOL_ADMIN.ROOM_ASSETS_BY_ROOM(selectedRoom._id),
          { assetId: assetForm.assetId, quantity: assetForm.quantity, notes: assetForm.notes }
        );
        if (res.status === 'success') {
          setItems((prev) => [...prev, res.data.item]);
          await loadRooms();
          toast.success('Thêm tài sản thành công.');
          setAssetDialogOpen(false);
        }
      }
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi lưu.');
    } finally {
      setSavingAsset(false);
    }
  };

  const handleDeleteAsset = async () => {
    setDeletingAsset(true);
    try {
      const res = await del(ENDPOINTS.SCHOOL_ADMIN.ROOM_ASSET_ITEM(selectedRoom._id, deleteAssetTarget._id));
      if (res.status === 'success') {
        setItems((prev) => prev.filter((i) => i._id !== deleteAssetTarget._id));
        await loadRooms();
        toast.success('Đã xóa tài sản khỏi phòng.');
        setDeleteAssetTarget(null);
      }
    } catch {
      toast.error('Lỗi khi xóa.');
    } finally {
      setDeletingAsset(false);
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.roomName.toLowerCase().includes(roomSearch.toLowerCase())
  );

  const usedAssetIds = new Set(items.map((i) => i.assetId?._id).filter(Boolean));
  const availableAssets = assetCatalog.filter((a) => !usedAssetIds.has(a._id));

  const buildImportPlan = (rows) => {
    const planned = new Map();
    const skipped = [];

    rows.forEach((r, idx) => {
      const qty = Math.max(0, Number(r.quantity) || 0);
      if (qty <= 0) return;
      const name = String(r.name || '').trim();
      const code = String(r.assetCode || '').trim();
      if (!name && !code) {
        skipped.push(`Dòng ${idx + 1}: thiếu mã hoặc tên tài sản.`);
        return;
      }
      const key = `${normalizeText(code)}::${normalizeText(name)}`;
      if (!planned.has(key)) {
        planned.set(key, {
          assetCode: code,
          name,
          unit: String(r.unit || 'Cái').trim() || 'Cái',
          quantity: 0,
        });
      }
      planned.get(key).quantity += qty;
    });

    return { rows: [...planned.values()], skipped };
  };

  const handleWordImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!selectedRoom?._id) return toast.warn('Vui lòng chọn phòng trước khi import.');

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await postFormData(ENDPOINTS.SCHOOL_ADMIN.ASSET_ALLOCATIONS_PARSE_WORD, fd);
      const assets = res?.data?.assets || [];
      const extras = res?.data?.extraAssets || [];
      const parsed = [...assets, ...extras].map((a) => ({
        assetCode: a.assetCode || '',
        name: a.name || '',
        unit: a.unit || 'Cái',
        quantity: Number(a.quantity) || 0,
      }));

      if (!parsed.length) return toast.warn('Không tìm thấy dữ liệu tài sản trong file.');
      const plan = buildImportPlan(parsed);
      if (!plan.rows.length && plan.skipped.length) {
        plan.skipped.slice(0, 3).forEach((m) => toast.warn(m));
        return;
      }
      setImportRows(plan.rows);
      setImportSkipped(plan.skipped);
      setImportOpen(true);
    } catch (err) {
      toast.error(`Không thể đọc file Word: ${err?.message || ''}`);
    }
  };

  const confirmImport = async () => {
    if (!selectedRoom?._id || importRows.length === 0) return;
    setImporting(true);
    try {
      const res = await post(ENDPOINTS.SCHOOL_ADMIN.ROOM_ASSETS_IMPORT(selectedRoom._id), {
        rows: importRows,
      });
      const { created = 0, updated = 0, skipped = 0, errors = [] } = res?.data || {};
      await loadRoomAssets(selectedRoom);
      await loadRooms();
      setImportOpen(false);
      setImportRows([]);
      const skippedCount = importSkipped.length + skipped;
      toast.success(
        `Đã nhập phòng "${selectedRoom.roomName}": thêm mới ${created}, cộng dồn ${updated}${skippedCount ? `, bỏ qua ${skippedCount}` : ''}.`
      );
      if (errors.length) {
        errors.slice(0, 6).forEach((msg) => toast.warn(msg, { autoClose: 6500 }));
      }
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi import vào phòng.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <RoleLayout
      title="Quản lý tài sản theo phòng học"
      menuItems={menuItems}
      activeKey="room-assets"
      onMenuSelect={handleMenuSelect}
      onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      userName={user?.fullName || user?.username || 'School Admin'}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
    >
      <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 120px)' }}>

        {/* ════ Cột trái: danh sách phòng ════ */}
        <Paper sx={{ width: 290, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight={700}>Danh sách phòng</Typography>
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openAddRoom}>
                Thêm phòng
              </Button>
            </Stack>
            <TextField
              size="small" fullWidth placeholder="Tìm phòng..."
              value={roomSearch} onChange={(e) => setRoomSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
          </Box>

          {loadingRooms ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>
          ) : (
            <List dense sx={{ overflowY: 'auto', flex: 1 }}>
              {filteredRooms.length === 0 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Chưa có phòng nào.</Typography>
                  <Button size="small" sx={{ mt: 1 }} onClick={openAddRoom}>+ Thêm phòng đầu tiên</Button>
                </Box>
              )}
              {filteredRooms.map((room) => (
                <ListItemButton
                  key={room._id}
                  selected={selectedRoom?._id === room._id}
                  onClick={() => loadRoomAssets(room)}
                  sx={{ borderLeft: selectedRoom?._id === room._id ? '3px solid' : '3px solid transparent', borderColor: 'primary.main', pr: 0.5 }}
                >
                  <MeetingRoomIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary', flexShrink: 0 }} />
                  <ListItemText
                    primary={room.roomName}
                    secondaryTypographyProps={{ component: 'div' }}
                    secondary={
                      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                        <Chip label={ROOM_STATUS_LABEL[room.status]?.label || room.status} color={ROOM_STATUS_LABEL[room.status]?.color || 'default'} size="small" sx={{ fontSize: 10, height: 18 }} />
                        {room.zone && <Typography variant="caption" color="text.secondary">Khu {room.zone}</Typography>}
                        <Typography variant="caption" color="text.secondary">• {room.totalTypes || 0} loại</Typography>
                      </Stack>
                    }
                  />
                  <Stack direction="row" sx={{ ml: 'auto', flexShrink: 0 }}>
                    <Tooltip title="Sửa phòng">
                      <IconButton size="small" onClick={(e) => openEditRoom(room, e)}><EditIcon sx={{ fontSize: 15 }} /></IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa phòng">
                      <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteRoomTarget(room); }}>
                        <DeleteIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </ListItemButton>
              ))}
            </List>
          )}
        </Paper>

        {/* ════ Cột phải: tài sản trong phòng ════ */}
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedRoom ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'text.secondary' }}>
              <InventoryIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="body1">Chọn một phòng để xem tài sản</Typography>
            </Box>
          ) : (
            <>
              {/* Header */}
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{selectedRoom.roomName}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={ROOM_STATUS_LABEL[selectedRoom.status]?.label || selectedRoom.status} color={ROOM_STATUS_LABEL[selectedRoom.status]?.color || 'default'} size="small" />
                      {selectedRoom.zone && <Typography variant="caption" color="text.secondary">Khu {selectedRoom.zone}</Typography>}
                      {selectedRoom.floor && <Typography variant="caption" color="text.secondary">• Tầng {selectedRoom.floor}</Typography>}
                      {selectedRoom.capacity > 0 && <Typography variant="caption" color="text.secondary">• Sức chứa: {selectedRoom.capacity}</Typography>}
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => wordInputRef.current?.click()} size="small">
                      Import Word
                    </Button>
                    <input
                      ref={wordInputRef}
                      type="file"
                      accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      style={{ display: 'none' }}
                      onChange={handleWordImport}
                    />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openAddAsset} size="small">
                      Thêm tài sản
                    </Button>
                  </Stack>
                </Stack>
              </Box>

              {/* Bảng tài sản */}
              {loadingItems ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>
              ) : (
                <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell width={50}>#</TableCell>
                        <TableCell width={100}>Mã TS</TableCell>
                        <TableCell>Tên tài sản</TableCell>
                        <TableCell>Loại</TableCell>
                        <TableCell width={70} align="center">ĐVT</TableCell>
                        <TableCell width={90} align="center">Số lượng</TableCell>
                        <TableCell>Ghi chú</TableCell>
                        <TableCell width={100} align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            Phòng này chưa có tài sản. Nhấn &quot;Thêm tài sản&quot; để bắt đầu.
                          </TableCell>
                        </TableRow>
                      )}
                      {items.map((item, idx) => (
                        <TableRow key={item._id} hover>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 0.5, borderRadius: 0.5 }}>
                              {item.assetId?.assetCode || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.assetId?.name}</TableCell>
                          <TableCell><Typography variant="caption" color="text.secondary">{item.assetId?.category}</Typography></TableCell>
                          <TableCell align="center">{item.assetId?.unit || 'Cái'}</TableCell>
                          <TableCell align="center"><Typography fontWeight={600}>{item.quantity}</Typography></TableCell>
                          <TableCell><Typography variant="caption" color="text.secondary">{item.notes || '—'}</Typography></TableCell>
                          <TableCell align="center">
                            <Stack direction="row" justifyContent="center" spacing={0.5}>
                              <Tooltip title="Sửa số lượng">
                                <IconButton size="small" onClick={() => openEditAsset(item)}><EditIcon fontSize="small" /></IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa khỏi phòng">
                                <IconButton size="small" color="error" onClick={() => setDeleteAssetTarget(item)}><DeleteIcon fontSize="small" /></IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {items.length > 0 && (
                <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                  <Stack direction="row" spacing={3}>
                    <Typography variant="caption" color="text.secondary">Tổng loại: <strong>{items.length}</strong></Typography>
                    <Typography variant="caption" color="text.secondary">Tổng số lượng: <strong>{items.reduce((s, i) => s + i.quantity, 0)}</strong></Typography>
                  </Stack>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>

      {/* ════ Dialog thêm / sửa PHÒNG ════ */}
      <Dialog open={roomDialogOpen} onClose={() => setRoomDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRoom ? 'Sửa thông tin phòng' : 'Thêm phòng mới'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Tên phòng" value={roomForm.roomName} onChange={(e) => setRoomForm((f) => ({ ...f, roomName: e.target.value }))} fullWidth required size="small" />
            <Stack direction="row" spacing={2}>
              <TextField select label="Khu" value={roomForm.zone} onChange={(e) => setRoomForm((f) => ({ ...f, zone: e.target.value }))} fullWidth size="small">
                <MenuItem value="A">Khu A</MenuItem>
                <MenuItem value="B">Khu B</MenuItem>
              </TextField>
              <TextField label="Tầng" type="number" value={roomForm.floor} onChange={(e) => setRoomForm((f) => ({ ...f, floor: Number(e.target.value) }))} inputProps={{ min: 1 }} fullWidth size="small" />
              <TextField label="Sức chứa" type="number" value={roomForm.capacity} onChange={(e) => setRoomForm((f) => ({ ...f, capacity: Number(e.target.value) }))} inputProps={{ min: 0 }} fullWidth size="small" />
            </Stack>
            <TextField select label="Trạng thái" value={roomForm.status} onChange={(e) => setRoomForm((f) => ({ ...f, status: e.target.value }))} fullWidth size="small">
              <MenuItem value="available">Trống</MenuItem>
              <MenuItem value="in_use">Đang dùng</MenuItem>
              <MenuItem value="maintenance">Bảo trì</MenuItem>
            </TextField>
            <TextField label="Ghi chú" value={roomForm.note} onChange={(e) => setRoomForm((f) => ({ ...f, note: e.target.value }))} fullWidth multiline rows={2} size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomDialogOpen(false)} disabled={savingRoom}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveRoom} disabled={savingRoom}>
            {savingRoom ? <CircularProgress size={18} /> : editRoom ? 'Lưu' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════ Dialog thêm / sửa TÀI SẢN trong phòng ════ */}
      <Dialog open={assetDialogOpen} onClose={() => setAssetDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editAsset ? 'Sửa số lượng tài sản' : 'Thêm tài sản vào phòng'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!editAsset ? (
              <TextField select label="Loại tài sản" value={assetForm.assetId} onChange={(e) => setAssetForm((f) => ({ ...f, assetId: e.target.value }))} fullWidth required size="small"
                helperText={availableAssets.length === 0 ? 'Tất cả tài sản trong catalog đã được thêm.' : ''}>
                {availableAssets.length === 0 && <MenuItem disabled value="">Không còn tài sản nào</MenuItem>}
                {availableAssets.map((a) => (
                  <MenuItem key={a._id} value={a._id}>[{a.assetCode}] {a.name} — {a.unit}</MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField label="Tài sản" value={`[${editAsset.assetId?.assetCode}] ${editAsset.assetId?.name}`} fullWidth size="small" disabled />
            )}
            <TextField label="Số lượng" type="number" value={assetForm.quantity} onChange={(e) => setAssetForm((f) => ({ ...f, quantity: Number(e.target.value) }))} inputProps={{ min: 0 }} fullWidth required size="small" />
            <TextField label="Ghi chú (tuỳ chọn)" value={assetForm.notes} onChange={(e) => setAssetForm((f) => ({ ...f, notes: e.target.value }))} fullWidth multiline rows={2} size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssetDialogOpen(false)} disabled={savingAsset}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveAsset} disabled={savingAsset}>
            {savingAsset ? <CircularProgress size={18} /> : editAsset ? 'Lưu' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════ Confirm xóa phòng ════ */}
      <ConfirmDialog
        open={!!deleteRoomTarget}
        title="Xóa phòng"
        message={`Xóa phòng "${deleteRoomTarget?.roomName}"? Tất cả tài sản gán cho phòng này cũng sẽ bị xóa.`}
        onConfirm={handleDeleteRoom}
        onCancel={() => setDeleteRoomTarget(null)}
        loading={deletingRoom}
      />

      {/* ════ Confirm xóa tài sản ════ */}
      <ConfirmDialog
        open={!!deleteAssetTarget}
        title="Xóa tài sản khỏi phòng"
        message={`Xóa "${deleteAssetTarget?.assetId?.name}" khỏi phòng "${selectedRoom?.roomName}"?`}
        onConfirm={handleDeleteAsset}
        onCancel={() => setDeleteAssetTarget(null)}
        loading={deletingAsset}
      />

      <Dialog open={importOpen} onClose={() => !importing && setImportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Xem trước import vào phòng "{selectedRoom?.roomName}" — {importRows.length} mục hợp lệ
        </DialogTitle>
        <DialogContent dividers>
          {importRows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Không có mục nào hợp lệ để import.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={50}>#</TableCell>
                  <TableCell width={120}>Mã TS</TableCell>
                  <TableCell>Tên tài sản</TableCell>
                  <TableCell width={80} align="center">ĐVT</TableCell>
                  <TableCell width={100} align="center">Số lượng</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {importRows.map((r, idx) => (
                  <TableRow key={`${r.assetCode}-${r.name}-${idx}`}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{r.assetCode}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell align="center">{r.unit}</TableCell>
                    <TableCell align="center">{r.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {importSkipped.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                Mục bị bỏ qua: {importSkipped.length}
              </Typography>
              <List dense sx={{ maxHeight: 140, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {importSkipped.slice(0, 30).map((m, idx) => (
                  <ListItemText key={`${m}-${idx}`} primaryTypographyProps={{ variant: 'caption', color: 'text.secondary', sx: { px: 1.5, py: 0.3 } }} primary={m} />
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)} disabled={importing}>Hủy</Button>
          <Button variant="contained" onClick={confirmImport} disabled={importing || importRows.length === 0} startIcon={importing ? <CircularProgress size={16} /> : <UploadFileIcon />}>
            {importing ? 'Đang import...' : `Import ${importRows.length} mục`}
          </Button>
        </DialogActions>
      </Dialog>
    </RoleLayout>
  );
}
