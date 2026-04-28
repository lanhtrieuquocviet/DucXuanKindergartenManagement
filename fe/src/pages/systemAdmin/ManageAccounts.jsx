import {
  Alert,
  Box,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useSystemAdmin } from '../../context/SystemAdminContext';


// Sub-components
import AccountHeader from './components/AccountHeader';
import AccountToolbar from './components/AccountToolbar';
import AccountTable from './components/AccountTable';
import AccountDialog from './components/AccountDialog';

const mapUserFriendlySaveError = (err) => {
  const rawMessage = err?.data?.message || err?.message || '';
  if (rawMessage.includes('E11000') || rawMessage.includes('duplicate key')) {
    if (rawMessage.includes('email')) {
      return 'Email đã tồn tại trong hệ thống.';
    }
    if (rawMessage.includes('username')) {
      return 'Tên đăng nhập đã tồn tại trong hệ thống.';
    }
    return 'Dữ liệu bị trùng, vui lòng kiểm tra lại thông tin.';
  }
  return rawMessage || 'Có lỗi khi lưu tài khoản.';
};

function ManageAccounts() {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [success, setSuccess] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [usernameHint, setUsernameHint] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });
  const [userForm, setUserForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    status: 'active',
    roleIds: [],
    position: '',
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [accountSearch, setAccountSearch] = useState('');

  const navigate = useNavigate();
  const { user, logout, isInitializing } = useAuth();
  const {
    getUsers,
    getRoles,
    createUser,
    updateUser,
    deleteUser,
    loading,
    error,
    setError,
  } = useSystemAdmin();

  useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRoles = user?.roles?.map((r) => r.roleName || r) || [];
    if (!userRoles.includes('SystemAdmin')) {
      navigate('/', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);
        const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()]);
        setUsers(usersData || []);
        setRoles(rolesData || []);
      } catch (err) {
        // Error được xử lý trong context
      }
    };

    fetchData();
  }, [navigate, user, getUsers, getRoles, setError, isInitializing]);


  const handleOpenUserForm = (account = null) => {
    setSaveErrorMessage('');
    setError(null);
    if (account) {
      setEditingUser(account);
      setUserForm({
        username: account.username || '',
        fullName: account.fullName || '',
        email: account.email || '',
        phone: account.phone || '',
        password: '',
        confirmPassword: '',
        status: account.status || 'active',
        roleIds: (account.roles || []).map((r) => r._id || r.id).filter(Boolean),
        position: account.position || '',
      });
    } else {
      setEditingUser(null);
      setUserForm({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        status: 'active',
        roleIds: [],
        position: '',
      });
    }
    setShowUserForm(true);
  };

  const handleCloseUserForm = () => {
    setSaveErrorMessage('');
    setShowUserForm(false);
    setEditingUser(null);
    setUsernameHint('');
    setPasswordHint('');
    setError(null);
    setUserForm({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      status: 'active',
      roleIds: [],
      position: '',
    });
  };

  const handleChangeField = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const val = value.replace(/\D/g, '').slice(0, 10);
      setUserForm((prev) => {
        const next = { ...prev, phone: val };
        // Nếu username đang trống hoặc đang chứa SĐT cũ, cập nhật theo SĐT mới
        if (!prev.username || /^\d*$/.test(prev.username)) {
          next.username = val;
        }
        return next;
      });
      return;
    }

    setUserForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'username') {
      // Cho phép chữ cái, số, và các ký tự trong email (@, .)
      const isValidChar = /^[A-Za-z0-9@._-]*$/.test(value);
      if (value && !isValidChar) {
        setUsernameHint('Tài khoản chỉ được chứa chữ cái, số, @, ., _, -');
      } else {
        setUsernameHint('');
      }
    }
    if (name === 'password') {
      const hasUpper = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[^A-Za-z0-9]/.test(value);
      if (value && (!hasUpper || !hasNumber || !hasSpecial)) {
        setPasswordHint('Mật khẩu phải có ít nhất 1 chữ cái viết hoa, 1 số và 1 ký tự đặc biệt.');
      } else {
        setPasswordHint('');
      }
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess('');
      setSaveErrorMessage('');

      const usernameTrimmed = (userForm.username || '').trim();
      if (usernameTrimmed && !/^[A-Za-z0-9@._-]+$/.test(usernameTrimmed)) {
        const msg = 'Tài khoản không hợp lệ. Chỉ chấp nhận chữ cái, số, @, ., _, -';
        setSaveErrorMessage(msg);
        return;
      }

      if (userForm.password) {
        if (userForm.password !== userForm.confirmPassword) {
          const msg = 'Mật khẩu và xác nhận mật khẩu không khớp.';
          setSaveErrorMessage(msg);
          return;
        }
        const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
        if (!strongPasswordRegex.test(userForm.password)) {
          const msg = 'Mật khẩu phải có ít nhất 1 chữ cái viết hoa, 1 số và 1 ký tự đặc biệt, tối thiểu 6 ký tự.';
          setSaveErrorMessage(msg);
          return;
        }
      }

      const payload = {
        username: usernameTrimmed,
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        status: userForm.status,
        roleIds: userForm.roleIds || [],
        position: userForm.position,
      };
      if (userForm.password) payload.password = userForm.password;

      if (!editingUser) {
        await createUser(payload);
        setSuccess('Tạo tài khoản và hồ sơ nhân sự thành công.');
      } else {
        await updateUser(editingUser._id || editingUser.id, payload);
        setSuccess('Cập nhật tài khoản thành công.');
      }

      setTimeout(() => setSuccess(''), 3000);
      handleCloseUserForm();

      const refreshedUsers = await getUsers();
      setUsers(refreshedUsers || []);
    } catch (err) {
      const msg = mapUserFriendlySaveError(err);
      setSaveErrorMessage(msg);
    }
  };

  const handleDeleteAccount = (account) => {
    setConfirmState({
      open: true,
      title: 'Xóa tài khoản?',
      message: `Bạn có chắc chắn muốn xóa (khóa) tài khoản "${account.username}"? Tài khoản sẽ bị khóa và người dùng sẽ không thể đăng nhập, nhưng dữ liệu vẫn được giữ trong hệ thống.`,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        try {
          setError(null);
          setSuccess('');
          await deleteUser(account._id || account.id);
          setSuccess('Tài khoản đã được khóa (xóa mềm) thành công.');
          setTimeout(() => setSuccess(''), 3000);
          const refreshedUsers = await getUsers();
          setUsers(refreshedUsers || []);
        } catch (err) {
          // Error đã được xử lý trong context
        }
      },
    });
  };

  const filteredUsers = accountSearch.trim()
    ? users.filter((u) => {
      const q = accountSearch.trim().toLowerCase();
      return (
        (u.username || '').toLowerCase().includes(q) ||
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    })
    : users;

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const userName = user?.fullName || user?.username || 'System Admin';

  return (
    <Box>
      {/* Alert messages */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <AccountHeader />

      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <AccountToolbar 
          accountSearch={accountSearch}
          setAccountSearch={setAccountSearch}
          setPage={setPage}
          filteredCount={filteredUsers.length}
          onAddAccount={() => handleOpenUserForm()}
        />

        <AccountTable 
          users={users}
          paginatedUsers={paginatedUsers}
          filteredUsers={filteredUsers}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          onEdit={handleOpenUserForm}
          onDelete={handleDeleteAccount}
          loading={loading}
          isMdDown={isMdDown}
        />
      </Paper>

      <AccountDialog 
        open={showUserForm}
        onClose={handleCloseUserForm}
        editingUser={editingUser}
        userForm={userForm}
        setUserForm={setUserForm}
        roles={roles}
        saveErrorMessage={saveErrorMessage}
        loading={loading}
        onSave={handleSaveUser}
        usernameHint={usernameHint}
        passwordHint={passwordHint}
        handleChangeField={handleChangeField}
        isSmDown={isSmDown}
      />

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
        loading={loading}
      />
    </Box>
  );
}

export default ManageAccounts;
