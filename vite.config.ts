import { defineConfig } from 'vite-plus'

// Workspace-wide config: formatting, linting and the test runner.
// App-specific Vite/Vitest settings live in apps/*/vite.config.ts.
export default defineConfig({
  fmt: {
    arrowParens: 'always',
    bracketSpacing: true,
    endOfLine: 'lf',
    printWidth: 80,
    semi: false,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    useTabs: false,
    sortTailwindcss: {
      stylesheet: './apps/web/src/index.css',
      functions: ['clsx', 'cn', 'cva'],
    },
  },
  lint: {
    plugins: ['typescript', 'oxc'],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: 'vite-plus',
        specifier: 'vite-plus/oxlint-plugin',
      },
    ],
    overrides: [
      {
        files: ['apps/web/**'],
        plugins: ['react'],
        rules: {
          'react/rules-of-hooks': 'error',
          'react/only-export-components': [
            'warn',
            {
              allowConstantExport: true,
            },
          ],
        },
      },
      {
        files: ['apps/api/**'],
        env: {
          node: true,
        },
      },
    ],
  },
  test: {
    projects: ['apps/*'],
    coverage: {
      // Test setup files aren't application code
      exclude: ['**/src/test/**'],
      // Minimum floor, not a target: fail `vp run coverage` if untested code lands
      thresholds: { statements: 90, functions: 90, lines: 90, branches: 80 },
    },
  },
})
