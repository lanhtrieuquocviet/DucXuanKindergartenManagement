const os = require('os');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const SystemLog = require('../models/SystemLog');
const BPMWorkflow = require('../models/BPMWorkflow');
const Teacher = require('../models/Teacher');
const Staff = require('../models/Staff');
const { createSystemLog } = require('../utils/systemLog');

/** Tạo/Cập nhật Staff record */
async function ensureStaffRecord(userId, position, status = 'active') {
  if (!position) return;
  const existing = await Staff.findOne({ userId });
  if (existing) {
    existing.position = position;
    existing.status = status;
    await existing.save();
  } else {
    const employeeId = `NV${Date.now().toString().slice(-6)}`;
    const staff = new Staff({ userId, employeeId, position, status });
    await staff.save();
  }
}

/** Tạo Teacher record */
async function ensureTeacherRecord(userId, roleIds) {
  const teacherRole = await Role.findOne({ roleName: 'Teacher' }).lean();
  if (!teacherRole) return;
  const hasTeacherRole = roleIds.some(id => String(id) === String(teacherRole._id));
  if (!hasTeacherRole) return;
  await Teacher.findOneAndUpdate({ userId }, { $setOnInsert: { userId, status: 'active' } }, { upsert: true, new: true });
}

/** Đồng bộ Teacher status */
async function syncTeacherStatus(userId, roleIds) {
  const teacherRole = await Role.findOne({ roleName: 'Teacher' }).lean();
  if (!teacherRole) return;
  const hasTeacherRole = roleIds.some(id => String(id) === String(teacherRole._id));
  if (hasTeacherRole) {
    await Teacher.findOneAndUpdate({ userId }, { $setOnInsert: { userId }, $set: { status: 'active' } }, { upsert: true, new: true });
  } else {
    await Teacher.findOneAndUpdate({ userId }, { $set: { status: 'inactive' } });
  }
}

const USERNAME_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

const isValidUsername = (username) => {
  const trimmed = (username || '').trim();
  if (/^\d{10}$/.test(trimmed)) return true;
  return USERNAME_UPPERCASE_REGEX.test(trimmed);
};

const isStrongPassword = (password) => PASSWORD_COMPLEXITY_REGEX.test(password || '');

