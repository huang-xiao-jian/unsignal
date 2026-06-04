import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*'],
    reporters: ['default'],
    passWithNoTests: true,
  },
});
