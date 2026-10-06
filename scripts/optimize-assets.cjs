// Re-encode the original generated photography without modifying the sources.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const sourceDir = process.argv[2];
if (!sourceDir) throw new Error('Usage: node scripts/optimize-assets.cjs <original-photography-directory>');
const images = {
  'hero-cup': 'exec-70e7b27e-66e8-4bde-9e95-828cb985f6d6.png',
  'iced-latte': 'exec-28e97aac-cce5-4b35-bd2f-eccd06f003b1.png',
  matcha: 'exec-cc5852ed-ec11-4442-95ed-9b4eb0108c8e.png',
  espresso: 'exec-2dfa1d1d-8da9-42ba-b2cb-d238d3571942.png',
  cinnamon: 'exec-f8d25a16-ebcb-4521-a595-b103ec85d0cf.png',
  lifestyle: 'exec-cbd21d3c-28bb-43d6-bf62-ae7c3cc8c53f.png',
  'promo-cup': 'promo-cup-ribbed.png',
};
const localReplacements = {
  'hero-cup': 'assets-source/hero-cup-ribbed.png',
  'promo-cup': 'assets-source/promo-cup-ribbed.png',
  'espresso-mug': 'assets-source/espresso-mug.png',
  glace: 'assets-source/glace.png',
  'flat-white': 'assets-source/flat-white.png',
  bumble: 'assets-source/bumble.png',
  macarons: 'assets-source/macarons.png',
  'coffee-guide-espresso': 'separate-keyframes/espresso.png',
  'coffee-guide-americano': 'separate-keyframes/americano.png',
  'coffee-guide-cappuccino': 'separate-keyframes/kapuchino.png',
  'coffee-guide-latte': 'separate-keyframes/latte.png',
  'coffee-guide-raf': 'separate-keyframes/raf.png',
};

async function main() {
  await fs.mkdir('public/assets', { recursive: true });
  for (const [name, file] of Object.entries({ ...images, ...localReplacements })) {
    const source = localReplacements[name] || path.join(sourceDir, file);
    const metadata = await sharp(source).metadata();
    for (const width of [480, name === 'lifestyle' ? 1440 : 960]) {
      const stem = width === 480 ? `${name}-480` : name;
      const size = name.startsWith('coffee-guide-') ? { width, height: width, fit: 'cover' } : { width };
      await sharp(source).resize(size).webp({ quality: 82, alphaQuality: 95 }).toFile(`public/assets/${stem}.webp`);
      await sharp(source).resize(size).avif({ quality: 55, effort: 3 }).toFile(`public/assets/${stem}.avif`);
    }
    console.log(`${name}: ${metadata.width}×${metadata.height}, alpha=${metadata.hasAlpha}`);
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
