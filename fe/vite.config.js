import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['@vladmandic/face-api'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách các thư viện nặng thành các chunk riêng biệt
          'face-api': ['@vladmandic/face-api'],
          'mui': ['@mui/material', '@mui/icons-material'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'excel-utils': ['xlsx', 'exceljs'],
          'pdf-utils': ['jspdf', 'jspdf-autotable'],
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
