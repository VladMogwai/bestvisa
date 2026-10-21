import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://visabest.pro',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
});
