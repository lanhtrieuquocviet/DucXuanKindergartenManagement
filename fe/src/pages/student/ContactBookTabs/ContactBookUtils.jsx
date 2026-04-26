import { 
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  EventBusy as LeaveIcon,
} from '@mui/icons-material';

export const PRIMARY = '#059669';

export function fmtDate(d) { 
  return d ? new Date(d).toLocaleDateString('vi-VN') : '—'; 
}

export function genderLabel(g) { 
  return g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'; 
}

export function calcAge(dob) {
  if (!dob) return null;
  const b = new Date(dob), now = new Date();
  let y = now.getFullYear() - b.getFullYear();
  if (now.getMonth() - b.getMonth() < 0 || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) y--;
  return y > 0 ? `${y} tuổi` : null;
}

export function calcBMI(h, w) { 
  return (h && w) ? +(w / ((h / 100) ** 2)).toFixed(1) : null; 
}

export function bmiLabel(bmi) {
  if (!bmi) return null;
  if (bmi < 14.5) return { label: 'Thiếu cân', color: 'info' };
  if (bmi < 18)   return { label: 'Bình thường', color: 'success' };
  if (bmi < 25)   return { label: 'Thừa cân', color: 'warning' };
  return           { label: 'Béo phì', color: 'error' };
}

export const STATUS_HEALTH = { 
  healthy: { label: 'Bình thường', color: 'success' }, 
  monitor: { label: 'Cần theo dõi', color: 'warning' }, 
  concerning: { label: 'Đáng lo ngại', color: 'error' } 
};

export const ATTENDANCE_CFG = {
  present: { label: 'Có mặt', color: '#16a34a', bg: '#dcfce7', icon: <PresentIcon sx={{ fontSize: 14 }} /> },
  absent:  { label: 'Vắng',   color: '#dc2626', bg: '#fee2e2', icon: <AbsentIcon  sx={{ fontSize: 14 }} /> },
  leave:   { label: 'Nghỉ phép', color: '#d97706', bg: '#fef3c7', icon: <LeaveIcon sx={{ fontSize: 14 }} /> },
};
