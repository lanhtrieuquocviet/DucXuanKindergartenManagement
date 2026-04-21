import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, Stack, IconButton, Avatar,
  Paper, Skeleton, Tabs, Tab, Divider, Tooltip,
  Fade, LinearProgress, useMediaQuery, useTheme,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as CircleIcon,
  KeyboardArrowRight as ArrowIcon,
  AccountTree as FlowIcon,
  Commit as NodeIcon,
  Psychology as AiIcon,
  GppGood as AuditIcon,
  NotificationsActive as NotifyIcon,
  Save as SaveIcon,
  CallSplit as SplitIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { get, put, ENDPOINTS } from '../../../service/api';
import RoleLayout from '../../../layouts/RoleLayout';
import { useAuth } from '../../../context/AuthContext';
import { useSchoolAdminMenu } from '../useSchoolAdminMenu';
import { createSchoolAdminMenuSelect } from '../schoolAdminMenuConfig';
import { toast } from 'react-toastify';

// ── Màu & icon theo category ─────────────────────────────────────
const CATEGORY_META = {
  system:  { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: <FlowIcon   sx={{ fontSize: 16 }} /> },
  ai:      { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icon: <AiIcon     sx={{ fontSize: 16 }} /> },
  logic:   { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: <SplitIcon  sx={{ fontSize: 16 }} /> },
  audit:   { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: <AuditIcon  sx={{ fontSize: 16 }} /> },
  action:  { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', icon: <NotifyIcon sx={{ fontSize: 16 }} /> },
  Other:   { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: <NodeIcon   sx={{ fontSize: 16 }} /> },
};

const getCategoryMeta = (cat) => CATEGORY_META[cat] || CATEGORY_META.Other;

// ── Node Card ────────────────────────────────────────────────────
function NodeCard({ node, index, total, isLast }) {
  const cat  = node.data?.nodeCategory || 'Other';
  const meta = getCategoryMeta(cat);

  return (
    <Box sx={{ display: 'flex', gap: 2, position: 'relative' }}>
      {/* Cột timeline */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
        <Avatar
          sx={{
            width: 40, height: 40,
            bgcolor: meta.bg,
            border: `2px solid ${meta.color}`,
            color: meta.color,
            fontSize: 13, fontWeight: 800,
            boxShadow: `0 0 0 3px ${meta.bg}`,
          }}
        >
          {index + 1}
        </Avatar>
        {!isLast && (
          <Box sx={{ width: 2, flex: 1, minHeight: 24, bgcolor: '#e2e8f0', mt: 0.5, mb: 0.5, borderRadius: 1 }} />
        )}
      </Box>

      {/* Card nội dung */}
      <Paper
        elevation={0}
        sx={{
          flex: 1, mb: isLast ? 0 : 1.5,
          p: { xs: 1.5, sm: 2 },
          border: `1.5px solid ${meta.border}`,
          borderRadius: 3,
          bgcolor: meta.bg,
          transition: 'box-shadow .15s',
          '&:hover': { boxShadow: `0 4px 16px ${meta.color}22` },
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Box
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: '50%',
              bgcolor: meta.color + '18', color: meta.color,
            }}
          >
            {meta.icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1e293b', lineHeight: 1.3 }}>
              {node.data?.label || node.id}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              ID: <code style={{ fontFamily: 'monospace', fontSize: 11 }}>{node.id}</code>
            </Typography>
          </Box>
          <Chip
            label={cat}
            size="small"
            sx={{
              bgcolor: meta.color + '18',
              color: meta.color,
              fontWeight: 700,
              fontSize: 10,
              height: 20,
            }}
          />
        </Stack>
      </Paper>
    </Box>
  );
}

// ── Edge Row ─────────────────────────────────────────────────────
function EdgeRow({ edge }) {
  const hasCondition = edge.sourceHandle;
  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        px: 2, py: 0.75,
        borderRadius: 2,
        bgcolor: hasCondition ? '#fffbeb' : '#f8fafc',
        border: '1px solid', borderColor: hasCondition ? '#fde68a' : '#e2e8f0',
        mb: 0.75,
      }}
    >
      <ArrowIcon sx={{ fontSize: 16, color: hasCondition ? '#f59e0b' : '#94a3b8' }} />
      <Typography variant="caption" sx={{ color: '#475569', fontFamily: 'monospace', flex: 1 }}>
        <strong>{edge.source}</strong> → <strong>{edge.target}</strong>
      </Typography>
      {hasCondition && (
        <Chip
          label={edge.sourceHandle === 'true' ? '✅ true' : '❌ false'}
          size="small"
          sx={{
            height: 18, fontSize: 10,
            bgcolor: edge.sourceHandle === 'true' ? '#dcfce7' : '#fee2e2',
            color: edge.sourceHandle === 'true' ? '#16a34a' : '#dc2626',
            fontWeight: 700,
          }}
        />
      )}
    </Box>
  );
}

// ── Header Badge ─────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active:   { label: 'Đang chạy', color: '#10b981', bg: '#f0fdf4' },
    draft:    { label: 'Bản nháp',  color: '#f59e0b', bg: '#fffbeb' },
    archived: { label: 'Lưu trữ',  color: '#6b7280', bg: '#f3f4f6' },
  };
  const s = map[status] || map.draft;
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 11, border: `1px solid ${s.color}33` }}
    />
  );
}

