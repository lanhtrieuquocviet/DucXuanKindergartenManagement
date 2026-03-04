const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const { sendPasswordResetEmail, sendOTPEmail, generateRandomPassword } = require('../utils/email');
const { createSystemLog } = require('../utils/systemLog');

// ============================================
// Hằng số
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Ít nhất 1 chữ hoa, 1 số, 1 ký tự đặc biệt, tối thiểu 6 ký tự
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

// ============================================
// Các hàm hỗ trợ
// ============================================

/**
 * Validate mật khẩu theo các quy tắc:
 * - Độ dài tối thiểu: 8 ký tự
 * - Độ dài tối đa: 64 ký tự
 * - Không chứa khoảng trắng
 * @param {string} password - Mật khẩu cần validate
 * @returns {string[]} - Mảng các lỗi (rỗng nếu hợp lệ)
 */
const validatePassword = (password) => {
  const errors = [];

  // Kiểm tra độ dài tối thiểu
  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }

  // Kiểm tra độ dài tối đa
  if (password.length > 64) {
    errors.push('Mật khẩu không được vượt quá 64 ký tự');
  }

  // Kiểm tra khoảng trắng
  if (password.includes(' ')) {
    errors.push('Mật khẩu không được chứa khoảng trắng');
  }

  // Kiểm tra khoảng trắng đầu/cuối
  if (password !== password.trim()) {
    errors.push('Mật khẩu không được có khoảng trắng ở đầu hoặc cuối');
  }

  return errors;
};

/**
 * Loại bỏ các trường nhạy cảm khỏi tài liệu người dùng trước khi gửi cho client
 * @param {import('../models/User')} userDoc
 */
const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, __v, ...safeUser } = user;
  return safeUser;
};

/**
 * Helper: build user response (kèm roles đã format)
 * @param {import('../models/User')} user
 */
const buildUserResponse = (user) => {
  const roles = (user.roles || []).map((role) => ({
    id: role._id,
    roleName: role.roleName,
    permissions: (role.permissions || []).map((p) => (p.code ? p.code : p)),
  }));

  return {
    ...sanitizeUser(user),
    roles,
  };
};

/**
 * Hàm hỗ trợ: Ẩn một phần địa chỉ email
 * @param {string} email - Địa chỉ email đầy đủ
 * @returns {string} - Email đã được ẩn một phần (ví dụ: abc***@gmail.com)
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) {
    return email;
  }
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 3) {
    return `${localPart[0]}***@${domain}`;
  }
  const visibleChars = Math.min(3, Math.floor(localPart.length / 2));
  const visible = localPart.substring(0, visibleChars);
  return `${visible}***@${domain}`;
};

/**
 * Helper: Tính toán thời gian chờ dựa trên số lần reset (exponential backoff)
 * @param {number} attempts - Số lần đã reset password
 * @returns {number} - Thời gian chờ tính bằng phút
 */
const calculateWaitTime = (attempts) => {
  if (attempts === 0) {
    return 0; // Lần đầu không cần chờ
  }
  // Exponential backoff: 5 phút, 10 phút, 20 phút, 40 phút, 80 phút...
  // Công thức: 5 * 2^(attempts - 1)
  return 5 * Math.pow(2, attempts - 1);
};

/**
 * Helper: Kiểm tra và tính toán thời gian chờ còn lại
 * @param {import('../models/User')} user - User object
 * @returns {Object} - { allowed: boolean, waitMinutes: number, waitUntil: Date }
 */
