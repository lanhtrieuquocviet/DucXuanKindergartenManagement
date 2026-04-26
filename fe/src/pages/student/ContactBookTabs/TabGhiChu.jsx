import { useEffect, useState } from 'react';
import { Box, Stack, Typography, Paper, Chip, Skeleton } from '@mui/material';
import { 
  EditNote as NoteTabIcon 
} from '@mui/icons-material';
import { get, ENDPOINTS } from '../../../service/api';

export default function TabGhiChu({ studentId }) {
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = studentId ? `?studentId=${studentId}` : '';
    get(`${ENDPOINTS.STUDENTS.CONTACT_BOOK_NOTES}${q}`)
      .then(res => setNotes(res.data || []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <Stack spacing={1.5}>{[1,2].map(i => <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 3 }} />)}</Stack>;
  if (notes.length === 0) return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
      <NoteTabIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} />
      <Typography color="text.secondary" variant="body2">Giáo viên chưa có ghi chú nào.</Typography>
    </Paper>
  );
  return (
    <Box>
      <Stack spacing={1.5}>
        {notes.map(note => (
          <Paper key={note._id} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5 }}>
            <Chip
              label={new Date(note.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#f3f4f6', color: 'text.secondary', fontWeight: 600, mb: 1 }}
            />
            <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{note.content}</Typography>
            {note.images?.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1} mt={1.5}>
                {note.images.map((url, i) => (
                  <Box key={i} component="img" src={url} alt="" onClick={() => setLightbox(url)}
                    sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2, border: '1px solid #e2e8f0', cursor: 'pointer', '&:hover': { opacity: 0.85 } }} />
                ))}
              </Stack>
            )}
          </Paper>
        ))}
      </Stack>
      {lightbox && (
        <Box onClick={() => setLightbox(null)} sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <Box component="img" src={lightbox} alt="" sx={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 2, boxShadow: 8 }} />
        </Box>
      )}
    </Box>
  );
}
