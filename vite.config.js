import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Worker 파일을 최적화하지 않도록 설정
    rollupOptions: {
      output: {
        // Worker를 별도 청크로 유지
        manualChunks: undefined
      }
    },
    // 최소화하지만 과도한 최적화는 하지 않음
    minify: 'terser',
    terserOptions: {
      compress: {
        // 수학 연산 최적화 방지
        pure_funcs: [],
        // 루프 최적화 방지
        loops: false,
        // 무한 루프 감지 비활성화
        passes: 1
      },
      mangle: {
        // 함수 이름 유지 (디버깅용)
        keep_fnames: false
      }
    }
  },
  worker: {
    // Worker 최적화 설정
    format: 'es',
    rollupOptions: {
      output: {
        // Worker 코드 최적화 최소화
        compact: false
      }
    }
  },
  // 개발 서버 설정
  server: {
    port: 5173,
    strictPort: false,
    host: true
  }
})
