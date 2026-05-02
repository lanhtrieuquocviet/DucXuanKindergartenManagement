import React, { memo, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  SwapHoriz as SwapHorizIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { TARGET_USER_OPTIONS, emptyAssetRow, emptySeparator } from './AllocationUtils';

const AssetRowEditor = memo(function AssetRowEditor({ rows, onChange, onMoveToOther, moveLabel }) {
  const dragIdx = useRef(null);
  const [dropIdx, setDropIdx] = useState(null);

  const update  = (i, field, value) => onChange(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const remove  = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const addRow  = () => onChange([...rows, emptyAssetRow()]);
  const addSep  = () => onChange([...rows, emptySeparator()]);

  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragOver  = (e, i) => { e.preventDefault(); setDropIdx(i); };
  const onDragLeave = () => setDropIdx(null);
  const onDragEnd   = () => { dragIdx.current = null; setDropIdx(null); };
  const onDrop      = (e, i) => {
    e.preventDefault();
    setDropIdx(null);
    const from = dragIdx.current;
    if (from === null || from === i) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(i, 0, item);
    onChange(next);
    dragIdx.current = null;
  };

  let assetIdx = 0;

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ mb: 1, minWidth: 700 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell sx={{ width: 28, p: 0 }} />
            <TableCell sx={{ width: 40 }}>TT</TableCell>
            <TableCell sx={{ width: 110 }}>Mã TS</TableCell>
            <TableCell>Tên thiết bị *</TableCell>
            <TableCell sx={{ width: 70 }}>ĐVT</TableCell>
            <TableCell sx={{ width: 70 }}>SL</TableCell>
            <TableCell sx={{ width: 120 }}>Đối tượng SD</TableCell>
            <TableCell>Ghi chú</TableCell>
            <TableCell sx={{ width: onMoveToOther ? 68 : 36 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => {
            const isDrop = dropIdx === i;
            const rKey = r._key || i;
            if (r._isSeparator) {
              return (
                <TableRow
                  key={rKey} draggable
                  onDragStart={() => onDragStart(i)} onDragOver={(e) => onDragOver(e, i)}
                  onDragLeave={onDragLeave} onDragEnd={onDragEnd} onDrop={(e) => onDrop(e, i)}
                  sx={{ bgcolor: isDrop ? 'primary.100' : 'primary.50', outline: isDrop ? '2px dashed' : 'none', outlineColor: 'primary.main' }}
                >
                  <TableCell sx={{ p: 0, cursor: 'grab', color: 'text.disabled', textAlign: 'center' }}>
                    <DragIndicatorIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} />
                  </TableCell>
                  <TableCell colSpan={7} sx={{ py: 0.5 }}>
                    <TextField
                      size="small" fullWidth variant="standard"
                      placeholder="Tên danh mục (VD: I. ĐỒ DÙNG)"
                      defaultValue={r.categoryName || ''}
                      onBlur={(e) => update(i, 'categoryName', e.target.value)}
                      InputProps={{ disableUnderline: false, sx: { fontWeight: 'bold', color: 'primary.main', fontSize: 13 } }}
                    />
                  </TableCell>
                  <TableCell sx={{ p: 0.5 }}>
                    <IconButton size="small" color="error" onClick={() => remove(i)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            }
            assetIdx++;
            return (
              <TableRow
                key={rKey} draggable
                onDragStart={() => onDragStart(i)} onDragOver={(e) => onDragOver(e, i)}
                onDragLeave={onDragLeave} onDragEnd={onDragEnd} onDrop={(e) => onDrop(e, i)}
                sx={{ outline: isDrop ? '2px dashed' : 'none', outlineColor: 'primary.main', bgcolor: isDrop ? 'action.hover' : undefined }}
              >
                <TableCell sx={{ p: 0, cursor: 'grab', color: 'text.disabled', textAlign: 'center' }}>
                  <DragIndicatorIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} />
                </TableCell>
                <TableCell>{assetIdx}</TableCell>
                <TableCell>
                  <TextField size="small" defaultValue={r.assetCode || ''} onBlur={(e) => update(i, 'assetCode', e.target.value)} sx={{ minWidth: 90 }} />
                </TableCell>
                <TableCell>
                  <TextField size="small" defaultValue={r.name || ''} required onBlur={(e) => update(i, 'name', e.target.value)} sx={{ minWidth: 160 }} />
                </TableCell>
                <TableCell>
                  <TextField size="small" defaultValue={r.unit || 'Cái'} onBlur={(e) => update(i, 'unit', e.target.value)} sx={{ minWidth: 55 }} />
                </TableCell>
                <TableCell>
                  <TextField size="small" type="number" defaultValue={r.quantity ?? 1} onBlur={(e) => update(i, 'quantity', Number(e.target.value))} slotProps={{ htmlInput: { min: 0 } }} sx={{ minWidth: 55 }} />
                </TableCell>
                <TableCell>
                  <Select size="small" value={r.targetUser || 'Trẻ'} onChange={(e) => update(i, 'targetUser', e.target.value)} sx={{ minWidth: 110 }}>
                    {TARGET_USER_OPTIONS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </TableCell>
                <TableCell>
                  <TextField size="small" defaultValue={r.notes || ''} onBlur={(e) => update(i, 'notes', e.target.value)} sx={{ minWidth: 90 }} />
                </TableCell>
                <TableCell sx={{ p: 0.5 }}>
                  <Stack direction="row" gap={0}>
                    {onMoveToOther && (
                      <Tooltip title={moveLabel || 'Chuyển sang mục kia'}>
                        <IconButton size="small" color="primary" onClick={() => onMoveToOther(i, r)}>
                          <SwapHorizIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton size="small" color="error" onClick={() => remove(i)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Stack direction="row" gap={1}>
        <Button size="small" startIcon={<AddIcon />} onClick={addRow}>Thêm thiết bị</Button>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addSep} color="primary">
          + Danh mục
        </Button>
      </Stack>
    </Box>
  );
});

export default AssetRowEditor;
