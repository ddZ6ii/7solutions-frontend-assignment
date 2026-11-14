import { defineConfig } from 'vite-plus'

/**
 * Live tests against the real dummyjson API, run with `vpr test:live`.
 *
 * A separate config, not an entry in the root `test.projects`: every
 * registered project runs on a plain `vp test`, which must stay offline.
 * No setupFiles: the unit tests' "unmocked fetch" safety net is skipped on
 * purpose, since these tests need the real network.
 */
export default defineConfig({
  root: import.meta.dirname,
  test: {
    name: 'api-live',
    environment: 'node',
    include: ['src/**/*.live.test.ts'],
    // A real network call can exceed the default 5s
    testTimeout: 15_000,
  },
})
