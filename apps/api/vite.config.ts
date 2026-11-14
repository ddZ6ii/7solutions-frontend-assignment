import { configDefaults, defineConfig } from 'vite-plus'

// API app config. Formatting, linting and coverage are configured
// at the workspace root (../../vite.config.ts).
export default defineConfig({
  test: {
    name: 'api',
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    // Live tests call the real dummyjson: never part of `vp test`.
    // They run on their own with `vpr test:live` (see vite.live.config.ts).
    exclude: [...configDefaults.exclude, '**/*.live.test.ts'],
  },
})
