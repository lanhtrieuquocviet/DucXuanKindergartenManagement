const InspectionCommittee = require('../models/InspectionCommittee');
const InspectionMinutes = require('../models/InspectionMinutes');
const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle, VerticalAlign,
} = require('docx');

// ===================== COMMITTEES =====================

exports.listCommittees = async (req, res) => {
  try {
    const committees = await InspectionCommittee.find()
      .populate('createdBy', 'fullName username')
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
    const { name, foundedDate, decisionNumber, members } = req.body;
    if (!name || !foundedDate || !decisionNumber) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng điền đầy đủ thông tin.' });
    }
    const committee = await InspectionCommittee.create({
      name,
      foundedDate,
      decisionNumber,
      members: members || [],
      createdBy: req.user._id,
    });
    return res.status(201).json({ status: 'success', data: { committee } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.updateCommittee = async (req, res) => {
  try {
    const { name, foundedDate, decisionNumber, members } = req.body;
    const committee = await InspectionCommittee.findByIdAndUpdate(
      req.params.id,
      { name, foundedDate, decisionNumber, members },
      { new: true, runValidators: true }
    );
    if (!committee) return res.status(404).json({ status: 'error', message: 'Không tìm thấy ban kiểm kê.' });
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
    const committee = await InspectionCommittee.findByIdAndUpdate(
      req.params.id,
      { status: 'ended' },
      { new: true }
    );
    if (!committee) return res.status(404).json({ status: 'error', message: 'Không tìm thấy ban kiểm kê.' });
    return res.json({ status: 'success', data: { committee } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ===================== MINUTES =====================

// Teacher: only their own minutes
exports.listMyMinutes = async (req, res) => {
  try {
    const minutes = await InspectionMinutes.find({ createdBy: req.user._id })
      .populate('createdBy', 'fullName username')
      .populate('committeeId', 'name members')
      .sort({ createdAt: -1 });
    return res.json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.listMinutes = async (req, res) => {
  try {
    const minutes = await InspectionMinutes.find()
      .populate('createdBy', 'fullName username')
      .populate('committeeId', 'name')
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
    const { className, scope, location, inspectionDate, inspectionTime, endTime, reason, inspectionMethod, committeeId, assets, conclusion } = req.body;
    if (!inspectionDate) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn ngày kiểm kê.' });
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
      assets: assets || [],
      conclusion: conclusion || '',
      createdBy: req.user._id,
      status: 'pending',
    });
    await minutes.populate('createdBy', 'fullName username');
    return res.status(201).json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.updateMinutes = async (req, res) => {
  try {
    const { className, scope, location, inspectionDate, inspectionTime, endTime, reason, inspectionMethod, committeeId, assets, conclusion } = req.body;
    const minutes = await InspectionMinutes.findById(req.params.id);
    if (!minutes) return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });
    if (minutes.status === 'approved') {
      return res.status(400).json({ status: 'error', message: 'Không thể chỉnh sửa biên bản đã duyệt.' });
    }
    Object.assign(minutes, { className: className || '', scope, location, inspectionDate, inspectionTime, endTime, reason, inspectionMethod, committeeId, assets, conclusion });
    await minutes.save();
    await minutes.populate('createdBy', 'fullName username');
    return res.json({ status: 'success', data: { minutes } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.approveMinutes = async (req, res) => {
  try {
    const minutes = await InspectionMinutes.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    ).populate('createdBy', 'fullName username');
    if (!minutes) return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });
    return res.json({ status: 'success', data: { minutes } });
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
      assets = [], committeeId: committee,
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
