<title>PME Economy — Status Map</title>
<meta name="description" content="What's decided vs. still open in the PradhanMantri Elections Game Mobile economy redesign.">

<style>
:root{
  --paper:#F7F5F0; --paper-raised:#FFFFFF; --ink:#1C1B19; --ink-soft:#55524A;
  --rule:#E4E0D6; --rule-strong:#D2CCBC;
  --navy:#14315B; --navy-soft:#3C5478;
  --decided-bg:#E4EFE6; --decided-fg:#2F6E4E; --decided-line:#7FB894;
  --open-bg:#F6EAD4; --open-fg:#9C6B18; --open-line:#D9A94E;
  --gap-bg:#EAE3F2; --gap-fg:#6A4E93; --gap-line:#A98BCB;
  --assumed-bg:#EAE8E2; --assumed-fg:#7A7568; --assumed-line:#ABA79A;
  --serif: Georgia, "Iowan Old Style", "Times New Roman", serif;
  --sans: -apple-system, "Segoe UI", "Inter", sans-serif;
  --mono: ui-monospace, "SF Mono", "Cascadia Code", "Consolas", monospace;
}
:root[data-theme="dark"]{
  --paper:#15171C; --paper-raised:#1C1F26; --ink:#EDEAE1; --ink-soft:#A9A493;
  --rule:#2B2E36; --rule-strong:#383C46;
  --navy:#8FAEDD; --navy-soft:#6F8DBB;
  --decided-bg:#1E2E24; --decided-fg:#7FCB9B; --decided-line:#3E5A48;
  --open-bg:#332A18; --open-fg:#E4B45C; --open-line:#5A4A28;
  --gap-bg:#2A2438; --gap-fg:#C0A6E8; --gap-line:#493C5E;
  --assumed-bg:#24262C; --assumed-fg:#9B968A; --assumed-line:#3A3D44;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --paper:#15171C; --paper-raised:#1C1F26; --ink:#EDEAE1; --ink-soft:#A9A493;
    --rule:#2B2E36; --rule-strong:#383C46;
    --navy:#8FAEDD; --navy-soft:#6F8DBB;
    --decided-bg:#1E2E24; --decided-fg:#7FCB9B; --decided-line:#3E5A48;
    --open-bg:#332A18; --open-fg:#E4B45C; --open-line:#5A4A28;
    --gap-bg:#2A2438; --gap-fg:#C0A6E8; --gap-line:#493C5E;
    --assumed-bg:#24262C; --assumed-fg:#9B968A; --assumed-line:#3A3D44;
  }
}

*{box-sizing:border-box;}
body{
  background:var(--paper); color:var(--ink); font-family:var(--sans);
  line-height:1.55; font-size:16px; max-width:960px; margin:0 auto;
  padding:52px 24px 100px;
}
::selection{ background:var(--navy); color:var(--paper); }

.eyebrow{
  font-family:var(--mono); font-size:11.5px; letter-spacing:.14em; text-transform:uppercase;
  color:var(--navy-soft); margin:0 0 8px;
}
h1{
  font-family:var(--serif); font-size:clamp(28px,4.2vw,36px); font-weight:600;
  line-height:1.15; margin:0 0 10px; text-wrap:balance; letter-spacing:-.01em;
}
.subtitle{ color:var(--ink-soft); font-size:16.5px; max-width:60ch; margin:0 0 28px; }
header{ border-bottom:1px solid var(--rule-strong); padding-bottom:26px; margin-bottom:34px; }

h2{
  font-family:var(--serif); font-size:21px; font-weight:600; margin:0 0 6px; letter-spacing:-.005em;
}
h3{ font-family:var(--sans); font-size:14.5px; font-weight:700; margin:0 0 10px; color:var(--ink); }
.section-note{ color:var(--ink-soft); font-size:14px; margin:0 0 18px; max-width:66ch; }
section{ margin-bottom:46px; }

