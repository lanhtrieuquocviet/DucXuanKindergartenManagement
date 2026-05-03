import { useState, useRef, useEffect, useCallback } from 'react';
import { useConfirm } from '../../../hooks/useConfirm';
import { 
  Box, Paper, Stack, Typography, TextField, IconButton, 
  Tooltip, Button, Chip, Skeleton, CircularProgress 
} from '@mui/material';
import { 
  EditNote as NoteTabIcon, 
  AddPhotoAlternate as AddPhotoIcon, 
  Send as SendIcon, 
  Close as CloseIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { get, postFormData, del, ENDPOINTS } from '../../../service/api';
import { toast } from 'react-toastify';

export default function TabGhiChu({ classId, studentId }) {
  const confirm = useConfirm();
  const [content, setContent]     = useState('');
  const [images, setImages]       = useState([]); // [{ file, url, uploading }]
  const [loading, setLoading]     = useState(true);
  const [notes, setNotes]         = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox]   = useState(null);
  const fileRef = useRef();

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.TEACHER.CONTACT_BOOK_NOTES(classId, studentId));
      setNotes(res.data || []);
    } catch (_) {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [classId, studentId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAddImage = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newImages = files.map(file => ({ file, url: URL.createObjectURL(file), uploading: false }));
    setImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  };

  const handleRemoveImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      images.forEach(img => { if (img.file) formData.append('images', img.file); });
      await postFormData(ENDPOINTS.TEACHER.CONTACT_BOOK_NOTES(classId, studentId), formData);
      toast.success('Đã thêm ghi chú');
      setContent('');
      setImages([]);
      fetchNotes();
    } catch (err) {
      toast.error(err.data?.message || 'Không thể lưu ghi chú');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!await confirm('Bạn có chắc muốn xoá ghi chú này?')) return;
    try {
      await del(ENDPOINTS.TEACHER.CONTACT_BOOK_NOTE_DETAIL(classId, studentId, noteId));
      toast.success('Đã xoá');
      fetchNotes();
    } catch (err) {
      toast.error(err.data?.message || 'Xoá thất bại');
    }
  };

  return (
    <Box>
      {/* Form tạo ghi chú mới */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5, mb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
          <NoteTabIcon sx={{ fontSize: 18, color: '#7c3aed' }} />
          <Typography variant="subtitle2" fontWeight={700}>Thêm ghi chú mới</Typography>
        </Stack>

        <TextField
          multiline minRows={3} maxRows={8} fullWidth
          placeholder="Nhập nội dung ghi chú về học sinh..."
          value={content}
          onChange={e => setContent(e.target.value)}
          sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />

        {/* Ảnh đã chọn */}
        {images.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={1} mb={1.5}>
            {images.map((img, idx) => (
              <Box key={idx} sx={{ position: 'relative', width: 72, height: 72 }}>
                {img.uploading ? (
                  <Box sx={{ width: 72, height: 72, borderRadius: 2, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1' }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : (
                  <Box
                    component="img" src={img.url} alt=""
                    sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 2, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                    onClick={() => setLightbox(img.url)}
                  />
                )}
                <IconButton
                  size="small"
                  onClick={() => handleRemoveImage(idx)}
                  sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'white', border: '1px solid #e2e8f0', p: 0.25, '&:hover': { bgcolor: '#fee2e2' } }}
                >
                  <CloseIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}

        <Stack direction="row" alignItems="center" spacing={1}>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleAddImage} />
          <Tooltip title="Thêm ảnh (không bắt buộc)">
            <IconButton onClick={() => fileRef.current?.click()} size="small"
              sx={{ color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 1.5, '&:hover': { bgcolor: '#f1f5f9' } }}>
              <AddPhotoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained" size="small" endIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, borderRadius: 2, textTransform: 'none' }}
          >
            {submitting ? 'Đang lưu...' : 'Lưu ghi chú'}
          </Button>
        </Stack>
      </Paper>

      {/* Danh sách ghi chú */}
      {loading ? (
        <Stack spacing={1.5}>
          {[1, 2].map(i => <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 3 }} />)}
        </Stack>
      ) : notes.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 5, textAlign: 'center' }}>
          <NoteTabIcon sx={{ fontSize: 44, color: 'grey.300', mb: 1 }} />
          <Typography color="text.secondary" variant="body2">Chưa có ghi chú nào.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {notes.map(note => (
            <Paper key={note._id} elevation={0}
              sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5, position: 'relative' }}>
              {/* Header: ngày + xoá */}
              <Stack direction="row" alignItems="center" mb={1}>
                <Chip
                  label={new Date(note.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  size="small"
                  sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#f3f4f6', color: 'text.secondary', fontWeight: 600 }}
                />
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Xoá ghi chú">
                  <IconButton size="small" onClick={() => handleDelete(note._id)}
                    sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' }, p: 0.5, borderRadius: 1 }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* Nội dung */}
              <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                {note.content}
              </Typography>

              {/* Ảnh đính kèm */}
              {note.images?.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1} mt={1.5}>
                  {note.images.map((url, i) => (
                    <Box
                      key={i} component="img" src={url} alt=""
                      sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2, border: '1px solid #e2e8f0', cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
                      onClick={() => setLightbox(url)}
                    />
                  ))}
                </Stack>
              )}
            </Paper>
          ))}
        </Stack>
      )}

      {/* Lightbox preview */}
      {lightbox && (
        <Box
          onClick={() => setLightbox(null)}
          sx={{
            position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.75)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
          }}
        >
          <Box component="img" src={lightbox} alt=""
            sx={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 2, boxShadow: 8 }} />
        </Box>
      )}
    </Box>
  );
}
