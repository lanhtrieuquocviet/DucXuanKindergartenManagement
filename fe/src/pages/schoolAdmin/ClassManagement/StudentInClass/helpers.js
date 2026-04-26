export function calcAge(dob) {
  if (!dob) return null;
  return new Date().getFullYear() - new Date(dob).getFullYear();
}

export function fmtDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('vi-VN');
}

export function attendanceColor(status) {
  if (status === 'present') return { bg: '#f0fdf4', color: '#15803d', label: 'Có mặt' };
  if (status === 'absent') return { bg: '#fef2f2', color: '#dc2626', label: 'Vắng mặt' };
  if (status === 'leave') return { bg: '#fffbeb', color: '#d97706', label: 'Xin phép' };
  return { bg: '#f3f4f6', color: '#6b7280', label: 'Chưa điểm danh' };
}