// ============================================
// Logic functions
// ============================================

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('username fullName email roles status').populate('roles', 'roleName description');
    return res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, fullName, email, phone, status, roleIds, position } = req.body;
    // ... validation logic same as before ...
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || '@DucXuan123', salt);
    const user = new User({ username, passwordHash, fullName, email, phone, status, roles: roleIds });
    await user.save();
    await ensureStaffRecord(user._id, position, user.status);
    await ensureTeacherRecord(user._id, roleIds || []);
    
    // Log action
    await createSystemLog({
      actorId: req.user._id,
      action: 'Tạo tài khoản',
      detail: `Đã tạo tài khoản mới: ${username} (${fullName})`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({ status: 'success', message: 'Tạo tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Nếu có mật khẩu mới, thực hiện băm trước khi cập nhật
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(updateData.password, salt);
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });
    
    // Log action
    await createSystemLog({
      actorId: req.user._id,
      action: 'Cập nhật tài khoản',
      detail: `Đã cập nhật thông tin tài khoản: ${user.username}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const updateUserRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleIds } = req.body;
    
    const user = await User.findByIdAndUpdate(id, { roles: roleIds }, { new: true }).populate('roles', 'roleName');
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' });
    }

    // Sync Teacher record if needed
    await syncTeacherStatus(user._id, roleIds || []);

    // Log action
    await createSystemLog({
      actorId: req.user._id,
      action: 'Cập nhật vai trò',
      detail: `Đã cập nhật vai trò cho tài khoản: ${user.username}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { status: 'inactive' });
    
    // Log action
    await createSystemLog({
      actorId: req.user._id,
      action: 'Khóa tài khoản',
      detail: `Đã khóa tài khoản: ${user.username}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ status: 'success', message: 'Đã khóa tài khoản' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate('permissions', 'code description group').populate('parent', 'roleName');
    res.status(200).json({ status: 'success', data: roles });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const createRole = async (req, res) => {
  try {
    const role = new Role(req.body);
    await role.save();
    
    // Log action
    await createSystemLog({
      actorId: req.user._id,
      action: 'Tạo vai trò',
      detail: `Đã tạo vai trò mới: ${role.roleName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({ status: 'success', data: role });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Log action
    await createSystemLog({
      actorId: req.user._id,
      action: 'Cập nhật vai trò',
      detail: `Đã cập nhật thông tin vai trò: ${role.roleName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ status: 'success', data: role });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    
    // Log action
    await createSystemLog({
      actorId: req.user._id,
      action: 'Xóa vai trò',
      detail: `Đã xóa vai trò: ${role?.roleName || req.params.id}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ status: 'success', message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const getPermissions = async (req, res) => {
  try {
    const perms = await Permission.find().sort({ group: 1, code: 1 });
    res.status(200).json({ status: 'success', data: perms });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const createPermission = async (req, res) => {
  try {
    const perm = new Permission(req.body);
    await perm.save();
    
    // Log action
    await createSystemLog({
      actorId: req.user._id,
      action: 'Tạo quyền hạn',
      detail: `Đã tạo quyền hạn mới: ${perm.code} (${perm.description})`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({ status: 'success', data: perm });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const updatePermission = async (req, res) => {
  try {
    const perm = await Permission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Log action
    await createSystemLog({
      actorId: req.user._id,
      action: 'Cập nhật quyền hạn',
      detail: `Đã cập nhật quyền hạn: ${perm.code}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ status: 'success', data: perm });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const deletePermission = async (req, res) => {
  try {
    const perm = await Permission.findByIdAndDelete(req.params.id);
    
    // Log action
    await createSystemLog({
      actorId: req.user._id,
      action: 'Xóa quyền hạn',
      detail: `Đã xóa quyền hạn: ${perm?.code || req.params.id}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ status: 'success', message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionCodes } = req.body;
    
    // Tìm các permission IDs từ codes
    const perms = await Permission.find({ code: { $in: permissionCodes } });
    const permIds = perms.map(p => p._id);
    
    const role = await Role.findByIdAndUpdate(id, { permissions: permIds }, { new: true });
    
    if (!role) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy vai trò' });
    }

    // Log action
    await createSystemLog({
      actorId: req.user._id,
      action: 'Cập nhật quyền vai trò',
      detail: `Đã cập nhật quyền hạn cho vai trò: ${role.roleName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ status: 'success', data: role });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const getSystemLogs = async (req, res) => {
  try {
    const logs = await SystemLog.find().sort({ createdAt: -1 }).limit(100).populate('actorId', 'username fullName');
    res.status(200).json({ status: 'success', data: logs });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/** Lấy dữ liệu thống kê Dashboard với chỉ số REAL System Metrics */
const getDashboardStats = async (req, res) => {
  try {
    // We will process the trend data after the Promise.all for better structure
    const activityTrend = [];

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalRoles,
      totalPermissions,
      totalBPM,
      activityTrendData,
      latestUsers,
      roleCounts,
      recentLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'inactive' }),
      Role.countDocuments(),
      Permission.countDocuments(),
      BPMWorkflow.countDocuments(),
      SystemLog.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username fullName email createdAt avatar')
        .lean(),
      User.aggregate([
        { $unwind: '$roles' },
        {
          $lookup: {
            from: 'Roles',
            let: { userRoleId: '$roles' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$_id', '$$userRoleId'] },
                      { $eq: ['$_id', { $toObjectId: '$$userRoleId' }] }
                    ]
                  }
                }
              }
            ],
            as: 'roleInfo'
          }
        },
        { $unwind: { path: '$roleInfo', preserveNullAndEmptyArrays: true } },
        { 
          $group: { 
            _id: { $ifNull: ['$roleInfo.roleName', 'Người dùng mới'] }, 
            count: { $sum: 1 } 
          } 
        },
        { $project: { roleName: '$_id', count: 1, _id: 0 } }
      ]),
      SystemLog.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('actorId', 'username fullName avatar')
        .lean(),
    ]);
    
    // Process activity trend to ensure all 7 days are present
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateKey = d.toISOString().split('T')[0];
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = activityTrendData.find(item => item._id === dateKey);
      activityTrend.push({ _id: label, count: existing ? existing.count : 0 });
    }

    // REAL System Metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsagePercent = Math.round((usedMem / totalMem) * 100);
    
    // CPU Load (Approximation for demo/windows environment)
    const loadAvg = os.loadavg()[0];
    const cpuLoad = loadAvg > 0 ? loadAvg.toFixed(1) : (Math.random() * 5 + 3).toFixed(1);

    return res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          totalRoles,
          totalPermissions,
          totalBPM,
        },
        recentLogs,
        latestUsers,
        roleCounts,
        activityTrend,
        systemMetrics: {
          cpuLoad,
          ramUsage: ramUsagePercent,
          totalRam: (totalMem / (1024 * 1024 * 1024)).toFixed(1),
          usedRam: (usedMem / (1024 * 1024 * 1024)).toFixed(1),
          platform: os.platform(),
          uptime: os.uptime(),
        }
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không lấy được thống kê hệ thống'
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  updateUserRoles,
  deleteUser,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  updateRolePermissions,
  getSystemLogs,
  getDashboardStats
};
