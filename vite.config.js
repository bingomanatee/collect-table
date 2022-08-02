import path from 'path';
import { defineConfig } from 'vite';
import { viteCommonjs, esbuildCommonjs } from '@originjs/vite-plugin-commonjs';
import eslintPlugin from 'vite-plugin-eslint';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    // This creates part of the magic.
    viteCommonjs(),

    // https://www.npmjs.com/package/@vitejs/plugin-react

    eslintPlugin(),
  ],
  requireConfigFile: false,
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        // Solves:
        // https://github.com/vitejs/vite/issues/5308
        // add the name of your package
        tsconfigPaths(),
        esbuildCommonjs(['carpenter']),
      ],
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'carpenter',
      fileName: (format) => `carpenter.${format}.js`
    },

     rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['rxjs'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          rxjs: 'rxjs'
        }
      }
    }
  }
});
