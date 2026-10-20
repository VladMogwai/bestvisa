# BestVisa — new site

Static rebuild of [bestvisa.ru](https://bestvisa.ru) (visa and passport agency, Moscow) with a new design.
Same content and the same 138 URLs as the old MODX site; built with [Astro](https://astro.build).

- **Production:** Beget (static files from `dist/`), lead forms keep posting to the existing `/shared/send_form.php`.
- **Preview:** Cloudflare Workers static assets, closed from indexing, forms do not send:
  https://bestvisa-preview.animation-lab.workers.dev

Cloudflare is not used for production: since June 2025 Russian ISPs throttle Cloudflare to 16 KB per resource.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:4321 |
| `npm run build` | Production build into `dist/` (Metrika on, indexable) |
| `npm run deploy:preview` | Preview build (noindex, no Metrika, no lead sending) and deploy to Cloudflare |
| `npm run extract` | Re-parse `migration/raw/pages/*.html` into `src/data/pages/*.json` |
| `npm run images` | Re-encode `migration/raw/images/**` into WebP under `public/` |

`migration/raw/` (scraped HTML and original images) is not in git; re-scrape it from the old site if needed.

## Structure

- `src/data/pages/*.json` — content of every page, extracted from the old site.
- `src/data/site.js` — contacts, messengers, menu, Metrika and Webmaster ids.
- `src/components/*Page.astro` — templates: service, article, list, catalog. `Sections.astro` renders service blocks.
- `src/scripts/lead.js` — forms, first-touch attribution (`bv_ft`, same format as the old site) and Metrika goals.
- `scripts/postbuild.mjs` — writes URLs without a trailing slash as `name.html`.
- `public/.htaccess` — Apache rules for Beget (https, `.html` rewrite, caching).

## Metrika goals (JavaScript events)

`lead_submit`, `click_phone`, `click_tg`, `click_wa`, `click_max`, `click_email`, `click_order`, `click_cta_header`, `click_cta_mobile`.

## Launch checklist (Beget)

1. Back up the current site and its `.htaccess` on Beget.
2. Copy the old 301 redirects from the current `.htaccess` (old WordPress paths like `/2026/02/27/...`) into `public/.htaccess`.
3. `npm run build`, upload `dist/` to the site root; keep `/shared/send_form.php` and anything it needs.
4. Send a test lead from the hero form and from the bottom form; check it arrives.
5. Yandex Webmaster: re-send `sitemap.xml`, check robots.txt, run "Проверка ответа сервера" on a few URLs.
6. Create the Metrika goals listed above.