/* legend */
.legend{
  display:flex; gap:8px; flex-wrap:wrap; padding:14px 16px; background:var(--paper-raised);
  border:1px solid var(--rule); border-radius:10px; margin-bottom:6px;
}
.legend .label{ font-family:var(--mono); font-size:11px; color:var(--ink-soft); align-self:center; margin-right:2px; }
.pill{
  display:inline-flex; align-items:center; gap:5px; font-family:var(--mono); font-size:11px;
  padding:3px 9px; border-radius:100px; font-weight:600; letter-spacing:.02em; white-space:nowrap;
  border:1px solid transparent;
}
.pill.decided{ background:var(--decided-bg); color:var(--decided-fg); }
.pill.open{ background:var(--open-bg); color:var(--open-fg); }
.pill.gap{ background:var(--gap-bg); color:var(--gap-fg); }
.pill.assumed{ background:var(--assumed-bg); color:var(--assumed-fg); border-style:dashed; border-color:var(--assumed-line); }

/* per-category vertical flow cards */
.flow-grid{
  display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:16px;
}
.flow-card{
  background:var(--paper-raised); border:1px solid var(--rule); border-radius:12px;
  padding:16px 15px 14px; display:flex; flex-direction:column;
}
.flow-card h3{
  text-align:center; margin:0 0 12px; font-size:13.5px; font-weight:700;
}
.step{
  border:1.5px solid var(--rule-strong); background:var(--paper); color:var(--ink);
  border-radius:8px; padding:10px 12px; font-size:13px; line-height:1.42; text-align:center;
}
.step.decided{ border-color:var(--decided-line); background:var(--decided-bg); }
.step.open{ border-color:var(--open-line); background:var(--open-bg); }
.step.gap{ border-color:var(--gap-line); background:var(--gap-bg); }
.step.assumed{ border-color:var(--assumed-line); background:var(--assumed-bg); border-style:dashed; }
.arrow{ text-align:center; color:var(--ink-soft); font-size:15px; line-height:1; margin:3px 0; }

/* convergence: where every category's boost lands */
.converge{ max-width:600px; margin:32px auto 0; display:flex; flex-direction:column; gap:4px; }
.converge-in{ display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-bottom:2px; }
.feed-chip{
  font-family:var(--mono); font-size:11px; padding:4px 11px; border-radius:100px;
  background:var(--paper-raised); border:1px solid var(--rule-strong); color:var(--ink-soft);
}
.hub-box{
  border:2px solid var(--decided-line); background:var(--decided-bg); color:var(--ink);
  border-radius:10px; padding:14px 18px; text-align:center; font-weight:600; font-size:13.5px; line-height:1.4;
}
.outcome-box{
  border:1.5px solid var(--rule-strong); background:var(--paper-raised); color:var(--ink);
  border-radius:8px; padding:10px 14px; text-align:center; font-size:13px;
}

/* price table */
.table-wrap{ overflow-x:auto; border:1px solid var(--rule); border-radius:10px; }
table{ border-collapse:collapse; width:100%; min-width:420px; font-size:13.5px; }
thead th{
  text-align:left; font-family:var(--mono); font-size:10.5px; letter-spacing:.07em; text-transform:uppercase;
  color:var(--ink-soft); background:var(--paper-raised); padding:10px 14px; border-bottom:1px solid var(--rule-strong);
}
tbody td{ padding:10px 14px; border-bottom:1px solid var(--rule); vertical-align:top; background:var(--paper-raised); font-variant-numeric:tabular-nums; }
tbody tr:last-child td{ border-bottom:none; }
td.feat{ font-weight:600; }
td.num{ font-family:var(--mono); font-size:13px; }
.verdict-row td{ background:var(--decided-bg); font-weight:600; color:var(--decided-fg); font-family:var(--mono); font-size:12.5px; }

/* still-open list */
.open-card{ border:1px solid var(--rule); background:var(--paper-raised); border-radius:10px; padding:18px 20px; border-top:3px solid var(--open-line); }
.open-card ul{ margin:0; padding-left:18px; font-size:13.5px; }
.open-card li{ margin-bottom:9px; }
.open-card li:last-child{ margin-bottom:0; }

