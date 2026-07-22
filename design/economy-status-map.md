<title>PME Design Reference — What's Actually Decided</title>
<meta name="description" content="The single authoritative reference for how Pradhan Mantri Elections Mobile is supposed to work, per finalized design decisions. The build should target this document.">

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
.subtitle{ color:var(--ink-soft); font-size:16.5px; max-width:66ch; margin:0 0 28px; }
header{ border-bottom:1px solid var(--rule-strong); padding-bottom:26px; margin-bottom:34px; }

h2{
  font-family:var(--serif); font-size:22px; font-weight:600; margin:0 0 6px; letter-spacing:-.005em;
}
h3{ font-family:var(--sans); font-size:14.5px; font-weight:700; margin:22px 0 10px; color:var(--ink); }
.section-note{ color:var(--ink-soft); font-size:14px; margin:0 0 18px; max-width:70ch; }
p{ color:var(--ink); font-size:14.5px; max-width:70ch; margin:0 0 14px; }
section{ margin-bottom:50px; }

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

/* price / data tables */
.table-wrap{ overflow-x:auto; border:1px solid var(--rule); border-radius:10px; margin-bottom:8px; }
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

/* worked-example / callout cards */
.example{ border:1px solid var(--rule); border-left:3px solid var(--navy-soft); background:var(--paper-raised); border-radius:8px; padding:14px 18px; margin:12px 0; }
.example .label{ font-family:var(--mono); font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--navy-soft); font-weight:700; margin:0 0 8px; }
.example p:last-child{ margin-bottom:0; }
.warn{ border-left-color:var(--open-line); }
.warn .label{ color:var(--open-fg); }

/* still-open list */
.open-card{ border:1px solid var(--rule); background:var(--paper-raised); border-radius:10px; padding:18px 20px; border-top:3px solid var(--open-line); }
.open-card ul{ margin:0; padding-left:18px; font-size:13.5px; }
.open-card li{ margin-bottom:9px; }
.open-card li:last-child{ margin-bottom:0; }

.source-note{ font-size:12.5px; color:var(--ink-soft); font-family:var(--mono); }

footer{ border-top:1px solid var(--rule-strong); padding-top:20px; color:var(--ink-soft); font-size:12.5px; }
</style>

<header>
  <p class="eyebrow">Design reference · single source of truth</p>
  <h1>What Pradhan Mantri Elections Mobile is supposed to do</h1>
  <p class="subtitle">Every finalized mechanic, formula, and number in the game's design, consolidated from <code>design/plan.md</code>, <code>CHANGELOG.md</code>, <code>findings.md</code>, and direct design decisions — in one place, so the build cycle has a single document to target instead of four. As of 2026-07-22, everything marked <span class="pill decided" style="vertical-align:1px;">decided</span> is settled and should be built to; anything else is flagged with exactly what's still missing.</p>
</header>

