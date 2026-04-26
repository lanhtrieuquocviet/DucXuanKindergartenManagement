const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Permission = require('../models/Permission');

// Mock KEY_ICONS keys for comparison
const roleLayoutContent = fs.readFileSync(path.join(__dirname, '../../../fe/src/layouts/RoleLayout.jsx'), 'utf8');
const keyIconsMatch = roleLayoutContent.match(/export const KEY_ICONS = {([\s\S]+?)};/);
const existingKeys = [];
if (keyIconsMatch) {
    const keysRaw = keyIconsMatch[1];
    const keyRegex = /['"]?([a-zA-Z0-9_-]+)['"]?:\s*</g;
    let match;
    while ((match = keyRegex.exec(keysRaw)) !== null) {
        existingKeys.push(match[1]);
    }
}

async function checkMissingIcons() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const perms = await Permission.find({ path: { $ne: "" } });
    console.log(`Checking ${perms.length} permissions for missing icons...`);
    
    perms.forEach(p => {
        const key = p.menuKey || p.code;
        if (!existingKeys.includes(key)) {
            console.log(`MISSING ICON: [${key}] | Desc: ${p.description}`);
        }
    });
    
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkMissingIcons();
