const service = require('../services/dailyMenu.service.js');

const updateDailyMenu = async (req, res, next) => service.updateDailyMenu(req, res, next);

module.exports = {
  updateDailyMenu,
};
