<title>PME Mobile — Gap Audit &amp; Action Plan</title>

<style>
:root{
  --bg:#F7F5F0; --bg-raised:#FFFFFF; --ink:#1C1B19; --ink-soft:#55524A;
  --rule:#E4E0D6; --rule-strong:#D2CCBC;
  --navy:#14315B; --navy-soft:#3C5478;
  --done-bg:#E4EFE6; --done-fg:#2F6E4E;
  --partial-bg:#F6EAD4; --partial-fg:#9C6B18;
  --missing-bg:#F5E1DA; --missing-fg:#A8431F;
  --stub-bg:#EAE3F2; --stub-fg:#6A4E93;
  --skip-bg:#EAE8E2; --skip-fg:#7A7568;
  --mono: ui-monospace, "SF Mono", "Cascadia Code", "Consolas", monospace;
  --serif: Georgia, "Iowan Old Style", "Times New Roman", serif;
  --sans: -apple-system, "Segoe UI", "Inter", sans-serif;
}
:root[data-theme="dark"]{
  --bg:#15171C; --bg-raised:#1C1F26; --ink:#EDEAE1; --ink-soft:#A9A493;
  --rule:#2B2E36; --rule-strong:#383C46;
  --navy:#8FAEDD; --navy-soft:#6F8DBB;
  --done-bg:#1E2E24; --done-fg:#7FCB9B;
  --partial-bg:#332A18; --partial-fg:#E4B45C;
  --missing-bg:#3A241C; --missing-fg:#E88E68;
  --stub-bg:#2A2438; --stub-fg:#C0A6E8;
  --skip-bg:#24262C; --skip-fg:#9B968A;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#15171C; --bg-raised:#1C1F26; --ink:#EDEAE1; --ink-soft:#A9A493;
    --rule:#2B2E36; --rule-strong:#383C46;
    --navy:#8FAEDD; --navy-soft:#6F8DBB;
    --done-bg:#1E2E24; --done-fg:#7FCB9B;
    --partial-bg:#332A18; --partial-fg:#E4B45C;
    --missing-bg:#3A241C; --missing-fg:#E88E68;
    --stub-bg:#2A2438; --stub-fg:#C0A6E8;
    --skip-bg:#24262C; --skip-fg:#9B968A;
  }
}

*{box-sizing:border-box;}
body{
  background:var(--bg); color:var(--ink); font-family:var(--sans);
  line-height:1.55; font-size:16px; max-width:820px; margin:0 auto;
  padding:56px 24px 120px;
}
::selection{ background:var(--navy); color:var(--bg); }

.eyebrow{
  font-family:var(--mono); font-size:11.5px; letter-spacing:.14em; text-transform:uppercase;
  color:var(--navy-soft); margin:0 0 6px;
}
h1{
  font-family:var(--serif); font-size:clamp(28px,4.4vw,38px); font-weight:600;
  line-height:1.14; margin:0 0 10px; text-wrap:balance; letter-spacing:-.01em;
}
.subtitle{ color:var(--ink-soft); font-size:16.5px; max-width:56ch; margin:0 0 28px; }
.meta-row{ display:flex; gap:18px; flex-wrap:wrap; font-family:var(--mono); font-size:12px; color:var(--ink-soft); margin-bottom:34px; }
.meta-row span b{ color:var(--ink); font-weight:600; }

header{ border-bottom:1px solid var(--rule-strong); padding-bottom:28px; margin-bottom:36px; }

.legend{
  display:flex; gap:8px; flex-wrap:wrap; padding:14px 16px; background:var(--bg-raised);
  border:1px solid var(--rule); border-radius:10px; margin-bottom:8px;
}
.legend .label{ font-family:var(--mono); font-size:11px; color:var(--ink-soft); align-self:center; margin-right:4px; }

.pill{
  display:inline-flex; align-items:center; gap:5px; font-family:var(--mono); font-size:11px;
  padding:3px 9px; border-radius:100px; font-weight:600; letter-spacing:.02em; white-space:nowrap;
}
.pill.done{ background:var(--done-bg); color:var(--done-fg); }
.pill.partial{ background:var(--partial-bg); color:var(--partial-fg); }
.pill.missing{ background:var(--missing-bg); color:var(--missing-fg); }
.pill.stub{ background:var(--stub-bg); color:var(--stub-fg); }
.pill.skip{ background:var(--skip-bg); color:var(--skip-fg); }

section{ margin-bottom:48px; }
h2{
  font-family:var(--serif); font-size:22px; font-weight:600; margin:0 0 4px; letter-spacing:-.005em;
}
h3{ font-family:var(--sans); font-size:15px; font-weight:700; margin:26px 0 8px; color:var(--ink); }
.section-note{ color:var(--ink-soft); font-size:14px; margin:0 0 18px; max-width:64ch; }

.tldr{
  background:var(--bg-raised); border:1px solid var(--rule); border-left:3px solid var(--navy);
  border-radius:8px; padding:20px 22px;
}
.tldr ul{ margin:0; padding-left:18px; }
.tldr li{ margin-bottom:9px; }
.tldr li:last-child{ margin-bottom:0; }

.table-wrap{ overflow-x:auto; border:1px solid var(--rule); border-radius:10px; }
table{ border-collapse:collapse; width:100%; min-width:640px; font-size:13.5px; }
thead th{
  text-align:left; font-family:var(--mono); font-size:10.5px; letter-spacing:.08em; text-transform:uppercase;
  color:var(--ink-soft); background:var(--bg-raised); padding:10px 14px; border-bottom:1px solid var(--rule-strong);
  position:sticky; top:0;
}
tbody td{ padding:10px 14px; border-bottom:1px solid var(--rule); vertical-align:top; background:var(--bg-raised); }
tbody tr:last-child td{ border-bottom:none; }
td.feat{ font-weight:600; }
td.file{ font-family:var(--mono); font-size:12px; color:var(--ink-soft); white-space:nowrap; }
td.desc{ color:var(--ink-soft); }
.cat-row td{
  background:var(--bg); font-family:var(--mono); font-size:10.5px; letter-spacing:.1em; text-transform:uppercase;
  color:var(--navy-soft); font-weight:700; padding:8px 14px;
}

.gap{ border:1px solid var(--rule); background:var(--bg-raised); border-radius:10px; padding:18px 20px; margin-bottom:14px; }
.gap-head{ display:flex; align-items:center; gap:10px; margin-bottom:6px; flex-wrap:wrap; }
.gap-head h4{ font-size:15.5px; margin:0; font-family:var(--sans); font-weight:700; }
.gap p{ margin:0; color:var(--ink-soft); font-size:14px; }
.gap code{ font-family:var(--mono); font-size:12.5px; background:var(--bg); padding:1px 5px; border-radius:4px; color:var(--ink); }

.phase{
  display:grid; grid-template-columns:auto 1fr; gap:0 18px; border:1px solid var(--rule); background:var(--bg-raised);
  border-radius:10px; padding:18px 20px; margin-bottom:14px;
}
.phase-num{
  font-family:var(--serif); font-size:26px; color:var(--navy-soft); font-weight:600; line-height:1;
  grid-row:1 / span 3; padding-top:2px;
}
.phase h4{ margin:0 0 4px; font-size:15.5px; font-family:var(--sans); font-weight:700; }
.phase .goal{ color:var(--ink-soft); font-size:13.5px; margin:0 0 10px; }
.phase ul{ margin:0; padding-left:18px; font-size:13.5px; }
.phase li{ margin-bottom:4px; }
.phase .dod{
  margin-top:10px; font-family:var(--mono); font-size:11.5px; color:var(--navy-soft);
  border-top:1px dashed var(--rule-strong); padding-top:8px;
}

.pwa-list{ display:grid; gap:10px; }
.pwa-item{
  display:grid; grid-template-columns:150px 1fr; gap:16px; padding:12px 16px; background:var(--bg-raised);
  border:1px solid var(--rule); border-radius:8px; font-size:13.5px; align-items:start;
}
.pwa-item .f{ font-family:var(--mono); font-size:12.5px; color:var(--navy); font-weight:600; }
.pwa-item .d{ color:var(--ink-soft); }

