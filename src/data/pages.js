// All migrated pages plus helpers shared by the templates.
import { buildPage } from './rewrite/apply.js';

const files = import.meta.glob('./pages/*.json', { eager: true });
const overrides = import.meta.glob('./rewrite/pages/*.json', { eager: true });
const name = (key) => key.split('/').pop();
const overrideByName = Object.fromEntries(Object.entries(overrides).map(([k, m]) => [name(k), m.default]));

// Texts on visabest.pro differ from bestvisa.ru: see src/data/rewrite/.
export const pages = Object.entries(files).map(([k, m]) => buildPage(m.default, overrideByName[name(k)]));
export const byPath = Object.fromEntries(pages.map((p) => [p.path, p]));

const IMG = '/shared/assets/images';
const firstImg = (page) => page.sections.map((s) => (s.html || '').match(/<img[^>]+src="([^"]+)"/)?.[1]).find(Boolean);
const rootOf = (path) => path.split('/')[2] || '';

// A country's photo is reused by all of its sub-pages (types, cities, documents).
const rootImage = {};
for (const p of pages) {
  const img = firstImg(p);
  if (img && !rootImage[rootOf(p.path)]) rootImage[rootOf(p.path)] = img;
}

const FALLBACK = [
  [/zagran|pasport/, `${IMG}/about-bestvisa.webp`],
  [/america/, `${IMG}/usa-country.webp`],
  [/asia/, `${IMG}/japan-country.webp`],
  [/oceania/, `${IMG}/australia-country.webp`],
  [/karty-inostrannykh|karta-ates/, `${IMG}/singapore-country.webp`],
  [/tury-za-rubezh/, `${IMG}/greece-country.webp`],
  [/vnzh/, `${IMG}/portugal-country.webp`],
  [/strakhovanie/, `${IMG}/switzerland-country.webp`],
  [/priglasheniya|o-kompanii/, `${IMG}/about-bestvisa.webp`],
];

export function heroImage(page) {
  return (
    firstImg(page) ||
    rootImage[rootOf(page.path)] ||
    FALLBACK.find(([re]) => re.test(page.path))?.[1] ||
    `${IMG}/schengen-europe-landmarks.webp`
  );
}

export function pageType(page) {
  if (page.path === '/') return 'home';
  if (page.path === '/uslugi/') return 'catalog';
  if (page.sections.some((s) => s.kind === 'list')) return 'list';
  if (page.sections.some((s) => s.kind === 'articleHero')) return 'article';
  return 'service';
}
