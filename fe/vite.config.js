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
          // Tách face-api.js thành chunk riêng → chỉ tải khi cần
          'face-api': ['@vladmandic/face-api'],
          // Tách MUI thành chunk riêng
          'mui': ['@mui/material', '@mui/icons-material'],
          // Tách React
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
