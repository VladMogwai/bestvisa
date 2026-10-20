import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://bestvisa.ru',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
});
