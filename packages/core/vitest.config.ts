import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@unsignal/core/mobx': new URL('./src/mobx.ts', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
  },
});
