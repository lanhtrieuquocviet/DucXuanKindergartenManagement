const service = require('../services/assetService.js');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, HeadingLevel, BorderStyle } = require('docx');

const listAssets = async (req, res, next) => service.listAssets(req, res, next);
const getAsset = async (req, res, next) => service.getAsset(req, res, next);
const createAsset = async (req, res, next) => service.createAsset(req, res, next);
const updateAsset = async (req, res, next) => service.updateAsset(req, res, next);
const deleteAsset = async (req, res, next) => service.deleteAsset(req, res, next);
const bulkCreateAssets = async (req, res, next) => service.bulkCreateAssets(req, res, next);
const bulkCreateWarehouseAssets = async (req, res, next) => service.bulkCreateWarehouseAssets(req, res, next);

const listTransactions = async (req, res, next) => service.listTransactions(req, res, next);

const generateWarehouseTemplate = async (req, res) => {
  try {
    const BORDER = { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' };
    const cellBorders = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

    const headerCell = (text) => new TableCell({
      borders: cellBorders,
      shading: { fill: 'D9E1F2' },
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })], alignment: AlignmentType.CENTER })],
    });

    const dataCell = (text, bold = false, center = false) => new TableCell({
      borders: cellBorders,
      children: [new Paragraph({ children: [new TextRun({ text: String(text || ''), bold, size: 20 })], alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT })],
    });

    const categoryRow = (roman, name) => new TableRow({
      children: [
        dataCell(roman, true, true),
        new TableCell({ borders: cellBorders, columnSpan: 4, shading: { fill: 'EBF3FB' }, children: [new Paragraph({ children: [new TextRun({ text: name, bold: true, size: 20 })] })] }),
      ],
    });

    const sampleRow = (stt, name, unit = 'Cái', qty = '1') => new TableRow({
      children: [
        dataCell(String(stt), false, true),
        dataCell(name),
        dataCell(unit, false, true),
        dataCell(qty, false, true),
        dataCell(''),
      ],
    });

    const makeTable = (rows) => new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell('STT'),
            headerCell('Tên tài sản'),
            headerCell('ĐVT'),
            headerCell('Số lượng'),
            headerCell('Ghi chú'),
          ],
        }),
        ...rows,
      ],
    });

    const mainTable = makeTable([
      categoryRow('I', 'Đồ dùng'),
      sampleRow(1, 'Bàn giáo viên', 'Cái', '1'),
      sampleRow(2, 'Ghế giáo viên', 'Cái', '1'),
      categoryRow('II', 'Thiết bị dạy học, đồ chơi và học liệu'),
      sampleRow(1, 'Bộ đồ chơi xếp hình', 'Bộ', '2'),
      sampleRow(2, 'Tranh giáo dục', 'Bộ', '1'),
      categoryRow('III', 'Sách, tài liệu, băng đĩa'),
      sampleRow(1, 'Sách giáo khoa mầm non', 'Quyển', '5'),
    ]);

    const extraTable = makeTable([
      sampleRow(1, 'Máy tính bảng', 'Cái', '2'),
      sampleRow(2, 'Máy chiếu', 'Cái', '1'),
    ]);

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: 'MẪU NHẬP KHO TÀI SẢN', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: 'Phần 1: Tài sản theo thông tư', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: '' }),
          mainTable,
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Phần 2: Các thiết bị tài sản khác ngoài thông tư', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: '' }),
          extraTable,
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="mau_nhap_kho_tai_san.docx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  bulkCreateAssets,
  bulkCreateWarehouseAssets,
  listTransactions,
  disposeAsset: async (req, res, next) => service.disposeAsset(req, res, next),
  generateWarehouseTemplate,
};
