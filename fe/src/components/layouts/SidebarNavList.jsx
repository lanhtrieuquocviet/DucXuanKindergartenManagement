import { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, Chip, Tooltip,
  Skeleton
} from '@mui/material';
import { Circle as DotIcon, ExpandLess, ExpandMore } from '@mui/icons-material';

let _savedScrollTop = 0;

/**
 * Danh sách menu điều hướng trong sidebar.
 * @param {Array}   menuItems    - mảng menu item { key, label, icon?, badge?, children? }
 * @param {string}  activeKey    - key của trang đang active
 * @param {function}onMenuSelect - callback khi chọn menu
 * @param {boolean} collapsed    - sidebar đang thu gọn
 * @param {object}  keyIcons     - map key -> ReactElement icon (fallback khi item không có icon)
 * @param {string}  sectionLabel - tiêu đề section (ẩn khi collapsed)
 */
export default function SidebarNavList({
  menuItems = [],
  activeKey,
  onMenuSelect,
  collapsed,
  keyIcons = {},
  sectionLabel = 'Menu chính',
  loading = false,
}) {
  const getInitialOpenGroups = () => {
    const init = {};
    menuItems.forEach((item) => {
      if (Array.isArray(item.children) && item.children.some((c) => c.key === activeKey)) {
        init[item.key] = true;
      }
    });
    return init;
  };

  const [openGroups, setOpenGroups] = useState(getInitialOpenGroups);
  const scrollRef = useRef(null);

  useEffect(() => {
    setOpenGroups((prev) => {
      const updated = { ...prev };
      menuItems.forEach((item) => {
        if (Array.isArray(item.children) && item.children.some((c) => c.key === activeKey)) {
          updated[item.key] = true;
        }
      });
      return updated;
    });
  }, [activeKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = _savedScrollTop;
    }
    return () => {
      if (scrollRef.current) {
        _savedScrollTop = scrollRef.current.scrollTop;
      }
    };
  }, []);

  // Giữ nguyên vị trí cuộn khi chuyển trang/menu trong cùng sidebar
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;
    const rafId = requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = _savedScrollTop;
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [activeKey, collapsed, menuItems.length]);

  return (
    <Box
      ref={scrollRef}
      onScroll={(e) => {
        _savedScrollTop = e.currentTarget.scrollTop;
      }}
      sx={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden', pt: 0.75, pb: 1,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.200', borderRadius: 2 },
      }}
    >
      {!collapsed && (
        <Typography
          variant="caption"
          sx={{ px: 2.5, mb: 1, display: 'block', color: 'text.disabled', fontWeight: 700, letterSpacing: 1.2, fontSize: 10, textTransform: 'uppercase' }}
        >
          {sectionLabel}
        </Typography>
      )}

      <List dense disablePadding sx={{ px: collapsed ? 0.75 : 1 }}>
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Box key={i} sx={{ px: collapsed ? 0 : 1.5, py: 1, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: collapsed ? 0 : 2, flexShrink: 0 }} />
              {!collapsed && <Skeleton variant="text" width="70%" height={20} />}
            </Box>
          ))
        ) : (
          menuItems.map((item) => {
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;
          const isChildActive = hasChildren
            ? item.children.some((child) => child.key === activeKey)
            : false;
          const isActive = item.key === activeKey || isChildActive;
          const icon = item.icon || keyIcons[item.key] || <DotIcon fontSize="small" />;
          const isGroupOpen = openGroups[item.key] ?? false;

          const parentButton = (
            <ListItemButton
              key={item.key}
              onClick={() => {
                if (hasChildren) {
                  setOpenGroups((prev) => ({ ...prev, [item.key]: !isGroupOpen }));
                } else {
                  onMenuSelect(item.key);
                }
              }}
              sx={{
                mb: 0.5, borderRadius: 2,
                px: collapsed ? 0 : 1.5,
                minHeight: 40,
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative', overflow: 'hidden',
                bgcolor: isActive ? 'rgba(99,102,241,0.09)' : 'transparent',
                color: isActive ? 'primary.main' : 'text.secondary',
                '&::before': isActive && !collapsed
                  ? {
                      content: '""',
                      position: 'absolute',
                      left: 0, top: '18%', bottom: '18%',
                      width: 3.5, borderRadius: '0 4px 4px 0',
                      background: 'linear-gradient(180deg, #4f46e5, #7c3aed)',
                    }
                  : {},
                '&:hover': {
                  bgcolor: isActive ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.04)',
                  color: isActive ? 'primary.main' : 'text.primary',
                },
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: isActive ? 'primary.main' : 'text.disabled', justifyContent: 'center' }}>
                {icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { style: { fontSize: 13, fontWeight: isActive ? 700 : 400 } } }}
                />
              )}
              {!collapsed && item.badge && (
                <Chip label={item.badge} size="small" color={isActive ? 'primary' : 'default'} sx={{ height: 18, fontSize: 10 }} />
              )}
              {!collapsed && hasChildren && (
                isGroupOpen ? <ExpandLess sx={{ fontSize: 16, ml: 0.5, color: 'text.disabled' }} /> : <ExpandMore sx={{ fontSize: 16, ml: 0.5, color: 'text.disabled' }} />
              )}
            </ListItemButton>
          );

          if (!hasChildren) {
            return collapsed
              ? <Tooltip key={item.key} title={item.label} placement="right" arrow>{parentButton}</Tooltip>
              : <span key={item.key}>{parentButton}</span>;
          }

          return (
            <Box key={item.key} sx={{ mb: 0.25 }}>
              {collapsed
                ? <Tooltip title={item.label} placement="right" arrow>{parentButton}</Tooltip>
                : parentButton}
              {!collapsed && isGroupOpen && (
                <List dense disablePadding sx={{ pl: 4 }}>
                  {item.children.map((child) => {
                    const childIsActive = child.key === activeKey;
                    const childIcon = child.icon || keyIcons[child.key] || <DotIcon sx={{ fontSize: 8 }} />;
                    return (
                      <ListItemButton
                        key={child.key}
                        onClick={() => onMenuSelect(child.key)}
                        sx={{
                          mb: 0.5, 
                          borderRadius: '0 20px 20px 0', 
                          minHeight: 40, 
                          pl: 2,
                          pr: 2,
                          position: 'relative',
                          bgcolor: childIsActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                          color: childIsActive ? 'primary.main' : 'text.secondary',
                          '&::before': childIsActive
                            ? {
                                content: '""',
                                position: 'absolute',
                                left: 0, top: '15%', bottom: '15%',
                                width: 3.5, borderRadius: '0 4px 4px 0',
                                background: 'linear-gradient(180deg, #4f46e5, #7c3aed)',
                              }
                            : {},
                          '&:hover': {
                            bgcolor: childIsActive ? 'rgba(99, 102, 241, 0.18)' : 'rgba(0, 0, 0, 0.04)',
                            color: childIsActive ? 'primary.main' : 'text.primary',
                          },
                          transition: 'all 0.2s ease',
                          ml: -4, // Pull back to align with parent edge if needed, adjust based on List pl
                        }}
                      >
                        <ListItemIcon sx={{ 
                          minWidth: 32, 
                          color: childIsActive ? 'primary.main' : 'text.disabled',
                          display: 'flex',
                          justifyContent: 'center'
                        }}>
                          {childIcon}
                        </ListItemIcon>
                        <ListItemText
                          primary={child.label}
                          slotProps={{ 
                            primary: { 
                              style: { 
                                fontSize: '0.85rem', 
                                fontWeight: childIsActive ? 700 : 500,
                                letterSpacing: childIsActive ? '0.01em' : 'normal'
                              } 
                            } 
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </Box>
          );
        })
      )}
      </List>
    </Box>
  );
}
