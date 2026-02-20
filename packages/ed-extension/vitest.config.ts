import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@schoolgle/ed-agents': '../../packages/ed-agents/src',
    },
  },
});
