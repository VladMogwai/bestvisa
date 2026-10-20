// Same URL set (and exact spelling, with or without trailing slash) as the old site's sitemap.
import { SITE_URL } from '../data/site.js';

const pages = Object.values(import.meta.glob('../data/pages/*.json', { eager: true })).map((m) => m.default.path);

export const GET = () => {
  const today = new Date().toISOString().slice(0, 10);
  const body = pages
    .map((p) => `<url><loc>${SITE_URL}${p}</loc><lastmod>${today}</lastmod><priority>${p === '/' ? '1.0' : p.split('/').length > 4 ? '0.6' : '0.8'}</priority></url>`)
    .join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
