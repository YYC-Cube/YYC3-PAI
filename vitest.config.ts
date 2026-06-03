/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@tauri-apps/plugin-fs': path.resolve(__dirname, 'src/__mocks__/tauri-plugin-fs.ts'),
      '@tauri-apps/plugin-shell': path.resolve(__dirname, 'src/__mocks__/tauri-plugin-shell.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'benchmarks/**/*.test.ts', 'e2e/tests/**/*.test.ts', 'e2e/**/*.e2e.test.ts'],
    exclude: ['e2e/My-mgmt*/**', 'src/app/store/__tests__/unified-data-store.test.ts', 'node_modules/**'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'e2e/',
        'benchmarks/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/dist/**',
        'src/app/components/ui/**',
        'src/app/lib/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/app/types/**',
        'src/app/components/**',
        'src/app/hooks/**',
        'src/app/pages/**',
        'src/app/App.tsx',
        'src/app/router.tsx',
        'src/test/**',
        'src/__mocks__/**',
      ],
      thresholds: {
        statements: 60,
        branches: 45,
        functions: 55,
        lines: 60,
      },
      clean: true,
    },
  },
})
