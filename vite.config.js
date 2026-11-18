import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsxFactory: 'localizedElement',
    jsxInject: 'import { localizedElement } from "/src/localized-element.js"',
  },
});
