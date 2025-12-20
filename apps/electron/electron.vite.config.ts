import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      target: 'node18',
      rollupOptions: {
        output: {
          entryFileNames: '[name].mjs',
          format: 'es' // 明示的に ESM 形式で出力するよう指定
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      target: 'node18',
      rollupOptions: {
        output: {
          // Preloadも合わせておくと安全です
          entryFileNames: '[name].mjs'
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src')
      }
    },
    build: {
      target: 'esnext'
    },
    plugins: [react(), tailwindcss()]
  }
})
