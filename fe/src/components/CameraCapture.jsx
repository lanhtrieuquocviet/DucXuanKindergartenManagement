/**
 * CameraCapture.jsx
 *
 * Component chụp ảnh bắt buộc qua camera (WebRTC).
 * Không cho phép upload file từ thiết bị.
 *
 * Props:
 *   label        – nhãn hiển thị
 *   required     – hiển thị dấu *
 *   currentValue – URL ảnh đã lưu (từ parent)
 *   onCapture    – async (file: File) => void  — gọi khi chụp xong, parent xử lý upload
 *   readOnly     – chỉ hiển thị ảnh, không cho chụp
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box, Button, Avatar, Typography, CircularProgress, Alert, IconButton,
} from '@mui/material';
import { CameraAlt, Replay, Cameraswitch } from '@mui/icons-material';

function CameraCapture({ label, required, currentValue, onCapture, readOnly }) {
  // phase: idle | camera | uploading | done
  const [phase, setPhase] = useState('idle');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [notif, setNotif] = useState(null); // { type: 'success'|'error', msg }

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // ── Tắt camera ─────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }, []);

  // ── Bật camera ─────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing) => {
    setCameraError(null);
    setCameraReady(false);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: facing },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch (err) {
      let msg = 'Không thể bật camera';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
        msg = 'Trình duyệt chặn quyền camera — vào Settings > Privacy > Camera để cấp quyền';
      else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')
        msg = 'Không tìm thấy camera trên thiết bị này';
      else if (err.name === 'NotReadableError' || err.name === 'TrackStartError')
        msg = 'Camera đang được dùng bởi ứng dụng khác — hãy đóng tab/app đang dùng camera rồi thử lại';
      setCameraError(msg);
    }
  }, [stopCamera]);

  const openCamera = () => {
    setPhase('camera');
    setNotif(null);
    startCamera(facingMode);
  };

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  // ── Chụp frame và upload ────────────────────────────────────────────────────
  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);

    stopCamera();
    setPhase('uploading');

    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await onCapture(file);
      setPhase('done');
      setNotif({ type: 'success', msg: 'Lưu ảnh thành công!' });
    } catch (err) {
      setPhase('idle');
      setNotif({ type: 'error', msg: err.message || 'Lỗi khi tải ảnh lên' });
    }
  };

  // Cleanup khi unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── readOnly: chỉ hiển thị ảnh ─────────────────────────────────────────────
  if (readOnly) {
    return (
      <Box>
        {label && (
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            {label}
          </Typography>
        )}
        {currentValue && /^https?:\/\//i.test(currentValue) ? (
          <Box component="a" href={currentValue} target="_blank" rel="noreferrer" sx={{ display: 'inline-block' }}>
            <Box component="img" src={currentValue} alt={label}
              sx={{ width: 80, height: 80, borderRadius: 1.5, objectFit: 'cover', border: '1px solid', borderColor: 'divider' }} />
          </Box>
        ) : (
          <Typography variant="caption" color="text.disabled" fontStyle="italic">Chưa có ảnh</Typography>
        )}
      </Box>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box>
      {label && (
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
          {label}{required && <Box component="span" sx={{ color: 'error.main' }}> *</Box>}
        </Typography>
      )}

      {/* Camera stream */}
      {phase === 'camera' && (
        <Box>
          {/* Đang bật camera */}
          {!cameraReady && !cameraError && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, bgcolor: 'grey.100', borderRadius: 2, gap: 1.5 }}>
              <CircularProgress size={22} />
              <Typography variant="caption" color="text.secondary">Đang bật camera...</Typography>
            </Box>
          )}

          {/* Lỗi camera */}
          {cameraError && (
            <Box sx={{ p: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="error.main" fontWeight={600} sx={{ display: 'block', mb: 1.5 }}>
                {cameraError}
              </Typography>
              <Button size="small" variant="outlined" color="error" onClick={() => startCamera(facingMode)} sx={{ mr: 1 }}>
                Thử lại
              </Button>
              <Button size="small" onClick={() => { setPhase('idle'); stopCamera(); }}>
                Hủy
              </Button>
            </Box>
          )}

          {/* Video stream đang hoạt động */}
          <Box sx={{ display: cameraReady ? 'block' : 'none', borderRadius: 2, overflow: 'hidden', border: '2px solid', borderColor: 'primary.200' }}>
            <Box sx={{ position: 'relative' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', display: 'block', maxHeight: 280, objectFit: 'cover' }}
              />
              {/* Nút đổi camera trước/sau */}
              <IconButton
                size="small"
                onClick={flipCamera}
                sx={{
                  position: 'absolute', top: 8, right: 8,
                  bgcolor: 'rgba(0,0,0,0.45)', color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
                }}
              >
                <Cameraswitch fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, p: 1.5, bgcolor: 'grey.50', justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<CameraAlt />}
                onClick={capturePhoto}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Chụp ảnh
              </Button>
              <Button
                variant="outlined"
                onClick={() => { setPhase('idle'); stopCamera(); }}
                sx={{ textTransform: 'none' }}
              >
                Hủy
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Đang upload */}
      {phase === 'uploading' && (
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 80, bgcolor: 'grey.50', borderRadius: 2, gap: 1.5,
          border: '1px solid', borderColor: 'divider',
        }}>
          <CircularProgress size={20} />
          <Typography variant="caption" fontWeight={600}>Đang lưu ảnh...</Typography>
        </Box>
      )}

      {/* Idle / Done */}
      {(phase === 'idle' || phase === 'done') && (
        <>
          {currentValue && /^https?:\/\//i.test(currentValue) ? (
            /* Đã có ảnh: hiển thị preview + nút chụp lại */
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Box
                component="a"
                href={currentValue}
                target="_blank"
                rel="noreferrer"
                sx={{ flexShrink: 0, display: 'block', borderRadius: 1.5, overflow: 'hidden', border: '2px solid', borderColor: 'success.300', boxShadow: 1 }}
              >
                <Box component="img" src={currentValue} alt={label}
                  sx={{ width: 80, height: 80, objectFit: 'cover', display: 'block' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" fontWeight={600} color="success.main">
                  ✓ Đã chụp ảnh
                </Typography>
                {notif && (
                  <Alert severity={notif.type} sx={{ mt: 0.5, py: 0.25, px: 1, '& .MuiAlert-message': { fontSize: 12 } }}>
                    {notif.msg}
                  </Alert>
                )}
                <Button
                  size="small"
                  startIcon={<Replay sx={{ fontSize: 14 }} />}
                  onClick={openCamera}
                  sx={{ mt: 0.5, textTransform: 'none', fontSize: 12, color: 'text.secondary' }}
                >
                  Chụp lại
                </Button>
              </Box>
            </Box>
          ) : (
            /* Chưa có ảnh: nút mở camera */
            <>
              <Box
                onClick={openCamera}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 2, py: 1.5, borderRadius: 2,
                  border: '2px dashed',
                  borderColor: notif?.type === 'error' ? 'error.300' : 'divider',
                  bgcolor: notif?.type === 'error' ? '#fef2f2' : 'grey.50',
                  cursor: 'pointer', transition: 'all 0.15s',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.200' }}>
                  <CameraAlt sx={{ fontSize: 16, color: 'text.disabled' }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    Nhấn để chụp ảnh
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                    Chụp bằng camera
                  </Typography>
                </Box>
              </Box>
              {notif && (
                <Alert severity={notif.type} sx={{ mt: 1, py: 0.25, px: 1, '& .MuiAlert-message': { fontSize: 12 } }}>
                  {notif.msg}
                </Alert>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}

export default CameraCapture;
