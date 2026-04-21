const Blog = require('../models/Blog');
const BlogCategory = require('../models/BlogCategory');
const HomepageBannerSetting = require('../models/HomepageBannerSetting');
const ImageLibraryItem = require('../models/ImageLibraryItem');
const PublicInfo = require('../models/PublicInfo');
const Timetable = require('../models/Timetable');

/**
 * Get all data needed for the homepage in a single request
 */
exports.getHomepageData = async (req, res) => {
  try {
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

    // Fetch one latest blog per category
    const featuredBlogs = await Promise.all(
      categories.map(async (cat) => {
        const blog = await Blog.findOne({ 
          category: cat._id, 
          status: 'published' 
        })
        .sort({ createdAt: -1 })
        .lean();
        
        if (blog) {
          return {
            ...blog,
            categoryName: cat.name
          };
        }
        return null;
      })
    );

    res.json({
      success: true,
      data: {
        banners: banners?.banners || [],
        featuredBlogs: featuredBlogs.filter(Boolean),
        gallery,
        organizationStructure: publicInfo?.organizationStructure || {},
        timetable: {
          data: timetable,
          effectiveSeason: timetable[0]?.appliesToSeason || 'quanh năm'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};
