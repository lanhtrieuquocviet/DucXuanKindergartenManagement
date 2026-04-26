require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./src/models/Student');
const User = require('./src/models/User');
const Role = require('./src/models/Role');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await Student.deleteMany({});
  const parentRole = await Role.findOne({ roleName: { $in: ['Parent', 'Phụ huynh'] } });
  if(parentRole) { 
    await User.deleteMany({ roles: parentRole._id }); 
  }
  console.log('Đã dọn dẹp sạch sẽ toàn bộ học sinh và phụ huynh!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
