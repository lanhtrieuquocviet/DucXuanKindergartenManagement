const AssetAllocation = require('../models/AssetAllocation');
const Classes         = require('../models/Classes');
const mammoth         = require('mammoth');
const WordExtractor   = require('word-extractor');
const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle,
  VerticalAlign, HeadingLevel,
} = require('docx');
let JSDOM = null;
try {
  ({ JSDOM } = require('jsdom'));
} catch (_) {
  JSDOM = null;
}

// ─── List all allocations ──────────────────────────────────────────────────
exports.listAllocations = async (req, res) => {
  try {
    const { status, classId, gradeId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (classId) {
      filter.classId = classId;
    } else if (gradeId) {
      const gradeClasses = await Classes.find({ gradeId }, '_id').lean();
      filter.classId = { $in: gradeClasses.map((c) => c._id) };
    }

    const allocations = await AssetAllocation.find(filter)
      .populate({ path: 'classId', select: 'className gradeId', populate: { path: 'gradeId', select: 'gradeName' } })
      .populate('createdBy', 'fullName username')
      .populate('confirmedBy', 'fullName username')
      .sort({ createdAt: -1 });
    return res.json({ status: 'success', data: { allocations } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Get one allocation ────────────────────────────────────────────────────
exports.getAllocation = async (req, res) => {
  try {
    const allocation = await AssetAllocation.findById(req.params.id)
      .populate('classId', 'className')
      .populate('createdBy', 'fullName username')
      .populate('confirmedBy', 'fullName username')
      .populate('transferHistory.transferredBy', 'fullName username');
    if (!allocation)
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản bàn giao.' });
    return res.json({ status: 'success', data: { allocation } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Create allocation ─────────────────────────────────────────────────────
exports.createAllocation = async (req, res) => {
  try {
    const {
      classId,
      className,
      teacherName,
      teacherPosition,
      handoverByName,
      handoverByPosition,
      handoverDate,
      academicYear,
      assets,
      extraAssets,
      notes,
    } = req.body;

    if (!assets || !Array.isArray(assets) || assets.length === 0)
      return res.status(400).json({ status: 'error', message: 'Danh sách tài sản không được để trống.' });

    // Kiểm tra lớp đã có biên bản đang hoạt động hoặc chờ xác nhận chưa
    if (classId) {
      const existing = await AssetAllocation.findOne({ classId, status: { $in: ['active', 'pending_confirmation'] } });
      if (existing)
        return res.status(409).json({
          status: 'error',
          message: `Lớp này đã có biên bản bàn giao đang hoạt động (${existing.documentCode}). Không thể tạo thêm.`,
        });
    }

    // Resolve className from classId if not provided
    let resolvedClassName = className || '';
    if (classId && !resolvedClassName) {
      const cls = await Classes.findById(classId);
      if (cls) resolvedClassName = cls.className;
    }

    const allocation = new AssetAllocation({
      classId:            classId || undefined,
      className:          resolvedClassName,
      teacherName:        teacherName || '',
      teacherPosition:    teacherPosition || 'Giáo viên',
      handoverByName:     handoverByName || '',
      handoverByPosition: handoverByPosition || 'Hiệu trưởng',
      handoverDate:       handoverDate ? new Date(handoverDate) : new Date(),
      academicYear:       academicYear || '',
      assets,
      extraAssets:        Array.isArray(extraAssets) ? extraAssets : [],
      notes:              notes || '',
      status:             'pending_confirmation',
      confirmedAt:        null,
      transferHistory:    [],
      createdBy:          req.user._id,
    });

    await allocation.save();
    return res.status(201).json({ status: 'success', data: { allocation } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Update allocation ─────────────────────────────────────────────────────
exports.updateAllocation = async (req, res) => {
  try {
    const allocation = await AssetAllocation.findById(req.params.id);
    if (!allocation)
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản bàn giao.' });

    if (allocation.status === 'transferred')
      return res.status(400).json({ status: 'error', message: 'Không thể chỉnh sửa biên bản đã chuyển lớp.' });

    const fields = [
      'classId','className','teacherName','teacherPosition',
      'handoverByName','handoverByPosition','academicYear','assets','extraAssets','notes',
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) allocation[f] = req.body[f];
    }
    if (req.body.handoverDate) allocation.handoverDate = new Date(req.body.handoverDate);
    if (req.body.status && ['pending_confirmation', 'active', 'returned'].includes(req.body.status)) {
      allocation.status = req.body.status;
    }

    await allocation.save();
    return res.json({ status: 'success', data: { allocation } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Delete allocation ─────────────────────────────────────────────────────
exports.deleteAllocation = async (req, res) => {
  try {
    const allocation = await AssetAllocation.findByIdAndDelete(req.params.id);
    if (!allocation)
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản bàn giao.' });
    return res.json({ status: 'success', message: 'Xóa biên bản thành công.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Transfer allocation to another class ─────────────────────────────────
exports.transferAllocation = async (req, res) => {
  try {
    const { toClassId, toClassName, toTeacherName, transferDate, note } = req.body;

    const allocation = await AssetAllocation.findById(req.params.id);
    if (!allocation)
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản bàn giao.' });

    if (allocation.status === 'returned')
      return res.status(400).json({ status: 'error', message: 'Tài sản đã được thu hồi, không thể chuyển.' });
    if (allocation.status === 'pending_confirmation')
      return res.status(400).json({ status: 'error', message: 'Biên bản chưa được giáo viên xác nhận, không thể chuyển lớp.' });

    // Resolve target class name
    let resolvedToClassName = toClassName || '';
    if (toClassId && !resolvedToClassName) {
      const cls = await Classes.findById(toClassId);
      if (cls) resolvedToClassName = cls.className;
    }

    // Record transfer history
    allocation.transferHistory.push({
      fromClassName:   allocation.className,
      toClassName:     resolvedToClassName,
      fromTeacherName: allocation.teacherName,
      toTeacherName:   toTeacherName || '',
      transferDate:    transferDate ? new Date(transferDate) : new Date(),
      note:            note || '',
      transferredBy:   req.user._id,
    });

    // Update current holder
    allocation.classId      = toClassId || allocation.classId;
    allocation.className    = resolvedToClassName;
    allocation.teacherName  = toTeacherName || '';
    allocation.status       = 'transferred';

    await allocation.save();
    return res.json({ status: 'success', data: { allocation } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Teacher: confirm handover ────────────────────────────────────────────
exports.confirmAllocation = async (req, res) => {
  try {
    const allocation = await AssetAllocation.findById(req.params.id);
    if (!allocation)
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản bàn giao.' });

    if (allocation.status !== 'pending_confirmation')
      return res.status(400).json({ status: 'error', message: 'Biên bản này không ở trạng thái chờ xác nhận.' });

    allocation.status      = 'active';
    allocation.confirmedAt = new Date();
    allocation.confirmedBy = req.user._id;
    await allocation.save();

    return res.json({ status: 'success', data: { allocation } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Export Word document for one allocation ──────────────────────────────
exports.exportWord = async (req, res) => {
  try {
    const allocation = await AssetAllocation.findById(req.params.id)
      .populate('classId', 'className');
    if (!allocation)
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy biên bản.' });

    const {
      documentCode, className, teacherName, teacherPosition,
      handoverByName, handoverByPosition, handoverDate, academicYear,
      assets = [], extraAssets = [], notes,
    } = allocation;

    const dateStr = handoverDate
      ? new Date(handoverDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '___/___/______';

    // ── Helpers ────────────────────────────────────────────────────────────
    const noBorder = {
      top: { style: BorderStyle.NONE, size: 0 },
      bottom: { style: BorderStyle.NONE, size: 0 },
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
    };
    const thinBorder = {
      top:    { style: BorderStyle.SINGLE, size: 4 },
      bottom: { style: BorderStyle.SINGLE, size: 4 },
      left:   { style: BorderStyle.SINGLE, size: 4 },
      right:  { style: BorderStyle.SINGLE, size: 4 },
    };

    const cell = (text, opts = {}) => new TableCell({
      borders: opts.noBorder ? noBorder : thinBorder,
      verticalAlign: VerticalAlign.CENTER,
      shading: opts.shading ? { fill: opts.shading } : undefined,
      columnSpan: opts.colSpan,
      rowSpan: opts.rowSpan,
      children: [new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        children: [new TextRun({
          text: String(text ?? ''),
          bold: opts.bold,
          size: opts.size || 22,
          font: 'Times New Roman',
        })],
      })],
    });

    const para = (text, opts = {}) => new Paragraph({
      alignment: opts.align,
      spacing: { before: opts.spaceBefore || 80, after: opts.spaceAfter || 80 },
      children: [new TextRun({
        text: String(text ?? ''),
        bold: opts.bold,
        italics: opts.italic,
        size: opts.size || 24,
        font: 'Times New Roman',
        underline: opts.underline ? {} : undefined,
      })],
    });

    // ── Asset table rows ───────────────────────────────────────────────────
    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        cell('TT',               { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
        cell('Mã số',            { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
        cell('Tên thiết bị',     { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
        cell('ĐVT',              { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
        cell('SL',               { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
        cell('Đối tượng SD',     { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
        cell('Ghi chú',          { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
      ],
    });

    const assetRows = [];
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
            children: [new Paragraph({
              children: [new TextRun({ text: a.category, bold: true, size: 22, font: 'Times New Roman' })],
            })],
          })],
        }));
      }
      tt++;
      assetRows.push(new TableRow({
        children: [
          cell(tt,              { align: AlignmentType.CENTER }),
          cell(a.assetCode,    { align: AlignmentType.CENTER }),
          cell(a.name),
          cell(a.unit,         { align: AlignmentType.CENTER }),
          cell(a.quantity,     { align: AlignmentType.CENTER }),
          cell(a.targetUser,   { align: AlignmentType.CENTER }),
          cell(a.notes),
        ],
      }));
    }

    const assetTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...assetRows],
      columnWidths: [600, 1200, 3000, 700, 700, 1200, 1400],
    });

    // ── Extra assets table ─────────────────────────────────────────────────
    const extraSection = [];
    if (extraAssets && extraAssets.length > 0) {
      extraSection.push(
        para('CÁC THIẾT BỊ TÀI SẢN KHÁC NGOÀI THÔNG TƯ', { bold: true, spaceBefore: 160 }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                cell('TT',              { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
                cell('Tên đồ dùng',     { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
                cell('ĐV tính',         { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
                cell('Số lượng',        { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
                cell('Đối tượng SD',    { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
                cell('Ghi chú',         { bold: true, align: AlignmentType.CENTER, shading: 'D9D9D9' }),
              ],
            }),
            ...extraAssets.map((a, i) => new TableRow({
              children: [
                cell(i + 1,         { align: AlignmentType.CENTER }),
                cell(a.name),
                cell(a.unit,        { align: AlignmentType.CENTER }),
                cell(a.quantity,    { align: AlignmentType.CENTER }),
                cell(a.targetUser,  { align: AlignmentType.CENTER }),
                cell(a.notes),
              ],
            })),
          ],
          columnWidths: [600, 3000, 900, 900, 1500, 1400],
        }),
      );
    }

    // ── Signature table ────────────────────────────────────────────────────
    const signTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: noBorder,
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'XÁC NHẬN NHÀ TRƯỜNG', bold: true, size: 22, font: 'Times New Roman' })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Hiệu trưởng)', italics: true, size: 20, font: 'Times New Roman' })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 }, children: [new TextRun({ text: handoverByName || '', size: 22, font: 'Times New Roman' })] }),
              ],
            }),
            new TableCell({
              borders: noBorder,
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI BÀN GIAO', bold: true, size: 22, font: 'Times New Roman' })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ' ', size: 20, font: 'Times New Roman' })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 }, children: [new TextRun({ text: '', size: 22, font: 'Times New Roman' })] }),
              ],
            }),
            new TableCell({
              borders: noBorder,
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI NHẬN BÀN GIAO', bold: true, size: 22, font: 'Times New Roman' })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Giáo viên)', italics: true, size: 20, font: 'Times New Roman' })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 }, children: [new TextRun({ text: teacherName || '', size: 22, font: 'Times New Roman' })] }),
              ],
            }),
          ],
        }),
      ],
      columnWidths: [2800, 2800, 2800],
    });

    // ── Build document ─────────────────────────────────────────────────────
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 1080 },
          },
        },
        children: [
          // Header
          para('CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM', { bold: true, align: AlignmentType.CENTER, size: 26 }),
          para('Độc lập - Tự do - Hạnh phúc', { bold: true, align: AlignmentType.CENTER, size: 24, underline: true }),

          // Title
          para('BIÊN BẢN BÀN GIAO TÀI SẢN LỚP MẪU GIÁO', { bold: true, align: AlignmentType.CENTER, size: 28, spaceBefore: 160 }),
          ...(className ? [para(className.toUpperCase(), { bold: true, align: AlignmentType.CENTER, size: 26 })] : []),
          para(`Đức Xuân, ngày ${dateStr}`, { italic: true, align: AlignmentType.CENTER }),

          // Sections
          para('I/ Thành phần:', { bold: true, spaceBefore: 120 }),
          para(`1. ${handoverByName || '___________________________'} — Chức vụ: ${handoverByPosition || 'Hiệu trưởng'}`),
          para(`2. ${teacherName   || '___________________________'} — Chức vụ: ${teacherPosition   || 'Giáo viên'}`),

          para('II/ Lý do bàn giao:', { bold: true, spaceBefore: 80 }),
          para(`Bàn giao tài sản có trong lớp học${academicYear ? ` năm học ${academicYear}` : ''}.`),

          para('III/ Nội dung bàn giao:', { bold: true, spaceBefore: 80 }),
          para('BÀN GIAO TÀI SẢN CÓ TRONG LỚP HỌC', { bold: true, align: AlignmentType.CENTER }),

          assetTable,
          ...extraSection,

          ...(notes ? [para(`Ghi chú: ${notes}`, { italic: true, spaceBefore: 120 })] : []),

          // Close paragraph
          para(
            `Biên bản kết thúc vào lúc _____ ngày ${dateStr}. Biên bản này được thành 2 bản, giao viên chủ nhiệm lớp giữ một bản và Ban CSVC nhà trường giữ một bản.`,
            { spaceBefore: 160 }
          ),

          // Signatures
          new Paragraph({ spacing: { before: 200 } }),
          signTable,
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = `bien_ban_ban_giao_${documentCode || allocation._id}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    return res.send(buffer);
  } catch (err) {
    console.error('[exportWord]', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Parse Word file (.doc / .docx) → asset rows ──────────────────────────
exports.parseWordFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'error', message: 'Không có file.' });

    const { buffer, originalname } = req.file;
    const ext = (originalname || '').split('.').pop().toLowerCase();
    let assets = [];

    let result = { assets: [], extraAssets: [] };

    if (ext === 'docx') {
      const mammothResult = await mammoth.convertToHtml({ buffer });
      result = parseAssetsFromHtml(mammothResult.value);
    } else if (ext === 'doc') {
      const extractor = new WordExtractor();
      const extracted = await extractor.extract(buffer);
      const body = extracted.getBody();
      result = parseAssetsFromText(body);
      // Fallback: nếu không ra gì, thử HTML giả
      if (!result.assets.length && !result.extraAssets.length) {
        const fakeHtml = textToFakeHtml(body);
        if (fakeHtml) result = parseAssetsFromHtml(fakeHtml);
      }
      // Debug nếu vẫn trống
      if (!result.assets.length && !result.extraAssets.length) {
        return res.json({
          status: 'success',
          data: { assets: [], extraAssets: [], count: 0 },
          debug: body.slice(0, 800),
        });
      }
    } else {
      return res.status(400).json({ status: 'error', message: 'Chỉ hỗ trợ .doc và .docx' });
    }

    return res.json({
      status: 'success',
      data: { assets: result.assets, extraAssets: result.extraAssets, count: result.assets.length + result.extraAssets.length },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Strategy 1: Parse từng dòng text trực tiếp (cho .doc) ────────────────
// Trả về { assets, extraAssets } phân biệt theo section header trong text.
function parseAssetsFromText(text) {
  const assets      = [];
  const extraAssets = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const EXTRA_MARKER = /ngoài thông tư|khác ngoài/i;
  const ROMAN_RE     = /^(I{1,3}|IV|VI{0,3}|IX|X{1,3})$/i;
  let isExtra          = false;
  let currentCategory  = '';

  for (const line of lines) {
    if (EXTRA_MARKER.test(line)) { isExtra = true; currentCategory = ''; continue; }

    let parts = line.includes('\t')
      ? line.split('\t').map((p) => p.trim()).filter(Boolean)
      : line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);

    if (parts.length < 2) continue;

    // Hàng tiêu đề danh mục: phần tử đầu là số La Mã
    if (ROMAN_RE.test(parts[0]) && parts.length >= 2) {
      const catName = parts.slice(1).join(' ').trim();
      currentCategory = `${parts[0]}. ${catName}`;
      continue;
    }

    if (parts.length < 3) continue;
    if (!/^\d{1,3}$/.test(parts[0])) continue;

    let startIdx  = 1;
    let assetCode = '';

    if (/^[A-Z]{1,4}\d{4,}/.test(parts[1])) {
      assetCode = parts[1];
      startIdx  = 2;
    }

    const name = parts[startIdx] || '';
    if (name.length < 3) continue;
    if (/^(tt|stt|tên|thiết bị|mã số|đvt|số lượng|đối tượng|ghi chú|i\.|ii\.|iii\.|iv\.|bàn giao|cộng hoà|độc lập|tên đồ)/i.test(name)) continue;
    if (/^\d+$/.test(name)) continue;

    const rawUnit = parts[startIdx + 1] || '';
    const unit    = rawUnit.length <= 8 ? rawUnit || 'Cái' : 'Cái';
    const rawQty  = (parts[startIdx + 2] || '').replace(/[^0-9]/g, '');
    const quantity = Math.max(1, parseInt(rawQty) || 1);

    let targetUser = 'Trẻ';
    for (let k = startIdx + 3; k < parts.length; k++) {
      const t = parts[k].toLowerCase();
      if (/gi[áa]o vi[eê]n|gv/.test(t))  { targetUser = 'Giáo viên'; break; }
      if (/d[uù]ng chung|chung/.test(t)) { targetUser = 'Dùng chung'; break; }
      if (/^tr[eẻ]$/.test(t))             { targetUser = 'Trẻ'; break; }
    }

    const notes = parts[startIdx + 4] || '';
    const row = { category: currentCategory, assetCode, name, unit, quantity, targetUser, notes };
    if (isExtra) extraAssets.push(row); else assets.push(row);
  }

  return { assets, extraAssets };
}

// ─── Strategy 2: Chuyển text thô → HTML giả ───────────────────────────────
function textToFakeHtml(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const rows  = lines
    .filter((l) => l.includes('\t') || /\s{2,}/.test(l))
    .map((l) => {
      const cells = l.split(/\t|\s{2,}/).map((c) => c.trim()).filter(Boolean);
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    });
  return rows.length ? `<table>${rows.join('')}</table>` : '';
}

// ─── Strategy 3: Parse HTML tables (cho .docx và fallback .doc) ───────────
// Trả về { assets, extraAssets } dựa vào tiêu đề bảng hoặc text trước bảng.
function parseAssetsFromHtml(html) {
  if (!JSDOM) {
    const plainText = String(html || '')
      .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+\n/g, '\n')
      .replace(/\n\s+/g, '\n')
      .trim();
    return parseAssetsFromText(plainText);
  }

  const { window } = new JSDOM(html);
  const doc         = window.document;
  const tables      = Array.from(doc.querySelectorAll('table'));
  const assets      = [];
  const extraAssets = [];

  // "thiết bị khác" bỏ vì dễ false-positive trong tên thiết bị
  const EXTRA_MARKER = /ngoài thông tư|khác ngoài/i;

  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) continue;

    // ── Xác định bảng thuộc section nào ────────────────────────────────
    // PP1: Trong 3 hàng đầu có ô merged (≤3 cell) chứa EXTRA_MARKER
    let isExtraTable = false;
    for (let i = 0; i < Math.min(rows.length, 3); i++) {
      const rc = Array.from(rows[i].querySelectorAll('td, th'));
      if (rc.length <= 3 && EXTRA_MARKER.test(rc.map(c => c.textContent.trim()).join(' '))) {
        isExtraTable = true;
        break;
      }
    }
    // PP2: prevElementSibling là đoạn ngắn (<80 ký tự) chứa EXTRA_MARKER
    if (!isExtraTable) {
      const prevEl = table.previousElementSibling;
      const pt = prevEl?.textContent?.trim() || '';
      if (pt.length > 0 && pt.length < 80 && EXTRA_MARKER.test(pt)) isExtraTable = true;
    }
    let targetList = isExtraTable ? extraAssets : assets;

    // ── Tìm header row ──────────────────────────────────────────────────
    // Header hợp lệ: phải có ≥3 ô RIÊNG BIỆT + có cả tên-kw VÀ đo-lường-kw
    let headerIdx = -1;
    let colMap    = {};
    let hasTT     = false;

    for (let i = 0; i < Math.min(rows.length, 6); i++) {
      const cells = Array.from(rows[i].querySelectorAll('td, th'))
        .map((c) => c.textContent.trim().toLowerCase().replace(/\s+/g, ' '));

      const hasNameKw  = cells.some(c => /(tên|thiết bị|dụng cụ|đồ chơi)/.test(c));
      const hasMeasKw  = cells.some(c => /đvt|đơn vị|số lượng|\bsl\b|\bsố\b|mã/.test(c));
      const isHeader   = hasNameKw && hasMeasKw && cells.length >= 3;

      if (isHeader) {
        headerIdx = i;
        cells.forEach((text, idx) => {
          if (/^(tt|stt)$/.test(text))                                                  { colMap.tt = idx; hasTT = true; }
          else if (/mã/.test(text) && colMap.assetCode == null)                         colMap.assetCode  = idx;
          else if (/(tên|thiết bị|dụng cụ|đồ chơi)/.test(text) && colMap.name == null) colMap.name       = idx;
          else if (/đvt|đơn vị/.test(text))                                             colMap.unit       = idx;
          else if (/(số lượng|^sl$|^số$)/.test(text) && colMap.quantity == null)        colMap.quantity   = idx;
          else if (/đối tượng|mục đích/.test(text))                                     colMap.targetUser = idx;
          else if (/ghi chú/.test(text))                                                colMap.notes      = idx;
        });
        break;
      }
    }

    if (headerIdx === -1 || colMap.name == null) continue;

    // ── Kiểm tra sub-header row (Bộ/Cái hoặc Trẻ/GV dưới "Số lượng") ──
    let dataStart = headerIdx + 1;
    if (dataStart < rows.length) {
      const subCells = Array.from(rows[dataStart].querySelectorAll('td, th'))
        .map((c) => c.textContent.trim().toLowerCase());
      const subJoined = subCells.join(' ');
      const isSubHeader = /\bbộ\b|\bcái\b|\btrẻ\b.*\bgiáo\b|\bgiáo\b.*\btrẻ\b/.test(subJoined);

      if (isSubHeader) {
        // Đếm số sub-column xuất hiện từ vị trí cột quantity trở đi
        const qtyPos  = colMap.quantity ?? 4;
        const subCount = subCells.slice(qtyPos).filter((t) => t.trim()).length;
        const extra   = Math.max(0, subCount - 1); // số cột dư do split
        if (extra > 0) {
          if (colMap.targetUser != null) colMap.targetUser += extra;
          if (colMap.notes      != null) colMap.notes      += extra;
          // Giữ cột quantity đầu tiên, thêm quantity2 là cột cuối sub-group
          colMap.quantity2 = qtyPos + subCount - 1;
        }
        dataStart++; // bỏ qua hàng sub-header
      }
    }

    // ── Parse data rows ─────────────────────────────────────────────────
    const getText = (cells, idx) =>
      idx != null && cells[idx] ? cells[idx].textContent.trim() : '';

    const ROMAN_RE = /^(I{1,3}|IV|VI{0,3}|IX|X{1,3})$/i;
    let currentCategory = '';

    for (let i = dataStart; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll('td, th'));
      if (cells.length < 2) continue;

      // Hàng phân tách section "ngoài thông tư" nằm trong cùng bảng
      const fullRowText = cells.map(c => c.textContent.trim()).join(' ');
      if (EXTRA_MARKER.test(fullRowText)) {
        targetList = extraAssets;
        currentCategory = '';
        continue;
      }

      const ttText = getText(cells, colMap.tt ?? 0);

      // Hàng tiêu đề danh mục: cột TT là chữ số La Mã (I, II, III...)
      if (ROMAN_RE.test(ttText)) {
        // Lấy tên danh mục từ các ô còn lại
        const categoryName = cells
          .slice(1).map(c => c.textContent.trim()).filter(Boolean).join(' ').trim();
        currentCategory = `${ttText}. ${categoryName}`;
        continue;
      }

      // Bỏ hàng không có số TT hợp lệ
      if (hasTT && (!ttText || !/^\d+$/.test(ttText))) continue;

      const name = getText(cells, colMap.name);
      if (!name) continue;

      // Số lượng: lấy giá trị đầu tiên khác 0 trong các sub-column
      let quantity = 1;
      const q1 = parseInt(getText(cells, colMap.quantity).replace(/[^0-9]/g, '')) || 0;
      const q2 = colMap.quantity2 != null
        ? parseInt(getText(cells, colMap.quantity2).replace(/[^0-9]/g, '')) || 0
        : 0;
      quantity = q1 || q2 || 1;

      // Đối tượng SD: thử từ colMap trước, nếu không khớp thì quét toàn hàng
      let targetUser = 'Trẻ';
      const rawTarget = getText(cells, colMap.targetUser).toLowerCase();
      if      (/gi[áa]o vi[eê]n|gv/.test(rawTarget))      targetUser = 'Giáo viên';
      else if (/d[uù]ng chung|chung/.test(rawTarget))      targetUser = 'Dùng chung';
      else if (/tr[eẻ]/.test(rawTarget))                   targetUser = 'Trẻ';
      else {
        // Quét tất cả cell trong hàng
        for (const cell of cells) {
          const t = cell.textContent.trim().toLowerCase();
          if (/gi[áa]o vi[eê]n/.test(t))       { targetUser = 'Giáo viên'; break; }
          if (/d[uù]ng chung/.test(t))          { targetUser = 'Dùng chung'; break; }
        }
      }

      targetList.push({
        category:   currentCategory,
        assetCode:  getText(cells, colMap.assetCode),
        name,
        unit:       getText(cells, colMap.unit) || 'Cái',
        quantity,
        targetUser,
        notes:      getText(cells, colMap.notes),
      });
    }
  }

  return { assets, extraAssets };
}

// ─── Parse Excel file (.xlsx) → asset rows ────────────────────────────────
exports.parseExcelFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'error', message: 'Không có file.' });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    if (!workbook.worksheets.length)
      return res.status(400).json({ status: 'error', message: 'File Excel không có sheet nào.' });

    const ROMAN_RE = /^(I{1,3}|IV|V?I{0,3}|IX|X{1,3})$/i;

    const parseSheet = (sheet) => {
      const rows = [];
      let headerRowNum = -1;
      let colMap = {};
      let currentCategory = '';

      sheet.eachRow((row, rowNum) => {
        const vals = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          vals[cell.col - 1] = String(cell.text || cell.value || '').trim();
        });

        // Tìm header row
        if (headerRowNum === -1) {
          const joined = vals.join(' ').toLowerCase();
          if (/(tên|thiết bị|dụng cụ)/.test(joined) && /(đvt|đơn vị|số lượng)/.test(joined)) {
            headerRowNum = rowNum;
            vals.forEach((text, idx) => {
              const t = text.toLowerCase().replace(/\s+/g, ' ');
              if (/^(tt|stt)$/.test(t))                                     colMap.tt         = idx;
              else if (/mã/.test(t) && colMap.assetCode == null)            colMap.assetCode  = idx;
              else if (/(tên|thiết bị|dụng cụ)/.test(t) && colMap.name == null) colMap.name  = idx;
              else if (/đvt|đơn vị/.test(t))                                colMap.unit       = idx;
              else if (/(số lượng|^sl$)/.test(t) && colMap.quantity == null) colMap.quantity  = idx;
              else if (/đối tượng|mục đích/.test(t))                        colMap.targetUser = idx;
              else if (/ghi chú/.test(t))                                   colMap.notes      = idx;
            });
          }
          return;
        }

        if (colMap.name == null) return;

        const ttVal  = vals[colMap.tt ?? 0] || '';
        const name   = vals[colMap.name]    || '';
        if (!name) return;

        // Hàng tiêu đề danh mục (cột TT là số La Mã)
        if (ROMAN_RE.test(ttVal)) {
          currentCategory = `${ttVal}. ${name}`;
          return;
        }

        // Bỏ hàng header lặp hoặc không có tên hợp lệ
        if (/^(tên|thiết bị|stt|tt)$/i.test(name)) return;

        const rawQty = (vals[colMap.quantity] || '').replace(/[^0-9]/g, '');
        const qty    = Math.max(0, parseInt(rawQty) || 0);
        const rawTarget = (vals[colMap.targetUser] || '').toLowerCase();
        let targetUser = 'Trẻ';
        if (/gi[áa]o vi[eê]n|gv/.test(rawTarget))     targetUser = 'Giáo viên';
        else if (/d[uù]ng chung|chung/.test(rawTarget)) targetUser = 'Dùng chung';

        rows.push({
          category:   currentCategory,
          assetCode:  vals[colMap.assetCode]  || '',
          name,
          unit:       vals[colMap.unit]       || 'Cái',
          quantity:   qty,
          targetUser,
          notes:      vals[colMap.notes]      || '',
        });
      });

      return rows;
    };

    const assets      = parseSheet(workbook.worksheets[0]);
    const extraAssets = workbook.worksheets[1] ? parseSheet(workbook.worksheets[1]) : [];

    if (!assets.length && !extraAssets.length)
      return res.json({
        status: 'success',
        data: { assets: [], extraAssets: [], count: 0 },
        debug: 'Không tìm thấy dữ liệu hợp lệ.',
      });

    return res.json({
      status: 'success',
      data: { assets, extraAssets, count: assets.length + extraAssets.length },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Generate Excel template (.xlsx) ─────────────────────────────────────
exports.generateExcelTemplate = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const wb      = new ExcelJS.Workbook();
    wb.creator    = 'Trường Mầm non Đức Xuân';

    const BLUE_HDR = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
    const GREY_HDR = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EAF6' } };
    const GREEN_CAT = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
    const WHITE    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    const BORDER   = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
    const CENTER = { horizontal: 'center', vertical: 'middle', wrapText: true };
    const LEFT   = { horizontal: 'left',   vertical: 'middle', wrapText: true };

    const buildSheet = (sheetName, isExtra) => {
      const ws = wb.addWorksheet(sheetName, { pageSetup: { fitToPage: true, fitToWidth: 1 } });

      ws.columns = [
        { key: 'tt',         width: 6  },
        { key: 'assetCode',  width: 12 },
        { key: 'name',       width: 36 },
        { key: 'unit',       width: 9  },
        { key: 'quantity',   width: 11 },
        { key: 'targetUser', width: 15 },
        { key: 'notes',      width: 24 },
      ];

      // ── Row 1: school name ──────────────────────────────────────────────
      ws.mergeCells('A1:G1');
      const r1 = ws.getRow(1);
      r1.height = 20;
      const c1 = r1.getCell(1);
      c1.value = 'UBND THÀNH PHỐ BẮC KẠN — TRƯỜNG MẦM NON ĐỨC XUÂN';
      c1.font  = { bold: true, size: 11, color: { argb: 'FF1565C0' } };
      c1.alignment = CENTER;
      c1.fill = WHITE;

      // ── Row 2: document title ───────────────────────────────────────────
      ws.mergeCells('A2:G2');
      const c2 = ws.getRow(2).getCell(1);
      c2.value = isExtra
        ? 'DANH SÁCH TÀI SẢN NGOÀI THÔNG TƯ — BIÊN BẢN BÀN GIAO'
        : 'DANH SÁCH TÀI SẢN THEO THÔNG TƯ — BIÊN BẢN BÀN GIAO';
      c2.font      = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
      c2.alignment = CENTER;
      c2.fill      = BLUE_HDR;
      ws.getRow(2).height = 26;

      // ── Row 3: sub-title note ───────────────────────────────────────────
      ws.mergeCells('A3:G3');
      const c3 = ws.getRow(3).getCell(1);
      c3.value = isExtra
        ? '(Sheet 2 — Điền các thiết bị tài sản NGOÀI danh mục thông tư. Không cần ghi nhóm.)'
        : '(Sheet 1 — Điền tên nhóm ở cột TT bằng số La Mã: I, II, III... Dữ liệu tài sản điền từ hàng tiếp theo.)';
      c3.font      = { italic: true, size: 10, color: { argb: 'FF555555' } };
      c3.alignment = CENTER;
      c3.fill      = WHITE;
      ws.getRow(3).height = 18;

      // ── Row 4: column headers ───────────────────────────────────────────
      const hdrRow  = ws.getRow(4);
      hdrRow.height = 30;
      const headers = ['TT', 'Mã số', 'Tên thiết bị / Tài sản', 'ĐVT', 'Số lượng', 'Đối tượng SD', 'Ghi chú'];
      headers.forEach((h, i) => {
        const cell    = hdrRow.getCell(i + 1);
        cell.value    = h;
        cell.font     = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill     = BLUE_HDR;
        cell.border   = BORDER;
        cell.alignment = CENTER;
      });

      // ── Example data ────────────────────────────────────────────────────
      const examples = isExtra ? [
        // Không có nhóm
        [1, '',      'Tivi Samsung 55"',    'Cái', 1, 'Dùng chung', ''],
        [2, '',      'Máy tính bảng',       'Cái', 5, 'Trẻ',        ''],
        [3, '',      'Loa bluetooth',       'Cái', 2, 'Giáo viên',  'Dùng chung'],
      ] : [
        // Nhóm I
        ['I', '', 'ĐỒ DÙNG - ĐỒ CHƠI',    '', '', '', ''],
        [1, 'MA001', 'Bàn học sinh',        'Cái', 10, 'Trẻ',       ''],
        [2, 'MA002', 'Ghế học sinh',        'Cái', 20, 'Trẻ',       ''],
        [3, 'MA003', 'Tủ đựng đồ dùng',    'Cái',  2, 'Dùng chung',''],
        // Nhóm II
        ['II', '', 'THIẾT BỊ DẠY HỌC',     '', '', '', ''],
        [4, 'MB001', 'Bảng từ trắng',       'Cái',  1, 'Giáo viên', ''],
        [5, 'MB002', 'Máy chiếu',           'Bộ',   1, 'Giáo viên', ''],
        // Nhóm III
        ['III', '', 'ĐỒ DÙNG VỆ SINH - Y TẾ', '', '', '', ''],
        [6, 'MC001', 'Bộ đồ y tế',          'Bộ',   1, 'Dùng chung',''],
      ];

      let dataRowNum = 5;
      examples.forEach((ex) => {
        const row   = ws.getRow(dataRowNum++);
        row.height  = 20;
        const isCat = typeof ex[0] === 'string' && /^[IVXLC]+$/i.test(ex[0]) && !isExtra;

        if (isCat) {
          // Category header row (chỉ sheet 1)
          ws.mergeCells(`B${dataRowNum - 1}:G${dataRowNum - 1}`);
          const cellTT   = row.getCell(1);
          const cellName = row.getCell(2);
          cellTT.value   = ex[0];
          cellName.value = ex[2];
          [cellTT, cellName].forEach(c => {
            c.font      = { bold: true, size: 11, color: { argb: 'FF1B5E20' } };
            c.fill      = GREEN_CAT;
            c.border    = BORDER;
            c.alignment = i => i === 0 ? CENTER : LEFT;
          });
          cellTT.alignment  = CENTER;
          cellName.alignment = LEFT;
        } else {
          ex.forEach((val, i) => {
            const cell    = row.getCell(i + 1);
            cell.value    = val;
            cell.fill     = i % 2 === 0 ? GREY_HDR : WHITE;
            cell.border   = BORDER;
            cell.alignment = i <= 1 || i === 3 || i === 4 ? CENTER : LEFT;
            if (i === 4) cell.numFmt = '0';
          });
        }
      });

      // ── Empty rows for user to fill ────────────────────────────────────
      for (let r = 0; r < 10; r++) {
        const row = ws.getRow(dataRowNum++);
        row.height = 20;
        for (let c = 1; c <= 7; c++) {
          const cell    = row.getCell(c);
          cell.fill     = WHITE;
          cell.border   = BORDER;
          cell.alignment = c <= 2 || c === 4 || c === 5 ? CENTER : LEFT;
        }
      }

      // ── Legend row ──────────────────────────────────────────────────────
      ws.mergeCells(`A${dataRowNum}:G${dataRowNum}`);
      const legCell    = ws.getRow(dataRowNum).getCell(1);
      legCell.value    = '* Đối tượng SD: "Trẻ" | "Giáo viên" | "Dùng chung"   |   Hàng nhóm (chỉ sheet 1): TT = I, II, III... và Tên nhóm ở cột Tên thiết bị';
      legCell.font     = { italic: true, size: 9, color: { argb: 'FF795548' } };
      legCell.alignment = LEFT;

      return ws;
    };

    buildSheet('Theo thông tư',    false);
    buildSheet('Ngoài thông tư',   true);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="mau_tai_san_ban_giao.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Get list of classes with teachers (helper for frontend dropdown) ─────
exports.listClasses = async (req, res) => {
  try {
    const classes = await Classes.find({}, 'className _id teacherIds gradeId')
      .populate({
        path: 'teacherIds',
        select: 'userId',
        populate: { path: 'userId', select: 'fullName' },
      })
      .populate('gradeId', 'gradeName')
      .sort({ className: 1 });

    const result = classes.map((cls) => ({
      _id: cls._id,
      className: cls.className,
      gradeId: cls.gradeId?._id || null,
      gradeName: cls.gradeId?.gradeName || '',
      teachers: (cls.teacherIds || [])
        .map((t) => t?.userId?.fullName || '')
        .filter(Boolean),
    }));

    return res.json({ status: 'success', data: { classes: result } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
