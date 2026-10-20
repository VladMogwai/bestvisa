// Keeps the old URL spelling: pages whose URL has no trailing slash
// (/blog/foto-na-zagranpasport) become dist/blog/foto-na-zagranpasport.html,
// so neither Beget nor Cloudflare redirects them to a different address.
import { readdirSync, readFileSync, renameSync, rmdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const pages = readdirSync('src/data/pages').map((f) => JSON.parse(readFileSync(join('src/data/pages', f), 'utf8')).path);
let moved = 0;
for (const path of pages.filter((p) => !p.endsWith('/'))) {
  const dir = join('dist', path);
  const from = join(dir, 'index.html');
  if (!existsSync(from)) throw new Error(`missing ${from}`);
  renameSync(from, `${dir}.html`);
  if (readdirSync(dir).length === 0) rmdirSync(dir);
  moved++;
}
console.log(`postbuild: ${moved} pages written as .html (no trailing slash)`);
