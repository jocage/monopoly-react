import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.e2b.app', 'localhost', '5173-ijrmfthfi68ld7v9opebw.e2b.app'],
  },
})
