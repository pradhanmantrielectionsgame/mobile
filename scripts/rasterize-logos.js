// Rasterises the two oversized auto-traced party-logo SVGs to a small PNG.
//
// All_India_Trinamool_Congress_logo_(3).svg is 895 KB — 130,474 coordinate
// points across 7 paths, an Inkscape trace of a bitmap — and it renders as a
// ~30px badge. Rounding coordinates only saves 13%, so the fix is to
// rasterise, not to minify. The AAP logo (96 KB) has the same problem, smaller.
// The other three party logos are real vector art (8–28 KB) and stay as SVG.
//
// ponytail: uses the Playwright already in devDependencies rather than adding a
// native rasteriser (cairosvg needs a libcairo DLL that Windows doesn't ship).
// Swap to sharp/resvg only if this ever has to run in CI.
//
// Usage: node scripts/rasterize-logos.js   (then shrink-images.py makes .webp)
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ICONS = path.resolve(__dirname, '..', 'assets', 'icons');
const TARGETS = [
  ['All_India_Trinamool_Congress_logo_(3).svg', 96],
  ['Aam_Aadmi_Party_logo_(English).svg', 96],
];

(async () => {
  const browser = await chromium.launch();
  for (const [name, size] of TARGETS) {
    const src = path.join(ICONS, name);
    if (!fs.existsSync(src)) { console.log(`  skip (missing): ${name}`); continue; }
    const out = src.replace(/\.svg$/, '.png');

    // deviceScaleFactor 2 so the badge stays crisp on a 3x phone screen
    // without storing a 3x-sized file.
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 2,
    });
    // Inlined into an HTML wrapper rather than navigated to directly — a
    // standalone .svg document has no <head>, so addStyleTag has nothing to
    // attach to and the sizing rules can't be applied.
    const svg = fs.readFileSync(src, 'utf8').replace(/<\?xml[^>]*\?>/, '');
    await page.setContent(
      `<style>html,body{margin:0;padding:0;background:transparent}
       svg{width:${size}px;height:${size}px;display:block}</style>${svg}`,
      { waitUntil: 'load' }
    );
    await page.screenshot({ path: out, omitBackground: true });
    await page.close();

    const before = fs.statSync(src).size, after = fs.statSync(out).size;
    console.log(`  ${name.padEnd(42)} ${String(Math.round(before / 1024)).padStart(5)}K -> ` +
                `${String(Math.round(after / 1024)).padStart(4)}K  (${size}px @2x)`);
  }
  await browser.close();
})();
