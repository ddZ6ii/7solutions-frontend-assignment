import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, lazyPlugins } from 'vite-plus'

// https://vite.dev/config/
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
      stylesheet: './src/index.css',
      functions: ['clsx', 'cn', 'cva'],
    },
  },
  lint: {
    plugins: ['react', 'typescript', 'oxc'],
    rules: {
      'react/rules-of-hooks': 'error',
      'react/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
        },
      ],
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
  },
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  plugins: lazyPlugins(() => [react(), tailwindcss()]),
})
