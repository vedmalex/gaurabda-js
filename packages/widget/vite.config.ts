import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({ rollupTypes: true }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GaurabdaWidget',
      formats: ['es', 'iife'],
      fileName: (format) => `gaurabda-widget.${format === 'es' ? 'js' : 'iife.js'}`,
    },
    sourcemap: true,
    minify: 'esbuild',
  },
});
