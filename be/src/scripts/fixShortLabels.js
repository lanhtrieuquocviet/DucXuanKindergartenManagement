const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');

async function fixShortDescriptions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const updates = [
      // Tài sản & Mua sắm
      { code: 'MANAGE_ASSET', description: 'Danh mục tài sản' },
      { code: 'MANAGE_INSPECTION', description: 'Kiểm kê tài sản' },
      { code: 'MANAGE_PURCHASE_REQUEST', description: 'Yêu cầu mua sắm' },
      { code: 'MANAGE_HANDOVER', description: 'Bàn giao tài sản' },
      { code: 'MANAGE_ASSET_ISSUES', description: 'Sự cố tài sản' },
      { code: 'MANAGE_ROOM_ASSETS', description: 'Tài sản theo phòng' },
      { code: 'ACCESS_INVENTORY', description: 'Quản lý kho & CSVC' },
      { code: 'MANAGE_FACILITIES', description: 'Quản lý CSVC' },

      // Nội dung & Truyền thông
      { code: 'MANAGE_IMAGE_LIBRARY', description: 'Thư viện ảnh' },
      { code: 'MANAGE_VIDEOS', description: 'Quản lý Video-clip' },
      { code: 'MANAGE_BLOG', description: 'Bài viết & Tin tức' },
      { code: 'MANAGE_BANNER', description: 'Quản lý Banner' },
      { code: 'MANAGE_QA', description: 'Hỏi đáp phụ huynh' },

      // Học vụ
      { code: 'MANAGE_ACADEMIC_PLAN', description: 'Thiết lập kế hoạch' },
      { code: 'MANAGE_ACADEMIC_EVENTS', description: 'Thiết lập sự kiện' },
      { code: 'MANAGE_CURRICULUM', description: 'Thời khóa biểu' },
      { code: 'MANAGE_STUDENT', description: 'Quản lý học sinh' },
      { code: 'MANAGE_CLASS', description: 'Quản lý lớp học' },
      { code: 'MANAGE_GRADE', description: 'Quản lý khối lớp' },
      { code: 'MANAGE_TEACHER', description: 'Quản lý giáo viên' },
      { code: 'MANAGE_STAFF_POSITION', description: 'Danh mục chức vụ' },

      // Dinh dưỡng
      { code: 'SCHOOL_ADMIN_DISTRICT_NUTRITION', description: 'Quy định dinh dưỡng sở' },
      { code: 'KITCHEN_DISTRICT_NUTRITION', description: 'Quy định dinh dưỡng sở' },
      { code: 'MANAGE_INGREDIENTS', description: 'Nguyên liệu' },

      // Điểm danh
      { code: 'VIEW_ATTENDANCE', description: 'Xem điểm danh' },
      { code: 'REGISTER_FACE', description: 'Đăng ký khuôn mặt' },

      // Tài liệu
      { code: 'MANAGE_DOCUMENTS', description: 'Tài liệu nội bộ' },
      { code: 'MANAGE_DOCUMENT', description: 'Quản lý tài liệu' }
    ];

    for (const u of updates) {
      await Permission.findOneAndUpdate({ code: u.code }, { description: u.description });
      console.log(`Updated ${u.code} -> ${u.description}`);
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixShortDescriptions();