footer{ border-top:1px solid var(--rule-strong); padding-top:22px; color:var(--ink-soft); font-size:13px; }
footer h4{ font-family:var(--sans); font-size:13px; color:var(--ink); margin:0 0 8px; }
footer ul{ margin:0 0 16px; padding-left:18px; }

@media (max-width:640px){
  .phase{ grid-template-columns:1fr; }
  .phase-num{ grid-row:auto; }
  .pwa-item{ grid-template-columns:1fr; }
}
</style>

<header>
  <p class="eyebrow">Product audit &amp; roadmap</p>
  <h1>Pradhan Mantri Elections Game — Mobile Parity &amp; PWA Plan</h1>
  <p class="subtitle">What the desktop build has that the mobile port doesn't yet, and the shortest path to an installable phone build you can playtest today.</p>
  <div class="meta-row">
    <span>Desktop: <b>~15,000</b> lines, 30 modules</span>
    <span>Mobile: <b>~3,900</b> lines, 13 modules</span>
    <span>Reviewed <b>2026-07-20</b></span>
  </div>
  <div class="legend">
    <span class="label">Status key</span>
    <span class="pill done">● ported</span>
    <span class="pill partial">● partial</span>
    <span class="pill stub">● stub / dead</span>
    <span class="pill missing">● missing</span>
    <span class="pill skip">● intentionally skipped</span>
  </div>
</header>

<section id="tldr">
  <h2>TL;DR</h2>
  <p class="section-note">Five things worth knowing before the detail below.</p>
  <div class="tldr">
    <ul>
      <li><b>The core loop is solid.</b> Map, states, popularity math, campaign spending, policy progress, rally tokens, and regional-dominance bonuses are all ported and working on mobile.</li>
      <li><b>Player 2 isn't AI yet</b> — it's Shift+Click on the same phone. You've confirmed: port and improve the desktop AI (<code>ai-player-controller.js</code>, 956 lines). This is the single biggest chunk of work in this plan.</li>
      <li><b>There's no game, before or after the game.</b> No welcome screen (players are hardcoded to Modi/BJP vs Rahul/INC), and no game-over / results / hung-parliament screen. You can't currently start a fresh game or see who won.</li>
      <li><b>The options menu is decorative.</b> New Game, Sound, Music, Pause, Help, Random Events, Hard Mode all exist as buttons that just <code>console.log</code> and close.</li>
      <li><b>It isn't a PWA at all</b> — no manifest, no service worker, no home-screen icon. That's actually the fastest win here: a few hours of work gets you an installable app for playtesting, independent of everything else.</li>
    </ul>
  </div>
</section>

<section id="audit">
  <h2>Feature parity audit</h2>
  <p class="section-note">Every desktop module, mapped to its mobile equivalent (or lack of one).</p>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Feature</th><th>Desktop module</th><th>Mobile status</th><th>Notes</th></tr></thead>
    <tbody>
      <tr class="cat-row"><td colspan="4">Core simulation — working</td></tr>
      <tr><td class="feat">Map &amp; state interaction</td><td class="file">map-controller.js (537)</td><td><span class="pill done">ported</span></td><td class="desc">state-manager.js — thinner (161 lines) but functionally covers click/select/invest.</td></tr>
      <tr><td class="feat">Popularity engine</td><td class="file">popularity-initializer.js, policy-popularity-calculator.js</td><td><span class="pill done">ported</span></td><td class="desc">Consolidated into popularity-manager.js (424).</td></tr>
      <tr><td class="feat">Campaign funds &amp; spending</td><td class="file">campaign-spending.js (208)</td><td><span class="pill done">ported</span></td><td class="desc">investment-system.js (275).</td></tr>
      <tr><td class="feat">Policy / campaign promises</td><td class="file">policy-progress.js (734)</td><td><span class="pill done">ported</span></td><td class="desc">campaign-system.js (538) — includes completion bonuses.</td></tr>
      <tr><td class="feat">Rally tokens</td><td class="file">rally-controller.js, key-tracker.js</td><td><span class="pill done">ported &amp; improved</span></td><td class="desc">rally-system.js (491) replaces desktop's Alt+Click with a proper touch tray — good mobile-native redesign, not a gap.</td></tr>
      <tr><td class="feat">Regional dominance bonus</td><td class="file">group-rewards.js (76)</td><td><span class="pill done">ported</span></td><td class="desc">checkRegionalDominanceBonuses() in campaign-system.js.</td></tr>
      <tr><td class="feat">State groups (data + UI)</td><td class="file">state-groups.js, group-ui-controller.js</td><td><span class="pill done">ported</span></td><td class="desc">Bottom banner grid in index.html.</td></tr>
      <tr><td class="feat">Seat projection bar</td><td class="file">seat-projection.js (248)</td><td><span class="pill done">ported</span></td><td class="desc">Live in popularity-manager.js / ui-manager.js, not just decorative.</td></tr>
      <tr><td class="feat">Phase / timer system</td><td class="file">game-timer.js (379)</td><td><span class="pill done">ported</span></td><td class="desc">phase-system.js (499).</td></tr>
      <tr><td class="feat">Audio</td><td class="file">sound-manager.js (167)</td><td><span class="pill done">ported</span></td><td class="desc">Distributed inline (playAudio calls) rather than centralized — fine, not worth consolidating.</td></tr>

      <tr class="cat-row"><td colspan="4">Meta / session — missing</td></tr>
      <tr><td class="feat">Welcome / setup screen</td><td class="file">welcome-screen.js (468)</td><td><span class="pill missing">missing</span></td><td class="desc">No name, politician, or party selection. Player 1/2 hardcoded to Modi/BJP vs Rahul/INC in index.html.</td></tr>
      <tr><td class="feat">Game-over / results screen</td><td class="file">game-over-screen.js (419)</td><td><span class="pill missing">missing</span></td><td class="desc">No victory, defeat, or hung-parliament screen — the game has no defined ending.</td></tr>
      <tr><td class="feat">AI opponent (Player 2)</td><td class="file">ai-player-controller.js (956)</td><td><span class="pill missing">missing</span></td><td class="desc">Mobile "Player 2" = Shift+Click by the same person. Confirmed priority: port + improve.</td></tr>
      <tr><td class="feat">Options menu actions</td><td class="file">game-options.js (479)</td><td><span class="pill stub">stub</span></td><td class="desc">initOptionsModal() in app.js: every card click just <code>console.log</code>s and closes. Nothing wired up.</td></tr>
      <tr><td class="feat">Random events</td><td class="file">random-events.js (250)</td><td><span class="pill skip">superseded</span></td><td class="desc">Not being ported as-is — replaced by the agenda / special-power / token system in the Replayability section below. Desktop's version only ever affected Player 1 (a real bug) and was flavor-text-over-fixed-math; the new design fixes both problems structurally instead of porting the old system.</td></tr>
      <tr><td class="feat">Home-state bonus</td><td class="file">home-state-bonus.js (337)</td><td><span class="pill skip">superseded</span></td><td class="desc">Folded into the new politician roster (each entry already carries a home state) rather than ported as a standalone module — see Replayability section.</td></tr>
      <tr><td class="feat">Action log</td><td class="file">actions-log.js (51)</td><td><span class="pill missing">missing</span></td><td class="desc">No running feed of game actions on mobile. Small file, but screen space is the real cost — needs a mobile-native pattern (drawer), not a straight port.</td></tr>
      <tr><td class="feat">Help / tutorial</td><td class="file">(part of game-options.js)</td><td><span class="pill stub">stub</span></td><td class="desc">Help card exists, does nothing.</td></tr>

      <tr class="cat-row"><td colspan="4">Polish — partial</td></tr>
      <tr><td class="feat">Visual effects</td><td class="file">visual-effects.js (445)</td><td><span class="pill partial">partial</span></td><td class="desc">ripple-effects.js (248) covers investment feedback; desktop's broader effect set not fully ported.</td></tr>
      <tr><td class="feat">Config system</td><td class="file">game-config.js (372)</td><td><span class="pill partial">partial</span></td><td class="desc">config-manager.js (95) is much thinner — worth a pass to confirm nothing important got hardcoded instead of JSON-driven.</td></tr>

      <tr class="cat-row"><td colspan="4">Desktop-only — correctly skipped</td></tr>
      <tr><td class="feat">TV / broadcast display</td><td class="file">tv-display.js (241)</td><td><span class="pill skip">skip</span></td><td class="desc">Spectator screen for a two-device desktop setup — doesn't apply to a single phone.</td></tr>
      <tr><td class="feat">Drag-and-drop utils</td><td class="file">drag-drop-utils.js (208)</td><td><span class="pill skip">skip</span></td><td class="desc">Correctly reimplemented as tap-based interaction instead.</td></tr>
      <tr><td class="feat">Debug tools</td><td class="file">debug-groups.js, debug-index.js</td><td><span class="pill skip">skip</span></td><td class="desc">Dev-only, no player-facing value.</td></tr>
    </tbody>
  </table>
  </div>
