import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  TextField,
  Box,
  TableCell
} from '@mui/material';
import { useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
export const STATUS_LABEL = {
  draft: { label: 'Nháp', color: 'default' },
  pending: { label: 'Chờ duyệt', color: 'warning' },
  approved: { label: 'Đã duyệt', color: 'success' },
  rejected: { label: 'Từ chối', color: 'error' },
};

export function formatDateInput(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export const emptyMember = () => ({ userId: null, fullName: '', position: '', role: 'Thành viên', notes: '' });
export const emptyCommittee = () => ({ name: '', foundedDate: new Date().toISOString().slice(0, 10), decisionNumber: '', members: [emptyMember()] });
export const emptyAssetRow = () => ({ category: '', assetCode: '', name: '', unit: 'Cái', quantity: 0, targetUser: '', notes: '' });
export const emptyAsset = () => ({
  assetCode: '', name: '', category: 'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em', room: '',
  requiredQuantity: 0, quantity: 1, area: '', constructionType: 'Không áp dụng',
  unit: 'Cái', condition: 'Còn tốt', notes: '',
  seats1: null, seats2: null, seats4: null,
});
export const emptyMinutes = () => ({
  className: '',
  location: 'Đức Xuân',
  inspectionDate: new Date().toISOString().slice(0, 10),
  inspectionTime: '',
  endTime: '',
  reason: 'Kiểm kê tài sản có trong lớp học tại thời điểm cuối năm',
  inspectionMethod: 'Kiểm kê số tài sản có trong lớp học và theo Thông tư 01 của Bộ GD&ĐT ban hành và các thiết bị dạy học khác.\nTổng hợp số liệu báo cáo về nhà trường để có kế hoạch bổ sung và theo dõi.',
  committeeId: '',
  assets: [emptyAssetRow()],
  extraAssets: [],
  conclusion: '',
});

export const CONDITION_OPTIONS = ['Còn tốt', 'Không sử dụng được'];
export const CONDITION_COLOR = { 'Còn tốt': 'success', 'Không sử dụng được': 'error' };
export const CATEGORY_OPTIONS = [
  'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em',
  'Số bàn, ghế ngồi',
  'Khối phòng phục vụ học tập',
  'Phòng tổ chức ăn, nghỉ',
  'Công trình công cộng và khối phòng phục vụ khác',
  'Khối phòng hành chính quản trị',
  'Diện tích đất',
  'Thiết bị dạy học và CNTT',
];
export const CONSTRUCTION_OPTIONS = ['Kiên cố', 'Bán kiên cố', 'Tạm', 'Không áp dụng'];

export const SECTION7_CATEGORIES = ['Diện tích đất', 'Thiết bị dạy học và CNTT'];
export const SECTION7_SUB_LABELS = {
  'Diện tích đất': '7.1. Diện tích đất (Tính đến thời điểm hiện tại)',
  'Thiết bị dạy học và CNTT': '7.2. Thiết bị dạy học và thiết bị Công nghệ thông tin',
};
export const SECTION7_PRESETS = {
  'Diện tích đất': [
    { name: 'Tổng diện tích khuôn viên đất', unit: 'm²' },
    { name: 'Diện tích sân chơi', unit: 'm²' },
    { name: 'Diện tích sân vườn (dùng cho trẻ khám phá, trải nghiệm)', unit: 'm²' },
  ],
  'Thiết bị dạy học và CNTT': [
    { name: 'Thiết bị dạy học tối thiểu', unit: 'Bộ' },
    { name: 'Thiết bị đồ chơi ngoài trời', unit: 'Loại' },
    { name: 'Tổng số máy tính đang được sử dụng (Bao gồm cả Laptop và PC)', unit: 'Bộ' },
    { name: 'Tổng số đường truyền Internet (Bao gồm cả thuê bao miễn phí và trả phí)', unit: 'Bộ' },
    { name: 'Số máy tính được kết nối Internet', unit: 'Bộ' },
    { name: 'Số máy tính phục vụ công tác Quản lý', unit: 'Bộ' },
    { name: 'Số máy tính phục vụ công tác Giảng dạy, Học tập', unit: 'Bộ' },
    { name: 'Máy chiếu', unit: 'Chiếc' },
    { name: 'Máy Photocopy', unit: 'Chiếc' },
    { name: 'Máy in', unit: 'Chiếc' },
    { name: 'Máy Scaner', unit: 'Chiếc' },
    { name: 'Máy ép Plastic', unit: 'Chiếc' },
    { name: 'Tivi dùng cho công tác quản lý', unit: 'Chiếc' },
    { name: 'Tivi tại các phòng học', unit: 'Chiếc' },
    { name: 'Đàn phím điện tử', unit: 'Chiếc' },
    { name: 'Tủ đựng đồ', unit: 'Chiếc' },
  ],
};
export const UNIT_OPTIONS = ['Cái', 'Bộ', 'Loại', 'Chiếc', 'm²', 'Phòng', 'Bàn', 'Ghế', 'Khác'];

export const WAREHOUSE_CATEGORIES = ['Đồ dùng', 'Thiết bị dạy học, đồ chơi và học liệu', 'Sách, tài liệu, băng đĩa', 'Thiết bị ngoài thông tư'];
export const WAREHOUSE_CATEGORY_PREFIX = { 'Đồ dùng': 'I', 'Thiết bị dạy học, đồ chơi và học liệu': 'II', 'Sách, tài liệu, băng đĩa': 'III', 'Thiết bị ngoài thông tư': 'IV' };
export const emptyWarehouseAsset = () => ({ assetCode: '', name: '', category: 'Đồ dùng', unit: 'Cái', quantity: 0, brokenQuantity: 0, notes: '' });

export function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── Shared: Inline-edit cell components ─────────────────────────────────────
export function InlineCell({ a, field, align = 'left', isText = false, ie, setIe, onSave, sx = {} }) {
  const isEditing = ie?.id === a._id && ie?.field === field;
  const rawVal = a[field];
  const display = rawVal != null && rawVal !== '' ? rawVal : '—';
  if (isEditing) {
    return (
      <TableCell align={align} sx={{ p: '2px 4px', ...sx }}>
        <input
          autoFocus
          type={isText ? 'text' : 'number'}
          defaultValue={rawVal ?? ''}
          style={{
            width: '100%', border: '1px solid #1a56db', borderRadius: 4,
            padding: '2px 6px', fontSize: 13, outline: 'none',
            textAlign: align === 'center' ? 'center' : 'left', background: '#f0f7ff',
          }}
          onBlur={e => onSave(a._id, field, e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') e.target.blur();
            if (e.key === 'Escape') setIe(null);
          }}
        />
      </TableCell>
    );
  }
  return (
    <TableCell
      align={align}
      onClick={() => setIe({ id: a._id, field, value: rawVal })}
      sx={{ cursor: 'text', '&:hover': { backgroundColor: '#e8f4fd' }, ...sx }}
    >
      {display}
    </TableCell>
  );
}

export function InlineSelectCell({ a, field, options, align = 'center', ie, setIe, onSave, renderValue }) {
  const isEditing = ie?.id === a._id && ie?.field === field;
  const rawVal = a[field];
  if (isEditing) {
    return (
      <TableCell align={align} sx={{ p: '2px 4px' }}>
        <select
          autoFocus
          defaultValue={rawVal}
          style={{ width: '100%', border: '1px solid #1a56db', borderRadius: 4, padding: '2px 4px', fontSize: 12 }}
          onChange={e => onSave(a._id, field, e.target.value)}
          onBlur={() => setIe(null)}
          onKeyDown={e => e.key === 'Escape' && setIe(null)}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </TableCell>
    );
  }
  return (
    <TableCell
      align={align}
      onClick={() => setIe({ id: a._id, field, value: rawVal })}
      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#e8f4fd' } }}
    >
      {renderValue ? renderValue(rawVal) : (rawVal || '—')}
    </TableCell>
  );
}

// ─── Shared: Confirm Delete Dialog ───────────────────────────────────────────
export function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading, confirmText = 'Xóa', loadingText = 'Đang xóa...' }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title || 'Xác nhận'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>Hủy</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}>
          {loading ? loadingText : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Shared: Add Category Dialog ─────────────────────────────────────────────
export function AddCategoryDialog({ open, onClose, onConfirm }) {
  const [value, setValue] = useState('');
  const handleConfirm = () => {
    if (!value.trim()) return;
    onConfirm(value.trim());
    setValue('');
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Thêm nhóm tài sản</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Tên nhóm"
          placeholder="VD: ĐỒ DÙNG, THIẾT BỊ DẠY HỌC"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={() => { onClose(); setValue(''); }}>Hủy</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!value.trim()}>Thêm</Button>
      </DialogActions>
    </Dialog>
  );
}
