const InspectionCommittee = require('../models/InspectionCommittee');
const InspectionMinutes = require('../models/InspectionMinutes');
const User = require('../models/User');
const Role = require('../models/Role');
const AcademicYear = require('../models/AcademicYear');
const Asset = require('../models/Asset');
const AssetAdjustment = require('../models/AssetAdjustment');
const AssetIncident = require('../models/AssetIncident');
const auditService = require('./assetAuditService');

// Đồng bộ role InventoryStaff — một giáo viên chỉ thuộc 1 ban tại một thời điểm
async function syncInventoryStaffRole(addUserIds = [], removeUserIds = []) {
  const inventoryRole = await Role.findOne({ roleName: 'InventoryStaff' }).lean();
  if (!inventoryRole) return;
  const roleId = inventoryRole._id;

  if (addUserIds.length) {
    await User.updateMany({ _id: { $in: addUserIds } }, { $addToSet: { roles: roleId } });
  }
  if (removeUserIds.length) {
    await User.updateMany({ _id: { $in: removeUserIds } }, { $pull: { roles: roleId } });
  }
}
const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle, VerticalAlign,
} = require('docx');

// ===================== COMMITTEES =====================

exports.listCommittees = async (req, res) => {
  try {
    const { academicYearId } = req.query;
    const filter = {};
    if (academicYearId) filter.academicYearId = academicYearId;

    const committees = await InspectionCommittee.find(filter)
      .populate('createdBy', 'fullName username')
      .populate('academicYearId', 'yearName')
      .sort({ createdAt: -1 });
    return res.json({ status: 'success', data: { committees } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getCommittee = async (req, res) => {
  try {
    const committee = await InspectionCommittee.findById(req.params.id).populate('createdBy', 'fullName username');
    if (!committee) return res.status(404).json({ status: 'error', message: 'Không tìm thấy ban kiểm kê.' });
    return res.json({ status: 'success', data: { committee } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.createCommittee = async (req, res) => {
  try {
    const { name, foundedDate, decisionNumber, members, academicYearId } = req.body;
    if (!name || !foundedDate || !decisionNumber) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng điền đầy đủ thông tin.' });
    }
    const memberIds = (members || []).map(m => m.userId).filter(Boolean);
    if (memberIds.length) {
      const conflict = await InspectionCommittee.findOne({
        status: 'active',
        'members.userId': { $in: memberIds },
      }).lean();
      if (conflict) {
        return res.status(409).json({ status: 'error', message: 'Một hoặc nhiều thành viên đã thuộc ban kiểm kê đang hoạt động.' });
      }
    }

    // Resolve academicYearId
    let resolvedYearId = academicYearId || null;
    if (!resolvedYearId) {
      const activeYear = await AcademicYear.findOne({ status: 'active' }).select('_id').lean();
      if (activeYear) resolvedYearId = activeYear._id;
    }

    const committee = await InspectionCommittee.create({
      name, foundedDate, decisionNumber,
      academicYearId: resolvedYearId,
      members: members || [],
      createdBy: req.user._id,
    });
    await syncInventoryStaffRole(memberIds, []);
    return res.status(201).json({ status: 'success', data: { committee } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.updateCommittee = async (req, res) => {
  try {
    const { name, foundedDate, decisionNumber, members } = req.body;
    const old = await InspectionCommittee.findById(req.params.id).lean();
    if (!old) return res.status(404).json({ status: 'error', message: 'Không tìm thấy ban kiểm kê.' });

    const oldIds = (old.members || []).map(m => m.userId?.toString()).filter(Boolean);
    const newIds = (members || []).map(m => m.userId?.toString()).filter(Boolean);
    const addIds    = newIds.filter(id => !oldIds.includes(id));
    const removeIds = oldIds.filter(id => !newIds.includes(id));

    // Validate thành viên mới không thuộc ban khác đang active
    if (addIds.length) {
      const conflict = await InspectionCommittee.findOne({
        _id: { $ne: req.params.id },
        status: 'active',
        'members.userId': { $in: addIds },
      }).lean();
      if (conflict) {
        return res.status(409).json({ status: 'error', message: 'Một hoặc nhiều thành viên đã thuộc ban kiểm kê đang hoạt động.' });
      }
    }

    const committee = await InspectionCommittee.findByIdAndUpdate(
      req.params.id,
      { name, foundedDate, decisionNumber, members },
      { new: true, runValidators: true }
    );
    await syncInventoryStaffRole(addIds, removeIds);

    return res.json({ status: 'success', data: { committee } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.deleteCommittee = async (req, res) => {
  try {
    const committee = await InspectionCommittee.findByIdAndDelete(req.params.id);
    if (!committee) return res.status(404).json({ status: 'error', message: 'Không tìm thấy ban kiểm kê.' });
    return res.json({ status: 'success', message: 'Xóa ban kiểm kê thành công.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.endCommittee = async (req, res) => {
  try {
    const old = await InspectionCommittee.findById(req.params.id).lean();
    if (!old) return res.status(404).json({ status: 'error', message: 'Không tìm thấy ban kiểm kê.' });

    const committee = await InspectionCommittee.findByIdAndUpdate(
      req.params.id,
      { status: 'ended', endedAt: new Date() },
      { new: true }
    );

    const memberIds = (old.members || []).map(m => m.userId?.toString()).filter(Boolean);
    await syncInventoryStaffRole([], memberIds);

    return res.json({ status: 'success', data: { committee } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ===================== MINUTES =====================

// Teacher: only their own minutes
exports.listMyMinutes = async (req, res) => {
  try {
    const { academicYearId } = req.query;
    const filter = { createdBy: req.user._id };
    if (academicYearId) filter.academicYearId = academicYearId;

    const minutes = await InspectionMinutes.find(filter)
      .populate('createdBy', 'fullName username')
      .populate('committeeId', 'name members')
      .populate('academicYearId', 'yearName')
      .sort({ createdAt: -1 });
    return res.json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.listMinutes = async (req, res) => {
  try {
    const { academicYearId } = req.query;
    const filter = {};
    if (academicYearId) filter.academicYearId = academicYearId;

    const minutes = await InspectionMinutes.find(filter)
      .populate('createdBy', 'fullName username')
      .populate('committeeId', 'name')
      .populate('academicYearId', 'yearName')
      .sort({ createdAt: -1 });
    return res.json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getMinutes = async (req, res) => {
  try {
    const minutes = await InspectionMinutes.findById(req.params.id)
      .populate('createdBy', 'fullName username')
      .populate('committeeId', 'name members');
    if (!minutes) return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });
    return res.json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.createMinutes = async (req, res) => {
  try {
    const { className, scope, location, inspectionDate, inspectionTime, endTime, reason, inspectionMethod, committeeId, assets, extraAssets, conclusion, academicYearId } = req.body;
    if (!inspectionDate) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn ngày kiểm kê.' });
    }

    // Resolve academicYearId
    let resolvedYearId = academicYearId || null;
    if (!resolvedYearId) {
      const activeYear = await AcademicYear.findOne({ status: 'active' }).select('_id').lean();
      if (activeYear) resolvedYearId = activeYear._id;
    }

    const minutes = await InspectionMinutes.create({
      className: className || '',
      scope: scope || '',
      location: location || 'Đức Xuân',
      inspectionDate,
      inspectionTime: inspectionTime || '',
      endTime: endTime || '',
      reason: reason || '',
      inspectionMethod: inspectionMethod || '',
      committeeId: committeeId || null,
      academicYearId: resolvedYearId,
      assets: assets || [],
      extraAssets: extraAssets || [],
      conclusion: conclusion || '',
      createdBy: req.user._id,
      status: 'pending',
    });

    // ─── SNAPSHOTTING ───
    // Chụp ảnh số lượng và tình trạng tài sản hiện tại
    const assetIds = (assets || []).map(a => a.assetId).filter(Boolean);
    if (assetIds.length > 0) {
      const currentAssets = await Asset.find({ _id: { $in: assetIds } }).lean();
      minutes.snapshot = currentAssets.map(a => ({
        assetId: a._id,
        expectedQty: a.quantity,
        condition: a.condition,
      }));
      await minutes.save();
    }

    await minutes.populate('createdBy', 'fullName username');
    return res.status(201).json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.updateMinutes = async (req, res) => {
  try {
    const { className, scope, location, inspectionDate, inspectionTime, endTime, reason, inspectionMethod, committeeId, assets, extraAssets, conclusion } = req.body;
    const oldMinutes = await InspectionMinutes.findById(req.params.id);
    if (!oldMinutes) return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });
    
    if (oldMinutes.status === 'approved') {
      return res.status(400).json({ status: 'error', message: 'Không thể chỉnh sửa biên bản đã duyệt.' });
    }

    // Nếu biên bản đang bị reject, tạo version mới thay vì sửa đè (Audit trail)
    if (oldMinutes.status === 'rejected') {
      const newVersion = new InspectionMinutes({
        minutesNumber: oldMinutes.minutesNumber, // Giữ nguyên mã số
        className: className || oldMinutes.className,
        scope: scope || oldMinutes.scope,
        location: location || oldMinutes.location,
        inspectionDate: inspectionDate || oldMinutes.inspectionDate,
        inspectionTime: inspectionTime || oldMinutes.inspectionTime,
        endTime: endTime || oldMinutes.endTime,
        reason: reason || oldMinutes.reason,
        inspectionMethod: inspectionMethod || oldMinutes.inspectionMethod,
        committeeId: committeeId || oldMinutes.committeeId,
        academicYearId: oldMinutes.academicYearId,
        assets: assets || oldMinutes.assets,
        extraAssets: extraAssets || oldMinutes.extraAssets,
        snapshot: oldMinutes.snapshot, // Giữ nguyên snapshot của lần đầu
        conclusion: conclusion || oldMinutes.conclusion,
        version: oldMinutes.version + 1,
        status: 'pending',
        createdBy: req.user._id,
      });
      await newVersion.save();
      return res.json({ status: 'success', message: 'Đã tạo phiên bản mới cho biên bản.', data: newVersion });
    }

    // Nếu đang là draft hoặc pending (chưa duyệt/chưa reject), cho phép sửa đè
    Object.assign(oldMinutes, { className: className || '', scope, location, inspectionDate, inspectionTime, endTime, reason, inspectionMethod, committeeId, assets, extraAssets: extraAssets || [], conclusion });
    await oldMinutes.save();
    await oldMinutes.populate('createdBy', 'fullName username');
    return res.json({ status: 'success', data: { minutes: oldMinutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.approveMinutes = async (req, res) => {
  try {
    const minutes = await InspectionMinutes.findById(req.params.id);
    if (!minutes) return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });
    if (minutes.status === 'approved') return res.status(400).json({ status: 'error', message: 'Biên bản đã được duyệt trước đó.' });

    // 1. Tạo các bản ghi Adjustment thay vì sync trực tiếp
    const adjustments = [];
    const incidents = [];

    for (const item of minutes.assets) {
      const snap = minutes.snapshot.find(s => s.assetId.toString() === (item.assetId || '').toString());
      const expected = snap ? snap.expectedQty : 0;
      const actual = item.quantity || 0;
      const diff = actual - expected;

      if (diff !== 0) {
        adjustments.push({
          assetId: item.assetId,
          type: diff > 0 ? 'excess' : 'missing',
          oldQty: expected,
          newQty: actual,
          difference: diff,
          reason: `Kiểm kê lớp ${minutes.className} (${minutes.minutesNumber})`,
          sourceInspectionId: minutes._id,
          createdBy: req.user._id,
        });

        if (diff < 0) {
          incidents.push({
            assetId: item.assetId,
            assetName: item.name,
            assetCode: item.assetCode,
            className: minutes.className,
            location: minutes.location || minutes.className,
            type: 'lost',
            severity: 'medium',
            description: `Mất tài sản phát hiện qua kiểm kê ${minutes.minutesNumber}. Thiếu ${Math.abs(diff)} đơn vị so với thực tế.`,
            sourceInspectionId: minutes._id,
            createdBy: req.user._id,
            reporter: req.user._id,
          });
        }
      }

      // Check hỏng hóc trong ghi chú hoặc condition (logic demo)
      if (item.notes && (item.notes.toLowerCase().includes('hỏng') || item.notes.toLowerCase().includes('sửa'))) {
        incidents.push({
          assetId: item.assetId,
          assetName: item.name,
          assetCode: item.assetCode,
          className: minutes.className,
          location: minutes.location || minutes.className,
          type: 'broken',
          severity: 'medium',
          description: `Tài sản hỏng/cần sửa chữa phát hiện qua kiểm kê ${minutes.minutesNumber}: ${item.notes}`,
          sourceInspectionId: minutes._id,
          createdBy: req.user._id,
          reporter: req.user._id,
        });
      }
    }

    if (adjustments.length > 0) {
      await AssetAdjustment.insertMany(adjustments);
    }
    if (incidents.length > 0) {
      await AssetIncident.insertMany(incidents);
    }

    minutes.status = 'approved';
    await minutes.save();

    await auditService.logAssetAction(null, 'APPROVE_INSPECTION', req.user._id, {
      minutesId: minutes._id,
      adjustmentCount: adjustments.length,
      incidentCount: incidents.length,
    });

    return res.json({ status: 'success', data: { minutes, adjustmentsCreated: adjustments.length } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.rejectMinutes = async (req, res) => {
  try {
    const { rejectReason } = req.body;
    const minutes = await InspectionMinutes.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectReason: rejectReason || '' },
      { new: true }
    ).populate('createdBy', 'fullName username');
    if (!minutes) return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });
    return res.json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.exportMinutesWord = async (req, res) => {
  try {
    const minutes = await InspectionMinutes.findById(req.params.id)
      .populate('createdBy', 'fullName username')
      .populate('committeeId', 'name members');
    if (!minutes) return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });

    const {
      minutesNumber, className, scope, location, inspectionDate,
      inspectionTime, endTime, reason, inspectionMethod,
      assets = [], extraAssets = [], committeeId: committee,
    } = minutes;

    const d = inspectionDate ? new Date(inspectionDate) : null;
    const dayStr   = d ? d.getDate()           : '___';
    const monthStr = d ? d.getMonth() + 1      : '___';
    const yearStr  = d ? d.getFullYear()        : '______';
    const titleParts = [className, scope].filter(Boolean).map(s => s.toUpperCase()).join(' - ');

    // ── helpers ────────────────────────────────────────────────────────────
    const noBorder = {
      top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 },
      left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 },
    };
    const thinBorder = {
      top: { style: BorderStyle.SINGLE, size: 4 }, bottom: { style: BorderStyle.SINGLE, size: 4 },
      left: { style: BorderStyle.SINGLE, size: 4 }, right: { style: BorderStyle.SINGLE, size: 4 },
    };

    const tcell = (text, opts = {}) => new TableCell({
      borders: opts.noBorder ? noBorder : thinBorder,
      verticalAlign: VerticalAlign.CENTER,
      shading: opts.shading ? { fill: opts.shading } : undefined,
      columnSpan: opts.colSpan,
      children: [new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        children: [new TextRun({ text: String(text ?? ''), bold: opts.bold, size: opts.size || 22, font: 'Times New Roman' })],
      })],
    });

    const para = (text, opts = {}) => new Paragraph({
      alignment: opts.align,
      spacing: { before: opts.spaceBefore || 60, after: opts.spaceAfter || 60 },
      children: [new TextRun({
        text: String(text ?? ''),
        bold: opts.bold,
        italics: opts.italic,
        size: opts.size || 24,
        font: 'Times New Roman',
        underline: opts.underline ? {} : undefined,
      })],
    });

    // ── asset table ────────────────────────────────────────────────────────
    const assetRows = [];
    assetRows.push(new TableRow({
      tableHeader: true,
      children: [
        tcell('TT',              { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
        tcell('MÃ SỐ',           { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
        tcell('TÊN THIẾT BỊ',   { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
        tcell('ĐVT',             { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
        tcell('SL',              { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
        tcell('ĐỐI TƯỢNG SD',   { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
        tcell('GHI CHÚ',         { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
      ],
    }));

    let tt = 0;
    let lastCat = null;
    for (const a of assets) {
      if (a.category && a.category !== lastCat) {
        lastCat = a.category;
        assetRows.push(new TableRow({
          children: [new TableCell({
            borders: thinBorder,
            columnSpan: 7,
            shading: { fill: 'F2F2F2' },
            children: [new Paragraph({ children: [new TextRun({ text: a.category, bold: true, size: 22, font: 'Times New Roman' })] })],
          })],
        }));
      }
      tt++;
      assetRows.push(new TableRow({
        children: [
          tcell(tt,             { align: AlignmentType.CENTER }),
          tcell(a.assetCode,   { align: AlignmentType.CENTER }),
          tcell(a.name),
          tcell(a.unit,        { align: AlignmentType.CENTER }),
          tcell(a.quantity,    { align: AlignmentType.CENTER }),
          tcell(a.targetUser,  { align: AlignmentType.CENTER }),
          tcell(a.notes),
        ],
      }));
    }

    const assetTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: assetRows,
      columnWidths: [600, 1200, 3000, 700, 700, 1400, 1400],
    });

    // ── extra assets table (ngoài thông tư) ───────────────────────────────────
    let extraTable = null;
    if (extraAssets.length > 0) {
      const extraRows = [];
      extraRows.push(new TableRow({
        tableHeader: true,
        children: [
          tcell('TT',              { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
          tcell('MÃ SỐ',           { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
          tcell('TÊN THIẾT BỊ',   { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
          tcell('ĐVT',             { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
          tcell('SL',              { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
          tcell('ĐỐI TƯỢNG SD',   { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
          tcell('GHI CHÚ',         { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
        ],
      }));
      let extraTt = 0;
      let extraLastCat = null;
      for (const a of extraAssets) {
        if (a.category && a.category !== extraLastCat) {
          extraLastCat = a.category;
          extraRows.push(new TableRow({
            children: [new TableCell({
              borders: thinBorder,
              columnSpan: 7,
              shading: { fill: 'F2F2F2' },
              children: [new Paragraph({ children: [new TextRun({ text: a.category, bold: true, size: 22, font: 'Times New Roman' })] })],
            })],
          }));
        }
        extraTt++;
        extraRows.push(new TableRow({
          children: [
            tcell(extraTt,         { align: AlignmentType.CENTER }),
            tcell(a.assetCode,     { align: AlignmentType.CENTER }),
            tcell(a.name),
            tcell(a.unit,          { align: AlignmentType.CENTER }),
            tcell(a.quantity,      { align: AlignmentType.CENTER }),
            tcell(a.targetUser,    { align: AlignmentType.CENTER }),
            tcell(a.notes),
          ],
        }));
      }
      extraTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: extraRows,
        columnWidths: [600, 1200, 3000, 700, 700, 1400, 1400],
      });
    }

    // ── signature table ────────────────────────────────────────────────────
    const leaderName  = committee?.members?.find(m => m.role === 'Trưởng ban')?.fullName || '';
    const secretName  = committee?.members?.find(m => m.role === 'Phó ban')?.fullName || '';
    const signTable   = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({
        children: [
          new TableCell({ borders: noBorder, children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'XÁC NHẬN CỦA NHÀ TRƯỜNG', bold: true, size: 22, font: 'Times New Roman' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Phó Hiệu Trưởng)', italics: true, size: 20, font: 'Times New Roman' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 }, children: [new TextRun({ text: leaderName, size: 22, font: 'Times New Roman' })] }),
          ]}),
          new TableCell({ borders: noBorder, children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'GIÁO VIÊN CHỦ NHIỆM', bold: true, size: 22, font: 'Times New Roman' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 }, children: [new TextRun({ text: '', size: 22, font: 'Times New Roman' })] }),
          ]}),
          new TableCell({ borders: noBorder, children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI GHI BIÊN BẢN', bold: true, size: 22, font: 'Times New Roman' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 }, children: [new TextRun({ text: secretName, size: 22, font: 'Times New Roman' })] }),
          ]}),
        ],
      })],
      columnWidths: [2933, 2934, 2933],
    });

    // ── build members paragraphs ───────────────────────────────────────────
    const memberParas = (committee?.members?.length)
      ? committee.members.map((m, i) => para(
          `${i + 1}. ${m.fullName}${m.role !== 'Thành viên' ? ` - ${m.role}` : ''}`,
          { spaceBefore: 40, spaceAfter: 40 }
        ))
      : [para('(Chưa có thành viên)', { italic: true })];

    const methodLines = (inspectionMethod || '').split('\n')
      .map(line => para(`- ${line}`, { spaceBefore: 40, spaceAfter: 40 }));

    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 1080 } } },
        children: [
          para('CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM', { bold: true, align: AlignmentType.CENTER, size: 26 }),
          para('Độc lập - Tự do - Hạnh phúc', { bold: true, underline: true, align: AlignmentType.CENTER, size: 24 }),
          para(`BIÊN BẢN KIỂM KÊ TÀI SẢN${titleParts ? ' ' + titleParts : ''}`, { bold: true, align: AlignmentType.CENTER, size: 28, spaceBefore: 160 }),
          para(`${location || 'Đức Xuân'}, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`, { italic: true, align: AlignmentType.CENTER }),

          para('I/ Thành phần Ban kiểm kê:', { bold: true, spaceBefore: 120 }),
          ...memberParas,

          para('II/ Lí do kiểm kê:', { bold: true, spaceBefore: 80 }),
          para(`- ${reason || '...'}`, { spaceBefore: 40, spaceAfter: 40 }),

          para('III/ Thời gian kiểm kê:', { bold: true, spaceBefore: 80 }),
          para(`- Vào hồi ${inspectionTime || '___'} ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`, { spaceBefore: 40, spaceAfter: 40 }),

          para('IV/ Hình thức kiểm kê:', { bold: true, spaceBefore: 80 }),
          ...methodLines,

          para('V/ Nội dung kiểm kê:', { bold: true, spaceBefore: 80 }),
          para('KIỂM KÊ TÀI SẢN CÓ TRONG LỚP HỌC:', { bold: true, align: AlignmentType.CENTER }),

          assetTable,

          ...(extraTable ? [
            para('CÁC THIẾT BỊ TÀI SẢN KHÁC NGOÀI THÔNG TƯ', { bold: true, align: AlignmentType.CENTER, spaceBefore: 120 }),
            extraTable,
          ] : []),

          para(
            `Kiểm kê kết thúc vào lúc ${endTime || '___'} ngày ${dayStr} tháng ${monthStr} năm ${yearStr}. Biên bản này được sao thành 2 bản, giáo viên chủ nhiệm lớp giữ một bản và Ban kiểm kê giữ một bản.`,
            { spaceBefore: 160 }
          ),

          new Paragraph({ spacing: { before: 200 } }),
          signTable,
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = `bien_ban_kiem_ke_${minutesNumber || minutes._id}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    return res.send(buffer);
  } catch (err) {
    console.error('[exportMinutesWord]', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.deleteMinutes = async (req, res) => {
  try {
    const minutes = await InspectionMinutes.findByIdAndDelete(req.params.id);
    if (!minutes) return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });
    return res.json({ status: 'success', message: 'Xóa biên bản thành công.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
