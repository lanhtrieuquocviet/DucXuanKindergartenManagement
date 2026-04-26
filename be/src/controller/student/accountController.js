const User = require('../../models/User');
const { normalizePhone, upsertParentProfileFromUser } = require('./helpers');

const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ status: 'error', message: 'Thiếu username' });
    const user = await User.findOne({ username }).lean();
    return res.status(200).json({ status: 'success', available: !user });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const checkParentByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ status: 'error', message: 'Thiếu số điện thoại' });
    const normalizedPhone = normalizePhone(phone);
    
    let parent = await User.findOne({ 
      $or: [{ username: normalizedPhone }, { phone: normalizedPhone }] 
    }).select('fullName email phone roles status').lean();

    if (parent) {
      await upsertParentProfileFromUser(parent);
    }

    return res.status(200).json({
      status: 'success',
      exists: !!parent,
      data: parent || null,
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  checkUsernameAvailability,
  checkParentByPhone,
};
