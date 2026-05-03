import { createContext, useContext, useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: 'Xác nhận',
    message: '',
    confirmText: 'Xác nhận',
    confirmColor: 'error',
  });
  const resolveRef = useRef(null);

  const confirm = (message, { title = 'Xác nhận', confirmText = 'Xác nhận', confirmColor = 'error' } = {}) => {
    setState({ open: true, message, title, confirmText, confirmColor });
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={state.open} onClose={handleCancel} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{state.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{state.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={handleCancel}>Hủy</Button>
          <Button variant="contained" color={state.confirmColor} onClick={handleConfirm}>
            {state.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
