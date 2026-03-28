const AssetAllocation = require('../models/AssetAllocation');
const Classes         = require('../models/Classes');
const mammoth         = require('mammoth');
const WordExtractor   = require('word-extractor');
const { JSDOM }       = require('jsdom');

// ─── List all allocations ──────────────────────────────────────────────────
exports.listAllocations = async (req, res) => {
  try {
    const { status, classId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (classId) filter.classId = classId;

    const allocations = await AssetAllocation.find(filter)
      .populate('classId', 'className')
      .populate('createdBy', 'fullName username')
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

    // Kiểm tra lớp đã có biên bản đang hoạt động chưa
    if (classId) {
      const existing = await AssetAllocation.findOne({ classId, status: 'active' });
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
      status:             'active',
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
    if (req.body.status && ['active','returned'].includes(req.body.status)) {
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

// ─── Get list of classes with teachers (helper for frontend dropdown) ─────
exports.listClasses = async (req, res) => {
  try {
    const classes = await Classes.find({}, 'className _id teacherIds')
      .populate({
        path: 'teacherIds',
        select: 'userId',
        populate: { path: 'userId', select: 'fullName' },
      })
      .sort({ className: 1 });

    const result = classes.map((cls) => ({
      _id: cls._id,
      className: cls.className,
      teachers: (cls.teacherIds || [])
        .map((t) => t?.userId?.fullName || '')
        .filter(Boolean),
    }));

    return res.json({ status: 'success', data: { classes: result } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
