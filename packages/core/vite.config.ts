import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({ rollupTypes: true }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        today: resolve(__dirname, 'src/today.ts'),
      },
      formats: ['es', 'cjs'],
    },
    sourcemap: true,
    minify: false,
  },
});
