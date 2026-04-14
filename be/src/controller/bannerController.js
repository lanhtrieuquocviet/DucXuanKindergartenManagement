const service = require('../services/bannerService.js');

const getAdminHomepageBanners = async (req, res, next) => service.getAdminHomepageBanners(req, res, next);
const updateAdminHomepageBanners = async (req, res, next) => service.updateAdminHomepageBanners(req, res, next);
const createAdminHomepageBanner = async (req, res, next) => service.createAdminHomepageBanner(req, res, next);
const updateAdminHomepageBannerById = async (req, res, next) => service.updateAdminHomepageBannerById(req, res, next);
const deleteAdminHomepageBannerById = async (req, res, next) => service.deleteAdminHomepageBannerById(req, res, next);
const getPublicHomepageBanners = async (req, res, next) => service.getPublicHomepageBanners(req, res, next);

module.exports = {
  getAdminHomepageBanners,
  updateAdminHomepageBanners,
  createAdminHomepageBanner,
  updateAdminHomepageBannerById,
  deleteAdminHomepageBannerById,
  getPublicHomepageBanners,
};
