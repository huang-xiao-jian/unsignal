import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: 'src/index.ts',
    mobx: 'src/mobx.ts',
    resource: 'src/resource.ts',
  },
  format: ['esm'],
});
