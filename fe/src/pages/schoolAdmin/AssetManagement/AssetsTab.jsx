import { Fragment, useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  GetApp as FileDownloadIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { del, get, post, put, ENDPOINTS } from '../../../service/api';
import {
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  CONSTRUCTION_OPTIONS,
  SECTION7_CATEGORIES,
  SECTION7_PRESETS,
  SECTION7_SUB_LABELS,
  UNIT_OPTIONS,
  emptyAsset,
  ConfirmDialog,
  InlineCell,
  InlineSelectCell
} from './AssetUtils';

export function AssetsTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(emptyAsset());
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Import Excel
  const importRef = useRef();
  const [importPreview, setImportPreview] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Bulk select & delete
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Inline edit
  const [inlineEdit, setInlineEdit] = useState(null); // { id, field, value }
  const [inlineSaving, setInlineSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await get(ENDPOINTS.SCHOOL_ADMIN.ASSETS + '?type=csvc');
      setAssets(res?.data?.assets || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được danh sách tài sản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => { setSelected(new Set()); }, [search, filterCategory]);

  const handleInlineSave = async (id, field, value) => {
    const asset = assets.find(a => a._id === id);
    if (!asset) return;
    const STRING_FIELDS = new Set(['name', 'assetCode', 'unit', 'condition', 'constructionType', 'notes', 'room']);
    const parsed = STRING_FIELDS.has(field) ? value : (value === '' || value == null ? null : Number(value));
    if (asset[field] === parsed) { setInlineEdit(null); return; }
    setInlineSaving(true);
    try {
      const payload = { ...asset, [field]: parsed };
      await put(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(id), payload);
      setAssets(prev => prev.map(a => a._id === id ? { ...a, [field]: parsed } : a));
    } catch (err) {
      toast.error(err?.message || 'Lưu thất bại.');
    } finally {
      setInlineSaving(false);
      setInlineEdit(null);
    }
  };

  const handleOpen = (asset = null) => {
    if (asset?._id) {
      setForm({
        assetCode: asset.assetCode,
        name: asset.name,
        category: asset.category || 'Khác',
        room: asset.room || '',
        requiredQuantity: asset.requiredQuantity ?? 0,
        quantity: asset.quantity,
        area: asset.area ?? '',
        constructionType: asset.constructionType || 'Không áp dụng',
        unit: asset.unit || 'Cái',
        condition: asset.condition,
        notes: asset.notes || '',
        seats1: asset.seats1 ?? null,
        seats2: asset.seats2 ?? null,
        seats4: asset.seats4 ?? null,
      });
      setEditId(asset._id);
    } else {
      setForm({ ...emptyAsset(), ...(asset?.category ? { category: asset.category } : {}) });
      setEditId(null);
    }
    setOpenModal(true);
  };

  const handleClose = () => { setOpenModal(false); setForm(emptyAsset()); setEditId(null); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên tài sản.'); return; }
    if (SECTION7_CATEGORIES.includes(form.category) && !form.unit?.trim()) {
      toast.error('Vui lòng nhập đơn vị tính (ĐVT).'); return;
    }
    if ((form.quantity ?? 0) < 0) { toast.error('Số lượng không được âm.'); return; }
    if ((form.requiredQuantity ?? 0) < 0) { toast.error('Nhu cầu QĐ không được âm.'); return; }
    if (form.category === 'Số bàn, ghế ngồi') {
      const total = (form.seats1 || 0) + (form.seats2 || 0) + (form.seats4 || 0);
      if (total > (form.quantity || 0)) {
        toast.error('Tổng "Trong đó" (1+2+4 chỗ) không được lớn hơn Tổng số chỗ ngồi.'); return;
      }
    }
    setSaving(true);
    try {
      const payload = { ...form, area: form.area !== '' ? Number(form.area) : null };
      if (editId) {
        await put(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(editId), payload);
        toast.success('Cập nhật tài sản thành công.');
      } else {
        await post(ENDPOINTS.SCHOOL_ADMIN.ASSETS, payload);
        toast.success('Thêm tài sản thành công.');
      }
      handleClose();
      load();
    } catch (err) {
      toast.error(err?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await del(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(deleteTarget._id));
      toast.success('Xóa tài sản thành công.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = id =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map(id => del(ENDPOINTS.SCHOOL_ADMIN.ASSET_DETAIL(id))));
      toast.success(`Đã xóa ${selected.size} tài sản.`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
      load();
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleImportFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    import('xlsx').then(XLSX => {
      const reader = new FileReader();
      reader.onload = evt => {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (!rows?.length) { toast.error('File rỗng hoặc sai định dạng.'); return; }

        const SECTION_PATTERNS = [
          { re: /^1[\.\s\)]/, cat: 'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em', fmt: 'room' },
          { re: /^2[\.\s\)]/, cat: 'Số bàn, ghế ngồi', fmt: 'banGhe' },
          { re: /^3[\.\s\)]/, cat: 'Khối phòng phục vụ học tập', fmt: 'room' },
          { re: /^4[\.\s\)]/, cat: 'Phòng tổ chức ăn, nghỉ', fmt: 'room' },
          { re: /^5[\.\s\)]/, cat: 'Công trình công cộng và khối phòng phục vụ khác', fmt: 'room' },
          { re: /^6[\.\s\)]/, cat: 'Khối phòng hành chính quản trị', fmt: 'room' },
          { re: /^7\.1/, cat: 'Diện tích đất', fmt: 'landarea' },
          { re: /^7\.2/, cat: 'Thiết bị dạy học và CNTT', fmt: 'equip' },
          { re: /^7[\.\s\)]/, cat: 'Thiết bị dạy học và CNTT', fmt: 'equip' },
        ];

        const CODE_PREFIX = {
          'Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em': 'PH',
          'Số bàn, ghế ngồi': 'BG',
          'Khối phòng phục vụ học tập': 'HT',
          'Phòng tổ chức ăn, nghỉ': 'AN',
          'Công trình công cộng và khối phòng phục vụ khác': 'CC',
          'Khối phòng hành chính quản trị': 'HC',
          'Diện tích đất': 'DT',
          'Thiết bị dạy học và CNTT': 'TB',
        };
        const codeCounters = {};

        const toNum = v => {
          if (typeof v === 'number') return v;
          const s = String(v ?? '').trim();
          if (!s) return 0;
          const cleaned = s.includes('.') && s.includes(',')
            ? s.replace(/\./g, '').replace(',', '.')
            : s.replace(',', '.');
          const n = parseFloat(cleaned);
          return isNaN(n) ? 0 : n;
        };
        const isNum = v => typeof v === 'number' || (typeof v === 'string' && /^[\d,\.]+$/.test(v.trim()) && v.trim() !== '');
        const SKIP_ROW = /^(tổng số:?|trong đó|chia ra|tổng cộng|đvt|ghi chú|nguồn nước|thư viện nhà trường)$/i;

        let currentCat = '';
        let currentFmt = 'room';
        const parsed = [];

        for (const row of rows) {
          const col0 = String(row[0] ?? '').trim();
          if (!col0) continue;
          const sec = SECTION_PATTERNS.find(s => s.re.test(col0));
          if (sec) { currentCat = sec.cat; currentFmt = sec.fmt; continue; }
          if (!currentCat) continue;
          const numCols = row.slice(1).filter(v => isNum(v));
          if (numCols.length === 0) continue;
          const name = col0.replace(/^[\-\+\*\•\–\—\s]+/, '').trim();
          if (!name || name.length < 2) continue;
          if (SKIP_ROW.test(name)) continue;
          const prefix = CODE_PREFIX[currentCat] || 'TS';
          codeCounters[prefix] = (codeCounters[prefix] || 0) + 1;
          const assetCode = `${prefix}${String(codeCounters[prefix]).padStart(3, '0')}`;
          let asset;
          if (currentFmt === 'landarea') {
            let dvt = ''; let qty = 0;
            for (let ci = 1; ci < row.length; ci++) {
              const v = row[ci]; if (v === '' || v == null) continue;
              if (isNum(v)) { qty = toNum(v); break; }
              if (!dvt && typeof v === 'string') dvt = v.trim();
            }
            asset = { assetCode, name, category: currentCat, room: '', requiredQuantity: 0, quantity: qty, unit: dvt || 'm²', area: null, constructionType: 'Không áp dụng', condition: 'Còn tốt', notes: '' };
          } else if (currentFmt === 'banGhe') {
            asset = { assetCode, name, category: currentCat, room: '', requiredQuantity: toNum(row[1]), quantity: toNum(row[2]), area: null, constructionType: 'Không áp dụng', condition: 'Còn tốt', notes: '', seats1: row[3] !== '' && row[3] != null ? toNum(row[3]) : null, seats2: row[4] !== '' && row[4] != null ? toNum(row[4]) : null, seats4: row[5] !== '' && row[5] != null ? toNum(row[5]) : null };
          } else if (currentFmt === 'equip') {
            let dvt = ''; let qty = 0;
            for (let ci = 1; ci < row.length; ci++) {
              const v = row[ci]; if (v === '' || v == null) continue;
              if (isNum(v)) { qty = toNum(v); break; }
              if (!dvt && typeof v === 'string') dvt = v.trim();
            }
            asset = { assetCode, name, category: currentCat, room: '', requiredQuantity: 0, quantity: qty, unit: dvt || 'Cái', area: null, constructionType: 'Không áp dụng', condition: 'Còn tốt', notes: '' };
          } else {
            const requiredQuantity = toNum(row[1]);
            const quantity = toNum(row[2]);
            const areaRaw = row[3];
            const area = areaRaw !== '' && areaRaw != null ? toNum(areaRaw) || null : null;
            const kienCo = toNum(row[4]); const banKienCo = toNum(row[6]); const tam = toNum(row[8]);
            let constructionType = 'Không áp dụng';
            if (kienCo > 0 && !banKienCo && !tam) constructionType = 'Kiên cố';
            else if (banKienCo > 0 && !kienCo && !tam) constructionType = 'Bán kiên cố';
            else if (tam > 0 && !kienCo && !banKienCo) constructionType = 'Tạm';
            asset = { assetCode, name, category: currentCat, room: '', requiredQuantity, quantity, area, constructionType, condition: 'Còn tốt', notes: '' };
          }
          parsed.push(asset);
        }
        if (!parsed.length) { toast.error('Không nhận ra cấu trúc file.'); return; }
        setImportPreview(parsed); setImportOpen(true);
        toast.info(`Đọc được ${parsed.length} tài sản. Kiểm tra trước khi nhập.`);
      };
      reader.readAsArrayBuffer(file);
    }).catch(() => toast.error('Không hỗ trợ import Excel.'));
    e.target.value = '';
  };

  const handleDownloadTemplate = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Trường MN Đức Xuân'; wb.created = new Date();
      const ws = wb.addWorksheet('Cơ sở vật chất', { pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 }, views: [{ state: 'frozen', xSplit: 0, ySplit: 7 }] });
      ws.columns = [{ key: 'A', width: 50 }, { key: 'B', width: 15 }, { key: 'C', width: 12 }, { key: 'D', width: 14 }, { key: 'E', width: 11 }, { key: 'F', width: 13 }, { key: 'G', width: 13 }, { key: 'H', width: 13 }, { key: 'I', width: 11 }, { key: 'J', width: 13 }];
      const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
      const bdr = (style = 'thin', color = 'B0BEC5') => ({ style, color: { argb: color } });
      const allBorders = (style = 'thin', color = 'B0BEC5') => ({ top: bdr(style, color), bottom: bdr(style, color), left: bdr(style, color), right: bdr(style, color) });
      const font = (size, bold, color = '212121', italic = false) => ({ name: 'Times New Roman', size, bold, italic, color: { argb: color } });
      const align = (h, v = 'middle', wrap = true) => ({ horizontal: h, vertical: v, wrapText: wrap });
      const styleCell = (cell, { f, fi, al, bd } = {}) => { if (f) cell.fill = f; if (fi) cell.font = fi; if (al) cell.alignment = al; if (bd) cell.border = bd; };
      const mergeStyle = (addr, opts) => styleCell(ws.getCell(addr), opts);

      ws.addRow([]); ws.mergeCells('A1:J1'); mergeStyle('A1', { f: fill('1565C0'), fi: font(14, true, 'FFFFFF'), al: align('center') }); ws.getCell('A1').value = 'TRƯỜNG MẦM NON ĐỨC XUÂN'; ws.getRow(1).height = 26;
      ws.addRow([]); ws.mergeCells('A2:J2'); mergeStyle('A2', { f: fill('1976D2'), fi: font(13, true, 'FFFFFF'), al: align('center') }); ws.getCell('A2').value = 'BÁO CÁO CƠ SỞ VẬT CHẤT – MẪU NHẬP DỮ LIỆU'; ws.getRow(2).height = 24;
      ws.addRow([]); ws.mergeCells('A3:J3'); mergeStyle('A3', { f: fill('E3F2FD'), fi: font(9, false, '1565C0', true), al: align('left') }); ws.getCell('A3').value = '  Hướng dẫn: Điền số liệu thực tế vào các ô màu trắng. Các ô màu xanh/cam là tiêu đề, không chỉnh sửa. File này dùng để Import vào hệ thống quản lý tài sản.'; ws.getRow(3).height = 18;
      ws.addRow([]); ws.getRow(4).height = 6;
      ws.addRow([]); ws.getRow(5).height = 22;
      const setH = (addr, value, bgColor = '1565C0', fgColor = 'FFFFFF') => { ws.getCell(addr).value = value; mergeStyle(addr, { f: fill(bgColor), fi: font(10, true, fgColor), al: align('center'), bd: allBorders('medium', '90CAF9') }); };
      ws.mergeCells('A5:A6'); setH('A5', 'Tên phòng / Tài sản'); ws.mergeCells('B5:B6'); setH('B5', 'Nhu cầu\ntheo QĐ'); ws.mergeCells('C5:C6'); setH('C5', 'Tổng số'); ws.mergeCells('D5:D6'); setH('D5', 'Diện tích\n(m²)'); ws.mergeCells('E5:F5'); setH('E5', 'Kiên cố', '1976D2'); ws.mergeCells('G5:H5'); setH('G5', 'Bán kiên cố', '388E3C', 'FFFFFF'); ws.mergeCells('I5:J5'); setH('I5', 'Tạm', 'F57C00', 'FFFFFF');
      ws.addRow([]); ws.getRow(6).height = 18; const subCols = [['E6', 'Số phòng', '1976D2'], ['F6', 'Diện tích', '1976D2'], ['G6', 'Số phòng', '388E3C'], ['H6', 'Diện tích', '388E3C'], ['I6', 'Số phòng', 'F57C00'], ['J6', 'Diện tích', 'F57C00']]; subCols.forEach(([addr, val, bg]) => setH(addr, val, bg));
      ws.addRow([]); ws.getRow(7).height = 16; const units = ['', 'Phòng', 'Phòng', 'm²', 'Phòng', 'm²', 'Phòng', 'm²', 'Phòng', 'm²']; units.forEach((u, i) => { const cell = ws.getRow(7).getCell(i + 1); cell.value = u; cell.font = font(9, false, '546E7A', true); cell.fill = fill('E3F2FD'); cell.alignment = align('center'); cell.border = allBorders('thin', 'B0BEC5'); });
      const SECTION_COLORS = ['1565C0', '6A1B9A', '00695C', 'B71C1C', '37474F', 'E65100', '004D40'];
      const addSectionHeader = (title, colorIdx) => { const color = SECTION_COLORS[colorIdx] || '1565C0'; const row = ws.addRow([title]); ws.mergeCells(`A${row.number}:J${row.number}`); mergeStyle(`A${row.number}`, { f: fill(color), fi: font(10, true, 'FFFFFF'), al: align('left'), bd: { top: bdr('medium', color), bottom: bdr('medium', color), left: bdr('thin'), right: bdr('thin') } }); row.height = 20; };
      const addDataRow = (label, vals, isSubItem = false) => { const rowData = [label, ...vals]; const row = ws.addRow(rowData); row.height = 18; row.eachCell({ includeEmpty: true }, (cell, colNum) => { if (colNum === 1) { cell.font = font(10, !isSubItem, isSubItem ? '424242' : '212121'); cell.alignment = align('left'); cell.fill = fill(isSubItem ? 'FAFAFA' : 'F5F5F5'); } else { cell.font = font(10, false, '1565C0'); cell.alignment = align('center'); cell.fill = fill('FFFFFF'); cell.numFmt = '#,##0.##'; } cell.border = allBorders('thin', 'CFD8DC'); }); };
      const addEquipSectionHeader = (title, colorIdx) => { const color = SECTION_COLORS[colorIdx] || '004D40'; const row = ws.addRow([title, 'ĐVT', 'Số lượng']); ws.mergeCells(`C${row.number}:J${row.number}`); [1, 2, 3].forEach(ci => { const cell = row.getCell(ci); cell.fill = fill(ci === 1 ? color : color + 'CC'); cell.font = font(10, true, 'FFFFFF'); cell.alignment = align(ci === 1 ? 'left' : 'center'); cell.border = allBorders('medium', '80CBC4'); }); row.height = 20; };
      const addEquipRow = (label, dvt, qty) => { const row = ws.addRow([label, dvt, qty]); ws.mergeCells(`C${row.number}:J${row.number}`); row.height = 18; row.getCell(1).font = font(10, false, '212121'); row.getCell(1).alignment = align('left'); row.getCell(1).fill = fill('FAFAFA'); row.getCell(1).border = allBorders('thin', 'CFD8DC'); row.getCell(2).font = font(10, false, '5D4037'); row.getCell(2).alignment = align('center'); row.getCell(2).fill = fill('FFF8E1'); row.getCell(2).border = allBorders('thin', 'CFD8DC'); row.getCell(3).font = font(10, true, '1565C0'); row.getCell(3).alignment = align('center'); row.getCell(3).fill = fill('FFFFFF'); row.getCell(3).numFmt = '#,##0.##'; row.getCell(3).border = allBorders('thin', 'CFD8DC'); };
      addSectionHeader('1. Phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em', 0); addDataRow('- Tổng số phòng học', [17, 17, 695, 17, 695, '', '', '', '']); addDataRow('+ Khu sinh hoạt chung', [17, 17, 695, 17, 695, '', '', '', ''], true); addDataRow('+ Khu ngủ', [17, 10, 472.2, 10, 472.2, '', '', '', ''], true); addSectionHeader('2. Số bàn, ghế ngồi', 1);
      (() => { const BG_COLOR = '6A1B9A'; const BG_LIGHT = 'AB47BC'; const r1 = ws.addRow([]); r1.height = 20; const applyH = (addr, val, bg, colspan) => { ws.getCell(addr).value = val; styleCell(ws.getCell(addr), { f: fill(bg), fi: font(9, true, 'FFFFFF'), al: align('center'), bd: allBorders('medium', '90CAF9') }); if (colspan) ws.mergeCells(`${addr}:${String.fromCharCode(addr.charCodeAt(0) + colspan - 1)}${r1.number}`); }; applyH(`A${r1.number}`, 'Tên', BG_COLOR); applyH(`B${r1.number}`, 'Tổng nhu cầu cần có\ntheo quy định', BG_COLOR); applyH(`C${r1.number}`, 'Tổng số chỗ ngồi\ncủa tất cả các phòng', BG_COLOR); ws.mergeCells(`D${r1.number}:F${r1.number}`); applyH(`D${r1.number}`, 'Trong đó', BG_LIGHT); ws.mergeCells(`G${r1.number}:J${r1.number}`); styleCell(ws.getCell(`G${r1.number}`), { f: fill('F3E5F5'), bd: allBorders('thin', 'CE93D8') }); const r2 = ws.addRow([]); r2.height = 18; const sub = (addr, val, bg) => { ws.getCell(addr).value = val; styleCell(ws.getCell(addr), { f: fill(bg), fi: font(9, true, 'FFFFFF'), al: align('center'), bd: allBorders('medium', 'CE93D8') }); }; sub(`A${r2.number}`, '', BG_COLOR); sub(`B${r2.number}`, '', BG_COLOR); sub(`C${r2.number}`, '', BG_COLOR); sub(`D${r2.number}`, '1 chỗ ngồi', BG_LIGHT); sub(`E${r2.number}`, '2 chỗ ngồi', BG_LIGHT); sub(`F${r2.number}`, '4 chỗ ngồi', BG_LIGHT); ws.mergeCells(`G${r2.number}:J${r2.number}`); styleCell(ws.getCell(`G${r2.number}`), { f: fill('F3E5F5'), bd: allBorders('thin', 'CE93D8') }); })();
      const addBanGheRow = (label, [nhuCau, tongSo, cho1, cho2, cho4], isSubItem = false) => { const nz = v => (v === 0 || v) ? v : ''; const row = ws.addRow([label, nhuCau, tongSo, nz(cho1), nz(cho2), nz(cho4)]); row.height = 18; ws.mergeCells(`G${row.number}:J${row.number}`); row.eachCell({ includeEmpty: true }, (cell, colNum) => { if (colNum === 1) { cell.font = font(10, !isSubItem, isSubItem ? '424242' : '212121'); cell.alignment = align('left'); cell.fill = fill(isSubItem ? 'FAFAFA' : 'F5F5F5'); } else if (colNum <= 6) { cell.font = font(10, false, '1565C0'); cell.alignment = align('center'); cell.fill = fill('FFFFFF'); cell.numFmt = '#,##0.##'; } cell.border = allBorders('thin', 'CFD8DC'); }); };
      addBanGheRow('- Tổng số bàn', [300, 277, 0, 17, 260]); addSectionHeader('3. Khối phòng phục vụ học tập', 2); addEquipSectionHeader('7.1. Diện tích đất', 6); addEquipRow('- Tổng diện tích khuôn viên đất', 'm²', 3943.3);
      const buffer = await wb.xlsx.writeBuffer(); const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'mau_co_so_vat_chat.xlsx'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); toast.success('Tải file mẫu thành công!');
    } catch (err) { toast.error('Lỗi tải file mẫu.'); }
  };

  const handleExportExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Quản lý Tài sản'; wb.created = new Date();
      const ws = wb.addWorksheet('Danh sách tài sản', { pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }, views: [{ state: 'frozen', xSplit: 0, ySplit: 6 }] });
      const COLS = [{ header: 'STT', key: 'stt', width: 6 }, { header: 'Tên tài sản', key: 'name', width: 38 }, { header: 'Loại tài sản', key: 'category', width: 32 }, { header: 'Nhu cầu QĐ', key: 'requiredQuantity', width: 13 }, { header: 'Thực tế', key: 'quantity', width: 11 }, { header: 'Diện tích (m²)', key: 'area', width: 14 }, { header: 'Loại CT', key: 'constructionType', width: 14 }, { header: 'Tình trạng', key: 'condition', width: 13 }, { header: 'Ghi chú', key: 'notes', width: 22 }, { header: '1 chỗ ngồi', key: 'seats1', width: 11 }, { header: '2 chỗ ngồi', key: 'seats2', width: 11 }, { header: '4 chỗ ngồi', key: 'seats4', width: 11 }];
      ws.columns = COLS;
      const CLR = { headerBg: '1A56DB', headerFg: 'FFFFFF', catBg: 'E8F0FE', catFg: '1A56DB', subtotalBg: 'EFF6FF', subtotalFg: '1E40AF', totalBg: 'DBEAFE', totalFg: '1E3A8A', rowEven: 'F8FAFF', rowOdd: 'FFFFFF', border: 'CBD5E1', titleBg: '1E40AF', titleFg: 'FFFFFF' };
      const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
      const border = (color = CLR.border) => ({ top: { style: 'thin', color: { argb: color } }, left: { style: 'thin', color: { argb: color } }, bottom: { style: 'thin', color: { argb: color } }, right: { style: 'thin', color: { argb: color } } });
      const fontBold = (size = 10, color = '000000') => ({ name: 'Times New Roman', size, bold: true, color: { argb: color } });
      const fontNormal = (size = 10) => ({ name: 'Times New Roman', size });
      const center = { horizontal: 'center', vertical: 'middle', wrapText: true };
      const lastCol = String.fromCharCode(64 + COLS.length);

      ws.addRow([]); ws.mergeCells(`A1:${lastCol}1`); const c1 = ws.getCell('A1'); c1.value = 'TRƯỜNG MẦM NON ĐỨC XUÂN'; c1.font = fontBold(13, 'FFFFFF'); c1.fill = fill(CLR.titleBg); c1.alignment = center;
      ws.addRow([]); ws.mergeCells(`A2:${lastCol}2`); const c2 = ws.getCell('A2'); c2.value = 'BÁO CÁO DANH SÁCH TÀI SẢN'; c2.font = fontBold(13, '1E3A8A'); c2.fill = fill('DBEAFE'); c2.alignment = center;
      ws.addRow([]); ws.getRow(5).height = 30; COLS.forEach((col, i) => { const cell = ws.getRow(5).getCell(i + 1); cell.value = col.header; cell.font = fontBold(10, 'FFFFFF'); cell.fill = fill(CLR.headerBg); cell.alignment = center; cell.border = border('90A8C3'); });
      
      const filtered = assets.filter(a => (!search || a.name?.toLowerCase().includes(search.toLowerCase())) && (!filterCategory || a.category === filterCategory));
      let rowIdx = 7;
      CATEGORY_OPTIONS.forEach((cat, gi) => {
        const rows = filtered.filter(a => a.category === cat); if (!rows.length) return;
        const catRow = ws.getRow(rowIdx++); ws.mergeCells(`A${rowIdx - 1}:${lastCol}${rowIdx - 1}`); const catCell = ws.getCell(`A${rowIdx - 1}`); catCell.value = `${gi + 1}. ${cat}`; catCell.font = fontBold(10, CLR.catFg); catCell.fill = fill(CLR.catBg);
        rows.forEach((a, i) => { const dr = ws.getRow(rowIdx++); dr.getCell(1).value = i + 1; dr.getCell(2).value = a.name; dr.getCell(3).value = a.category; dr.getCell(4).value = a.requiredQuantity; dr.getCell(5).value = a.quantity; dr.getCell(8).value = a.condition; dr.eachCell(c => { c.font = fontNormal(10); c.border = border(); }); });
      });
      const buffer = await wb.xlsx.writeBuffer(); const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `tai-san.xlsx`; a.click(); toast.success('Xuất Excel thành công!');
    } catch (err) { toast.error('Lỗi xuất Excel.'); }
  };

  const handleBulkImport = async () => {
    if (!importPreview.length) return;
    setImporting(true);
    try {
      await post(ENDPOINTS.SCHOOL_ADMIN.ASSETS_BULK, { assets: importPreview });
      toast.success('Nhập thành công.'); setImportOpen(false); setImportPreview([]); load();
    } catch (err) { toast.error('Lỗi nhập.'); }
    finally { setImporting(false); }
  };

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || a.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const grouped = CATEGORY_OPTIONS.map(cat => ({
    cat, rows: filtered.filter(a => a.category === cat),
  })).filter(g => (!search && !filterCategory) || g.rows.length > 0);
  const uncategorized = filtered.filter(a => !CATEGORY_OPTIONS.includes(a.category));
  if (uncategorized.length) grouped.push({ cat: 'Khác', rows: uncategorized });

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} mb={2} flexWrap="wrap">
        <TextField size="small" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} sx={{ flex: 1 }} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Loại tài sản</InputLabel>
          <Select value={filterCategory} label="Loại tài sản" onChange={e => setFilterCategory(e.target.value)}>
            <MenuItem value="">Tất cả</MenuItem>
            {CATEGORY_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => importRef.current?.click()} sx={{ textTransform: 'none' }}>Import</Button>
        <input ref={importRef} hidden type="file" accept=".xlsx,.xls" onChange={handleImportFile} />
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate} sx={{ textTransform: 'none' }}>Mẫu</Button>
        <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExportExcel} sx={{ textTransform: 'none' }}>Xuất Excel</Button>
      </Stack>

      {loading ? <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box> : (
        grouped.map(({ cat, rows }, gi) => {
          const isSection7 = SECTION7_CATEGORIES.includes(cat);
          const toggleGroupAll = () => {
            const allSelected = rows.every(a => selected.has(a._id));
            setSelected(prev => {
              const next = new Set(prev);
              rows.forEach(a => allSelected ? next.delete(a._id) : next.add(a._id));
              return next;
            });
          };
          return (
            <Box key={gi} mb={3}>
              <Box sx={{ backgroundColor: '#e8f0fe', px: 1.5, py: 0.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight={700} variant="body2">{cat} ({rows.length})</Typography>
                <IconButton size="small" color="primary" onClick={() => handleOpen({ category: cat })}><AddIcon fontSize="small" /></IconButton>
              </Box>
              <TableContainer sx={{ border: '1px solid #c7d7f8', maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"><Checkbox size="small" onChange={toggleGroupAll} /></TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tên</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Thực tế</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Xóa</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map(a => (
                      <TableRow key={a._id} hover>
                        <TableCell padding="checkbox"><Checkbox size="small" checked={selected.has(a._id)} onChange={() => toggleSelect(a._id)} /></TableCell>
                        <InlineCell a={a} field="name" isText ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave} />
                        <InlineCell a={a} field="quantity" align="center" ie={inlineEdit} setIe={setInlineEdit} onSave={handleInlineSave} />
                        <TableCell align="center"><IconButton size="small" color="error" onClick={() => setDeleteTarget(a)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })
      )}

      {selected.size > 0 && (
        <Paper sx={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', p: 2, display: 'flex', alignItems: 'center', gap: 2, zIndex: 1000 }}>
          <Typography variant="body2">Đã chọn <strong>{selected.size}</strong> mục</Typography>
          <Button variant="contained" color="error" size="small" onClick={() => setBulkDeleteOpen(true)}>Xóa hàng loạt</Button>
        </Paper>
      )}

      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Cập nhật' : 'Thêm mới'}</DialogTitle>
        <DialogContent dividers>
          <Stack gap={2} pt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Loại</InputLabel>
              <Select value={form.category} label="Loại" onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORY_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Tên *" size="small" fullWidth value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Stack direction="row" gap={2}>
              <TextField label="Số lượng" size="small" type="number" sx={{ flex: 1 }} value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))} />
              <TextField label="ĐVT" size="small" sx={{ flex: 1 }} value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={handleClose}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>Lưu</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} title="Xóa tài sản" message={`Xóa "${deleteTarget?.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      <ConfirmDialog open={bulkDeleteOpen} title="Xóa hàng loạt" message={`Xóa ${selected.size} tài sản đã chọn?`} onConfirm={handleBulkDelete} onCancel={() => setBulkDeleteOpen(false)} loading={bulkDeleting} />

      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Xem trước dữ liệu ({importPreview.length})</DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead><TableRow><TableCell>Tên</TableCell><TableCell>Loại</TableCell><TableCell align="center">Số lượng</TableCell></TableRow></TableHead>
            <TableBody>{importPreview.slice(0, 10).map((a, i) => (<TableRow key={i}><TableCell>{a.name}</TableCell><TableCell>{a.category}</TableCell><TableCell align="center">{a.quantity}</TableCell></TableRow>))}</TableBody>
          </Table>
          {importPreview.length > 10 && <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>... và {importPreview.length - 10} mục khác</Typography>}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setImportOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleBulkImport} disabled={importing}>Nhập dữ liệu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
