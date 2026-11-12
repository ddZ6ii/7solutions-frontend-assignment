import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, lazyPlugins } from 'vite-plus'

// Web app config. Formatting, linting and coverage are configured
// at the workspace root (../../vite.config.ts).
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'web',
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  plugins: lazyPlugins(() => [react(), tailwindcss()]),
})
