import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: 'src/index.ts',
    mobx: 'src/mobx.ts',
  },
  format: ['esm'],
});
