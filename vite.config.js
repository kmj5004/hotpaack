import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // 기본 minify 사용 (esbuild)
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  worker: {
    format: 'es'
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true
  }
})
