import { defineConfig } from 'tsup';

export default defineConfig([
  // Main bundle
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    external: ['@mysten/sui'],
  },
  // Client bundle
  {
    entry: ['src/client/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    outDir: 'dist/client',
    external: ['@mysten/sui'],
  },
  // Types bundle
  {
    entry: ['src/types/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    outDir: 'dist/types',
    external: ['@mysten/sui'],
  },
  // Utils bundle
  {
    entry: ['src/utils/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    outDir: 'dist/utils',
    external: ['@mysten/sui'],
  },
]);
