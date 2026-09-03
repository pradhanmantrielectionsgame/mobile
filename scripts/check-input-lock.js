// Regression check for the paused/replay input lock (bugs reported 2026-09-02:
// human actions still went through while paused and during replay).
// Needs `npm run serve` running. Usage: node scripts/check-input-lock.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 664 } });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto('http://localhost:8934/mobile/index.html');
  await p.click('#welcomeStartBtn');
  await p.waitForSelector('#selectOverlay:not([hidden])');
  await p.click('.pol-play-btn');
  await p.waitForSelector('#stage', { state: 'visible' });
  await p.waitForTimeout(600);

  const funds = () => p.evaluate(() => window.__game.players.p1.fundsCr);
  const tap = async () => {
    await p.evaluate(() => {
      const el = document.getElementById('INUP');
      const r = el.getBoundingClientRect();
      const opt = { bubbles: true, clientX: r.left + r.width/2, clientY: r.top + r.height/2, button: 0 };
      el.dispatchEvent(new PointerEvent('pointerdown', opt));
    });
    await p.waitForTimeout(80);
  };

  // 1. paused -> no action
  await p.click('#pauseToggleBtn');
  const f0 = await funds();
  await tap(); await tap(); await tap();
  const f1 = await funds();
  console.log('PAUSED   funds', f0, '->', f1, f0 === f1 ? 'PASS (blocked)' : 'FAIL (action went through)');

  // 2. resumed -> action works
  await p.click('#pauseToggleBtn');
  await tap(); await tap(); await tap();
  const f2 = await funds();
  console.log('RESUMED  funds', f1, '->', f2, f2 < f1 ? 'PASS (action works)' : 'FAIL (blocked when it should not be)');

  await b.close();
})();
