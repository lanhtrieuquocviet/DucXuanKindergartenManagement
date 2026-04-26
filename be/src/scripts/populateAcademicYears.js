const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const AcademicYear = require('../models/AcademicYear');

async function populateYears() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const years = await AcademicYear.find({});
    for (const year of years) {
      if (year.startDate && !year.startYear) {
        year.startYear = new Date(year.startDate).getFullYear();
      }
      if (year.endDate && !year.endYear) {
        year.endYear = new Date(year.endDate).getFullYear();
      }
      await year.save();
    }
    console.log('Populated startYear and endYear for existing academic years');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

populateYears();
