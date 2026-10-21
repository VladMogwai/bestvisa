// Replaces the old site's AI-generated country images with Pexels photos listed in migration/pexels/selected.json.
// Originals land in migration/raw/images/... under the same names, then `npm run images` re-encodes them to WebP.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';

const DIR = 'migration/raw/images/shared/assets/images';
const selected = JSON.parse(readFileSync('migration/pexels/selected.json', 'utf8'));

for (const [name, id] of Object.entries(selected)) {
  if (name.startsWith('_')) continue;
  const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2400`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!(res.headers.get('content-type') || '').startsWith('image/')) throw new Error(`${name}: ${id} is not an image (${res.status})`);
  rmSync(`${DIR}/${name}.png`, { force: true });
  writeFileSync(`${DIR}/${name}.jpg`, Buffer.from(await res.arrayBuffer()));
  console.log('ok', name, id);
}