const checkPasswordResetRateLimit = (user) => {
  const now = new Date();
  const RESET_WINDOW_HOURS = 24; // Reset counter sau 24 giờ

  // Reset counter nếu đã qua 24 giờ kể từ lần reset cuối
  if (user.lastPasswordResetAt) {
    const hoursSinceLastReset = (now - user.lastPasswordResetAt) / (1000 * 60 * 60);
    if (hoursSinceLastReset >= RESET_WINDOW_HOURS) {
      // Reset counter
      user.passwordResetAttempts = 0;
      user.nextPasswordResetAllowedAt = null;
      return { allowed: true, waitMinutes: 0, waitUntil: null };
    }
  }

  // Kiểm tra nếu đang trong thời gian chờ
  if (user.nextPasswordResetAllowedAt && now < user.nextPasswordResetAllowedAt) {
    const waitMs = user.nextPasswordResetAllowedAt - now;
    const waitMinutes = Math.ceil(waitMs / (1000 * 60));
    return {
      allowed: false,
      waitMinutes,
      waitUntil: user.nextPasswordResetAllowedAt,
    };
  }

  // Tính toán thời gian chờ cho lần tiếp theo
  const waitMinutes = calculateWaitTime(user.passwordResetAttempts);
  const waitUntil = waitMinutes > 0 ? new Date(now.getTime() + waitMinutes * 60 * 1000) : null;

  return {
    allowed: true,
    waitMinutes: 0,
    waitUntil,
  };
};

const isStrongPassword = (password) =>
  PASSWORD_COMPLEXITY_REGEX.test(password || '');

// ============================================
// Các hàm controller
// ============================================

/**
 * POST /api/auth/login
 * Đăng nhập bằng tài khoản + mật khẩu
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu',
      });
    }

    if (!User || !User.findOne) {
      return res.status(500).json({
        status: 'error',
        message: 'User model is not available',
      });
    }

    const user = await User.findOne({ username }).populate({
      path: 'roles',
      model: 'Roles',
      populate: {
        path: 'permissions',
        model: 'Permission',
      },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Tài khoản hoặc mật khẩu không đúng',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        status: 'error',
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ nhà trường.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Tài khoản hoặc mật khẩu không đúng',
      });
    }

    const roles = (user.roles || []).map((role) => ({
      id: role._id,
      roleName: role.roleName,
      permissions: (role.permissions || []).map((p) => (p.code ? p.code : p)),
    }));

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      roles: (user.roles || []).map((r) => r.roleName),
      permissions: Array.from(
        new Set(
          (user.roles || []).flatMap((role) =>
            (role.permissions || []).map((p) => (p.code ? p.code : p)),
          ),
        ),
      ),
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    await createSystemLog({
      req,
      actor: user,
      action: 'Đăng nhập hệ thống',
      detail: `Đăng nhập thành công cho tài khoản ${user.username}`,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Đăng nhập thất bại',
    });
  }
};

/**
 * GET /api/auth/me
 * Lấy thông tin hồ sơ người dùng hiện tại (dựa trên token)
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'roles',
      model: 'Roles',
      populate: {
        path: 'permissions',
        model: 'Permission',
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: buildUserResponse(user),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không lấy được hồ sơ người dùng',
    });
  }
};

/**
 * PUT /api/auth/me
 * Cập nhật thông tin cơ bản của người dùng hiện tại
 * (fullName, email, avatar; các field khác có thể bổ sung sau)
 */
const updateProfile = async (req, res) => {
  try {
    // Hỗ trợ cả phone và parentPhone để tương thích
    const { fullName, email, avatar, phone, parentPhone, address } = req.body;

    const user = await User.findById(req.user.id).populate({
      path: 'roles',
      model: 'Roles',
      populate: {
        path: 'permissions',
        model: 'Permission',
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng',
      });
    }

    if (typeof fullName === 'string' && fullName.trim() !== '') {
      user.fullName = fullName.trim();
    }

    if (typeof email === 'string' && email.trim() !== '') {
      user.email = email.trim().toLowerCase();
    }

    if (typeof avatar === 'string') {
      user.avatar = avatar;
    }

    // Tín tiên phone, nếu không có thì dùng parentPhone
    const phoneValue = phone !== undefined ? phone : parentPhone;
    if (typeof phoneValue === 'string') {
      user.phone = phoneValue.trim();
    }

    if (typeof address === 'string') {
      user.address = address.trim();
    }

    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật hồ sơ thành công',
      data: buildUserResponse(user),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không cập nhật được hồ sơ',
    });
  }
};

/**
 * POST /api/auth/change-password
 * Đổi mật khẩu cho người dùng hiện tại
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới',
      });
    }

    // Validate mật khẩu mới
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: passwordErrors.join('. '),
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng',
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Mật khẩu hiện tại không đúng',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Change password error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không đổi được mật khẩu',
    });
  }
};

/**
 * Tạo mã OTP 6 chữ số
 * @returns {string} - Mã OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * POST /api/auth/forgot-password/verify-account
 * Xác minh tài khoản và gửi OTP qua email
 */
