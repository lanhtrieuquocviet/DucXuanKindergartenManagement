import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchoolAdmin } from '../../context/SchoolAdminContext';
import RoleLayout from '../../layouts/RoleLayout';

function QaList() {
  const [questionsData, setQuestionsData] = useState(null);
  const [message, setMessage] = useState({ type: null, text: null });
  const [answeringId, setAnsweringId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [editingAnswer, setEditingAnswer] = useState(null); // { questionId, answerIndex }
  const [editingText, setEditingText] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
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
    } catch (_) {
      // ignore
    }
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SchoolAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    fetchQa(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, user, isInitializing, getQaQuestions, setError]);

  const refreshQa = async () => {
    await fetchQa(page || 1);
  };

  const handleEditQuestion = async (q) => {
    const newTitle = window.prompt('Sửa tiêu đề câu hỏi:', q.title);
    if (newTitle === null) return;
    const newContent = window.prompt('Sửa nội dung câu hỏi:', q.content);
    if (newContent === null) return;

    try {
      setError(null);
      setMessage({ type: null, text: null });
      await updateQuestion(q._id, {
        title: newTitle,
        email: q.email || '',
        phone: q.phone || '',
        address: q.address || '',
        idNumber: q.idNumber || '',
        category: q.category || '',
        content: newContent,
      });
      setMessage({ type: 'success', text: 'Đã cập nhật câu hỏi.' });
      await refreshQa();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Cập nhật câu hỏi thất bại.' });
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      setError(null);
      setMessage({ type: null, text: null });
      await deleteQuestion(id);
      setMessage({ type: 'success', text: 'Đã xóa câu hỏi.' });
      await refreshQa();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Xóa câu hỏi thất bại.' });
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập nội dung trả lời.' });
      return;
    }
    try {
      setError(null);
      await answerQuestion(answeringId, answerText.trim(), 'Ban giám hiệu');
      setMessage({ type: 'success', text: 'Đã gửi trả lời cho câu hỏi.' });
      setAnsweringId(null);
      setAnswerText('');
      await refreshQa();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gửi trả lời thất bại.' });
    }
  };

  const handleStartEditAnswer = (questionId, answerIndex, currentContent) => {
    setMessage({ type: null, text: null });
    setEditingAnswer({ questionId, answerIndex });
    setEditingText(currentContent || '');
  };

  const handleUpdateAnswer = async () => {
    if (!editingAnswer) return;
    if (!editingText.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập nội dung câu trả lời.' });
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
      setMessage({ type: 'success', text: 'Đã cập nhật câu trả lời.' });
      setEditingAnswer(null);
      setEditingText('');
      await refreshQa();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Cập nhật câu trả lời thất bại.' });
    }
  };

  const menuItems = [
    { key: 'overview', label: 'Tổng quan trường' },
    { key: 'classes', label: 'Lớp học' },
    { key: 'teachers', label: 'Giáo viên' },
    { key: 'students', label: 'Học sinh & phụ huynh' },
    { key: 'assets', label: 'Quản lý tài sản' },
    { key: 'reports', label: 'Báo cáo của trường' },
    { key: 'contacts', label: 'Liên hệ' },
    { key: 'qa', label: 'Câu hỏi' },
    { key: 'blogs', label: 'Quản lý blog' },
    { key: 'attendance', label: 'Quản lý điểm danh' },
  ];

  const handleMenuSelect = (key) => {
    if (key === 'overview') {
      navigate('/school-admin');
      return;
    }
    if (key === 'classes') {
      navigate('/school-admin/classes');
      return;
    }
    if (key === 'contacts') {
      navigate('/school-admin/contacts');
      return;
    }
    if (key === 'qa') {
      navigate('/school-admin/qa');
      return;
    }
    if (key === 'blogs') {
      navigate('/school-admin/blogs');
      return;
    }
    if (key === 'attendance') {
      navigate('/school-admin/attendance/overview');
      return;
    }
  };

  const userName = user?.fullName || user?.username || 'School Admin';
  const questions = questionsData?.data?.questions || [];
  const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

  return (
    <RoleLayout
      title="Quản lý câu hỏi"
      description="Xem, xóa và trả lời câu hỏi từ mục Hỏi đáp."
      menuItems={menuItems}
      activeKey="qa"
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      userName={userName}
      userAvatar={user?.avatar}
      onViewProfile={() => navigate('/profile')}
      onMenuSelect={handleMenuSelect}
    >
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {message.text && (
        <div
          className={`mb-4 rounded-md px-4 py-2 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          Câu hỏi từ mục Hỏi đáp
        </h2>
        {loading && (
          <p className="text-sm text-gray-500">Đang tải...</p>
        )}
        {!loading && questions.length === 0 && (
          <p className="text-sm text-gray-500">Chưa có câu hỏi nào.</p>
        )}
        {!loading && questions.length > 0 && (
          <div className="divide-y divide-gray-200">
            {questions.map((q) => (
              <div key={q._id} className="py-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{q.title}</p>
                    <p className="text-xs text-gray-500">
                      {q.email || 'Ẩn danh'} • {formatDate(q.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                      {q.content}
                    </p>
                    {Array.isArray(q.answers) && q.answers.length > 0 && (
                      <div className="mt-2 border-l-4 border-green-500 pl-3 space-y-2">
                        {q.answers.map((a, idx) => (
                          <div key={idx} className="text-sm text-gray-700">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <span className="font-medium text-green-700">
                                  {a.authorName || 'Trả lời'}:
                                </span>{' '}
                                <span className="whitespace-pre-wrap">{a.content}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStartEditAnswer(q._id, idx, a.content)
                                }
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200 hover:bg-blue-100"
                              >
                                Sửa
                              </button>
                            </div>
                            {editingAnswer &&
                              editingAnswer.questionId === q._id &&
                              editingAnswer.answerIndex === idx && (
                                <div className="mt-2">
                                  <textarea
                                    rows={3}
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm focus:outline-green-500"
                                    placeholder="Chỉnh sửa nội dung trả lời..."
                                  />
                                  <div className="mt-2 flex gap-2">
                                    <button
                                      type="button"
                                      onClick={handleUpdateAnswer}
                                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                    >
                                      Lưu
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingAnswer(null);
                                        setEditingText('');
                                      }}
                                      className="px-3 py-1.5 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col gap-2">
                    {/* <button
                      type="button"
                      onClick={() => handleEditQuestion(q)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Sửa
                    </button> */}
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q._id)}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Xóa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAnsweringId(q._id);
                        setAnswerText('');
                      }}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Trả lời
                    </button>
                  </div>
                </div>
                {answeringId === q._id && (
                  <div className="mt-3">
                    <textarea
                      rows={3}
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-green-500"
                      placeholder="Nhập nội dung trả lời..."
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={handleSubmitAnswer}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Gửi trả lời
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAnsweringId(null);
                          setAnswerText('');
                        }}
                        className="px-3 py-1.5 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!loading && page > 1) {
                fetchQa(page - 1);
              }
            }}
            disabled={loading || page <= 1}
            className="px-3 py-1.5 border rounded text-xs disabled:opacity-50"
          >
            {'<<'}
          </button>
          {[...Array(pagination.totalPages)].map((_, idx) => {
            const p = idx + 1;
            return (
              <button
                key={p}
                type="button"
                onClick={() => !loading && fetchQa(p)}
                className={`px-3 py-1.5 border rounded text-xs ${
                  p === page ? 'bg-blue-600 text-white' : 'bg-white'
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              if (!loading && page < (pagination.totalPages || 1)) {
                fetchQa(page + 1);
              }
            }}
            disabled={loading || page >= (pagination.totalPages || 1)}
            className="px-3 py-1.5 border rounded text-xs disabled:opacity-50"
          >
            {'>>'}
          </button>
        </div>
      )}
    </RoleLayout>
  );
}

export default QaList;