// ── Main Component ───────────────────────────────────────────────
const WorkflowBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, logout } = useAuth();
  const menuItems = useSchoolAdminMenu();
  const handleMenuSelect = createSchoolAdminMenuSelect(navigate);

  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState(0);

  useEffect(() => {
    const fetchWorkflow = async () => {
      setLoading(true);
      try {
        const res = await get(`/api/bpm/workflows/${id}`);
        setWorkflow(res.data);
      } catch (err) {
        toast.error('Không thể tải quy trình');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchWorkflow();
  }, [id]);

  // Thống kê nhanh
  const stats = workflow ? {
    total:  workflow.nodes.length,
    ai:     workflow.nodes.filter(n => n.data?.nodeCategory === 'ai').length,
    audit:  workflow.nodes.filter(n => n.data?.nodeCategory === 'audit').length,
    action: workflow.nodes.filter(n => n.data?.nodeCategory === 'action').length,
    edges:  workflow.edges.length,
  } : null;

  return (
    <RoleLayout
      menuItems={menuItems}
      activeKey="bpm"
      onMenuSelect={handleMenuSelect}
      onLogout={logout}
      userName={user?.fullName || user?.username}
      userRole="SchoolAdmin"
    >
      {/* ── Gradient Header ── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: { xs: 0, sm: 3 },
          p: { xs: 2, sm: 3 },
          mb: 3, color: '#fff',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
        <Box sx={{ position: 'absolute', bottom: -20, right: 60, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />

        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, mt: 0.25 }}>
            <BackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mb={0.5}>
              <FlowIcon sx={{ fontSize: 18, opacity: 0.85 }} />
              <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: 1.5, fontSize: 10 }}>
                BPM Workflow
              </Typography>
            </Stack>
            {loading ? (
              <Skeleton variant="text" width={220} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
            ) : (
              <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={800} sx={{ lineHeight: 1.2, mb: 0.75 }}>
                {workflow?.name || 'Quy trình'}
              </Typography>
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.75}>
              {workflow && <StatusBadge status={workflow.status} />}
              {workflow?.module && (
                <Chip label={workflow.module} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: 10, border: '1px solid rgba(255,255,255,0.3)' }} />
              )}
              {workflow?.type && (
                <Chip label={workflow.type} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 10, border: '1px solid rgba(255,255,255,0.25)' }} />
              )}
            </Stack>
          </Box>
        </Stack>

        {/* ── Stats bar ── */}
        {stats && (
          <Box
            sx={{
              mt: 2.5, display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
            }}
          >
            {[
              { label: 'Bước',    value: stats.total  },
              { label: 'AI',      value: stats.ai     },
              { label: 'Audit',   value: stats.audit  },
              { label: 'Cạnh',    value: stats.edges  },
            ].map(s => (
              <Box key={s.label} sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, p: 1, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1 }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: 10 }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* ── Tabs ── */}
      <Tabs
        value={tab} onChange={(_, v) => setTab(v)}
        variant="scrollable" scrollButtons="auto"
        sx={{
          mb: 2,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13, minWidth: 0, px: 2 },
          '& .Mui-selected': { color: '#6366f1' },
          '& .MuiTabs-indicator': { bgcolor: '#6366f1', height: 3, borderRadius: 2 },
        }}
      >
        <Tab label="📋 Các bước" />
        <Tab label="🔗 Luồng kết nối" />
      </Tabs>

      {/* ── Loading ── */}
      {loading && <LinearProgress sx={{ borderRadius: 1, mb: 2 }} />}

      {/* ── TAB 0: Nodes / Timeline ── */}
      {tab === 0 && !loading && workflow && (
        <Fade in>
          <Box sx={{ px: { xs: 0, sm: 1 } }}>
            {workflow.nodes.map((node, idx) => (
              <NodeCard
                key={node.id}
                node={node}
                index={idx}
                total={workflow.nodes.length}
                isLast={idx === workflow.nodes.length - 1}
              />
            ))}
          </Box>
        </Fade>
      )}

      {/* ── TAB 1: Edges ── */}
      {tab === 1 && !loading && workflow && (
        <Fade in>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block', px: 0.5 }}>
              {workflow.edges.length} kết nối giữa các bước
            </Typography>
            {workflow.edges.map(edge => (
              <EdgeRow key={edge.id} edge={edge} />
            ))}
          </Box>
        </Fade>
      )}

      {/* ── Empty state ── */}
      {!loading && !workflow && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <FlowIcon sx={{ fontSize: 64, color: '#e2e8f0', mb: 2 }} />
          <Typography color="text.secondary">Không tìm thấy quy trình</Typography>
        </Box>
      )}

      {/* ── Legend ── */}
      {!loading && workflow && (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            CHÚ THÍCH
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <Chip
                key={key}
                icon={<Box sx={{ color: meta.color, display: 'flex' }}>{meta.icon}</Box>}
                label={key}
                size="small"
                sx={{ bgcolor: meta.bg, color: meta.color, fontSize: 11, fontWeight: 600, border: `1px solid ${meta.border}` }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </RoleLayout>
  );
};

export default WorkflowBuilder;