const verifyAccount = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập tài khoản',
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Tài khoản không tồn tại trong hệ thống',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        status: 'error',
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ nhà trường.',
      });
    }

    if (!user.email) {
      return res.status(400).json({
        status: 'error',
        message: 'Tài khoản này chưa có email. Vui lòng liên hệ nhà trường.',
      });
    }

    // Kiểm tra rate limiting
    const rateLimitCheck = checkPasswordResetRateLimit(user);
    if (!rateLimitCheck.allowed) {
      const waitMinutes = rateLimitCheck.waitMinutes;
      const waitHours = Math.floor(waitMinutes / 60);
      const waitMins = waitMinutes % 60;
      let waitMessage = '';
      if (waitHours > 0) {
        waitMessage = `${waitHours} giờ${waitMins > 0 ? ` ${waitMins} phút` : ''}`;
      } else {
        waitMessage = `${waitMins} phút`;
      }

      return res.status(429).json({
        status: 'error',
        message: `Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng đợi ${waitMessage} trước khi thử lại.`,
        data: {
          waitMinutes,
          waitUntil: rateLimitCheck.waitUntil,
        },
      });
    }

    // Tạo mã OTP
    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    // Lưu OTP vào database
    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    user.otpVerified = false;
    user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
    user.lastPasswordResetAt = new Date();
    user.nextPasswordResetAllowedAt = rateLimitCheck.waitUntil;
    await user.save();

    // Gửi OTP qua email
    try {
      await sendOTPEmail(user.email, user.username, otpCode);
    } catch (emailError) {
      // eslint-disable-next-line no-console
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({
        status: 'error',
        message: 'Không thể gửi mã OTP. Vui lòng thử lại sau hoặc liên hệ nhà trường.',
      });
    }

    const maskedEmail = maskEmail(user.email);

    return res.status(200).json({
      status: 'success',
      message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
      data: {
        maskedEmail,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Verify account error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể xác minh tài khoản',
    });
  }
};

/**
 * POST /api/auth/forgot-password/verify-otp
 * Xác minh mã OTP
 */
const verifyOTP = async (req, res) => {
  try {
    const { username, otpCode } = req.body;

    if (!username || !otpCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ tài khoản và mã OTP',
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Tài khoản không tồn tại trong hệ thống',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        status: 'error',
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ nhà trường.',
      });
    }

    // Kiểm tra OTP
    if (!user.otpCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Chưa có mã OTP. Vui lòng yêu cầu gửi mã OTP trước.',
      });
    }

    if (user.otpCode !== otpCode.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Mã OTP không chính xác',
      });
    }

    // Kiểm tra OTP hết hạn
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      return res.status(400).json({
        status: 'error',
        message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã OTP mới.',
      });
    }

    // Đánh dấu OTP đã được xác minh
    user.otpVerified = true;
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Mã OTP hợp lệ. Bạn có thể đặt lại mật khẩu.',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể xác minh mã OTP',
    });
  }
};

/**
 * POST /api/auth/forgot-password/reset
 * Đặt lại mật khẩu sau khi đã xác minh OTP
 */
const resetPassword = async (req, res) => {
  try {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu mới',
      });
    }

    // Validate mật khẩu
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: passwordErrors.join('. '),
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Tài khoản không tồn tại trong hệ thống',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        status: 'error',
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ nhà trường.',
      });
    }

    // Kiểm tra OTP đã được xác minh chưa
    if (!user.otpVerified) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng xác minh mã OTP trước khi đặt lại mật khẩu.',
      });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu và xóa OTP
    user.passwordHash = passwordHash;
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.otpVerified = false;
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Reset password error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể đặt lại mật khẩu',
    });
  }
};

// ============================================
// Parent: quản lý con (học sinh) của phụ huynh
// ============================================

/**
 * GET /api/auth/me/children
 * Lấy danh sách con (học sinh) của phụ huynh đăng nhập
 */
