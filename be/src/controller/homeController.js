const Blog = require('../models/Blog');
const BlogCategory = require('../models/BlogCategory');
const HomepageBannerSetting = require('../models/HomepageBannerSetting');
const ImageLibraryItem = require('../models/ImageLibraryItem');
const Timetable = require('../models/Timetable');
const AcademicYear = require('../models/AcademicYear');
const { getOrganizationStructureData } = require('../services/publicInfoService');

function minutesToLabel(m) {
  const mm = Number(m);
  if (Number.isNaN(mm)) return '';
  const h = Math.floor(mm / 60);
  const minutes = mm % 60;
  return `${h}:${String(minutes).padStart(2, '0')}`;
}

// Simple in-memory cache
let homepageCache = {
  data: null,
  expiry: 0
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all data needed for the homepage in a single request
 */
exports.getHomepageData = async (req, res) => {
  try {
    // Check cache
    const now = Date.now();
    if (homepageCache.data && now < homepageCache.expiry) {
      return res.json({
        success: true,
        data: homepageCache.data,
        fromCache: true
      });
    }

    const activeYear = await AcademicYear.findOne({ status: 'active' })
      .sort({ startDate: -1 })
      .select('_id')
      .lean();

    const [
      banners,
      categories,
      gallery,
      organizationStructure,
      timetableRaw
    ] = await Promise.all([
      HomepageBannerSetting.findOne().lean(),
      BlogCategory.find().lean(),
      ImageLibraryItem.find().sort({ createdAt: -1 }).limit(6).lean(),
      getOrganizationStructureData(),
      activeYear
        ? Timetable.find({ academicYear: activeYear._id }).sort({ startMinutes: 1 }).limit(6).lean()
        : Promise.resolve([])
    ]);

    const timetable = timetableRaw.map(item => ({
      ...item,
      startLabel: minutesToLabel(item.startMinutes),
      endLabel: minutesToLabel(item.endMinutes),
    }));

    // Fetch latest blog for each category more efficiently
    // We can use an aggregation to get the latest blog for each category in one call
    const featuredBlogs = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $sort: { createdAt: -1 } },
      { 
        $group: { 
          _id: '$category', 
          latestBlog: { $first: '$$ROOT' } 
        } 
      }
    ]);

    // Map category names to blogs
    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat._id.toString()] = cat.name;
      return acc;
    }, {});

    const processedBlogs = featuredBlogs
      .map(item => {
        const blog = item.latestBlog;
        return {
          ...blog,
          categoryName: categoryMap[blog.category?.toString()] || 'Tin tức'
        };
      })
      .filter(Boolean);

    const resultData = {
      banners: banners?.banners || [],
      featuredBlogs: processedBlogs,
      gallery,
      organizationStructure: organizationStructure || {},
      timetable: {
        data: timetable,
        effectiveSeason: timetable[0]?.appliesToSeason || 'quanh năm'
      }
    };

    // Update cache
    homepageCache = {
      data: resultData,
      expiry: now + CACHE_DURATION
    };

    res.json({
      success: true,
      data: resultData
    });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