<section id="legend">
  <div class="legend">
    <span class="label">Status key</span>
    <span class="pill decided">● decided</span>
    <span class="pill open">● open — mechanic set, number isn't</span>
    <span class="pill gap">● decided, not coded yet</span>
    <span class="pill assumed">◌ assumed — never explicitly revisited</span>
  </div>
  <p class="section-note" style="margin-top:10px;">This document describes the <b>design</b> — what the game is supposed to do. It does not track implementation status (what's actually wired up in <code>js/*.js</code> today); that's a separate, faster-moving concern. See <code>findings.md</code> for dated implementation-gap findings.</p>
</section>

<section id="core">
  <h2>Core loop &amp; win condition</h2>
  <p class="section-note">The shape every other system sits inside.</p>

  <div class="flow-grid">
    <div class="flow-card">
      <h3>🕐 Match structure</h3>
      <div class="step decided">2 players, no accounts, 10 phases, each phase timed</div>
      <div class="arrow">↓</div>
      <div class="step decided">both players act simultaneously within a phase — no turn order</div>
    </div>
    <div class="flow-card">
      <h3>💰 Funds</h3>
      <div class="step decided">start: 2,500 Cr · refresh: 1,000 Cr/phase/player, independent</div>
      <div class="arrow">↓</div>
      <div class="step decided">lifetime budget per player: 2,500 + 1,000×10 = <b>12,500 Cr</b>, hard cap</div>
    </div>
    <div class="flow-card">
      <h3>🗺️ Seats</h3>
      <div class="step decided">state seats = round(popularity% × state's Lok Sabha seats) — proportional, not winner-take-all</div>
      <div class="arrow">↓</div>
      <div class="step decided">whoever clears <b>272 of 543</b> nationally wins; both under 272 = hung parliament</div>
    </div>
  </div>

  <h3>Starting position</h3>
  <p>Not a blank map. Popularity is seeded so each player gets a stronghold and the rest of the map starts genuinely contested:</p>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Player</th><th>Starting stronghold</th><th>Seats</th></tr></thead>
    <tbody>
      <tr><td class="feat">Player 1</td><td>Uttar Pradesh + Maharashtra (2 states)</td><td class="num">128</td></tr>
      <tr><td class="feat">Player 2</td><td>West Bengal + Bihar + Tamil Nadu (3 states)</td><td class="num">121</td></tr>
      <tr><td class="feat">Contested</td><td>Remaining 31 states/UTs — both players start low (5–29%), "Others" holds the plurality</td><td class="num">294 (54%)</td></tr>
    </tbody>
  </table>
  </div>
  <p class="section-note">Expected national seat share at kickoff, before either player spends a rupee: P1 ≈24.6%, P2 ≈24.3%, Others ≈51.1%. Most of the early game is a race to harvest the uncommitted "Others" pool, not direct player-vs-player combat.</p>
</section>

<section id="pot">
  <h2>The redistribution rule</h2>
  <p class="section-note">The one mechanic every lever below routes through.</p>
  <p>Every state holds three numbers that always sum to 100: your share, your opponent's share, "Others." Every action in the game — investment, rally, agenda, special power — is really the same operation: add a boost to your share (capped at 100), and take the equivalent amount away from your opponent and "Others" <i>proportionally to how much of the 100 they currently hold</i>. A state where your rival is strong bleeds mostly from your rival; a state that's mostly undecided bleeds mostly from the undecided middle. Nothing in this game adds points to the pool — every gain is a reassignment.</p>
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

<section id="investment">
  <h2>Direct cash investment</h2>
  <div class="flow-grid">
    <div class="flow-card">
      <h3>💰 Cost &amp; boost</h3>
      <div class="step decided">cost = seats × 10 Cr — mobile's own scale, not derived from desktop</div>
      <div class="arrow">↓</div>
      <div class="step decided">boost = linear glide, 5%→2% over 20 taps in that state, then floors at 2%</div>
    </div>
  </div>
  <div class="example">
    <p class="label">Why state size doesn't matter the way you'd expect</p>
    <p>Cost per tap scales with seats (seats×10), and the boost curve is identical regardless of state size — work out cost-per-projected-seat and the state's size cancels out completely. A tap in a 5-seat state and a tap in a 40-seat state buy the same Cr-per-seat, roughly 200 Cr/seat on a first tap, rising to ~500 Cr/seat at the decay floor. Big states aren't a trap, small states aren't a shortcut — the only thing that gets more expensive is repeating yourself in the <i>same</i> state.</p>
  </div>
</section>

<section id="rally">
  <h2>Rally tokens</h2>
  <div class="flow-grid">
    <div class="flow-card">
      <h3>📢 Income &amp; spend</h3>
      <div class="step decided">income: 2 tokens/phase/player, symmetric, accumulates — earnable up to 28 (20 base + 8 agenda bonus)</div>
      <div class="arrow">↓</div>
      <div class="step decided">spend cap: max 2 tokens played per phase per player, regular or agenda-bonus alike — real lifetime-<i>spendable</i> ceiling is 20 (2×10 phases), not 28</div>
    </div>
    <div class="flow-card">
      <h3>🎯 Scarcity &amp; crafting</h3>
      <div class="step decided">per-state cap: max 2 total token plays per state, ever, shared across both players — Nationwide Rally exempt</div>
      <div class="arrow">↓</div>
      <div class="step decided">craft 6 → Special Powerup (min. 3 phases, crafting counts against spend cap), 1 use/game</div>
      <div class="arrow">↓</div>
      <div class="step decided">craft 12 → Nationwide Rally (min. 6 phases — must start almost immediately in a 10-phase game), 1 use/game, replaces the old random ⭐ roll entirely</div>
    </div>
    <div class="flow-card">
      <h3>📜 Agenda tie-in</h3>
      <div class="step decided">+2 tokens per completed agenda, up to +8 across 4 — scheduling flexibility only, doesn't raise the 20-token ceiling</div>
      <div class="arrow">↓</div>
      <div class="step assumed">per-token popularity boost value — still open, see below</div>
    </div>
  </div>
  <p class="section-note">One shared pool: spend, convert, or let a token go unused — all subject to the same caps. Agenda-bonus tokens buy timing flexibility, not more power.</p>
</section>

<section id="agenda">
  <h2>Agenda commitment</h2>
  <div class="flow-grid">
    <div class="flow-card">
      <h3>💰 Cost</h3>
      <div class="step decided">500 Cr per tap, flat, regardless of policy — each tap = 25% completion</div>
      <div class="arrow">↓</div>
      <div class="step decided">2,000 Cr to max one agenda · 8,000 Cr to max all 4 · no per-phase tap cap, limited only by funds on hand</div>
    </div>
    <div class="flow-card">
      <h3>⚙️ Effect</h3>
      <div class="step gap">effect = baseMagnitude × Σ(matching support tags − matching oppose tags), applied per state</div>
      <div class="arrow">↓</div>
      <div class="step decided">not contested between players — each player funds only their own 4, no shared race, no way to "win" a policy out from under an opponent</div>
    </div>
    <div class="flow-card">
      <h3>🎁 Reward</h3>
      <div class="step decided">+2 rally tokens per completed agenda, up to +8 across 4</div>
    </div>
  </div>

  <div class="example">
    <p class="label">The real budget trade-off</p>
    <p>Maxing all 4 of a politician's agendas costs 8,000 of the 12,500 Cr lifetime budget — 64% of everything a player will ever have — leaving just 4,500 Cr for direct investment across the rest of the map. An agenda-heavy build is a genuinely different, more concentrated game than an investment-heavy one, not a minor variant.</p>
  </div>
  <div class="example">
    <p class="label">Hoarding is a real strategy, not a workaround</p>
    <p>No per-phase tap cap means a player can bank cash and burst-commit an agenda all at once late in the match. The cost of waiting is real: your opponent's uncontested popularity keeps climbing in the states you haven't touched yet. Delayed commitment is a genuine, self-taxing trade-off — not an exploit to patch.</p>
  </div>
  <div class="example">
    <p class="label">Why it's private, not a race</p>
    <p>An earlier draft had both players racing to complete the same shared policy, majority contributor at 100% wins. Dropped deliberately as unneeded complexity: a shared race like that has an obvious failure mode — a trailing player should rationally just stop contributing the moment they fall behind, which turns the mechanic into a trap more than a real choice. Each politician's 4 agendas belong to that player alone.</p>
  </div>

  <h3>Two corrections made 2026-07-22, now live in <code>data/policy-tags.json</code></h3>
  <div class="example warn">
    <p class="label">National Defense was net −25.3 seats nationally — now fixed</p>
    <p>National Defense supports <code>EasternBorder</code>/<code>WesternBorder</code> and opposed <code>CoastalIndia</code>/<code>HindiHeartland</code>. Six of the country's largest states (UP, Bihar, Gujarat, Rajasthan, Uttarakhand, West Bengal) were tagged with both a supported border region and an opposed one at once, netting to exactly zero there — while the states left with a clean, uncancelled effect skewed hard negative (big industrial/coastal states losing 12% outright; only small frontier states/UTs gaining it). Net effect computed against the real map: <b>−25.3 seat-equivalent</b>, the single worst pick in the 23-policy pool. <b>Fix applied:</b> dropped <code>HindiHeartland</code> from <code>opposeTags</code>, leaving only <code>CoastalIndia</code>. This un-cancels UP (+9.6) and Bihar (+4.8) — the two biggest states in the overlap — and the remaining zero-net states (Gujarat, West Bengal) now cancel for a thematically real reason (both are genuinely coastal <i>and</i> border states), not an arbitrary Hindi-Heartland collision. New net effect: <b>+1.8 seat-equivalent</b> — no longer a trap pick, though still the weakest in the pool pending further balance work.</p>
  </div>
  <div class="example warn">
    <p class="label">Three policies with no region tags are supposed to carry a flat +2% nationwide effect</p>
    <p>Women's Empowerment, Healthcare, and Anti-Corruption have no <code>supportTags</code>/<code>opposeTags</code> configured — under the effect formula above, that computes to exactly zero, a dead pick. <b>Decided:</b> these three are intended to carry a flat, uniform +2% nationwide popularity effect instead of a region-tagged one. Now recorded as an explicit <code>"nationwideBonus": 2</code> field on all three entries in <code>data/policy-tags.json</code>. A flat 2% nationwide converts to roughly <b>+10.9 seat-equivalent</b> (2% × 543 seats) once implemented — a real, modest contributor instead of a dead pick.</p>
    <p><b>Do not implement this using <code>baseMagnitude</code>.</b> <code>generateCampaignGrid()</code> in <code>campaign-system.js</code> already has display logic that labels a zero-tag policy "+<code>baseMagnitude</code>% Nationwide" for UI purposes only — Healthcare's <code>baseMagnitude</code> is 12, Women's Empowerment and Anti-Corruption are 8. Applying that value as the real effect instead of the decided 2% would make Healthcare worth ~+65 seat-equivalent (stronger than every other policy in the pool, including Economic Liberalization at +51.8) and the other two ~+43 each — a roughly 6× overshoot of the intended value. Read <code>nationwideBonus</code>, not <code>baseMagnitude</code>, when this gets built.</p>
  </div>
</section>

<section id="regional">
  <h2>Regional dominance</h2>
  <div class="flow-grid">
    <div class="flow-card">
      <h3>🎯 Trigger</h3>
      <div class="step decided">every state in the group individually ≥ 50% — not a seat-weighted average</div>
    </div>
    <div class="flow-card">
      <h3>🗺️ Groups</h3>
      <div class="step decided">15 groups, 5 per tier (Large / Mid / Small by seat count) — full membership lists in <code>data/states_data.json</code></div>
    </div>
    <div class="flow-card">
      <h3>💰 Payout</h3>
      <div class="step decided">payout = 5 × Σ(seats in group) — corrected from an earlier 0.5× bug that was 10× too small</div>
    </div>
  </div>

  <div class="example">
    <p class="label">Why "every state, individually" is deliberate</p>
    <p>A seat-weighted average check would let a player buy past a couple of stubborn hold-out states by overperforming elsewhere in the group. Requiring every member individually forces contesting a group's weakest links, not just piling resources into already-strong states. Confirmed intentional design, not a bug to loosen.</p>
  </div>
  <div class="example">
    <p class="label">Worked example: never a standalone cash target</p>
    <p>Agricultural Region (273 seats): payout 5×273 = 1,365 Cr. Real cost to push every member state to 50% from a cold start, using the real decay curve and real starting positions: ~12,480 Cr — <b>~11% ROI</b>, and this is the best case among all 15 groups, not the worst. Every one of the 15 groups costs more to fully dominate from scratch than a player's entire 12,500 Cr lifetime budget. The bonus only makes sense as an incidental kicker on states a player is already winning for the main seat race — never as something to deliberately chase from zero.</p>
  </div>
  <div class="example">
    <p class="label">Sabotage is cheaper than conquest — also deliberate</p>
    <p>Payout is gated on a live re-check, not a one-time achievement — a single state dropping back under 50% instantly zeroes the whole group's ongoing bonus, even with every other member state still held. Direct consequence of the strict per-state rule above, not a separate bug: it makes a losing player's cheapest counter-play "knock down one state" rather than "out-conquer the leader," which is either a built-in rubber band or a source of real swinginess depending which side of it you're on.</p>
  </div>
</section>

<section id="powers">
  <h2>Special powers</h2>
  <div class="flow-grid">
    <div class="flow-card">
      <h3>⚡ Rules</h3>
      <div class="step decided">resolve instantly only — no duration-based effects, ever</div>
      <div class="arrow">↓</div>
      <div class="step decided">matched cost + benefit, distinct verb, per politician — no two powers are the same mechanic reskinned</div>
      <div class="arrow">↓</div>
      <div class="step open">individual balance numbers across the 20-entry roster — Rajinikanth flagged by name as needing a pass</div>
    </div>
  </div>
  <p class="section-note">Instant-only is a load-bearing rule, not a style preference: a duration-based effect ("frozen for 1 phase") has nothing left to apply to if it unlocks on the game's last phase, which under any achievement-gated unlock it eventually will. Converting every effect to an instant lump-sum equivalent removes the dependency on borrowed future game-time entirely.</p>
</section>

<section id="roster">
  <h2>Politician roster</h2>
  <p class="section-note">Source of truth: <code>data/politicians-data.json</code> (roster) + <code>data/policy-tags.json</code> (shared 23-policy pool). Not duplicated here — read those files directly rather than trusting a second copy of this list to stay in sync.</p>
  <div class="flow-grid">
    <div class="flow-card">
      <h3>👥 Composition</h3>
      <div class="step decided">20 politicians (16 historical/current + 4 celebrities with real political ties)</div>
      <div class="arrow">↓</div>
      <div class="step decided">each carries 4 signature agendas drawn from the shared 23-policy pool + 1 unique special power</div>
    </div>
    <div class="flow-card">
      <h3>🔗 Sharing rule</h3>
      <div class="step decided">agendas are a shared pool, not bespoke per politician — multiple politicians can and do list the same agenda</div>
      <div class="arrow">↓</div>
      <div class="step decided">"exclusive" just means only one politician's list references that entry — no explicit exclusivity flag needed</div>
    </div>
  </div>
</section>

<section id="plausibility">
  <h2>Plausibility check — can the design actually be won?</h2>
  <p class="section-note">Worked numbers against the decided formulas above, modeling one player's best realistic play. Important caveat baked into every number here: this assumes an opponent who does nothing. A real, actively-adversarial opponent almost certainly pushes both players' realistic ceilings lower — nobody has modeled the two-active-player case yet (tracked as open, below).</p>

  <div class="table-wrap">
  <table>
    <thead><tr><th>Scenario</th><th>Best-case seat total</th></tr></thead>
    <tbody>
      <tr><td class="feat">Cash only — full 12,500 Cr budget, optimally spread</td><td class="num">~195 / 543 (35.9%)</td></tr>
      <tr><td class="feat">Cash + full 20 tokens + 2 strong agendas (Economic Liberalization, Education)</td><td class="num">~278 / 543 (51.2%)</td></tr>
      <tr class="verdict-row"><td colspan="2">Majority is reachable, but only using every lever at once, and only by ~6 seats out of 543 even at the model's best case.</td></tr>
    </tbody>
  </table>
  </div>

  <p>Cash alone cannot win under any circumstances — it isn't a skill ceiling, it's a hard mathematical wall: the entire lifetime budget only buys enough popularity to add roughly 60 seats on top of a player's free starting position, and 272 requires closing a much bigger gap than that. Tokens and agendas aren't optional flavor on top of investment; they are the only way to reach a majority at all.</p>

  <div class="example">
    <p class="label">Agenda pick quality swings harder than the winning margin</p>
    <p>Computing the effect formula against the real map for the original 23-policy pool: national seat-equivalent value ranged from <b>+51.8</b> (Economic Liberalization, best) to <b>−25.3</b> (National Defense, pre-fix) — a ~77-seat swing from a single agenda slot, against a ~6-seat winning margin. Post the National Defense fix above, the floor rises to roughly +1.8 (and to ~+10.9 for the three nationwide-bonus policies, once implemented) — narrowing the swing, but the full 23-policy ranking hasn't been recomputed end-to-end since these fixes landed. Worth doing before treating the roster as balanced.</p>
  </div>
</section>

<section id="open">
  <h2>Still open</h2>
  <p class="section-note">Everything else in this document — the redistribution rule, all category pipelines, the price scale, the group payout formula, the private-agenda model — is decided. These aren't yet.</p>
  <div class="open-card">
    <ul>
      <li><b>Individual special-power balance numbers</b> across the 20-entry roster — Rajinikanth flagged by name as needing a pass; the roster hasn't had a full cost/benefit audit.</li>
      <li><b>Rally-token per-play boost value</b> — live code currently applies 4% (not desktop's 8%), never explicitly re-decided under the redesigned token economy.</li>
      <li><b>Full 23-policy seat-equivalent re-ranking</b> — only the extremes and the three corrected entries have been recomputed since the 2026-07-22 fixes; the other ~19 policies haven't been checked for similar overlap or magnitude issues.</li>
      <li><b>Two-active-player seat ceiling</b> — every plausibility number above assumes a passive opponent. No one has modeled what happens when both players optimize simultaneously; the real reachable margin for either player is likely lower than the ~6-seat figure above, possibly making hung parliament the common real-play outcome even once every system is fully built.</li>
      <li><b>Hung-parliament resolution</b> — given the above, worth deciding whether "neither player reaches 272" should stay a null/no-winner result, or resolve some other way (plurality tiebreak, a scored secondary-objective system). Not decided either way yet; flagged here as a live open question, not settled either direction.</li>
    </ul>
  </div>
</section>

<footer>
  <p style="margin:0 0 10px;">This document supersedes the narrower "economy status map" it started as — scope expanded 2026-07-22 to cover the full finalized design (core loop, win condition, starting position, and the politician/agenda roster), not just cost/boost numbers, per explicit request to keep one authoritative reference for the build cycle to target.</p>
  <p style="margin:0 0 10px;">Implementation note (carried over): <code>phase-system.js</code> used to fetch <code>game-config.json</code> independently of the rest of the app — that's why its fallback default had drifted to 500/phase against the real 1,000. Removed; it now shares <code>config-manager.js</code>'s <code>getGameConfig()</code> with every other system.</p>
  <p style="margin:0;" class="source-note">Sources: <code>design/plan.md</code>, <code>CHANGELOG.md</code> (decisions D1–D9, two unrelated series), <code>findings.md</code>, ADR-0004/0005, direct design decisions made 2026-07-22 (National Defense fix, nationwideBonus field), <code>data/policy-tags.json</code>, <code>data/politicians-data.json</code>, <code>data/states_data.json</code>, desktop <code>js/*.js</code> (cited via <code>findings.md</code>) vs. mobile <code>data/game-config.json</code> + <code>js/investment-system.js</code> + <code>js/phase-system.js</code>. <code>check_data_consistency.js</code> run 2026-07-22 after the policy-tags.json edits: clean (3 pre-existing, unrelated implementation-gap failures — <code>NortheastIndia</code>/<code>BorderLands</code> stale references, tracked separately as build status, not design status).</p>
</footer>
