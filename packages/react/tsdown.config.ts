import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  dts: { generator: 'oxc' },
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm'],
});