</section>

<section id="gaps">
  <h2>The five gaps that matter</h2>
  <p class="section-note">Everything else in the table is either done or small. These are the ones that actually block "a real game you can play start to finish."</p>

  <div class="gap">
    <div class="gap-head"><h4>1 · No AI opponent</h4><span class="pill missing">missing</span></div>
    <p>Confirmed via <code>app.js:53</code> — <code>const playerId = event.shiftKey ? 'player2' : 'player1'</code>. There is no decision-making for Player 2 at all; it's a second human input path on the same screen. The target end state: Player 2 is filled by a matched human opponent on their own device when one's available, and the AI (ported and tuned from desktop's 956-line <code>ai-player-controller.js</code>) otherwise — see the multiplayer section below for how these two combine into one matchmaking flow.</p>
  </div>

  <div class="gap">
    <div class="gap-head"><h4>2 · No start or end to the game</h4><span class="pill missing">missing</span></div>
    <p>No welcome screen means no name/politician/party choice — every game is identical. No game-over screen means there's no moment where the app tells you who won. Between these two, the mobile build currently has no session boundary: it's a sandbox, not a game.</p>
  </div>

  <div class="gap">
    <div class="gap-head"><h4>3 · Options menu is non-functional</h4><span class="pill stub">stub</span></div>
    <p><code>app.js:420-429</code> — every option card (New Game, Toggle Sound, Toggle Music, Pause/Resume, Help, Random Events, Hard Mode) logs to console and closes the modal. Some of these are cheap wins once other pieces land: Sound/Music toggle just needs to flip a flag the existing <code>playAudio</code> calls already check; New Game just needs a state reset once a welcome screen exists to reset <em>to</em>.</p>
  </div>

  <div class="gap">
    <div class="gap-head"><h4>4 · Agenda / special-power / token system not built</h4><span class="pill missing">missing</span></div>
    <p>Supersedes the old "port random-events.js + home-state-bonus.js" plan entirely — see the Replayability section below for the full design (20-politician roster, signature agendas, single-use special powers, 3-flavor token economy). Bigger scope than the two desktop modules it replaces, but it's the actual fix for the game converging to the same 2-3 strategies every match, which flavor-text events never would have solved.</p>
  </div>

  <div class="gap">
    <div class="gap-head"><h4>5 · No PWA infrastructure</h4><span class="pill missing">missing</span></div>
    <p>No <code>manifest.json</code>, no service worker, no app icon set (only politician portraits and party logos exist in <code>assets/</code>). This is unrelated to every gap above and has no dependencies — it's the fastest way to get something installable on your phone today, independent of how much of the rest gets built.</p>
  </div>
</section>

<section id="pwa">
  <h2>PWA conversion — what's actually needed</h2>
  <p class="section-note">For a solo playtest install, not a Play Store submission: no build tooling, no Workbox, just the four files a browser's install prompt actually checks for.</p>
  <div class="pwa-list">
    <div class="pwa-item"><span class="f">manifest.json</span><span class="d">name, short_name, start_url, <code style="font-family:inherit">display: "standalone"</code>, theme/background color, icon list. Linked via <code style="font-family:inherit">&lt;link rel="manifest"&gt;</code> in index.html.</span></div>
    <div class="pwa-item"><span class="f">icons/</span><span class="d">Two new PNGs (192×192, 512×512) plus a maskable variant — none of the existing assets (politician portraits, party SVGs) are square/app-icon shaped, so these need to be made, not reused. <code style="font-family:inherit">apple-touch-icon</code> link too, since your default target is iPhone.</span></div>
    <div class="pwa-item"><span class="f">sw.js</span><span class="d">Minimal cache-first service worker: precache the HTML/CSS/JS/JSON/sounds shell on install, serve from cache with network fallback. Enough for installability and offline play — no need for a runtime caching strategy library at this scale.</span></div>
    <div class="pwa-item"><span class="f">app.js</span><span class="d">~5 lines: <code style="font-family:inherit">navigator.serviceWorker.register('sw.js')</code> on load.</span></div>
    <div class="pwa-item"><span class="f">index.html</span><span class="d"><code style="font-family:inherit">&lt;meta name="theme-color"&gt;</code>, <code style="font-family:inherit">viewport-fit=cover</code> for notch handling (relevant given the "camera-notch-banner" already in the layout), manifest + icon links.</span></div>
  </div>
</section>

<section id="roadmap">
  <h2>Phased action plan</h2>
  <p class="section-note">Ordered by dependency, not by size — each phase either unblocks the next or stands alone. Confirm each phase with me before I start it.</p>

  <div class="phase">
    <div class="phase-num">0</div>
    <div>
      <h4>PWA scaffolding</h4>
      <p class="goal">Installable on your phone, independent of everything else below.</p>
      <ul>
        <li>Write <code>manifest.json</code>, generate two icon sizes + maskable variant</li>
        <li>Minimal <code>sw.js</code> (cache-first shell)</li>
        <li>Wire up registration + manifest/meta links</li>
      </ul>
      <div class="dod">done when: "Add to Home Screen" appears on your phone and the game launches standalone (no browser chrome)</div>
    </div>
  </div>

  <div class="phase">
    <div class="phase-num">1</div>
    <div>
      <h4>Welcome / setup screen</h4>
      <p class="goal">Gives every later phase (AI persona, New Game reset, game-over) something to reset to.</p>
      <ul>
        <li>Politician + party picker (reuse existing portrait/logo assets)</li>
        <li>Replaces hardcoded Modi/BJP vs Rahul/INC in index.html</li>
        <li>Feeds chosen player config into game init</li>
      </ul>
      <div class="dod">done when: game no longer starts with hardcoded players</div>
    </div>
  </div>

  <div class="phase">
    <div class="phase-num">2</div>
    <div>
      <h4>Player 2 system: action-source abstraction + AI + matchmaking</h4>
      <p class="goal">The main event, now three parts building on one seam. Replace Shift+Click with a real Player 2 that's either a matched human or the AI.</p>
      <ul>
        <li><b>2a</b> — Refactor Player 2's actions behind one "action source" interface (local AI vs. relayed network input)</li>
        <li><b>2b</b> — Port + tune the AI decision engine from <code>ai-player-controller.js</code> as the first backend</li>
        <li><b>2c</b> — Realtime relay (Firebase Realtime DB or equivalent) + room/queue model as the second backend</li>
        <li><b>2d</b> — Matchmaking state machine: queue → pair on match, or fall back to AI after ~20–30s timeout</li>
        <li>Shared phase-timer clock once two real devices are in play</li>
      </ul>
      <div class="dod">done when: "Find Match" always starts a game — paired with another phone, or solo vs AI — never a dead end</div>
    </div>
  </div>

  <div class="phase">
    <div class="phase-num">3</div>
    <div>
      <h4>Game-over / results screen</h4>
      <p class="goal">Give the game an ending: winner, seat breakdown, hung parliament.</p>
      <ul>
        <li>Port <code>game-over-screen.js</code> logic, adapt layout to phone width</li>
        <li>Hook to phase-system's end-of-phase-8 check</li>
      </ul>
      <div class="dod">done when: finishing 8 phases shows a result, not a frozen board</div>
    </div>
  </div>

  <div class="phase">
    <div class="phase-num">4</div>
    <div>
      <h4>Wire up the options menu</h4>
      <p class="goal">Turn the existing stub into real controls — mostly cheap now that 0–3 exist.</p>
      <ul>
        <li>New Game → resets to welcome screen</li>
        <li>Sound / Music toggle → flag the existing playAudio calls already read</li>
        <li>Pause/Resume → gate the phase timer</li>
        <li>Help → static rules overlay</li>
      </ul>
      <div class="dod">done when: no option card still just console.logs</div>
    </div>
  </div>

  <div class="phase">
    <div class="phase-num">5</div>
    <div>
      <h4>Agenda / special-power / token system</h4>
      <p class="goal">Replaces the old "port random-events.js + home-state-bonus.js" plan — full design in the Replayability section below. Bigger than the two modules it replaces: a 20-entry politician roster (data), the agenda sheet UI (new addition to <code>pme-mobile-sheet.html</code>), special-power activation, and a 3-flavor rally-token economy replacing the current 2-flavor one.</p>
      <ul>
        <li>Write the 20-politician roster into <code>politicians-data.json</code> (home state + 4 signature agendas + 1 special power each)</li>
        <li>Redesign <code>rally-controller.js</code> / <code>rally-system.js</code>: 3 token flavors, no more random special-token roll, conversion mechanic (6 → Special Powerup, 12 → Nationwide Rally)</li>
        <li>Wire agenda commitment to trigger the region-tag popularity math (currently missing even on mobile's existing campaign grid — completion only pays a cash bonus today)</li>
        <li>Add the agenda sheet + special-power card to the Booth Ink interface (<code>pme-mobile-sheet.html</code>) — a third corner button next to the rally FAB</li>
      </ul>
      <div class="dod">done when: picking a different politician produces a genuinely different game, not just different flavor text</div>
    </div>
  </div>

  <div class="phase">
    <div class="phase-num">6</div>
    <div>
      <h4>Polish pass</h4>
      <p class="goal">Action log (as a drawer, not a sidebar — screen space is the constraint), remaining visual-effects parity, config audit.</p>
      <ul>
        <li>Action log as collapsible bottom-sheet, not a straight port</li>
        <li>Confirm config-manager.js isn't hardcoding values game-config.js drove on desktop</li>
      </ul>
      <div class="dod">done when: nothing left in the audit table above is red</div>
    </div>
  </div>
</section>

<section id="effort">
  <h2>Effort estimate</h2>
  <p class="section-note">In work sessions, not clock hours — the honest unit for AI-assisted build work. A "session" is one focused round of implementation plus your review/playtest. Calendar time depends entirely on your pace between sessions, not on how fast code gets written.</p>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Phase</th><th>Sessions</th><th>What gates it</th></tr></thead>
    <tbody>
      <tr><td class="feat">0 · PWA scaffolding</td><td class="file">1</td><td class="desc">Mechanical. Only real dependency is picking/making an icon.</td></tr>
      <tr><td class="feat">1 · Welcome screen</td><td class="file">1–2</td><td class="desc">A little UI iteration on phone viewport, otherwise mechanical.</td></tr>
      <tr><td class="feat">2 · Player 2 system (AI + multiplayer + matchmaking)</td><td class="file">8–11</td><td class="desc"><b>The long pole, now three sub-parts:</b> action-source refactor (1–2), AI decision engine + difficulty tuning (3–5, gated by your playtesting same as before), realtime relay + queue/matchmaking (3–4, new hosting dependency, this project's first backend). Combined rather than either/or, per your call.</td></tr>
      <tr><td class="feat">3 · Game-over screen</td><td class="file">1</td><td class="desc">Mechanical port + layout adapt.</td></tr>
      <tr><td class="feat">4 · Options menu wiring</td><td class="file">1</td><td class="desc">Mechanical, cheap once 0–3 exist.</td></tr>
      <tr><td class="feat">5 · Random events + home bonus</td><td class="file">1–2</td><td class="desc">Two independent self-contained systems.</td></tr>
      <tr><td class="feat">6 · Polish pass</td><td class="file">1–2</td><td class="desc">Open-ended by nature — diminishing returns, stop when it feels done.</td></tr>
    </tbody>
  </table>
  </div>
  <p class="section-note" style="margin-top:14px;"><b>Total: roughly 14–19 sessions</b> (up from 9–14 now that phase 2 covers AI + multiplayer + matchmaking instead of AI alone). At a casual side-project pace that's realistically <b>6–9 weeks</b> — set by your playtesting bandwidth on phase 2, not by code-writing speed. Phases 0–1 can still ship and be in your hands while phase 2 is in progress; they don't block each other.</p>
</section>

<section id="multiplayer">
  <h2>Simultaneous 2-device multiplayer, guest-only</h2>
  <p class="section-note">Verdict up front: the "guest login, no saved stats" part is the easy part — it's the simultaneous-2-device part that costs.</p>

  <div class="gap">
    <div class="gap-head"><h4>Guest login is nearly free</h4><span class="pill done">easy</span></div>
    <p>"No accounts, no saved stats" removes almost everything that makes auth hard — no signup flow, no password reset, no user database, no privacy/retention policy to think about. A room-code join ("share this 4-letter code with the other phone") with no login screen at all is the whole feature. If you want any auth at all, Firebase Anonymous Auth gives an ephemeral guest identity in one function call. Either way this is close to zero added difficulty.</p>
  </div>

  <div class="gap">
    <div class="gap-head"><h4>What actually makes this hard</h4><span class="pill partial">moderate–hard</span></div>
    <p><b>1. It needs a backend for the first time.</b> Every version of this game so far has been a static site — open the HTML file, everything runs client-side. Two phones seeing the same live state requires something that relays messages between them: a small WebSocket relay, or a realtime BaaS (Firebase Realtime DB / Supabase Realtime) so you're not standing up and hosting your own server. This is a new category of moving part, not a variation on existing code.</p>
    <p style="margin-top:10px;"><b>2. The input model has to be split.</b> Right now "Player 2" isn't a separate identity — it's Shift+Click on the same screen, i.e. both players share one UI. Two-device play means each phone can only act as its own player and must render the other player's moves read-only. That's a real rework of the interaction layer in state-manager.js / investment-system.js / rally-system.js, not just a new screen.</p>
    <p style="margin-top:10px;"><b>3. The phase timer needs a shared clock.</b> Each phone currently runs its own local countdown. Two devices need to agree when a phase ends — send a shared end-timestamp from whichever side is authoritative and have each client count down from that, rather than trusting local timers to stay in sync.</p>
  </div>

  <div class="gap">
    <div class="gap-head"><h4>The good news</h4><span class="pill done">favorable</span></div>
    <p>This game was already designed for simultaneous play — the phase-timer structure with both players free to act anytime during the countdown is exactly the shape multiplayer needs, it's currently just faked with a keyboard modifier on one screen. And because actions are discrete (invest funds, hold a rally) rather than twitch-fast, you don't need real netcode — no client-side prediction, no rollback. A simple pattern works fine: one phone (the host) runs the actual simulation using the code that already exists, the other phone just sends taps and receives state updates. You're not rewriting game logic, you're relaying it.</p>
  </div>

  <div class="gap">
    <div class="gap-head"><h4>Decision: combined, not either/or</h4><span class="pill done">resolved</span></div>
    <p>Confirmed direction: AI and human Player 2 are interchangeable <em>fillers for the same seat</em>, not competing features. Every match tries to find a human opponent first (a short matchmaking queue); if nobody's found within a timeout, the AI fills in instead. This is the right call for a casual game with an unpredictable player count — there's always a match, never a "no one's online" dead end.</p>
    <p style="margin-top:10px;">The clean way to build this: put one interface between the game and "what Player 2 does" — an <b>action source</b> that's either <i>local AI decision loop</i> or <i>relayed input from a second device</i>. The rest of the game (investment, rally, campaign handlers) already takes a <code>playerId</code> parameter and doesn't care where that player's actions originate, so this is a real but contained refactor, not a rewrite. Build that seam once, then AI and multiplayer are two backends plugged into the same socket instead of two parallel systems.</p>
    <p style="margin-top:10px;"><b>Matchmaking itself</b> is a small state machine on top of the relay from the section above: player taps "Find Match" → join a queue → if another queued player appears within ~20–30s, pair them into a human-vs-human room → if the timeout elapses first, spawn the local AI and start solo. The timeout length is a tuning knob, not a design decision — easy to adjust once it's live.</p>
  </div>
</section>

<section id="stack">
  <h2>Tech stack, deployment &amp; cost</h2>
  <p class="section-note">What actually runs where, and what it costs at playtesting/friends scale versus if you ever publish to an app store.</p>

  <h3>How the pieces talk to each other</h3>
  <div class="gap">
    <p>Both phones stay dumb clients — no game logic moves server-side. A managed realtime database (Firebase Realtime DB, or Supabase as the open-source equivalent) sits in the middle purely as a message board: phone A writes "I'm queued," phone B reads that and pairs up, then during the match each phone writes its actions to a shared room path and the other phone's listener picks them up and applies them locally using the same simulation code that already exists. No custom server process to write, run, or keep alive — the "backend" is API calls from the client SDK, gated by security rules instead of your own auth logic. Anonymous auth (Firebase/Supabase both have a one-line version) gives each session a throwaway guest ID for exactly as long as the room lives, then it's gone — which is exactly the "no saved stats" requirement, for free.</p>
  </div>

  <h3>Recommended stack</h3>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Layer</th><th>Choice</th><th>Why</th></tr></thead>
    <tbody>
      <tr><td class="feat">Frontend</td><td class="file">unchanged — vanilla HTML/CSS/JS + PWA shell</td><td class="desc">Already the right choice, see verdict below.</td></tr>
      <tr><td class="feat">Realtime relay + queue</td><td class="file">Firebase Realtime Database</td><td class="desc">Client SDK only, no server to host. Supabase Realtime is an equally good open-source alternative if you'd rather not be on Google's stack.</td></tr>
      <tr><td class="feat">Guest identity</td><td class="file">Firebase Anonymous Auth</td><td class="desc">One function call, ephemeral, nothing persisted after the room closes.</td></tr>
      <tr><td class="feat">Static hosting</td><td class="file">GitHub Pages (current) or Cloudflare Pages</td><td class="desc">No change needed to keep GitHub Pages; Cloudflare Pages is a free lateral move if you want better cache-control headers for the service worker later.</td></tr>
      <tr><td class="feat">iOS / Android app store build</td><td class="file">Capacitor, later</td><td class="desc">Wraps the existing web app in a native shell — no rewrite. Only needed if/when you want App Store / Play Store listing; the PWA from Phase 0 already covers home-screen install today.</td></tr>
    </tbody>
  </table>
  </div>
  <p class="section-note">Alternative worth knowing about: <b>Colyseus</b>, a Node framework purpose-built for game rooms and matchmaking. It would hand you the matchmaking state machine (2d) largely for free instead of you writing it — but it means running and hosting an actual Node process instead of a fully managed service, i.e. real ops. Not worth it at this scale; keep in your back pocket if the game ever needs true server-authoritative anti-cheat, which a friends-and-family election sim doesn't.</p>

  <h3>What it costs</h3>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Item</th><th>Cost</th><th>When it applies</th></tr></thead>
    <tbody>
      <tr><td class="feat">Static hosting</td><td class="file">$0</td><td class="desc">GitHub Pages or Cloudflare Pages free tier, no bandwidth concerns at this scale.</td></tr>
      <tr><td class="feat">Firebase / Supabase</td><td class="file">$0</td><td class="desc">Free tier covers thousands of casual matches a month — you'd need real viral growth before seeing a bill.</td></tr>
      <tr><td class="feat">Capacitor</td><td class="file">$0</td><td class="desc">Open source, no licensing cost.</td></tr>
      <tr><td class="feat">Custom domain</td><td class="file">~$12/yr</td><td class="desc">Optional, cosmetic only.</td></tr>
      <tr><td class="feat">Apple Developer Program</td><td class="file">$99/yr</td><td class="desc"><b>Only</b> if you publish to the App Store. Not needed for PWA install or personal use.</td></tr>
      <tr><td class="feat">Google Play Console</td><td class="file">$25 one-time</td><td class="desc"><b>Only</b> if you publish to the Play Store.</td></tr>
    </tbody>
  </table>
  </div>
  <p class="section-note"><b>Bottom line: $0 to build, deploy, and playtest with friends.</b> Cost only shows up if you decide to list on an app store — and even then it's a one-time/annual fee, not usage-based.</p>

  <h3>Is the current stack appropriate?</h3>
  <div class="gap">
    <div class="gap-head"><h4>Verdict: yes — don't rewrite it</h4><span class="pill done">appropriate</span></div>
    <p>Vanilla HTML/CSS/JS with no build step is the right call for this project and stays the right call for an iOS/Android app, because of Capacitor: it packages an existing web app into a real native binary almost unchanged, so the SVG map, the CSS animations, the star-shaped rally tokens all carry over directly. Rewriting in React Native or Flutter would mean redoing that entire DOM/CSS-heavy UI in a different rendering model for no real gain — this is a turn-based strategy sim, not a performance-bound game, so there's no native-performance reason to justify the cost.</p>
  </div>
  <div class="gap">
    <div class="gap-head"><h4>One thing worth fixing as it grows</h4><span class="pill partial">minor</span></div>
    <p>Right now 13+ JS files share one global scope via plain <code>&lt;script src="..."&gt;</code> tags — fine at current size, but multiplayer/matchmaking adds several more files on top of an already-flat structure. The lazy fix: switch to native ES modules (<code>&lt;script type="module"&gt;</code>, real <code>import</code>/<code>export</code>) — a language feature every relevant browser and Capacitor's webview already supports, zero new dependencies, no bundler required. Worth doing incrementally as multiplayer touches these files anyway, not as a standalone refactor pass.</p>
  </div>
</section>

<section id="replay">
  <h2>Replayability</h2>
  <p class="section-note">Root cause, then the fix that's actually been designed for it (superseding the original 4-phase sketch below it in prior revisions of this doc).</p>

  <div class="gap">
    <div class="gap-head"><h4>Why it converges to 2–3 strategies</h4><span class="pill missing">diagnosis</span></div>
    <p>The regional dominance bonus (&gt;50% popularity across a whole state group → a lump sum plus a recurring per-phase payout) is the strongest lever in the game, and it's <b>static</b> — same groups, same payout, every match. Random starting popularity changes <em>where</em> you happen to be leading, but not <em>which lever is worth pulling</em>. Once a player learns "rush South India for the group bonus," that's correct in every game, forever.</p>
    <p style="margin-top:10px;">The desktop build already tried the obvious fix — random events, random starting popularity, a home-state bonus, randomized rally-token odds — and none of it helped. All four turned out to be <b>magnitude randomization dressed as variety</b>: different numbers on the same fixed template every time (random events were 20 flavor-text strings wrapped around one identical ±5-20% stat roll, and — worse — coded to only ever affect Player 1). Rolling a different number doesn't change what's optimal to do; it only changes how big the optimal move pays off. The fix has to change the <em>shape</em> of the decision, not its inputs.</p>
  </div>

  <h3>The fix: politician-driven agendas, not generic randomization</h3>
  <div class="gap">
    <p>Each politician (20 in the roster below) carries <b>5 personal slots</b>: 4 signature agendas drawn from a shared, region-tagged policy pool (already sitting unused in <code>data/policy-tags.json</code> and <code>data/states_data.json</code>'s regional boolean tags), plus 1 unique special power no other politician has. Picking a different politician changes which policies are even available to you and what your one-time wildcard move does — a structural difference, not a bigger or smaller number on the same list. Two players who pick Modi and Manmohan Singh are playing genuinely different games, not the same game with different multipliers.</p>
    <p style="margin-top:10px;">Agendas are <b>not</b> contested between players (an earlier draft of this design had both players racing to "win" the same policy — dropped as unneeded complexity). Each player invests in their own 4 independently; the region support/oppose tags create indirect friction on the map without needing a shared-resource race to track.</p>
  </div>

  <h3>The 20-politician roster</h3>
  <p class="section-note">16 historical/current politicians (former PMs, CMs, and party leaders) + 4 celebrities with real political ties. Signature agendas are the top entries from each politician's existing <code>policies</code> array in <code>politicians-data.json</code> (already present, just needs trimming from 6 to 4 and a special-power field added).</p>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Politician</th><th>Signature 4 agendas</th><th>Special power</th><th>Cost</th></tr></thead>
    <tbody>
      <tr class="cat-row"><td colspan="4">Politicians (16)</td></tr>
      <tr><td class="feat">Narendra Modi</td><td class="desc">Infrastructure, Hindutva, Economic Liberalization, National Defense</td><td class="desc"><b>Demonetization</b> — opponent instantly loses a lump sum of funds</td><td class="desc">−5% popularity nationwide</td></tr>
      <tr><td class="feat">Manmohan Singh</td><td class="desc">Economic Liberalization, Public Sector, Secularism, Education</td><td class="desc"><b>Economic Reform</b> — large one-time funds boost</td><td class="desc">−8% popularity in Agricultural/Public-Sector states</td></tr>
      <tr><td class="feat">Rahul Gandhi</td><td class="desc">Rural Development, Land Reforms, Secularism, Caste Reservation</td><td class="desc"><b>Bharat Jodo Yatra</b> — popularity boost in Secularism/Minority states</td><td class="desc">Instant lump-sum funds payment</td></tr>
      <tr><td class="feat">Atal Bihari Vajpayee</td><td class="desc">Infrastructure, National Defense, Hindi Language, Economic Liberalization</td><td class="desc"><b>Pokhran Test</b> — +10% popularity nationwide</td><td class="desc">Instant heavy funds penalty</td></tr>
      <tr><td class="feat">Arvind Kejriwal</td><td class="desc">Anti-Corruption, Education, Healthcare, Water &amp; Mineral Rights</td><td class="desc"><b>Anti-Corruption Raid</b> — voids one opponent agenda commitment, refunds their spend</td><td class="desc">Instantly forfeit any rally tokens currently held</td></tr>
      <tr><td class="feat">Mamata Banerjee</td><td class="desc">Women's Empowerment, State's Rights, Secularism, Agricultural Reforms</td><td class="desc"><b>State Autonomy Stand</b> — home state + State's-Rights states immune to opponent's agendas/rallies for rest of game</td><td class="desc">Funds hit now</td></tr>
      <tr><td class="feat">Nitish Kumar</td><td class="desc">Caste Reservation, Rural Development, Women's Empowerment, State's Rights</td><td class="desc"><b>Alliance Switch</b> — copies the effect of the opponent's last-used agenda</td><td class="desc">−5% popularity nationwide</td></tr>
      <tr><td class="feat">Yogi Adityanath</td><td class="desc">Law and Order, Hindutva, Uniform Civil Code, Infrastructure</td><td class="desc"><b>Bulldozer Action</b> — sharply cuts opponent's popularity in one target state</td><td class="desc">−popularity nationwide in Minority states</td></tr>
      <tr><td class="feat">Indira Gandhi</td><td class="desc">National Defense, Public Sector, Land Reforms, Rural Development</td><td class="desc"><b>National Emergency</b> — instantly seizes a large popularity swing from the opponent across all states</td><td class="desc">Instant −10% popularity nationwide + instant heavy funds loss</td></tr>
      <tr><td class="feat">Jawaharlal Nehru</td><td class="desc">Education, Secularism, Public Sector, Infrastructure</td><td class="desc"><b>Non-Alignment</b> — blocks the next special power the opponent tries to use (standing shield, no time limit)</td><td class="desc">Instant funds penalty on activation</td></tr>
      <tr><td class="feat">Sardar Patel</td><td class="desc">Law and Order, National Defense, Infrastructure, Anti-Corruption</td><td class="desc"><b>Iron Unification</b> — instantly flips one small state/UT fully to your majority</td><td class="desc">Heavy instant funds hit</td></tr>
      <tr><td class="feat">B.R. Ambedkar</td><td class="desc">Caste Reservation, Education, Judicial Activism, Indigenous Rights</td><td class="desc"><b>Constitutional Reform</b> — permanent, non-decaying +popularity floor in Caste-Reservation/Indigenous-Rights states</td><td class="desc">High instant funds hit</td></tr>
      <tr><td class="feat">Jayalalithaa</td><td class="desc">State's Rights, Women's Empowerment, Public Sector, Healthcare</td><td class="desc"><b>Amma Welfare Scheme</b> — large popularity boost in home state + Public-Sector states</td><td class="desc">Heavy instant funds hit</td></tr>
      <tr><td class="feat">Lal Bahadur Shastri</td><td class="desc">National Defense, Agricultural Reforms, Anti-Corruption, Public Sector</td><td class="desc"><b>Jai Jawan Jai Kisan</b> — boost in Border-Lands AND Agricultural-Region states at once</td><td class="desc">Instant funds penalty</td></tr>
      <tr><td class="feat">P.V. Narasimha Rao</td><td class="desc">Economic Liberalization, Judicial Activism, State's Rights, Digital Transformation</td><td class="desc"><b>Minority Government Survival</b> — re-activate one of your own agenda cards a second time</td><td class="desc">Instant heavy funds penalty</td></tr>
      <tr><td class="feat">Rajiv Gandhi</td><td class="desc">Digital Transformation, Infrastructure, Education, State's Rights</td><td class="desc"><b>Telecom Revolution</b> — permanently discounts Digital-Transformation agenda costs for rest of game</td><td class="desc">Heavy upfront funds hit</td></tr>
      <tr class="cat-row"><td colspan="4">Celebrities (4)</td></tr>
      <tr><td class="feat">Amitabh Bachchan</td><td class="desc">Press Freedom, Digital Transformation, Education, Healthcare</td><td class="desc"><b>Celebrity Endorsement</b> — converts undecided ("Others") popularity to you nationwide, not taken from the opponent</td><td class="desc">Funds hit this phase</td></tr>
      <tr><td class="feat">Sachin Tendulkar</td><td class="desc">Education, Healthcare, Infrastructure, Digital Transformation</td><td class="desc"><b>National Icon</b> — flat popularity boost split across all states</td><td class="desc">Usable only in the game's final phase</td></tr>
      <tr><td class="feat">Hema Malini</td><td class="desc">Women's Empowerment, Healthcare, Infrastructure, Education</td><td class="desc"><b>Star Power Rally</b> — popularity boost in home state + one adjacent state</td><td class="desc">Only usable while below national-average popularity</td></tr>
      <tr><td class="feat">Rajinikanth</td><td class="desc">Anti-Corruption, Press Freedom, Digital Transformation, Education</td><td class="desc"><b>Thalaivar Announcement</b> — massive one-time nationwide popularity surge</td><td class="desc">Permanently locks your other 4 agendas for the rest of the game</td></tr>
    </tbody>
  </table>
  </div>
  <p class="section-note" style="margin-top:10px;">Smriti Irani was considered and cut (not high-profile enough to carry a slot). Rajinikanth's cost is flagged as still needing a balance pass — its severity depends on how much game remains when it's used, which the unlock design below is meant to guarantee, but it's worth a specific playtest check.</p>

  <h3>Special-power design rules</h3>
  <div class="gap">
    <p><b>Every effect resolves instantly — nothing is phrased as "for N future phases."</b> An earlier draft had costs/benefits like "opponent can't spend funds for 1 phase" or "reduced funds income for 2 phases." That breaks the moment a power unlocks late in the game with no future phases left for the duration to apply to — which, under any gate tied to in-game achievement, it eventually will. Converting every timed effect to an instant lump-sum equivalent (e.g. "opponent instantly loses a lump sum of funds" instead of "opponent frozen for 1 phase") removes the dependency on borrowed future game-time entirely. The table above already reflects this.</p>
    <p style="margin-top:10px;">Every power uses a <b>different verb</b> — freeze/attack, unlock, march, pride/sanctions, disrupt, protect, mimic, total-lockout, power-block, instant-annex, permanent-buff, draw-from-neutral, timing-restricted, targeted-steal, self-destructing burst. None are the same power reskinned with a different number, which is the same principle the agenda system above is built on.</p>
  </div>

  <h3>Unlock mechanism: a redesigned 3-flavor rally-token economy</h3>
  <div class="gap">
    <p>Earlier candidates for "when does the special power unlock" — maxing all 4 agendas, crossing a popularity threshold, crossing a seat-lead threshold — were all rejected. Agenda-completion gating forces the unlock toward the very end of the game (see the instant-effect rule above — this is exactly the bug that rule exists to guard against). Popularity/seat thresholds solve the timing problem but tie the reward to already being ahead, which risks snowballing a leading player's advantage further (a real trade-off between "reward good play" and "keep the game close" with no clean answer).</p>
    <p style="margin-top:10px;">The resolved design instead makes rally tokens a real second currency, spent on the unlock directly — sidestepping the reward-vs-comeback dilemma entirely, since token income doesn't depend on who's winning:</p>
  </div>
  <div class="pwa-list">
    <div class="pwa-item"><span class="f">State Rally</span><span class="d">2 per phase, automatic, no longer use-it-or-lose-it — accumulates across the whole game (16 max from base income over 8 phases). Fully committing an agenda grants +2 bonus tokens (up to +8 across all 4 agendas). 24 max total in a game.</span></div>
    <div class="pwa-item"><span class="f">Special Powerup</span><span class="d">Convert 6 State Rally tokens to craft one. Activates your politician's unique special power. Usable once per game — the cap is on <em>use</em>, not on resources, so banking enough for a second one buys nothing.</span></div>
    <div class="pwa-item"><span class="f">Nationwide Rally</span><span class="d">Convert 12 State Rally tokens to craft one. Replaces the old ⭐ "special rally token" entirely — no more random 5% spawn chance. This is now purely earned, and should hit meaningfully harder than the old random version did, since it costs 12 tokens of foregone regular rallies to get. Usable once per game, same hard cap as above.</span></div>
  </div>
  <p class="section-note" style="margin-top:14px;">Pacing check: pure passive hoarding with zero agenda bonuses still reaches 6 tokens by phase 3 and 12 by phase 6 of an 8-phase game — real runway left even in the worst case. A player who completes agendas early reaches both thresholds faster. This also fully removes randomness from token acquisition — the original complaint that started this whole redesign was that the desktop token-odds system was "dynamic" in name only (a hardcoded, unchanging 10%/5% roll); this design doesn't fix that, it deletes the randomness outright.</p>
  <p class="section-note">Implementation note: this replaces the independent-roll logic in <code>rally-controller.js</code> (currently <code>Math.random() &lt; specialProbability</code> per token) — every awarded token becomes a flat State Rally token, and a conversion/crafting action needs to be added to the rally tray UI.</p>

  <h3>State-groups rebalance: from static bonus target to tiered choice</h3>
  <div class="gap">
    <div class="gap-head"><h4>Same root cause as the token redesign above</h4><span class="pill missing">diagnosis</span></div>
    <p>The regional-dominance bonus (&gt;50% popularity across a whole state group) is only as good as the groups it's scored against, and the original list — ported straight from desktop's <code>data/states_data.json</code> — had the exact "one obviously-correct target" problem called out at the top of this section: seat totals ranged from 25 (Northeast India) to 355 (Agricultural Region) with zero structure, so "rush the biggest group" was correct in every game, forever. Two more problems stacked on top: a "Union Territory" group tile duplicated the dedicated UT button cluster that exists specifically because UTs are too small to tap on the map (see <code>union-territories-container</code> in <code>index.html</code>), and Travel &amp; Tourism spanned 16 states from Ladakh to Tamil Nadu — too disparate a sweep to be worth the same payout as a tighter group.</p>
    <p style="margin-top:10px;">Fix: re-tier every group into Large / Mid / Small bands by actual seat count (5 groups per tier), retire the UT tile plus the two weakest groups (Northeast India, Border Lands), and add one new group (National Parks &amp; Wildlife) so Small tier gets a genuine fifth option built from states that had almost no presence anywhere else in the system. Full reasoning trail, including the eight alternative themes considered and rejected along the way, is in the design conversation this plan was built from — the outcome below is what matters going forward.</p>
  </div>

  <h4>Final design: 15 groups, 5 per tier</h4>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Tier</th><th>Group</th><th>Seats</th><th>States</th><th>Change from original data</th></tr></thead>
    <tbody>
      <tr><td class="feat">Large</td><td class="desc">Coastal India</td><td class="desc">256</td><td class="desc">13</td><td class="desc">none</td></tr>
      <tr><td class="feat">Large</td><td class="desc">Pilgrimage</td><td class="desc">254</td><td class="desc">9</td><td class="desc">−West Bengal, −Assam, −Rajasthan</td></tr>
      <tr><td class="feat">Large</td><td class="desc">Agricultural Region</td><td class="desc">273</td><td class="desc">8</td><td class="desc">−West Bengal, −Assam, −Gujarat</td></tr>
      <tr><td class="feat">Large</td><td class="desc">Industrial Corridor</td><td class="desc">239</td><td class="desc">8</td><td class="desc">+Jharkhand</td></tr>
      <tr><td class="feat">Large</td><td class="desc">Hindi Heartland</td><td class="desc">226</td><td class="desc">11</td><td class="desc">none</td></tr>
      <tr><td class="feat">Mid</td><td class="desc">Natural Resources</td><td class="desc">219</td><td class="desc">10</td><td class="desc">none</td></tr>
      <tr><td class="feat">Mid</td><td class="desc">Manufacturing</td><td class="desc">210</td><td class="desc">7</td><td class="desc">none</td></tr>
      <tr><td class="feat">Mid</td><td class="desc">Education</td><td class="desc">202</td><td class="desc">8</td><td class="desc">none</td></tr>
      <tr><td class="feat">Mid</td><td class="desc">Travel &amp; Tourism</td><td class="desc">194</td><td class="desc">15</td><td class="desc">−Karnataka</td></tr>
      <tr><td class="feat">Mid</td><td class="desc">Eastern Border</td><td class="desc">192</td><td class="desc">12</td><td class="desc">new — replaces Northeast India + half of Border Lands</td></tr>
      <tr><td class="feat">Small</td><td class="desc">South India</td><td class="desc">130</td><td class="desc">6</td><td class="desc">none</td></tr>
      <tr><td class="feat">Small</td><td class="desc">National Parks &amp; Wildlife</td><td class="desc">122</td><td class="desc">6</td><td class="desc">new</td></tr>
      <tr><td class="feat">Small</td><td class="desc">Minority Areas</td><td class="desc">107</td><td class="desc">14</td><td class="desc">none</td></tr>
      <tr><td class="feat">Small</td><td class="desc">Tribal Lands</td><td class="desc">86</td><td class="desc">11</td><td class="desc">none</td></tr>
      <tr><td class="feat">Small</td><td class="desc">Western Border</td><td class="desc">74</td><td class="desc">6</td><td class="desc">new — other half of Border Lands</td></tr>
    </tbody>
  </table>
  </div>
  <p class="section-note" style="margin-top:10px;"><b>Retired entirely:</b> the Union Territory group tile (the underlying <code>UnionTerritory</code> data field stays — only the selectable group filter goes), Northeast India (folded into Eastern Border), Border Lands (split into Eastern/Western Border).</p>

  <h4>Full member lists (changed and new groups only)</h4>
  <div class="pwa-list">
    <div class="pwa-item"><span class="f">Agricultural Region (273)</span><span class="d">Andhra Pradesh, Bihar, Haryana, Karnataka, Madhya Pradesh, Punjab, Uttar Pradesh, Maharashtra</span></div>
    <div class="pwa-item"><span class="f">Pilgrimage (254)</span><span class="d">Andhra Pradesh, Bihar, Gujarat, Jammu &amp; Kashmir, Odisha, Punjab, Tamil Nadu, Uttar Pradesh, Uttarakhand</span></div>
    <div class="pwa-item"><span class="f">Industrial Corridor (239)</span><span class="d">Delhi, Gujarat, Haryana, Madhya Pradesh, Maharashtra, Rajasthan, Uttar Pradesh, Jharkhand</span></div>
    <div class="pwa-item"><span class="f">Travel &amp; Tourism (194)</span><span class="d">Andaman &amp; Nicobar, Dadra &amp; Nagar Haveli and Daman &amp; Diu, Delhi, Goa, Himachal Pradesh, Jammu &amp; Kashmir, Kerala, Ladakh, Lakshadweep, Puducherry, Rajasthan, Sikkim, Tamil Nadu, Uttar Pradesh, Uttarakhand</span></div>
    <div class="pwa-item"><span class="f">Eastern Border (192)</span><span class="d">Uttarakhand, Uttar Pradesh, Bihar, West Bengal, Sikkim, Arunachal Pradesh, Assam, Meghalaya, Tripura, Mizoram, Manipur, Nagaland — the Nepal/Bhutan/Bangladesh/Myanmar/eastern-China frontier</span></div>
    <div class="pwa-item"><span class="f">National Parks &amp; Wildlife (122)</span><span class="d">Madhya Pradesh (Kanha, Bandhavgarh — most tiger reserves of any state), Assam (Kaziranga), Rajasthan (Ranthambore), Uttarakhand (Jim Corbett — India's first national park), Odisha (Similipal, Bhitarkanika), Karnataka (Nagarhole, Bandipur)</span></div>
    <div class="pwa-item"><span class="f">Western Border (74)</span><span class="d">Gujarat, Rajasthan, Punjab, Jammu &amp; Kashmir, Ladakh, Himachal Pradesh — the Pakistan/western-China frontier</span></div>
  </div>
  <p class="section-note">Coastal India, Hindi Heartland, Natural Resources, Manufacturing, Education, South India, Minority Areas, and Tribal Lands are unchanged from the original data.</p>

  <h4>Groups considered and rejected — don't re-litigate these</h4>
  <div class="gap">
    <p><b>Mega States</b> (UP/Maharashtra/WB/Bihar/Tamil Nadu by population) — rejected as thematically arbitrary ("gamey"), not a real Indian region/identity.</p>
    <p style="margin-top:8px;"><b>Defense Tech / Science &amp; Research</b> (Karnataka/AP/Kerala/Odisha/Maharashtra/Delhi/Tamil Nadu/Telangana, 205 seats) — real and well-sourced (every state has a specific DRDO/ISRO/BARC anchor), but landed at Mid-tier size, not Small, which was the actual gap being filled. Dropped for solving the wrong problem, not for being wrong.</p>
    <p style="margin-top:8px;"><b>Frontier Interior</b> (Punjab/Chhattisgarh/Himachal Pradesh/Assam, 42 seats) — genuinely the most under-used states in the whole system, but the seat total is too far below the Small-tier band (74-130) to justify a standalone group.</p>
    <p style="margin-top:8px;"><b>Freedom Struggle Landmarks</b> (Bihar/Punjab/Odisha/Jharkhand/Assam, 102), <b>Classical Dance Heritage</b> (Odisha/AP/Assam/Manipur/Rajasthan, 87), <b>Royal &amp; Ancient Heritage</b> (Rajasthan/MP/Odisha/Bihar, 115), <b>Red Corridor</b> (Chhattisgarh/Jharkhand/Odisha/Bihar/Telangana, 103) — all solid, real, correctly-sized candidates that lost out to National Parks &amp; Wildlife on theme fit alone. Any of the four is a reasonable substitute if National Parks ever gets cut for an unrelated reason.</p>
  </div>

  <h4>Implementation diffs</h4>
  <div class="gap">
    <p><b><code>data/states_data.json</code></b> — per-state field flips: West Bengal and Assam both lose <code>AgriculturalRegion</code> and <code>Pilgrimage</code>; Gujarat loses <code>AgriculturalRegion</code>; Rajasthan loses <code>Pilgrimage</code>; Jharkhand gains <code>IndustrialCorridor</code>; Karnataka loses <code>TravelAndTourism</code>. Add a new <code>NationalParksWildlife</code> column (true for Madhya Pradesh, Assam, Rajasthan, Uttarakhand, Odisha, Karnataka only). Add new <code>EasternBorder</code>/<code>WesternBorder</code> columns per the member lists above, and delete the old <code>BorderLands</code> and <code>NortheastIndia</code> columns entirely. Do not touch the <code>UnionTerritory</code> field — it's still read by the UT-button logic (<code>SMALL_UTS</code> in Booth Ink, <code>union-territories-container</code> in <code>index.html</code>); only the group filter tile goes.</p>
    <p style="margin-top:10px;"><b><code>data/policy-tags.json</code></b> — every policy referencing the retired tags needs remapping or its bonus math silently points at a tag no state has anymore: Rural Development, Hindi Language, Hindutva, Indigenous Rights, Uniform Civil Code, and State's Rights all swap <code>NortheastIndia</code> → <code>EasternBorder</code>. Law and Order and National Defense both swap <code>BorderLands</code> → <code>EasternBorder, WesternBorder</code> (mapped to <em>both</em> new tags since neither policy has an obvious reason to favor one frontier — flag this specific call for confirmation before implementing, narrow to one tag if it turns out to be wrong for either policy).</p>
    <p style="margin-top:10px;"><b>Booth Ink (<code>pme-mobile-sheet.html</code>) and <code>index.html</code></b> — both groups lists need the same three additions (Eastern Border, Western Border, National Parks &amp; Wildlife — suggested icons 🌄 / 🏔️ / 🐅) and three removals (Union Territory, Northeast India, Border Lands). Since neither file has any concept of tiers today, whether the groups bar should visually surface Large/Mid/Small (three rows? a tier label?) is a separate UI pass, not decided by this rebalance.</p>
    <p style="margin-top:10px;"><b>Recommendation, out of scope for this pass:</b> the group list (name, icon, label, member states) is currently hand-duplicated across three places — the per-state booleans in <code>states_data.json</code>, Booth Ink's <code>GROUPS</code> const, and <code>index.html</code>'s groups-grid divs. This rebalance touches all three by hand. Before doing a second rework like this one, introduce a single canonical <code>data/state-groups.json</code> (group key → tier, seats, icon, label) that both frontends read, so a future rebalance is a one-file diff instead of a three-file one.</p>
  </div>

  <h3>AI personalities</h3>
  <div class="phase">
    <div class="phase-num">·</div>
    <div>
      <h4>Still on the list, unrelated to the above</h4>
      <p class="goal">Folds into Phase 2 of the main build (the AI decision engine) — same engine, 3–4 parameter profiles instead of one.</p>
      <ul>
        <li>Aggressive investor / policy rusher / rally spammer / group-bonus rusher, picked randomly per match</li>
        <li>Removes the "I found the one counter-strategy" ceiling — you're reading and reacting, not executing a memorized script</li>
      </ul>
      <div class="dod">done when: two matches against the AI back to back feel like different opponents</div>
    </div>
  </div>

  <h3>Supporting changes — smaller leverage, worth doing once the above lands</h3>
  <div class="pwa-list">
    <div class="pwa-item"><span class="f">Diminishing returns</span><span class="d">Escalating cost for repeated investment in the same state within a phase — pushes diversification over "one big push, done." (Already partly true of mobile's investment system via its glide-path boost curve.)</span></div>
    <div class="pwa-item"><span class="f">Secondary goals</span><span class="d">Non-win-condition achievements ("swept a region," "comeback from behind at phase 6") for players who've already solved the primary win condition.</span></div>
  </div>
  <p class="section-note" style="margin-top:14px;">The old "draft phase" idea (ban/pick policies at game start) is effectively superseded — picking a politician now <em>is</em> that draft, since it fixes which 4 agendas and which power you have for the whole game.</p>
</section>

<footer>
  <h4>Assumptions worth flagging</h4>
  <ul>
    <li>Phase 2 (AI) is the long pole — treat phases 0-1 as things we can ship and playtest while phase 2 is in progress, they don't block each other.</li>
    <li>App icons need to be created new; nothing in <code>assets/</code> is square/icon-shaped. Fastest path is a simple mark (tricolor + Ashoka chakra motif, or a cropped party symbol) rather than a full illustration.</li>
    <li>GitHub Pages auth wall on the desktop live link is separate from this plan — likely a private-repo Pages visibility setting, worth checking if you want to share the mobile build the same way once it's live.</li>
  </ul>
</footer>
