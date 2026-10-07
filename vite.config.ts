/// <reference types="vitest/config" />
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

/**
 * Declarations for node16 resolution: relative imports get extensions,
 * and every .d.ts gets a .d.cts twin for require (a .d.ts is ESM in a "type": "module" package)
 */
const fixDeclarations = () => {
  readdirSync('dist')
    .filter((file) => file.endsWith('.d.ts'))
    .forEach((file) => {
      const text = readFileSync(`dist/${file}`, 'utf8');
      const withExtension = (extension: string) =>
        text.replace(/(from '\.\/[^']+)'/g, `$1${extension}'`);
      writeFileSync(`dist/${file}`, withExtension('.js'));
      writeFileSync(`dist/${file.replace(/\.d\.ts$/, '.d.cts')}`, withExtension('.cjs'));
    });
};

// `npm run dev`        — docs page from demo/
// `npm run build`      — library build into dist/
// `npm run build:demo` — docs page build into demo-dist/ (`--mode demo`)
export default defineConfig(({ mode }) => {
  if (mode === 'demo') {
    return {
      plugins: [react()],
      root: 'demo',
      // Works from any folder
      base: './',
      build: { outDir: '../demo-dist', emptyOutDir: true },
    };
  }
  return {
    plugins: [
      react(),
      dts({
        include: ['src'],
        exclude: ['src/**/*.test.tsx', 'src/testUtils.ts'],
        afterBuild: fixDeclarations,
      }),
    ],
    server: { port: 5173 },
    build: {
      lib: {
        entry: 'src/index.ts',
        formats: ['es', 'cjs'],
        fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
      },
      rollupOptions: { external: ['react', 'react/jsx-runtime', 'react-dom'] },
    },
    test: { environment: 'jsdom', globals: true, include: ['src/**/*.test.{ts,tsx}'] },
  };
});
