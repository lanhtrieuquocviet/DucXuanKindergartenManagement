const AssetAdjustment = require('../models/AssetAdjustment');
const Asset = require('../models/Asset');
const auditService = require('./assetAuditService');

exports.listAdjustments = async (req, res) => {
  try {
    const { status, assetId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (assetId) filter.assetId = assetId;

    const adjustments = await AssetAdjustment.find(filter)
      .populate('assetId', 'name assetCode quantity')
      .populate('sourceInspectionId', 'minutesNumber')
      .populate('createdBy', 'fullName username')
      .populate('appliedBy', 'fullName username')
      .sort({ createdAt: -1 });

    return res.json({ status: 'success', data: { adjustments } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.applyAdjustment = async (req, res) => {
  try {
    const adjustment = await AssetAdjustment.findById(req.params.id);
    if (!adjustment) return res.status(404).json({ status: 'error', message: 'Không tìm thấy lệnh điều chỉnh.' });
    if (adjustment.status !== 'pending') return res.status(400).json({ status: 'error', message: 'Lệnh này đã được xử lý hoặc bị hủy.' });

    const asset = await Asset.findById(adjustment.assetId);
    if (!asset) return res.status(404).json({ status: 'error', message: 'Không tìm thấy tài sản liên quan.' });

    const oldQty = asset.quantity;
    asset.quantity = adjustment.newQty;
    
    // Nếu là hỏng, có thể cần update thêm brokenQuantity
    if (adjustment.type === 'damage') {
      asset.brokenQuantity = (asset.brokenQuantity || 0) + Math.abs(adjustment.difference);
      asset.goodQuantity = Math.max(0, (asset.goodQuantity || 0) - Math.abs(adjustment.difference));
      asset.condition = 'Đã hỏng';
    } else if (adjustment.type === 'disposal') {
      // Thanh lý: Trừ thẳng vào quantity và brokenQuantity
      const subQty = Math.abs(adjustment.difference);
      asset.brokenQuantity = Math.max(0, (asset.brokenQuantity || 0) - subQty);
      asset.quantity = Math.max(0, (asset.quantity || 0) - subQty);
    }

    await asset.save();

    adjustment.status = 'applied';
    adjustment.appliedBy = req.user._id;
    adjustment.appliedAt = new Date();
    await adjustment.save();

    await auditService.logAssetAction(asset._id, 'APPLY_ADJUSTMENT', req.user._id, {
      type: adjustment.type,
      oldQty,
      newQty: asset.quantity,
      difference: adjustment.difference,
      adjustmentId: adjustment._id,
    });

    return res.json({ status: 'success', data: { adjustment, currentAssetQty: asset.quantity } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.voidAdjustment = async (req, res) => {
  try {
    const adjustment = await AssetAdjustment.findByIdAndUpdate(
      req.params.id,
      { status: 'void' },
      { new: true }
    );
    if (!adjustment) return res.status(404).json({ status: 'error', message: 'Không tìm thấy lệnh điều chỉnh.' });
    return res.json({ status: 'success', data: { adjustment } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
