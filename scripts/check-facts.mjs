// Compares visabest.pro texts with the original bestvisa.ru content:
// 1) every number (price, term, amount) must survive the rewrite unchanged;
// 2) similarity = share of the original's 5-word shingles still present (lower is more unique).
// Usage: node scripts/check-facts.mjs [page-file-substring]
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { buildPage } from '../src/data/rewrite/apply.js';

const only = process.argv[2];
const SKIP = new Set(['_allowAdded', 'href', 'path', 'flag', 'image', 'kind', 'id', 'cls', 'date', 'parent', 'breadcrumbs', 'more']);
const texts = (v, k) =>
  SKIP.has(k) ? [] : typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap((x) => texts(x)) : v && typeof v === 'object' ? Object.entries(v).flatMap(([kk, x]) => texts(x, kk)) : [];
const plain = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;| /g, ' ').replace(/&[a-z]+;/g, ' ');
const numbers = (s) => (plain(s).match(/\d+(?:[ .,]\d+)*/g) || []).map((n) => n.replace(/[ ]/g, ''));
const words = (s) => plain(s).toLowerCase().match(/[a-zа-яё0-9]+/g) || [];
const shingles = (s) => {
  const w = words(s);
  const out = new Set();
  for (let i = 0; i + 5 <= w.length; i++) out.add(w.slice(i, i + 5).join(' '));
  return out;
};
const count = (arr) => arr.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
const diff = (a, b) => [...a].flatMap(([k, n]) => Array(Math.max(0, n - (b.get(k) || 0))).fill(k));

let failed = 0;
const rows = [];
for (const f of readdirSync('src/data/pages').sort()) {
  if (only && !f.includes(only)) continue;
  const orig = JSON.parse(readFileSync(`src/data/pages/${f}`, 'utf8'));
  const ov = existsSync(`src/data/rewrite/pages/${f}`) ? JSON.parse(readFileSync(`src/data/rewrite/pages/${f}`, 'utf8')) : undefined;
  const built = buildPage(orig, ov);
  const a = texts(orig).join('\n');
  const b = texts(built).join('\n');
  const na = count(numbers(a));
  const nb = count(numbers(b));
  const lost = diff(na, nb);
  // An override may add a number that is a known fact of the old site (listed in `_allowAdded`).
  const allow = count(ov?._allowAdded || []);
  const added = diff(count(diff(nb, na)), allow);
  const sa = shingles(a);
  const sb = shingles(b);
  const same = [...sa].filter((x) => sb.has(x)).length;
  const sim = sa.size ? Math.round((100 * same) / sa.size) : 0;
  rows.push({ f, sim, override: Boolean(ov) });
  if (lost.length || added.length) {
    failed++;
    console.log(`✗ ${f}\n  lost:  ${lost.join(', ') || '—'}\n  added: ${added.join(', ') || '—'}`);
  }
}
const avg = Math.round(rows.reduce((s, r) => s + r.sim, 0) / (rows.length || 1));
console.log(`\npages: ${rows.length}, number mismatches: ${failed}, average similarity to bestvisa.ru: ${avg}%`);
for (const r of rows.filter((r) => r.override || only)) console.log(`  ${r.sim}%  ${r.f}${r.override ? '  (override)' : ''}`);
process.exitCode = failed ? 1 : 0;
