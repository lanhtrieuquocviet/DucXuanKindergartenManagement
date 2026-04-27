const svc = require('../services/roomAssetService');

const listRooms         = async (req, res, next) => svc.listRooms(req, res, next);
const listRoomAssets    = async (req, res, next) => svc.listRoomAssets(req, res, next);
const addAssetToRoom    = async (req, res, next) => svc.addAssetToRoom(req, res, next);
const updateRoomAsset   = async (req, res, next) => svc.updateRoomAsset(req, res, next);
const removeAssetFromRoom = async (req, res, next) => svc.removeAssetFromRoom(req, res, next);
const bulkImportRoomAssets = async (req, res, next) => svc.bulkImportRoomAssets(req, res, next);

module.exports = {
  listRooms,
  listRoomAssets,
  addAssetToRoom,
  updateRoomAsset,
  removeAssetFromRoom,
  bulkImportRoomAssets,
};
