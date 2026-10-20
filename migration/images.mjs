// Converts original images (migration/raw/images/**) into compressed WebP under public/.
// Same path, .webp extension: /shared/assets/images/france.png → /shared/assets/images/france.webp
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import sharp from 'sharp';

const SRC = 'migration/raw/images';
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

let before = 0, after = 0;
for (const file of walk(SRC).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))) {
  const rel = relative(SRC, file).replace(/\.(png|jpe?g|webp)$/i, '.webp');
  const out = join('public', rel);
  mkdirSync(dirname(out), { recursive: true });
  // Country photos are used as full-bleed backgrounds; everything else is inline.
  const width = /-country|landmarks|unsplash|about|building|entrance/.test(file) ? 1920 : 1000;
  const info = await sharp(file).resize({ width, withoutEnlargement: true }).webp({ quality: 74 }).toFile(out);
  before += statSync(file).size; after += info.size;
}
console.log(`images: ${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB`);
