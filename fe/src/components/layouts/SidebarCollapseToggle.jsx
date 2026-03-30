import { Box, IconButton, Tooltip } from '@mui/material';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';

/**
 * Nút thu gọn / mở rộng sidebar.
 * @param {boolean}  collapsed        - sidebar đang thu gọn
 * @param {function} onToggleCollapse - callback khi nhấn nút
 */
export default function SidebarCollapseToggle({ collapsed, onToggleCollapse }) {
  return (
    <Box sx={{ px: 1, pt: 1, pb: 0.25, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
      <Tooltip title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'} placement="right" arrow>
        <IconButton
          size="small"
          onClick={onToggleCollapse}
          sx={{
            width: 26, height: 26,
            bgcolor: 'grey.100',
            border: '1px solid', borderColor: 'divider',
            color: 'text.secondary',
            '&:hover': { bgcolor: 'rgba(99,102,241,0.1)', color: 'primary.main', borderColor: 'rgba(99,102,241,0.3)' },
          }}
        >
          {collapsed
            ? <ChevronRightIcon sx={{ fontSize: 15 }} />
            : <ChevronLeftIcon sx={{ fontSize: 15 }} />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
