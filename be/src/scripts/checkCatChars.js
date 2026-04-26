const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Asset = require('../models/Asset');

async function checkAssetCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const cats = await Asset.distinct('category');
    console.log('Categories in DB:');
    cats.forEach(c => {
      console.log(`- NAME: "${c}"`);
      console.log(`  LEN: ${c.length}`);
      console.log(`  HEX: ${Buffer.from(c).toString('hex')}`);
    });
    
    console.log('\nHardcoded Options:');
    const options = [
      'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em',
      'Số bàn, ghế ngồi',
      'Khối phòng phục vụ học tập',
      'Phòng tổ chức ăn, nghỉ',
      'Công trình công cộng và khối phòng phục vụ khác',
      'Khối phòng hành chính quản trị',
      'Diện tích đất',
      'Thiết bị dạy học và CNTT'
    ];
    options.forEach(o => {
      console.log(`- NAME: "${o}"`);
      console.log(`  LEN: ${o.length}`);
      console.log(`  HEX: ${Buffer.from(o).toString('hex')}`);
    });

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkAssetCategories();
