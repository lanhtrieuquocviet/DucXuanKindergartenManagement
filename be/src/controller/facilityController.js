const facilityService = require('../services/facilityService');
const FacilityCategory = require('../models/FacilityCategory');
const FacilityType = require('../models/FacilityType');
const FacilityItem = require('../models/FacilityItem');
const FacilityLocation = require('../models/FacilityLocation');
const FacilityHandover = require('../models/FacilityHandover');
const FacilityInventory = require('../models/FacilityInventory');
const FacilityIssue = require('../models/FacilityIssue');

const facilityController = {
  // --- Locations ---
  async listLocations(req, res) {
    try {
      const locations = await FacilityLocation.find().populate('managerId', 'fullName');
      res.json({ status: 'success', data: locations });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  async createLocation(req, res) {
    try {
      const location = await FacilityLocation.create(req.body);
      res.json({ status: 'success', data: location });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  // --- Categories & Types ---
  async listCategories(req, res) {
    try {
      const categories = await FacilityCategory.find();
      res.json({ status: 'success', data: categories });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  async listTypes(req, res) {
    try {
      const types = await FacilityType.find().populate('categoryId');
      res.json({ status: 'success', data: types });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  // --- Assets ---
  async listAssets(req, res) {
    try {
      const { locationId, typeId, status, area } = req.query;
      const filter = {};
      if (locationId) filter.currentLocationId = locationId;
      if (typeId) filter.typeId = typeId;
      if (status) filter.status = status;
      
      // Nếu lọc theo Area, cần tìm các locationId thuộc Area đó trước
      if (area) {
        const locations = await FacilityLocation.find({ area }).select('_id');
        filter.currentLocationId = { $in: locations.map(l => l._id) };
      }

      const assets = await FacilityItem.find(filter)
        .populate({
          path: 'typeId',
          populate: { path: 'categoryId' }
        })
        .populate('currentLocationId');
      
      res.json({ status: 'success', data: assets });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  // --- Handover ---
  async createHandover(req, res) {
    try {
      const handover = await FacilityHandover.create({
        ...req.body,
        senderId: req.user._id,
        handoverCode: `HO-${Date.now()}`
      });
      res.json({ status: 'success', data: handover });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  async signHandover(req, res) {
    try {
      const result = await facilityService.signHandover(req.params.id, req.user._id);
      res.json({ status: 'success', data: result });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  // --- Inventory ---
  async createInventory(req, res) {
    try {
      const inventory = await FacilityInventory.create(req.body);
      res.json({ status: 'success', data: inventory });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  async approveInventory(req, res) {
    try {
      const result = await facilityService.approveInventory(req.params.id, req.user._id);
      res.json({ status: 'success', data: result });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  // --- Issues ---
  async reportIssue(req, res) {
    try {
      const issue = await FacilityIssue.create({
        ...req.body,
        reporterId: req.user._id
      });
      res.json({ status: 'success', data: issue });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  async updateIssue(req, res) {
    try {
      const { status, resolution } = req.body;
      const result = await facilityService.updateIssueStatus(req.params.id, status, resolution);
      res.json({ status: 'success', data: result });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
};

module.exports = facilityController;
