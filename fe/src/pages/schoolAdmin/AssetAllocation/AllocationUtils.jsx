import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

// ─── Constants ────────────────────────────────────────────────────────────────
export const STATUS_INFO = {
  pending_confirmation: { label: 'Chờ xác nhận',  color: 'warning' },
  active:               { label: 'Đang sử dụng',  color: 'success' },
  transferred:          { label: 'Đã chuyển lớp', color: 'info' },
  returned:             { label: 'Đã thu hồi',    color: 'default' },
};

export const TARGET_USER_OPTIONS = ['Trẻ', 'Giáo viên', 'Dùng chung'];

export const normalizeLabel = (value = '') => String(value).trim().toLowerCase();

export function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN');
}

let _keyCounter = 1;
export const nextKey = () => _keyCounter++;

export const emptyAssetRow  = () => ({ _key: nextKey(), category: '', assetCode: '', name: '', unit: 'Cái', quantity: 1, targetUser: 'Trẻ', notes: '' });
export const emptySeparator = (name = '') => ({ _key: nextKey(), _isSeparator: true, categoryName: name });

export const emptyForm = () => ({
  classId: '',
  className: '',
  teacherName: '',
  teacherPosition: 'Giáo viên',
  handoverByName: '',
  handoverByPosition: 'Hiệu trưởng',
  handoverDate: new Date().toISOString().slice(0, 10),
  academicYear: '',
  assets: [emptyAssetRow()],
  extraAssets: [],
  notes: '',
});

export const emptyTransferForm = () => ({
  toClassId: '',
  toClassName: '',
  toTeacherName: '',
  transferDate: new Date().toISOString().slice(0, 10),
  note: '',
});

// Chuyển mảng flat (có separator) → mảng assets DB (category field)
export function flatToAssets(flat) {
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
export function assetsToFlat(assets) {
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

// ─── Shared: Confirm Dialog ──────────────────────────────────────────────────
export function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title || 'Xác nhận'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>Hủy</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Xác nhận'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
