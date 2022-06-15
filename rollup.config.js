import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import dts from "rollup-plugin-dts";
import { terser } from "rollup-plugin-terser";

// this override is needed because Module format cjs does not support top-level await
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('./package.json');

const globals = {
  ...packageJson.devDependencies,
};

export default [
  {
    input: "./src/types.ts",
    output: [{ file: "types/types.d.ts", format: "es" }],
    plugins: [dts()],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs', // commonJS
        sourcemap: true,
        exports: 'named'
      },
      {
        file: packageJson.module,
        format: 'esm', // ES Modules
        sourcemap: true,
        exports: 'named'
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        useTsconfigDeclarationDir: true,
        declaration: true,
        tsconfigOverride: {
          exclude: [],
        },
      }),
      commonjs({
        exclude: 'node_modules',
        ignoreGlobal: true,
      }),
      terser()
    ],
    external: Object.keys(globals),
  }
];

// Other useful plugins you might want to add are:
// @rollup/plugin-images - import image files into your components
// @rollup/plugin-json - import JSON files into your components
// rollup-plugin-terser - minify the Rollup bundle