const getMyChildren = async (req, res) => {
  try {
    const parentId = req.user.id;
    // Tìm theo cả parentId mới và userId/UserId cũ (cho dữ liệu import hoặc dữ liệu legacy)
    const students = await Student.find({
      $or: [
        { parentId },
        { ParentId: parentId },
        { userId: parentId },
        { UserId: parentId },
      ]
    })
      .populate('classId', 'className')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      data: students || [],
      total: students ? students.length : 0,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get my children error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không lấy được danh sách con',
    });
  }
};

/**
 * POST /api/auth/me/children
 * Thêm con (học sinh) cho phụ huynh
 */
const createMyChild = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { fullName, dateOfBirth, gender, parentName, parentPhone, address, classId } = req.body;

    if (!fullName || !dateOfBirth || !gender) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ: Họ tên, Ngày sinh, Giới tính',
      });
    }

    const newStudent = new Student({
      fullName: fullName.trim(),
      dateOfBirth: new Date(dateOfBirth),
      gender,
      parent: {
        name: parentName ? String(parentName).trim() : '',
        phone: parentPhone ? String(parentPhone).trim() : '',
      },
      address: address ? address.trim() : '',
      classId: classId || undefined,
      parentId,
      status: 'active',
    });

    await newStudent.save();

    const populated = await Student.findById(newStudent._id).populate('classId', 'className');

    return res.status(201).json({
      status: 'success',
      message: 'Thêm thông tin con thành công',
      data: populated,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create my child error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không thêm được thông tin con',
    });
  }
};

/**
 * PUT /api/auth/me/children/:studentId
 * Cập nhật thông tin con (chỉ phụ huynh sở hữu)
 */
const updateMyChild = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { studentId } = req.params;
    const { fullName, dateOfBirth, gender, parentName, parentPhone, address, classId, status } = req.body;

    const student = await Student.findOne({
      _id: studentId,
      $or: [
        { parentId },
        { ParentId: parentId },
        { userId: parentId },
        { UserId: parentId },
      ]
    });
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy thông tin con',
      });
    }

    if (fullName !== undefined) student.fullName = fullName.trim();
    if (dateOfBirth !== undefined) student.dateOfBirth = new Date(dateOfBirth);
    if (gender !== undefined) student.gender = gender;
    if (parentName !== undefined || parentPhone !== undefined) {
      student.parent = student.parent || {};
      if (parentName !== undefined) student.parent.name = String(parentName).trim();
      if (parentPhone !== undefined) student.parent.phone = String(parentPhone).trim();
    }
    if (address !== undefined) student.address = address.trim();
    if (classId !== undefined) student.classId = classId || null;
    if (status !== undefined) student.status = status;

    await student.save();

    const populated = await Student.findById(student._id).populate('classId', 'className');

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật thông tin con thành công',
      data: populated,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update my child error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không cập nhật được thông tin con',
    });
  }
};

/**
 * GET /api/auth/me/student
 * Lấy thông tin học sinh của user đăng nhập (role Student)
 */
const getMyStudentInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({
      $or: [
        { parentId: userId },
        { ParentId: userId },
        { userId },
        { UserId: userId },
      ],
    })
      .populate('classId', 'className')
      .lean();

    if (!student) {
      return res.status(200).json({
        status: 'success',
        data: null,
        message: 'Chưa có thông tin học sinh',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: student,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get my student info error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không lấy được thông tin học sinh',
    });
  }
};

/**
 * DELETE /api/auth/me/children/:studentId
 * Xóa thông tin con (chỉ phụ huynh sở hữu)
 */
const deleteMyChild = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { studentId } = req.params;

    const deleted = await Student.findOneAndDelete({
      _id: studentId,
      $or: [{ userId: parentId }, { UserId: parentId }]
    });
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy thông tin con',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Đã xóa thông tin con',
      data: deleted,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete my child error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không xóa được thông tin con',
    });
  }
};

module.exports = {
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyAccount,
  verifyOTP,
  resetPassword,
  getMyChildren,
  createMyChild,
  updateMyChild,
  deleteMyChild,
  getMyStudentInfo,
};
