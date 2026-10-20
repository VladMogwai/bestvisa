// Converts scraped bestvisa.ru pages (migration/raw/pages/*.html) into
// structured JSON (src/data/pages/*.json) that the new templates render.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';

const RAW = 'migration/raw/pages';
const OUT = 'src/data/pages';
const urls = readFileSync('migration/raw/urls.txt', 'utf8').trim().split('\n');

const fileFor = (url) => {
  const f = url.replace('https://bestvisa.ru/', '').replace(/\/$/, '').replace(/\//g, '__');
  return f || 'index';
};

// Original images are re-encoded to WebP by migration/images.mjs.
const webp = (src) => {
  if (!src) return src;
  const local = src.replace(/^https?:\/\/(www\.)?bestvisa\.ru/, '');
  return /^\/(shared|wp-content)\//.test(local) ? local.replace(/\?.*$/, '').replace(/\.(png|jpe?g)$/i, '.webp') : src;
};

// Links that the old server answered with 301 (or 404 with an obvious target).
const LINK_FIX = {
  '/2025/07/31/shengenskaya-viza/': '/blog/shengenskaya-viza',
  '/2026/02/27/viza-v-yaponiyu-polnyj-gid/': '/blog/viza-v-yaponiyu-polnyj-gid',
  '/2026/02/27/viza-vo-franciyu-polnyj-gid/': '/blog/viza-vo-franciyu-polnyj-gid',
  '/uslugi/iza-v-gretsiyu/': '/uslugi/viza-v-greciyu/',
  '/uslugi/shengen-vo-frantsiyu/': '/uslugi/viza-vo-francziyu/shengen/',
};

// Fixes for SEO mistakes inherited from the old site.
const TITLE_FIX = {
  '/uslugi/oformlenie-viz/america/': 'Визы в страны Америки — оформление в Москве | BestVisa',
};

const text = (el) => el.text().replace(/\s+/g, ' ').trim();

// Keeps semantic markup only: no inline styles, scripts, handlers or legacy classes.
function cleanHtml($, el) {
  const c = $(el).clone();
  c.find('script, style, noscript, button, form, .honeypot-field, .faq-arrow, svg').remove();
  c.find('*').each((_, node) => {
    const attrs = Object.keys(node.attribs || {});
    for (const a of attrs) {
      const keep =
        (a === 'href' && node.name === 'a') ||
        (['src', 'alt', 'width', 'height'].includes(a) && node.name === 'img') ||
        (['colspan', 'rowspan'].includes(a) && /^t[dh]$/.test(node.name)) ||
        (a === 'datetime' && node.name === 'time');
      if (!keep) $(node).removeAttr(a);
    }
    if (node.name === 'a') {
      const href = $(node).attr('href');
      if (href) {
        const local = href.replace(/^https?:\/\/(www\.)?bestvisa\.ru(?=\/)/, '');
        const [path, hash] = local.split('#');
        $(node).attr('href', (LINK_FIX[path] || path) + (hash ? `#${hash}` : ''));
      }
    }
    if (node.name === 'img') {
      const src = $(node).attr('src') || '';
      if (src.startsWith('data:')) $(node).remove();
      else $(node).attr('src', webp(src)).attr('loading', 'lazy');
    }
  });
  // Unwrap layout-only wrappers so the new CSS controls the layout.
  let changed = true;
  while (changed) {
    changed = false;
    c.find('div, span').each((_, node) => {
      $(node).replaceWith($(node).contents());
      changed = true;
    });
  }
  return (c.html() || '').replace(/\n\s*\n+/g, '\n').trim();
}

const cards = ($, sec) =>
  sec
    .find('.article-card')
    .map((_, a) => ({
      href: $(a).find('a').attr('href'),
      title: text($(a).find('.article-card-title')),
      text: text($(a).find('.article-card-desc')),
      date: text($(a).find('.article-card-date')) || undefined,
    }))
    .get();

function parseSection($, s) {
  const sec = $(s);
  const cls = (sec.attr('class') || '').split(/\s+/)[0];
  const id = sec.attr('id') || undefined;
  const h2 = text(sec.find('h2').not('.comparison-subtitle').first());

  switch (cls) {
    case 'social-proof':
      return { kind: 'socialProof', lead: text(sec.find('.social-proof-left p').last()) };
    case 'final-cta':
      return { kind: 'finalCta' };
    case 'guarantees':
      return {
        kind: 'guarantees',
        title: h2,
        items: sec.find('.hero-feature p').map((_, p) => cleanHtml($, p)).get(),
      };
    case 'pricing': {
      const tabs = sec.find('.pricing-tab');
      if (tabs.length) {
        return {
          kind: 'pricing',
          title: h2,
          intro: cleanHtml($, sec.find('.pricing-intro')),
          tabs: tabs
            .map((i, t) => {
              const panel = sec.find('.pricing-panel').eq(i);
              return {
                name: text($(t)),
                rows: panel.find('.pricing-service-row > span:first-child').map((_, r) => text($(r))).get(),
                total: text(panel.find('.pricing-total-amount')),
              };
            })
            .get(),
          note: cleanHtml($, sec.find('.pricing-note').first()),
        };
      }
      const detailed = sec.find('.pricing-detailed');
      if (detailed.length) {
        return {
          kind: 'passportPricing',
          title: h2,
          note: text(detailed.prevAll('p').first()),
          categories: detailed
            .find('.pricing-category-title')
            .map((_, h) => {
              const block = $(h).next('.pricing-section');
              return {
                title: text($(h)),
                types: block
                  .find('.pricing-type')
                  .map((_, t) => ({
                    name: text($(t).find('h4')),
                    desc: text($(t).find('.pricing-description')),
                    rows: $(t)
                      .find('.pricing-row')
                      .map((_, r) => ({ period: text($(r).find('.pricing-cell').first()), price: text($(r).find('.pricing-cell.price')) }))
                      .get(),
                    note: text($(t).find('.pricing-note')),
                  }))
                  .get(),
                included: block.find('.pricing-options .pricing-checkbox span').map((_, x) => text($(x))).get(),
                details: block
                  .find('.pricing-details-grid > div')
                  .map((_, d) => ({ title: text($(d).find('h5')), items: $(d).find('li').map((_, li) => text($(li))).get() }))
                  .get(),
              };
            })
            .get(),
        };
      }
      return { kind: 'pricingTable', title: h2, html: cleanHtml($, sec.find('.container')) };
    }
    case 'visa-types-section':
      return {
        kind: 'visaTypes',
        title: text(sec.find('h3').first()),
        cards: sec
          .find('.visa-type-card')
          .map((_, a) => ({
            href: $(a).attr('href'),
            name: text($(a).find('.visa-type-name')),
            price: text($(a).find('.visa-type-price')),
            desc: text($(a).find('.visa-type-desc')),
          }))
          .get(),
      };
    case 'steps':
      return {
        kind: 'steps',
        title: h2,
        items: sec.find('.step-card').map((_, c) => ({ title: text($(c).find('h4')), text: cleanHtml($, $(c).find('p')) })).get(),
      };
    case 'comparison': {
      const col = (sel) => ({
        title: text(sec.find(`${sel} h3`)),
        items: sec.find(`${sel} li`).map((_, li) => cleanHtml($, li)).get(),
      });
      return { kind: 'comparison', subtitle: text(sec.find('.comparison-subtitle')), title: h2, self: col('.comparison-column.gray'), us: col('.comparison-column.red') };
    }
    case 'help-cases':
      return { kind: 'helpCases', title: h2, items: sec.find('.help-case-item p').map((_, p) => cleanHtml($, p)).get() };
    case 'home-discount':
      return { kind: 'discount', title: text(sec.find('h2')), text: text(sec.find('p').first()) };
    case 'questions-cta':
      return { kind: 'questionsCta', title: h2, text: text(sec.find('.questions-cta-desc')) };
    case 'faq':
      return {
        kind: 'faq',
        title: h2,
        items: sec.find('.faq-item').map((_, f) => ({ q: text($(f).find('.faq-question')).replace(/\s*▼$/, ''), a: cleanHtml($, $(f).find('.faq-answer')) })).get(),
      };
    case 'visa-info':
      sec.find('h2').first().remove();
      return { kind: 'info', id, title: h2, html: cleanHtml($, sec.find('.container').length ? sec.find('.container') : sec) };
    case 'news-hero':
      return {
        kind: 'articleHero',
        title: text(sec.find('h1')),
        meta: text(sec.find('.news-meta')),
        date: sec.find('.news-meta time').attr('datetime'),
        parent: sec.find('.news-parent-link').attr('href'),
        parentName: text(sec.find('.news-parent-link')),
      };
    case 'news-content':
      return { kind: 'article', html: cleanHtml($, sec) };
    case 'home-articles':
      return { kind: 'related', title: text(sec.find('.home-section-header h3')), more: sec.find('.home-section-more').attr('href'), items: cards($, sec) };
    case 'list-items-section':
      return { kind: 'list', items: cards($, sec) };
    case 'countries-section':
      return {
        kind: 'countries',
        title: h2,
        groups: sec
          .find('.countries-group')
          .map((_, g) => ({
            title: text($(g).find('.countries-group-title')),
            links: $(g)
              .find('a.country-link')
              .map((_, a) => ({ name: text($(a)), href: $(a).attr('href'), flag: $(a).find('img').attr('src'), popular: $(a).find('.country-star').length > 0 }))
              .get(),
          }))
          .get(),
      };
    default:
      return { kind: 'raw', cls, id, html: cleanHtml($, sec) };
  }
}

function parsePage(url, html) {
  const $ = cheerio.load(html);
  const path = url.replace('https://bestvisa.ru', '');
  const hero = $('section.hero').first();
  const flag = hero.find('h1 .flag-wrap img').attr('src');
  hero.find('h1 .flag-wrap').remove();

  const page = {
    path,
    title: TITLE_FIX[path] || text($('title').first()),
    description: $('meta[name="description"]').attr('content') || '',
    h1: text($('h1').first()),
    breadcrumbs: $('.breadcrumbs-item a').map((_, a) => ({ name: text($(a)), href: $(a).attr('href') })).get(),
    flag: flag && flag.startsWith('data:') ? flag : undefined,
    hero: hero.length
      ? {
          term: text(hero.find('.hero-price-main')),
          price: text(hero.find('.hero-price-amount')),
          lead: cleanHtml($, hero.find('.hero-text > p').first()),
          image: webp(hero.find('.passport-image img').attr('src')),
          imageAlt: hero.find('.passport-image img').attr('alt'),
          features: hero.find('.hero-feature p').map((_, p) => cleanHtml($, p)).get(),
        }
      : undefined,
    sections: [],
  };

  $('main section, body > section').each((_, s) => {
    if ($(s).hasClass('hero')) return;
    page.sections.push(parseSection($, s));
  });
  // Pages without <main> keep sections at top level; dedupe by reference.
  return page;
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const stats = {};
for (const url of urls) {
  const f = fileFor(url);
  const page = parsePage(url, readFileSync(join(RAW, `${f}.html`), 'utf8'));
  for (const s of page.sections) stats[s.kind] = (stats[s.kind] || 0) + 1;
  writeFileSync(join(OUT, `${f}.json`), JSON.stringify(page, null, 1));
}
console.log(`${urls.length} pages →`, OUT);
console.log(stats);
