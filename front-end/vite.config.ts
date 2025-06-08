import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet'],
    exclude: []
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})