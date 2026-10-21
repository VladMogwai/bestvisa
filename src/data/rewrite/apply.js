// Builds visabest.pro texts: extracted bestvisa.ru content → shared phrase rules → per-page overrides.
import { rewriteText } from './shared.js';

// Keys whose values are data, not text.
const DATA_KEYS = new Set(['href', 'path', 'flag', 'image', 'kind', 'id', 'cls', 'date', 'parent', 'breadcrumbs', 'more']);

function rewriteDeep(value, key) {
  if (DATA_KEYS.has(key)) return value;
  if (typeof value === 'string') return rewriteText(value);
  if (Array.isArray(value)) return value.map((v) => rewriteDeep(v));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewriteDeep(v, k)]));
  return value;
}

// Arrays merge by index (null keeps the original item); objects merge by key; other values replace.
function merge(base, over) {
  if (over === null || over === undefined) return base;
  if (Array.isArray(base) && Array.isArray(over)) return base.map((b, i) => (i < over.length ? merge(b, over[i]) : b));
  if (base && typeof base === 'object' && over && typeof over === 'object' && !Array.isArray(over)) {
    const out = { ...base };
    for (const [k, v] of Object.entries(over)) out[k] = k in base ? merge(base[k], v) : v;
    return out;
  }
  return over;
}

export function buildPage(original, override) {
  const { _allowAdded, ...texts } = override || {};
  return merge(rewriteDeep(original), override ? texts : undefined);
}