footer{ border-top:1px solid var(--rule-strong); padding-top:20px; color:var(--ink-soft); font-size:12.5px; }
</style>

<header>
  <p class="eyebrow">Economy audit · follow-up to the desktop/mobile formula reduction</p>
  <h1>What's actually settled, and what still needs a number</h1>
  <p class="subtitle">Every cost, boost, and payout in the redesigned economy, mapped by decision status. As of 2026-07-21 this is nearly all settled — three loose ends are listed at the bottom.</p>
</header>

<section id="legend">
  <div class="legend">
    <span class="label">Status key</span>
    <span class="pill decided">● decided</span>
    <span class="pill open">● open — mechanic set, number isn't</span>
    <span class="pill gap">● decided, not coded yet</span>
    <span class="pill assumed">◌ assumed — never explicitly revisited</span>
  </div>
</section>

<section id="flowchart">
  <h2>The economy, end to end</h2>
  <p class="section-note">Each category is its own cost → effect → bonus pipeline, top to bottom. Color marks how settled each step is — not how important it is.</p>

  <div class="flow-grid">
    <div class="flow-card">
      <h3>💰 Direct Cash Investment</h3>
      <div class="step decided">cost = seats × 10 — mobile's own scale, kept as-is (not derived from desktop)</div>
      <div class="arrow">↓</div>
      <div class="step decided">boost = linear glide, 5%→2% over 20 investments, then floors at 2% — mobile's existing curve, kept</div>
    </div>

    <div class="flow-card">
      <h3>📢 Rally Tokens</h3>
      <div class="step decided">income: 2 tokens / phase / player, symmetric, accumulates. Earnable up to 28 (20 base + 8 agenda bonus)</div>
      <div class="arrow">↓</div>
      <div class="step decided">spend cap: max 2 tokens played per phase per player, regular income or agenda bonus alike — makes 20 (2×10 phases) the real lifetime-<em>spendable</em> ceiling, not 28. Agenda-bonus tokens don't raise the ceiling, they only give flexibility in when you spend the same 20 (one shared pool — spend, convert, or let it go unused, all subject to the same caps)</div>
      <div class="arrow">↓</div>
      <div class="step decided">per-state cap: max 2 total token plays per state, ever, shared across both players — Nationwide Rally is exempt</div>
      <div class="arrow">↓</div>
      <div class="step decided">craft 6 → Special Powerup — min. 3 phases to complete (crafting counts against the spend cap too), 1 use/game</div>
      <div class="arrow">↓</div>
      <div class="step decided">craft 12 → Nationwide Rally — min. 6 phases (must start almost immediately in a 10-phase game), 1 use/game, replaces old ⭐ roll</div>
      <div class="arrow">↓</div>
      <div class="step assumed">current live code applies +4% per token (not desktop's 8%) — not yet redecided under the new design</div>
    </div>

    <div class="flow-card">
      <h3>📜 Agenda Commitment</h3>
      <div class="step decided">cost: 500 Cr per tap (each tap = 25%) — 2,000 Cr to max one agenda, 8,000 Cr for all 4. No per-phase tap cap; limited only by funds on hand</div>
      <div class="arrow">↓</div>
      <div class="step gap">effect = baseMagnitude × Σ(support tags − oppose tags)</div>
      <div class="arrow">↓</div>
      <div class="step decided">+2 tokens per completed agenda (up to +8 across 4 agendas) — timing flexibility, not extra power: the 2/phase spend cap means 20 is the real lifetime ceiling regardless (see Rally Tokens card)</div>
    </div>

    <div class="flow-card">
      <h3>🗺️ Regional Dominance</h3>
      <div class="step decided">trigger: every state in group individually ≥ 50%</div>
      <div class="arrow">↓</div>
      <div class="step decided">15 groups, 5 per tier (Large / Mid / Small by seats)</div>
      <div class="arrow">↓</div>
      <div class="step decided">payout = 5 × Σ seats in group (= half the cost of one tap on the whole group as a unit) — corrected from an earlier 0.5× bug that was 10× too small</div>
    </div>

    <div class="flow-card">
      <h3>⚡ Special Powers</h3>
      <div class="step decided">resolve instantly only — no duration-based effects</div>
      <div class="arrow">↓</div>
      <div class="step decided">matched cost + benefit, distinct verb, per politician</div>
      <div class="arrow">↓</div>
      <div class="step open">individual balance numbers (20-entry roster)</div>
    </div>
  </div>

  <div class="converge">
    <div class="converge-in">
      <span class="feed-chip">cash boost</span>
      <span class="feed-chip">rally boost</span>
      <span class="feed-chip">agenda effect</span>
      <span class="feed-chip">power effect</span>
    </div>
    <div class="arrow">↓ ↓ ↓ ↓</div>
    <div class="hub-box">Shared redistribution rule — gainer +boost (capped 100), opponent + others lose proportionally, renormalize to 100</div>
    <div class="arrow">↓</div>
    <div class="outcome-box">state popularity → seat share (proportional) → win condition</div>
  </div>
</section>

<section id="prices">
  <h2>The price question — resolved</h2>
  <p class="section-note">Comparing to desktop's numbers turned up three ratios (12.5×, 5×, 10×) that never matched — proof mobile's numbers were independent placeholders, not a deliberate rebalance of desktop's. <b>Decision: mobile keeps its own numbers and stops comparing to desktop.</b> The values below are canonical on their own terms.</p>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td class="feat">Starting funds</td><td class="num">2,500</td></tr>
      <tr><td class="feat">Refresh / phase</td><td class="num">1,000 per player — confirmed via <code>phase-system.js</code>'s <code>awardRefreshFunds()</code> (calls <code>updatePlayerFunds()</code> for both players independently)</td></tr>
      <tr><td class="feat">Cost per seat</td><td class="num">10 <span style="color:var(--ink-soft)">(comment literally says "10 crores per seat")</span></td></tr>
      <tr><td class="feat">Direct-investment decay shape</td><td class="num">linear glide, 5%→2% over 20 taps, then floors at 2%</td></tr>
      <tr><td class="feat">Lifetime budget per player</td><td class="num">2,500 + 1,000×10 = <b>12,500</b></td></tr>
      <tr><td class="feat">Full-agenda spend (4 agendas × 2,000)</td><td class="num">8,000 of 12,500 (64%), leaving <b>4,500</b> for direct investment</td></tr>
      <tr class="verdict-row"><td colspan="2">Decided 2026-07-21: mobile's numbers (2,500 start / 1,000 per phase / seats×10 / 12,500 lifetime budget) are now canonical on their own terms.</td></tr>
    </tbody>
  </table>
  </div>
</section>

<section id="open">
  <h2>Still open</h2>
  <p class="section-note">Everything else on this page — the redistribution rule, all five category pipelines, the price scale, and the group payout — is decided. These three aren't.</p>
  <div class="open-card">
    <ul>
      <li>Individual special-power balance numbers (Rajinikanth flagged by name as needing a pass)</li>
      <li>Rally-token boost value under the new design — live code currently uses 4% (not desktop's 8%), never explicitly re-decided</li>
      <li><code>design/plan.md</code>'s roadmap text and Booth Ink's UI still hardcode 8 phases — needs updating now that 10 is confirmed canonical</li>
    </ul>
  </div>
</section>

<footer>
  <p style="margin:0 0 10px;">Implementation note: <code>phase-system.js</code> used to fetch <code>game-config.json</code> independently of the rest of the app — that's why its fallback default had drifted to 500/phase against the real 1000. Removed; it now shares <code>config-manager.js</code>'s <code>getGameConfig()</code> with every other system, so there's one config loader in the codebase, not two.</p>
  <p style="margin:0;">Sources: <code>design/plan.md</code>, <code>CHANGELOG.md</code> (decisions D1–D9, two unrelated series), <code>findings.md</code>, ADR-0004/0005, desktop <code>js/*.js</code> vs. mobile <code>data/game-config.json</code> + <code>js/investment-system.js</code> + <code>js/phase-system.js</code>.</p>
</footer>
