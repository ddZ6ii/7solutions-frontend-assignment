import { defineConfig } from 'vite-plus'

// API app config. Formatting, linting and coverage are configured
// at the workspace root (../../vite.config.ts).
export default defineConfig({
  test: {
    name: 'api',
    environment: 'node',
  },
})
