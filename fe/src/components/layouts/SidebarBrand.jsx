import { Box, Avatar, Typography } from '@mui/material';

/**
 * Brand header ở đầu sidebar.
 * @param {boolean} collapsed - sidebar đang thu gọn
 * @param {string}  emoji     - icon emoji thương hiệu (vd: '🎓', '🍳')
 * @param {string}  title     - tên thương hiệu
 * @param {string}  subtitle  - mô tả phụ
 */
export default function SidebarBrand({
  collapsed,
  emoji = '🎓',
  title = 'Đức Xuân',
  subtitle = 'Kindergarten Management',
}) {
  return (
    <Box
      sx={{
        px: collapsed ? 1.5 : 2.5, py: 2.25,
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 1.5,
        justifyContent: collapsed ? 'center' : 'flex-start',
        flexShrink: 0,
        position: 'relative', overflow: 'hidden',
        transition: 'padding 0.22s ease',
      }}
    >
      {!collapsed && (
        <>
          <Box sx={{ position: 'absolute', right: -18, top: -18, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
          <Box sx={{ position: 'absolute', right: 30, bottom: -25, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
        </>
      )}
      <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 19, position: 'relative', zIndex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0 }}>
        {emoji}
      </Avatar>
      {!collapsed && (
        <Box sx={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.2, letterSpacing: 0.3 }}>
            {title}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 10.5 }}>
            {subtitle}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
