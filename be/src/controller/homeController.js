const Blog = require('../models/Blog');
const BlogCategory = require('../models/BlogCategory');
const HomepageBannerSetting = require('../models/HomepageBannerSetting');
const ImageLibraryItem = require('../models/ImageLibraryItem');
const PublicInfo = require('../models/PublicInfo');
const Timetable = require('../models/Timetable');

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

    const [
      banners,
      categories,
      gallery,
      publicInfo,
      timetable
    ] = await Promise.all([
      HomepageBannerSetting.findOne().lean(),
      BlogCategory.find().lean(),
      ImageLibraryItem.find().sort({ createdAt: -1 }).limit(6).lean(),
      PublicInfo.findOne().lean(),
      Timetable.find({ isActive: true }).limit(6).lean()
    ]);

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
      organizationStructure: publicInfo?.organizationStructure || {},
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

