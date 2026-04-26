const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const FacilityCategory = require('../models/FacilityCategory');
const FacilityLocation = require('../models/FacilityLocation');
const FacilityType = require('../models/FacilityType');
const FacilityItem = require('../models/FacilityItem');

const MONGODB_URI = process.env.MONGODB_URI;

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Clear existing data (Optional, but good for clean seed)
    // await FacilityCategory.deleteMany({});
    // await FacilityLocation.deleteMany({});
    // await FacilityType.deleteMany({});
    // await FacilityItem.deleteMany({});

    // 2. Seed Categories
    const categories = [
      { name: 'Thiết bị Điện tử', code: 'DT', description: 'Tivi, Loa, Máy tính, Điều hòa...' },
      { name: 'Đồ gỗ & Nội thất', code: 'NT', description: 'Bàn, Ghế, Tủ kệ, Giường...' },
      { name: 'Đồ chơi & Giáo cụ', code: 'DC', description: 'Đồ chơi vận động, Bộ chữ cái, Học cụ Montessori...' },
      { name: 'Thiết bị Nhà bếp', code: 'KB', description: 'Nồi cơm điện, Tủ lạnh, Máy lọc nước...' },
    ];

    const createdCategories = [];
    for (const cat of categories) {
      const doc = await FacilityCategory.findOneAndUpdate({ code: cat.code }, cat, { upsert: true, new: true });
      createdCategories.push(doc);
    }
    console.log(`✅ Seeded ${createdCategories.length} categories`);

    // 3. Seed Locations
    const locations = [
      { name: 'Kho tổng trường', type: 'warehouse', area: 'Khu trung tâm', description: 'Kho chứa tài sản mới và tài sản chờ phân bổ' },
      { name: 'Phòng Mầm 1', type: 'classroom', area: 'Khu A', description: 'Lớp học khối Mầm' },
      { name: 'Phòng Chồi 1', type: 'classroom', area: 'Khu A', description: 'Lớp học khối Chồi' },
      { name: 'Phòng Lá 1', type: 'classroom', area: 'Khu B', description: 'Lớp học khối Lá' },
      { name: 'Nhà bếp trung tâm', type: 'kitchen', area: 'Khu dịch vụ', description: 'Khu vực chế biến thức ăn' },
      { name: 'Văn phòng Hội đồng', type: 'office', area: 'Khu trung tâm', description: 'Phòng làm việc ban giám hiệu' },
    ];

    const createdLocations = [];
    for (const loc of locations) {
      const doc = await FacilityLocation.findOneAndUpdate({ name: loc.name }, loc, { upsert: true, new: true });
      createdLocations.push(doc);
    }
    console.log(`✅ Seeded ${createdLocations.length} locations`);

    const warehouse = createdLocations.find(l => l.type === 'warehouse');

    // 4. Seed Facility Types
    const electronics = createdCategories.find(c => c.code === 'DT');
    const furniture = createdCategories.find(c => c.code === 'NT');

    const types = [
      { categoryId: electronics._id, name: 'Tivi Sony 55 inch', unit: 'Cái', specifications: '4K Ultra HD, Smart TV' },
      { categoryId: electronics._id, name: 'Điều hòa Daikin 12000 BTU', unit: 'Cái', specifications: 'Inverter, Gas R32' },
      { categoryId: furniture._id, name: 'Bàn gỗ mầm non', unit: 'Cái', specifications: 'Gỗ cao su, kích thước 60x100cm' },
      { categoryId: furniture._id, name: 'Ghế nhựa cao cấp', unit: 'Cái', specifications: 'Nhựa đúc nguyên khối' },
    ];

    const createdTypes = [];
    for (const t of types) {
      const doc = await FacilityType.findOneAndUpdate({ name: t.name }, t, { upsert: true, new: true });
      createdTypes.push(doc);
    }
    console.log(`✅ Seeded ${createdTypes.length} asset types`);

    // 5. Seed some Items in Warehouse
    const tvType = createdTypes.find(t => t.name.includes('Tivi'));
    const items = [
      { typeId: tvType._id, assetCode: 'TB-DT-001', status: 'good', currentLocationId: warehouse._id, purchaseDate: new Date() },
      { typeId: tvType._id, assetCode: 'TB-DT-002', status: 'good', currentLocationId: warehouse._id, purchaseDate: new Date() },
    ];

    for (const item of items) {
      await FacilityItem.findOneAndUpdate({ assetCode: item.assetCode }, item, { upsert: true });
    }
    console.log(`✅ Seeded ${items.length} initial items in Warehouse`);

    console.log('🌟 SEEDING COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
