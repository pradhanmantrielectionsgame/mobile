// Captures store/manifest screenshots off the local dev server.
//
//   npm run serve            (in another terminal, port 8934)
//   node scripts/capture-screenshots.js
//
// Writes assets/screenshots/*.png at 390x844 @2x (780x1688) — a home-screen
// PWA has no browser chrome, so 844 is the real usable height, not the 664
// that devices['iPhone 14'] reports.
//
// ponytail: drives the actual UI rather than mocking screens. The only reach-
// arounds are the three things a fresh profile can't show — the install gate,
// a locked roster, and a special power you'd otherwise play 3 phases to reach.
//
// CAVEAT: emoji here render in the host OS's emoji font (Segoe UI Emoji on
// Windows). The app uses emoji as icons, so these will NOT match what an
// iPhone (Apple Color Emoji) or Android (Noto Color Emoji) user sees. Fine
// for the manifest; re-shoot on a real device for the Play listing.

const { webkit, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8934/mobile/index.html';
const OUT = path.resolve(__dirname, '..', 'assets', 'screenshots');
const ALL_IDS = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'data', 'politicians-data.json'), 'utf8').replace(/^\uFEFF/, '')
).politicians.map(p => p.id);

const shots = [];
async function shot(page, name, label) {
  const file = path.join(OUT, name + '.png');
  await page.screenshot({ path: file });
  shots.push({ name, label });
  console.log('  ' + name + '.png  — ' + label);
}

const wait = (page, ms) => page.waitForTimeout(ms);

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await webkit.launch();
  const ctx = await browser.newContext({
    ...devices['iPhone 14'],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  // Two things a fresh profile can't show: the phone install gate hides the
  // whole app until Add-to-Home-Screen, and only 3 politicians start unlocked.
  await ctx.addInitScript(ids => {
    Object.defineProperty(navigator, 'standalone', { get: () => true });
    localStorage.setItem('pme_unlocked_politicians', JSON.stringify(ids));
  }, ALL_IDS);

  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('  ! page error:', e.message));
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // --- welcome ---
  await page.waitForSelector('#welcomeStartBtn:not([disabled])', { timeout: 30000 });
  await wait(page, 400);
  await shot(page, '01-welcome', 'Welcome screen');

  await page.locator('#welcomeStartBtn').click();
  await page.waitForSelector('#selectOverlay:not([hidden])');
  await wait(page, 700);

  // --- politician cards ---
  const cards = page.locator('#polCarousel .pol-card');
  const total = await cards.count();
  console.log('  (' + total + ' cards in carousel)');

  async function toCard(i) {
    await cards.nth(i).evaluate(el => el.scrollIntoView({ block: 'nearest', inline: 'center' }));
    await wait(page, 600);
  }

  // Cards carry no id attribute, so match on the rendered name.
  const pickIndex = name => cards.evaluateAll((els, wanted) => els.findIndex(
    el => (el.querySelector('.pol-name') || {}).textContent === wanted), name);

  for (const [i, [who, file]] of [
    ['Narendra Modi', '02-politician-card'],
    ['Arvind Kejriwal', '03-politician-card-2'],
    ['Rajinikanth', '04-politician-card-3'],
  ].entries()) {
    const at = await pickIndex(who);
    if (at < 0) { console.log('  (skipped ' + who + ' — not in carousel)'); continue; }
    await toCard(at);
    await shot(page, file, 'Politician card: ' + who);
  }

  const idx = Math.max(0, await pickIndex('Narendra Modi'));
  await toCard(idx);
  await wait(page, 400);

  await cards.nth(idx).locator('.pol-play-btn').click();
  await page.waitForSelector('#stage:not([hidden])', { timeout: 15000 });
  await wait(page, 1200);
  await shot(page, '05-map-board', 'Campaign map + HUD');

  // --- in-game actions ---
  // Map states are ISO codes (INMH, INUP...), not names. Tapping selects;
  // #cardInvestBtn is the direct-invest action on the selected state, and its
  // spawnMoneyText FX only lives 700ms, so shoot right after the last tap.
  async function investIn(iso, taps) {
    const st = page.locator('#map #' + iso).first();
    if (!(await st.count())) return console.log('  (no state ' + iso + ')');
    await st.click({ force: true });
    await wait(page, 300);
    for (let i = 0; i < taps; i++) {
      await page.locator('#cardInvestBtn').click({ force: true });
      await wait(page, 160);
    }
  }
  await investIn('INMH', 4);
  await investIn('INUP', 4);
  await investIn('INKA', 3);
  await shot(page, '06-state-action', 'Investing in a state');

  // Quick-invest the Northeast-8 group button — money FX + group readout.
  if (await page.locator('#neBtn').count()) {
    await page.locator('#neBtn').click({ force: true });
    await wait(page, 220);
    await shot(page, '07-group-invest', 'Northeast group quick-invest');
  }

  // --- special power burst ---
  await page.evaluate(() => {
    const g = window.__game;
    g.players.p1.tokens.stateRally = 99;
    g.players.p1.funds = 99999;
    if (g.cfg.rally) g.cfg.rally.specialPowerupMinPhase = 1;
    if (g.players.p1.politician.power) g.players.p1.politician.power.requiresMinPhase = 1;
  });
  await page.locator('#specialBtn').click({ force: true });  // craft
  await wait(page, 900);
  await shot(page, '08-special-ready', 'Special ability crafted');

  await page.locator('#specialBtn').click({ force: true });  // activate
  await wait(page, 900);                                     // mid-burst, before the 5s cleanup
  await shot(page, '09-special-power', 'Special ability activated');

  await browser.close();

  postprocess();
  console.log('\n' + shots.length + ' screenshots captured.');
  console.log('  assets/screenshots/*.webp   -> shipped, referenced by manifest.json');
  console.log('  design/play-listing/*.png   -> Play Console upload (not deployed)');
}

// PNG -> WebP for the shipped copies (CLAUDE.md: no PNG for photographic art),
// plus a side-padded PNG set for the Play listing. Play rejects a screenshot
// whose long side exceeds 2x its short side, and 390x844 is 2.16:1 — so the
// Play copies get background bars to land on exactly 2:1.
// ponytail: shells out to python/Pillow rather than adding an npm image dep.
function postprocess() {
  const py = [
    'import os, glob',
    'from PIL import Image',
    // JSON's double-quoted form is already a valid python literal (\ escapes
    // match). Don't convert it to r'...' — the repo path contains an apostrophe.
    'SRC = ' + JSON.stringify(OUT),
    "PLAY = os.path.join(os.path.dirname(os.path.dirname(SRC)), 'design', 'play-listing')",
    'os.makedirs(PLAY, exist_ok=True)',
    'BG = (0xEE, 0xF0, 0xF3)',
    "for f in sorted(glob.glob(os.path.join(SRC, '*.png'))):",
    "    im = Image.open(f).convert('RGB')",
    '    w, h = im.size',
    '    base = os.path.splitext(os.path.basename(f))[0]',
    "    im.save(os.path.join(SRC, base + '.webp'), 'WEBP', quality=82, method=6)",
    '    need = max(w, (h + 1) // 2)',
    "    can = Image.new('RGB', (need, h), BG)",
    '    can.paste(im, ((need - w) // 2, 0))',
    "    can.save(os.path.join(PLAY, base + '.png'), 'PNG', optimize=True)",
    '    os.remove(f)',
  ].join('\n');
  require('child_process').execFileSync('python', ['-c', py], { stdio: 'inherit' });
}

main().catch(e => { console.error(e); process.exit(1); });
