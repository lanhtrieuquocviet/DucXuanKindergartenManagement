const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkStudents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('Students');

    // Find documents where academicYearId is an ObjectId (type 7)
    const docs = await collection.find({ academicYearId: { $type: 7 } }).toArray();
    console.log(`Found ${docs.length} documents with ObjectId academicYearId`);

    for (const doc of docs) {
        console.log(`Fixing doc ${doc._id}`);
        await collection.updateOne(
            { _id: doc._id },
            { $set: { academicYearId: [doc.academicYearId] } }
        );
    }

    console.log('Done');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStudents();
