// Màn hình chọn lớp để bắt đầu điểm danh
import {
  Box, Grid, Card, CardActionArea, Typography, Chip,
  Alert, Skeleton, Stack,
} from '@mui/material';
import {
  School as SchoolIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';

const PALETTE = [
  { bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)', chip: { bgcolor: '#ede9fe', color: '#6d28d9' } },
  { bg: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',  chip: { bgcolor: '#e0f2fe', color: '#0369a1' } },
  { bg: 'linear-gradient(135deg, #10b981, #14b8a6)',  chip: { bgcolor: '#d1fae5', color: '#065f46' } },
  { bg: 'linear-gradient(135deg, #f59e0b, #ef4444)',  chip: { bgcolor: '#fef3c7', color: '#92400e' } },
];

function ClassSelector({ classes, loadingClasses, classesError, onSelect }) {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700} color="text.primary">
          Chọn lớp để điểm danh
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Chỉ hiển thị các lớp bạn đang phụ trách.
        </Typography>
      </Box>

      {/* Error */}
      {classesError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {classesError}
        </Alert>
      )}

      {/* Loading skeletons */}
      {loadingClasses ? (
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : classes.length === 0 ? (
        /* Empty state */
        <Box
          sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', py: 10, gap: 2,
            border: '2px dashed', borderColor: 'divider', borderRadius: 3,
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              width: 64, height: 64, borderRadius: 3,
              bgcolor: 'action.selected',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <SchoolIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" fontWeight={600} color="text.secondary">
              Chưa có lớp nào được phân công
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Vui lòng liên hệ quản trị viên.
            </Typography>
          </Box>
        </Box>
      ) : (
        /* Class grid */
        <Grid container spacing={2.5}>
          {classes.map((c, idx) => {
            const pal = PALETTE[idx % PALETTE.length];
            const studentCount = c.studentIds?.length ?? null;
            return (
              <Grid key={c._id || c.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: 6,
                      borderColor: 'transparent',
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => onSelect(c._id || c.id)}
                    sx={{ p: 2.5 }}
                  >
                    {/* Gradient icon */}
                    <Box
                      sx={{
                        width: 44, height: 44, borderRadius: 2.5,
                        background: pal.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mb: 2, boxShadow: 2,
                      }}
                    >
                      <SchoolIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>

                    {/* Class name */}
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom noWrap>
                      {c.className}
                    </Typography>

                    {/* Badges */}
                    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
                      {c.gradeId?.gradeName && (
                        <Chip
                          label={c.gradeId.gradeName}
                          size="small"
                          sx={{ height: 20, fontSize: 11, fontWeight: 600, ...pal.chip }}
                        />
                      )}
                      {c.academicYearId?.yearName && (
                        <Chip
                          label={c.academicYearId.yearName}
                          size="small"
                          sx={{ height: 20, fontSize: 11 }}
                        />
                      )}
                      {studentCount !== null && (
                        <Chip
                          label={`${studentCount} học sinh`}
                          size="small"
                          sx={{ height: 20, fontSize: 11 }}
                        />
                      )}
                    </Stack>

                    {/* CTA */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" fontWeight={700} sx={{ background: pal.bg, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Vào điểm danh
                      </Typography>
                      <ArrowIcon sx={{ fontSize: 14, background: pal.bg, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

export default ClassSelector;
