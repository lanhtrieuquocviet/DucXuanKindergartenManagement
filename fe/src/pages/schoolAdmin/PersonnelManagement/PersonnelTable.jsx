import { memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';

const ROLE_COLORS = {
  SchoolAdmin: { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe', label: 'Admin' },
  Teacher: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'Giáo viên' },
  Leader: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', label: 'Tổ trưởng' },
  Staff: { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', label: 'Nhân viên' },
  Kitchen: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', label: 'Bếp' },
  Medical: { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd', label: 'Y tế' },
};

const PersonnelTable = memo(({
  data,
  onEdit,
  onDelete,
}) => {
  const calculateSeniority = (hireDate) => {
    if (!hireDate) return null;
    const hire = new Date(hireDate);
    const now = new Date();
    const diff = now - hire;
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    if (years < 1) return 'Mới';
    return `${years}n`;
  };

  return (
    <TableContainer>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#f8fafc' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800, py: 1.5, whiteSpace: 'nowrap' }}>Thành viên & ID</TableCell>
            <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Chức vụ & Vai trò</TableCell>
            <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Trình độ & Thâm niên</TableCell>
            <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Liên hệ</TableCell>
            <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Trạng thái</TableCell>
            <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item._id} hover sx={{ '&:last-child td': { border: 0 } }}>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1.2}>
                  <Avatar
                    src={item.avatar}
                    sx={{ width: 28, height: 28, bgcolor: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    {item.fullName?.charAt(0)?.toUpperCase() || <PersonIcon sx={{ fontSize: 16 }} />}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200, display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {item.fullName}
                    <Typography component="span" variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                      ({item.username})
                    </Typography>
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1} noWrap>
                  <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ whiteSpace: 'nowrap' }}>
                    {item.position || 'NV'}
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                  <Stack direction="row" spacing={0.5}>
                    {(item.roleNames || '').split(',').slice(0, 2).map((r) => {
                      const role = r.trim();
                      const config = ROLE_COLORS[role] || { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', label: role };
                      return (
                        <Chip
                          key={role}
                          label={config.label}
                          size="small"
                          sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: config.bg, color: config.text, border: '1px solid', borderColor: config.border }}
                        />
                      );
                    })}
                  </Stack>
                </Stack>
              </TableCell>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>{item.degree || '—'}</Typography>
                  {item.hireDate && (
                    <Chip label={calculateSeniority(item.hireDate)} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600, color: 'text.secondary' }} />
                  )}
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                  {item.phone || item.email || '—'}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={item.status?.toLowerCase() === 'active' ? 'Active' : 'Locked'}
                  size="small"
                  sx={{ 
                    height: 18, fontSize: '0.6rem', fontWeight: 800,
                    bgcolor: item.status?.toLowerCase() === 'active' ? '#dcfce7' : '#fee2e2',
                    color: item.status?.toLowerCase() === 'active' ? '#166534' : '#991b1b',
                  }}
                />
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: '#3b82f6', p: 0.5 }}>
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDelete(item)} sx={{ color: '#ef4444', p: 0.5 }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export default PersonnelTable;
