import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  CircularProgress,
  TextField,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Send as SendIcon,
  QuestionAnswer as QaIcon,
} from '@mui/icons-material';

function QaList() {
  const [questionsData, setQuestionsData] = useState(null);
  const [answeringId, setAnsweringId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [editingAnswer, setEditingAnswer] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();
  const {
    getQaQuestions,
    updateQuestion,
    deleteQuestion,
    answerQuestion,
    updateAnswer,
    loading,
    error,
    setError,
  } = useSchoolAdmin();

  const fetchQa = async (targetPage = 1) => {
    try {
      setError(null);
      const qaRes = await getQaQuestions({ page: targetPage, limit: 10 });
      setQuestionsData(qaRes);
      setPagination(qaRes?.data?.pagination || null);
      setPage(targetPage);
    } catch (_) {}
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SchoolAdmin')) { navigate('/', { replace: true }); return; }
    fetchQa(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, user, isInitializing, getQaQuestions, setError]);

  const refreshQa = async () => { await fetchQa(page || 1); };

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleEditQuestion = async (q) => {
    const newTitle = window.prompt('Sửa tiêu đề câu hỏi:', q.title);
    if (newTitle === null) return;
    const newContent = window.prompt('Sửa nội dung câu hỏi:', q.content);
    if (newContent === null) return;
    try {
      setError(null);
      await updateQuestion(q._id, {
        title: newTitle,
        email: q.email || '',
        phone: q.phone || '',
        address: q.address || '',
        idNumber: q.idNumber || '',
        category: q.category || '',
        content: newContent,
      });
      toast.success('Đã cập nhật câu hỏi.');
      await refreshQa();
    } catch (err) {
      toast.error(err.message || 'Cập nhật câu hỏi thất bại.');
    }
  };

  const handleDeleteRequest = (id) => {
    if (!id) return;
    setDeleteTargetId(id);
  };

  const handleCloseDeleteDialog = () => {
    if (deleting) return;
    setDeleteTargetId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setDeleting(true);
      setError(null);
      await deleteQuestion(deleteTargetId);
      toast.success('Đã xóa câu hỏi.');
      setDeleteTargetId(null);
      await refreshQa();
    } catch (err) {
      toast.error(err.message || 'Xóa câu hỏi thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      toast.error('Vui lòng nhập nội dung trả lời.');
      return;
    }
    try {
      setError(null);
      await answerQuestion(answeringId, answerText.trim(), 'Ban giám hiệu');
      toast.success('Đã gửi trả lời cho câu hỏi.');
      setAnsweringId(null);
      setAnswerText('');
      await refreshQa();
    } catch (err) {
      toast.error(err.message || 'Gửi trả lời thất bại.');
    }
  };

  const handleStartEditAnswer = (questionId, answerIndex, currentContent) => {
    setEditingAnswer({ questionId, answerIndex });
    setEditingText(currentContent || '');
  };

  const handleUpdateAnswer = async () => {
    if (!editingAnswer) return;
    if (!editingText.trim()) {
      toast.error('Vui lòng nhập nội dung câu trả lời.');
      return;
    }
    try {
      setError(null);
      await updateAnswer(
        editingAnswer.questionId,
        editingAnswer.answerIndex,
        editingText.trim(),
        'Ban giám hiệu'
      );
      toast.success('Đã cập nhật câu trả lời.');
      setEditingAnswer(null);
      setEditingText('');
      await refreshQa();
    } catch (err) {
      toast.error(err.message || 'Cập nhật câu trả lời thất bại.');
    }
  };
  const questions = questionsData?.data?.questions || [];
  const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

  return (
    <Box>
      {/* Header gradient */}
      <Paper
        elevation={0}
        sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', borderRadius: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <QaIcon sx={{ color: 'white', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} color="white">Quản lý câu hỏi</Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.8)" mt={0.25}>
              Xem, xóa và trả lời câu hỏi từ mục Hỏi đáp.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600}>Câu hỏi từ mục Hỏi đáp</Typography>
        </Box>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" spacing={1.5} py={5}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">Đang tải...</Typography>
          </Stack>
        ) : questions.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Chưa có câu hỏi nào.</Typography>
          </Box>
        ) : (
          <Stack divider={<Divider />}>
            {questions.map((q) => (
              <Box key={q._id} sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                  {/* Question content */}
                  <Box flex={1}>
                    <Typography variant="body1" fontWeight={600} color="text.primary">
                      {q.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                      {q.email || 'Ẩn danh'} • {formatDate(q.createdAt)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1} sx={{ whiteSpace: 'pre-wrap' }}>
                      {q.content}
                    </Typography>

                    {/* Answers */}
                    {Array.isArray(q.answers) && q.answers.length > 0 && (
                      <Box
                        mt={2}
                        sx={{
                          borderLeft: '3px solid',
                          borderColor: 'success.main',
                          pl: 2,
                        }}
                      >
                        <Stack spacing={1.5}>
                          {q.answers.map((a, idx) => (
                            <Box key={idx}>
                              <Typography variant="body2" color="text.primary" sx={{ flex: 1, whiteSpace: 'pre-wrap' }}>
                                <Box component="span" sx={{ fontWeight: 700, color: 'success.dark' }}>
                                  {a.authorName || 'Trả lời'}:
                                </Box>{' '}
                                {a.content}
                              </Typography>

                              {editingAnswer &&
                                editingAnswer.questionId === q._id &&
                                editingAnswer.answerIndex === idx && (
                                  <Box mt={1.5}>
                                    <TextField
                                      multiline
                                      rows={3}
                                      fullWidth
                                      size="small"
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                      placeholder="Chỉnh sửa nội dung trả lời..."
                                    />
                                    <Stack direction="row" spacing={1} mt={1}>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        startIcon={<SendIcon />}
                                        onClick={handleUpdateAnswer}
                                        sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                      >
                                        Lưu
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="inherit"
                                        onClick={() => { setEditingAnswer(null); setEditingText(''); }}
                                        sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                      >
                                        Hủy
                                      </Button>
                                    </Stack>
                                  </Box>
                                )}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>

                  {/* Action buttons */}
                  <Stack spacing={1} sx={{ flexShrink: 0 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteRequest(q._id)}
                      sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 12 }}
                    >
                      Xóa
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<ReplyIcon />}
                      onClick={() => { setAnsweringId(q._id); setAnswerText(''); }}
                      sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 12 }}
                    >
                      Trả lời
                    </Button>
                    {Array.isArray(q.answers) && q.answers.length > 0 && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() =>
                          handleStartEditAnswer(
                            q._id,
                            q.answers.length - 1,
                            q.answers[q.answers.length - 1]?.content || ''
                          )
                        }
                        sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 12 }}
                      >
                        Sửa
                      </Button>
                    )}
                  </Stack>
                </Stack>

                {/* Answer box */}
                {answeringId === q._id && (
                  <Box mt={2}>
                    <TextField
                      multiline
                      rows={3}
                      fullWidth
                      size="small"
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Nhập nội dung trả lời..."
                    />
                    <Stack direction="row" spacing={1} mt={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<SendIcon />}
                        onClick={handleSubmitAnswer}
                        sx={{ textTransform: 'none', borderRadius: 1.5 }}
                      >
                        Gửi trả lời
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => { setAnsweringId(null); setAnswerText(''); }}
                        sx={{ textTransform: 'none', borderRadius: 1.5 }}
                      >
                        Hủy
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} mt={3}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => { if (!loading && page > 1) fetchQa(page - 1); }}
            disabled={loading || page <= 1}
            sx={{ minWidth: 40, borderRadius: 1.5 }}
          >
            {'<<'}
          </Button>
          {[...Array(pagination.totalPages)].map((_, idx) => {
            const p = idx + 1;
            return (
              <Button
                key={p}
                size="small"
                variant={p === page ? 'contained' : 'outlined'}
                color={p === page ? 'primary' : 'inherit'}
                onClick={() => !loading && fetchQa(p)}
                sx={{ minWidth: 40, borderRadius: 1.5 }}
              >
                {p}
              </Button>
            );
          })}
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => { if (!loading && page < (pagination.totalPages || 1)) fetchQa(page + 1); }}
            disabled={loading || page >= (pagination.totalPages || 1)}
            sx={{ minWidth: 40, borderRadius: 1.5 }}
          >
            {'>>'}
          </Button>
        </Stack>
      )}

      <Dialog open={Boolean(deleteTargetId)} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có muốn xóa câu hỏi này không.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDeleteDialog} disabled={deleting}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? 'Đang xóa...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default QaList;
