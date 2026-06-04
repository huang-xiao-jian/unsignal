import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vueJsx() as never],
  test: {
    environment: 'node',
  },
});
