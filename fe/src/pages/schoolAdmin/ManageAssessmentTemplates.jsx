import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Tooltip,
  Alert,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Assignment as AssessmentIcon,
  DragIndicator as DragIcon,
  Save as SaveIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { get, post, ENDPOINTS } from '../../service/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ManageAssessmentTemplates() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    templateName: '',
    academicYearId: '',
    criteria: [],
  });
  const [newCriterion, setNewCriterion] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const loadInitialData = useCallback(async () => {
    try {
      const yearsResp = await get(ENDPOINTS.SCHOOL_ADMIN.ACADEMIC_YEARS.LIST);
      if (yearsResp?.status === 'success') {
        setAcademicYears(yearsResp.data || []);
        const current = yearsResp.data.find(y => y.status === 'active');
        if (current) setSelectedYear(current._id);
        else if (yearsResp.data.length > 0) setSelectedYear(yearsResp.data[0]._id);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách năm học');
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const resp = await get(`${ENDPOINTS.SCHOOL_ADMIN.ASSESSMENT_TEMPLATES}?academicYearId=${selectedYear}`);
      if (resp?.status === 'success') {
        setTemplates(resp.data || []);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách mẫu đánh giá');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        templateName: template.templateName,
        academicYearId: template.academicYearId?._id || template.academicYearId,
        criteria: template.criteria || [],
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        templateName: `Mẫu đánh giá ${academicYears.find(y => y._id === selectedYear)?.yearName || ''}`,
        academicYearId: selectedYear,
        criteria: [], // Để trống danh sách tiêu chí
      });
    }
    setOpenDialog(true);
  };

  const handleAddCriterion = () => {
    if (!newCriterion.trim()) return;
    setFormData(prev => ({
      ...prev,
      criteria: [...prev.criteria, { name: newCriterion.trim(), description: newDescription.trim() }]
    }));
    setNewCriterion('');
    setNewDescription('');
  };

  const handleRemoveCriterion = (index) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index)
    }));
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

          const importedCriteria = data
            .slice(1)
            .filter(row => row[0])
            .map(row => ({ 
              name: String(row[0]).trim(),
              description: row[1] ? String(row[1]).trim() : '' 
            }));

          processImportedCriteria(importedCriteria);
        } catch (error) {
          toast.error('Lỗi khi đọc file Excel');
        }
      };
      reader.readAsBinaryString(file);
    } else if (fileName.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const arrayBuffer = evt.target.result;
          // Sử dụng convertToHtml để giữ nguyên cấu trúc đoạn văn/ô bảng
          const result = await mammoth.convertToHtml({ arrayBuffer });
          const html = result.value;
          
          // Sử dụng DOMParser để trích xuất văn bản từ các thẻ p, li, td
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const elements = doc.querySelectorAll('p, li, td');
          
          const rawLines = Array.from(elements)
            .map(el => el.textContent.trim())
            .filter(text => text.length > 0);

          // Xử lý lọc và làm sạch dữ liệu
          const importedCriteria = rawLines
            .filter(line => {
              const lower = line.toLowerCase();
              const blacklist = ['trường', 'lớp', 'năm học', 'danh sách', 'stt', 'họ và tên', 'tổng cộng', 'gvcn', 'ngày... tháng...', '+', '100%'];
              if (blacklist.some(word => lower.includes(word))) return false;
              
              // Lọc bỏ tên học sinh (Pattern: số + tên)
              const namePattern = /^\d+\.\s+[A-ZĐÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ]/;
              if (namePattern.test(line) && line.split(' ').length <= 5) return false;

              return line.length > 3 && line.length < 300;
            })
            .map(line => ({ name: line }))
            // Loại bỏ các dòng trùng lặp
            .filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);

          processImportedCriteria(importedCriteria);
        } catch (error) {
          toast.error('Lỗi khi đọc file Word');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Định dạng file không được hỗ trợ');
    }
    
    e.target.value = ''; // Reset input
  };

  const processImportedCriteria = (importedCriteria) => {
    if (importedCriteria.length > 0) {
      setFormData(prev => ({
        ...prev,
        criteria: [...prev.criteria, ...importedCriteria]
      }));
      toast.success(`Đã nhập thành công ${importedCriteria.length} tiêu chí`);
    } else {
      toast.warning('Không tìm thấy dữ liệu hợp lệ trong file');
    }
  };

  const handleSave = async () => {
    if (!formData.templateName || !formData.academicYearId || formData.criteria.length === 0) {
      toast.warning('Vui lòng điền đủ thông tin và ít nhất một tiêu chí');
      return;
    }

    try {
      const payload = {
        ...formData,
        _id: editingTemplate?._id
      };
      const resp = await post(ENDPOINTS.SCHOOL_ADMIN.ASSESSMENT_TEMPLATES, payload);
      if (resp?.status === 'success') {
        toast.success(editingTemplate ? 'Cập nhật thành công' : 'Tạo mới thành công');
        setOpenDialog(false);
        loadTemplates();
      }
    } catch (error) {
      toast.error(error.message || 'Lỗi khi lưu mẫu đánh giá');
    }
  };

  const handleDownloadTemplate = () => {
    const data = [
      ['Tên tiêu chí', 'Mô tả chi tiết'],
      ['Phát triển thể chất', 'Bao gồm cân nặng, chiều cao, vận động thô, vận động tinh...'],
      ['Phát triển nhận thức', 'Khám phá đồ vật, nhận biết đặc điểm bản thân, phân loại đối tượng...'],
      ['Phát triển ngôn ngữ', 'Diễn đạt nhu cầu, đọc thơ, kể chuyện, lắng nghe...'],
      ['Phát triển thẩm mỹ', 'Cảm nhận vẻ đẹp, nghe nhạc, hát, vẽ, nặn...'],
      ['Phát triển tình cảm và kỹ năng xã hội', 'Chơi thân thiện, quan tâm người khác, thực hiện quy định...']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Mau_Tieu_Chi_Danh_Gia.xlsx');
  };


  return (
    <Box>
      <Box p={1}>
        {academicYears.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            Hệ thống chưa có dữ liệu năm học. Vui lòng tạo năm học mới trước khi thiết lập mẫu đánh giá.
          </Alert>
        ) : null}

        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight="bold" color="primary">
              Quản lý Mẫu đánh giá định kỳ
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Thiết lập các tiêu chí đánh giá học sinh theo từng năm học
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={academicYears.length === 0}
            sx={{ borderRadius: 2 }}
          >
            Tạo mẫu mới
          </Button>
        </Stack>

        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Chọn năm học</InputLabel>
                <Select
                  value={selectedYear}
                  label="Chọn năm học"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {academicYears.map(year => (
                    <MenuItem key={year._id} value={year._id}>
                      {year.yearName} {year.status === 'active' && '(Hiện tại)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        {templates.length === 0 ? (
          <Box textAlign="center" py={10}>
            <AssessmentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">Chưa có mẫu đánh giá nào cho năm học này</Typography>
            <Button sx={{ mt: 2 }} variant="outlined" onClick={() => handleOpenDialog()}>
              Bắt đầu tạo ngay
            </Button>
          </Box>
        ) : (
          <Stack spacing={2}>
            {templates.map(tpl => (
              <Card key={tpl._id} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" fontWeight="600">{tpl.templateName}</Typography>
                      <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                        {tpl.criteria.map((c, idx) => (
                          <Chip key={idx} label={c.name} size="small" variant="outlined" color="primary" />
                        ))}
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton size="small" onClick={() => handleOpenDialog(tpl)}>
                          <EditIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton size="small">
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Dialog Tạo/Sửa */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth scroll="paper">
          <DialogTitle fontWeight="bold">
            {editingTemplate ? 'Chỉnh sửa mẫu đánh giá' : 'Tạo mẫu đánh giá mới'}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Tên mẫu đánh giá"
                value={formData.templateName}
                onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                placeholder="VD: Mẫu đánh giá cuối năm 2024-2025"
              />

              <FormControl fullWidth>
                <InputLabel>Năm học</InputLabel>
                <Select
                  value={formData.academicYearId}
                  label="Năm học"
                  onChange={(e) => setFormData(prev => ({ ...prev, academicYearId: e.target.value }))}
                >
                  {academicYears.map(year => (
                    <MenuItem key={year._id} value={year._id}>{year.yearName}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" fontWeight="600" display="flex" alignItems="center">
                    <DragIcon sx={{ fontSize: 18, mr: 0.5 }} /> Danh sách tiêu chí
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadTemplate}
                      sx={{ textTransform: 'none' }}
                    >
                      Tải file mẫu
                    </Button>
                    <Button
                      component="label"
                      variant="text"
                      size="small"
                      startIcon={<UploadIcon />}
                      sx={{ textTransform: 'none' }}
                    >
                      Import Excel/Word
                      <input type="file" hidden accept=".xlsx, .xls, .docx" onChange={handleImportFile} />
                    </Button>
                  </Stack>
                </Stack>
                <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
                  <List dense>
                    {formData.criteria.map((c, index) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={`${index + 1}. ${c.name}`} 
                          secondary={c.description}
                          secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton size="small" onClick={() => handleRemoveCriterion(index)}>
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  <Stack spacing={1} p={1}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Tên tiêu chí (VD: Phát triển thể chất)"
                      value={newCriterion}
                      onChange={(e) => setNewCriterion(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      placeholder="Mô tả chi tiết tiêu chí này..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                    <Button variant="outlined" onClick={handleAddCriterion} startIcon={<AddIcon />}>
                      Thêm tiêu chí
                    </Button>
                  </Stack>
                </Paper>
              </Box>

              <Alert severity="info" icon={<UploadIcon />}>
                Bạn có thể nhập danh sách tiêu chí nhanh bằng cách copy-paste hoặc tải file Excel/Word.
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy</Button>
            <Button variant="contained" onClick={handleSave} startIcon={<SaveIcon />}>Lưu mẫu</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
