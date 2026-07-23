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
  <p>Not a blank map, and not a fixed table either — the starting position is generated per match, in a fixed three-step order, from whichever politicians the two players pick plus a random roll on top:</p>
  <div class="flow-grid">
    <div class="flow-card">
      <h3>1️⃣ Baseline</h3>
      <div class="step decided">every state gets an independent random roll, 5%–29%, for each player separately — "Others" holds whatever's left over, everywhere, before either later step runs</div>
    </div>
    <div class="flow-card">
      <h3>2️⃣ Home state</h3>
      <div class="step decided">each politician carries a fixed <code>homeState</code> (<code>data/politicians-data.json</code>, e.g. Modi → Gujarat, Rahul Gandhi → Uttar Pradesh) — picking them adds +25% on top of your baseline roll there</div>
      <div class="arrow">↓</div>
      <div class="step decided">both players' politicians share a home state → the bonus is nullified for both, not split — that one state just keeps its two independent baseline rolls from step 1, no home advantage for either side</div>
    </div>
    <div class="flow-card">
      <h3>3️⃣ Random national edge</h3>
      <div class="step decided">both players' home states are pulled out of the pool first — no double-dipping your own, and your opponent's random draw can never land on it either</div>
      <div class="arrow">↓</div>
      <div class="step decided">players alternate turns drawing one state at a time from the shared remaining pool — a state can only go to whoever draws it, so it can never be drawn by both; who goes first is itself a coin flip each match, so the draw doesn't have a built-in first-mover advantage</div>
      <div class="arrow">↓</div>
      <div class="step decided">each drawn state's popularity is set to a fresh random 35%–65% for the player who drew it</div>
      <div class="arrow">↓</div>
      <div class="step decided">keep drawing until that player's <code>seatCountWithAdvantage</code> (Lok Sabha seats summed across their drawn states) exceeds 100 — but skip any candidate state that would push it past 130, and try the next instead</div>
    </div>
  </div>
  <div class="example">
    <p class="label">Replaces the old fixed-stronghold table</p>
    <p>An earlier draft scripted specific strongholds (P1: Uttar Pradesh + Maharashtra, P2: West Bengal + Bihar + Tamil Nadu) as a fixed starting position, always the same regardless of who or what was picked. Superseded 2026-07-22: starting position is now generated per match through the three-step procedure above — it varies with politician choice, baseline rolls, and the draw instead of repeating every game.</p>
  </div>
  <p class="section-note">Because the politician pick, the baseline rolls, and the draw are all random, the exact national kickoff split now varies match to match rather than landing on the fixed number the old scripted table gave. In spirit it's unchanged: each player starts with a meaningful chunk of the map in their favor, "Others" still holds the plurality, and most of the early game is a race to harvest the uncommitted pool, not direct player-vs-player combat.</p>
  <div class="example">
    <p class="label">UP being over-represented in the roster is a feature, not a bug — confirmed 2026-07-22</p>
    <p>Checked against the real roster (<code>data/politicians-data.json</code>): 10 of the 20 politicians have Uttar Pradesh as their <code>homeState</code>, so the nullified-tie rule above will trigger often, not rarely. That's the right outcome: it means the scenario where one player just starts with a mega lead by dominating the country's single biggest state (80 seats) off a home-state pick is itself made rare, precisely because ties there get cancelled instead of resolved in someone's favor. The concentration isn't a balance problem to fix — it's already doing balancing work.</p>
  </div>
  <div class="example">
    <p class="label">Implementation notes — starting position generator</p>
    <p>All values in basis points (bps), 10,000 = 100% — see the redistribution rule's precision convention below.</p>
    <div class="table-wrap"><pre style="background:var(--paper);border:none;border-radius:0;margin:0;padding:12px 14px;font-family:var(--mono);font-size:12px;line-height:1.65;color:var(--ink);white-space:pre-wrap;">1. baseline — for every state, for each player independently:
   player.pop[state] = randomInt(500, 2900)

2. home state — if p1.homeState ≠ p2.homeState:
   owner.pop[homeState] += 2500   (capped at 10000)
   else: no change — both keep their step-1 baseline roll in that state

3. random draw — pool = allStates − {p1.homeState, p2.homeState}, shuffled once
   firstDrawer = coinFlip(); players alternate turns consuming the pool
   on your turn, take the next pool state where:
     seatCountWithAdvantage[you] + state.seats ≤ 130
     (skip it and try the next pool entry if it would exceed 130)
   you.pop[state] = randomInt(3500, 6500)
   seatCountWithAdvantage[you] += state.seats
   stop drawing for a player once seatCountWithAdvantage[them] > 100</pre></div>
  </div>
</section>

<section id="pot">
  <h2>The redistribution rule</h2>
  <p class="section-note">The one mechanic every lever below routes through.</p>
  <p>Every state holds three shares that always add up to 100%: yours, your opponent's, and "Others" — the undecided middle. Every action in the game (investment, rally, agenda, special power) does the same basic thing: you gain a boost, capped so you can never pass 100%, and whatever you actually gained is taken away from your opponent and Others in proportion to how much each currently holds. If your rival already owns most of a state, your gain there eats mostly into your rival. If a state is still mostly undecided, your gain eats mostly into the undecided middle. Nothing is ever created out of thin air — every gain is just a reassignment of the same 100%.</p>
  <div class="converge">
    <p class="section-note" style="text-align:center;margin-bottom:10px;">Four different levers, but they all funnel through the exact same two-step rule:</p>
    <div class="converge-in">
      <span class="feed-chip">cash boost</span>
      <span class="feed-chip">rally boost</span>
      <span class="feed-chip">agenda effect</span>
      <span class="feed-chip">power effect</span>
    </div>
    <div class="arrow">↓ ↓ ↓ ↓</div>
    <div class="hub-box">1. You gain the boost — capped so you can never pass 100%</div>
    <div class="arrow">↓</div>
    <div class="hub-box">2. Your opponent and Others each give up their share of it, in proportion to how much they currently hold</div>
    <div class="arrow">↓</div>
    <div class="outcome-box">state popularity → seat share (proportional) → win condition</div>
  </div>

  <h3>Keeping the numbers exact</h3>
  <p>Behind the scenes, a state's popularity isn't stored as a percentage like "28.12%" — it's stored as a whole number out of 10,000 (every 100 of these = 1%, a unit called <i>basis points</i>, or "bps" for short). This sidesteps two problems that come from using percentages directly: rounded numbers that don't quite add back up to 100, and small rounding errors quietly piling up over the hundreds of little actions in a 10-phase game.</p>
  <div class="example">
    <p class="label">Worked example</p>
    <p>Say a state starts at P1 20%, P2 30%, Others 50%. P1 taps once for a flat 5% boost. P1 has plenty of room (20 + 5 = 25, nowhere near 100), so the full 5% goes through untrimmed. That 5% has to come from somewhere: it's taken from P2 and Others in proportion to what they already hold — a 30:50 split. P2 gives up its share, Others gives up its share, and both amounts get rounded to the nearest whole basis point.</p>
    <p>The one rule that keeps this exact: round <i>one</i> of the two amounts to a whole number, then get the other by subtracting from the total taken — never round both separately. Two independently-rounded pieces can drift a point off from where they started; one rounded piece plus "whatever's left" never can.</p>
  </div>
  <div class="table-wrap">
  <table>
    <thead><tr><th></th><th>P1</th><th>P2</th><th>Others</th></tr></thead>
    <tbody>
      <tr><td class="feat">Before</td><td class="num">20.00%</td><td class="num">30.00%</td><td class="num">50.00%</td></tr>
      <tr class="verdict-row"><td class="feat">After P1's tap</td><td class="num">25.00%</td><td class="num">28.12%</td><td class="num">46.88%</td></tr>
    </tbody>
  </table>
  </div>
  <p class="section-note">Players never see the underlying precision — the app always displays whole percentages (28.12% shows as "28%", rounded only on screen, at the very last step). Seat counts are computed from the exact number underneath, not from the already-rounded-for-display percentage, so two roundings never stack on top of each other and quietly drift the score.</p>

  <h3>When both players act on the same state at once</h3>
  <p>Turns are simultaneous, so both players can target the same state in the same phase. Each one is reaching into two places: the opponent's share, and the Others share. The two players' reaches into <i>each other</i> never collide — your pull on your opponent only ever touches their pile, never Others'. The one place a collision can happen is Others, since both players might be pulling from that same pile at the same moment.</p>
  <div class="example">
    <p class="label">Decided: shrink both requests to fit, like splitting a bill that's short on cash</p>
    <p>If both players' combined pull on Others would ask for more than Others actually has, scale both pulls down proportionally so they fit exactly — same idea as splitting a restaurant bill down when there isn't enough cash on the table to cover what everyone ordered. It makes no difference which player's action gets processed first internally; the result comes out the same either way.</p>
  </div>
  <div class="table-wrap">
  <table>
    <thead><tr><th></th><th>P1</th><th>P2</th><th>Others</th></tr></thead>
    <tbody>
      <tr><td class="feat">Before — a small, contested state</td><td class="num">10%</td><td class="num">10%</td><td class="num">80%</td></tr>
      <tr class="verdict-row"><td class="feat">After — both players throw a huge play at it, same phase</td><td class="num">50%</td><td class="num">50%</td><td class="num">0%</td></tr>
    </tbody>
  </table>
  </div>
  <p class="section-note">Together the two plays wanted more of that 80% undecided middle than existed, so both got scaled down to fit — and since the two plays were equally large, they land in an exact tie, with Others wiped out entirely. This only ever comes up when two big one-shot effects (a Nationwide Rally, a Special Powerup) land on the very same swing state in the very same phase and jointly overdraw the undecided middle — for an ordinary tap, or one player acting alone, nothing changes: it's just the rule above, run once.</p>
  <div class="example">
    <p class="label">Implementation notes — the redistribution engine</p>
    <div class="table-wrap"><pre style="background:var(--paper);border:none;border-radius:0;margin:0;padding:12px 14px;font-family:var(--mono);font-size:12px;line-height:1.65;color:var(--ink);white-space:pre-wrap;">Single actor:
  gain = min(boost_bps, 10000 − self_bps)
  opp_cut_raw = gain × opponent_bps / (opponent_bps + others_bps)
  opp_cut = round(opp_cut_raw)                 // round this side only
  others_cut = gain − opp_cut                  // derive, never round independently
  self += gain; opponent −= opp_cut; others −= others_cut

Both players act on the same state, same phase (compute against the pre-phase snapshot):
  for each player, compute gain / opp_cut_raw / others_cut_raw as above (unrounded)
  others_demand = p1's others_cut_raw + p2's others_cut_raw
  if others_demand > others_bps:
    scale = others_bps / others_demand
    both players' others_cut_raw ×= scale        // shrinks, doesn't redirect to opponent
    each player's actual gain = own opponent-facing cut + own scaled others_cut_raw
  round each player's final gain to the nearest bps, then split it into its
  two components (opponent-facing / others-facing) with the same round-one,
  derive-the-other rule as the single-actor case above</pre></div>
  </div>
</section>

<section id="investment">
  <h2>Direct cash investment</h2>
  <div class="flow-grid">
    <div class="flow-card">
      <h3>💰 Cost &amp; boost</h3>
      <div class="step decided">cost per tap = the state's seat count × 10 Cr — mobile's own scale, not carried over from desktop</div>
      <div class="arrow">↓</div>
      <div class="step decided">each tap in a state gives a smaller boost than the last — starts at 5%, shrinks down to 2% by the 20th tap in that state, then stays at 2% for every tap after</div>
    </div>
  </div>
  <div class="example">
    <p class="label">Why state size doesn't matter the way you'd expect</p>
    <p>Cost scales with seats, and the shrinking-boost pattern is identical everywhere — the two effects cancel out, so work out the cost per seat gained and a state's size makes no difference. A tap in a 5-seat state and a tap in a 40-seat state buy the same value per Crore: roughly 200 Cr per seat on a first tap in either, rising to ~500 Cr per seat once the boost has shrunk to its 2% floor. Big states aren't a trap and small states aren't a shortcut — the only thing that gets more expensive is tapping the <i>same</i> state over and over.</p>
  </div>
  <div class="example">
    <p class="label">Implementation notes</p>
    <div class="table-wrap"><pre style="background:var(--paper);border:none;border-radius:0;margin:0;padding:12px 14px;font-family:var(--mono);font-size:12px;line-height:1.65;color:var(--ink);white-space:pre-wrap;">costPerTap(state) = state.seats × 10                              // Cr

boost_bps(tapNumberInThisState) =
  tap ≤ 20:  round(500 − (tap − 1) × 300/19)   // linear, 500 bps at tap 1 → 200 bps at tap 20
  tap  > 20: 200                                // floor, forever after</pre></div>
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
      <div class="step decided">craft 6 → Special Powerup (min. 3 phases, crafting counts against spend cap), 1 use/game — this <i>is</i> the cost of activating your politician's unique Special Power (see that section below), not a separate generic effect</div>
      <div class="arrow">↓</div>
      <div class="step decided">craft 12 → Nationwide Rally (min. 6 phases — must start almost immediately in a 10-phase game), 1 use/game, replaces the old random ⭐ roll entirely — <b>+5% nationwide</b>, applied to every state at once</div>
    </div>
    <div class="flow-card">
      <h3>📜 Agenda tie-in</h3>
      <div class="step decided">+2 tokens per completed agenda, up to +8 across 4 — scheduling flexibility only, doesn't raise the 20-token ceiling</div>
      <div class="arrow">↓</div>
      <div class="step decided">per-token popularity boost: <b>+5%</b>, flat, no decay — same value as a fresh investment tap, but free and reusable up to the caps above</div>
    </div>
  </div>
  <p class="section-note">One shared pool: spend, convert, or let a token go unused — all subject to the same caps. Agenda-bonus tokens buy timing flexibility, not more power.</p>
  <div class="example">
    <p class="label">Why 5%, not desktop's 8% or live code's 4%</p>
    <p>Investment decays from a 5% opening tap down to a 2% floor, but nothing gives rally tokens a decay curve — with a 2-play-per-state cap, you'd never rack up enough plays for decay to matter, so a single flat number is the right shape. Pricing that flat number at 8% (desktop's old value) would make a free token strictly better than grinding cash taps, undercutting investment as the game's default lever. Pricing it below investment's 2% floor makes tokens worse than a decayed-out cash tap despite being scarcer to earn — nobody would spend them on boosts at all. 5% matches investment's best-case fresh-tap value: a token is worth as much as a completely untouched state's first cash tap, minus the Cr cost, minus the ability to repeat it freely.</p>
  </div>
  <div class="example">
    <p class="label">Nationwide Rally's magnitude — decided 2026-07-22</p>
    <p>The old desktop-era "special" rally token (superseded — see <code>js/rally-system.js</code>, disconnected from the current <code>game-config.json</code>) applied a flat boost to every state on the map at once. Nationwide Rally inherits that nationwide-sweep role by name and by explicit lineage ("replaces the old random ⭐ roll entirely").</p>
    <p><b>+5% nationwide</b>, applied to every state simultaneously — reusing the same per-token anchor as the regular boost above rather than inventing a new number. Using the same nationwide-conversion logic as the policy-tags fix (2% nationwide ≈ 10.9 seat-equivalent), 5% nationwide ≈ <b>27 seat-equivalent</b> — roughly half of the single best agenda (Economic Liberalization, +51.8), which feels proportionate given Nationwide Rally costs 60% of a player's entire lifetime token budget (12 of 20) and has to be started almost immediately (6-phase minimum craft time in a 10-phase game). The breadth itself is the real reward: 12 tokens spent individually could never reach more than ~6 states before hitting the 2-per-state cap, so the sweep covers ground manual play structurally cannot.</p>
  </div>
  <div class="example">
    <p class="label">Implementation notes</p>
    <div class="table-wrap"><pre style="background:var(--paper);border:none;border-radius:0;margin:0;padding:12px 14px;font-family:var(--mono);font-size:12px;line-height:1.65;color:var(--ink);white-space:pre-wrap;">simpleTokenBoost_bps    = 500     // +5%, flat, no decay, per state per play
nationwideRallyBoost_bps = 500    // +5%, flat, applied to every state at once
                                   // (same redistribution rule as any other boost —
                                   //  runs per state, capped at 10000, opponent+Others
                                   //  split the loss proportionally, same as a normal tap)</pre></div>
  </div>
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
      <div class="step gap">redesigned 2026-07-22 — each policy sets its own support/oppose strength <i>per region it touches</i>, not one shared strength for the whole policy. See "How the effect formula actually works" below — decided, not yet migrated into <code>data/policy-tags.json</code>.</div>
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
    <p>National Defense supports <code>EasternBorder</code>/<code>WesternBorder</code> and opposed <code>CoastalIndia</code>/<code>HindiHeartland</code>. Six of the country's largest states (UP, Bihar, Gujarat, Rajasthan, Uttarakhand, West Bengal) were tagged with both a supported border region and an opposed one at once, netting to exactly zero there — while the states left with a clean, uncancelled effect skewed hard negative (big industrial/coastal states losing 12% outright; only small frontier states/UTs gaining it). Net effect computed against the real map: <b>−25.3 seat-equivalent</b> (meaning: nationwide, this policy's pull costs about as many seats as losing 25 outright would) — the single worst pick in the 23-policy pool. <b>Fix applied:</b> dropped <code>HindiHeartland</code> from <code>opposeTags</code>, leaving only <code>CoastalIndia</code>. This un-cancels UP (+9.6) and Bihar (+4.8) — the two biggest states in the overlap — and the remaining zero-net states (Gujarat, West Bengal) now cancel for a thematically real reason (both are genuinely coastal <i>and</i> border states), not an arbitrary Hindi-Heartland collision. New net effect: <b>+1.8 seat-equivalent</b> — no longer a trap pick. (Update: no longer the weakest in the pool either — see the full ranking below, computed after this fix landed.)</p>
  </div>
  <div class="example warn">
    <p class="label">Three policies with no region tags carry a flat +4% nationwide effect — bumped 2026-07-22</p>
    <p>Women's Empowerment, Healthcare, and Anti-Corruption have no <code>supportTags</code>/<code>opposeTags</code> configured — under the effect formula above, that computes to exactly zero, a dead pick. <b>Decided:</b> these three carry a flat, uniform nationwide popularity effect instead of a region-tagged one, originally set at +2% and strengthened to <b>+4%</b> to make them real contenders rather than a modest afterthought. Now recorded as <code>"nationwideBonus": 4</code> on all three entries in <code>data/policy-tags.json</code>. A flat 4% nationwide converts to roughly <b>+21.7 seat-equivalent</b> (4% × 543 seats) — comparable to a genuinely strong regional pick, not just "no longer a dead one."</p>
    <p><b>Do not implement this using <code>baseMagnitude</code>.</b> <code>generateCampaignGrid()</code> in <code>campaign-system.js</code> already has display logic that labels a zero-tag policy "+<code>baseMagnitude</code>% Nationwide" for UI purposes only — Healthcare's <code>baseMagnitude</code> is 12, Women's Empowerment and Anti-Corruption are 8. Applying that value as the real effect instead of the decided 4% would make Healthcare worth ~+65 seat-equivalent (still stronger than every other policy in the pool, including Economic Liberalization at +51.8) and the other two ~+43 each — roughly 3× and 2× overshoots respectively, smaller than the old 2%-baseline's 6×/4× gap but still wrong. Read <code>nationwideBonus</code>, not <code>baseMagnitude</code>, when this gets built.</p>
  </div>
  <h3>How the effect formula works</h3>
  <p>Tier is not a property of the policy as a whole — it's the strength of that policy's pull on <i>one specific region it touches</i>, chosen individually, region by region. The same region can react differently to different policies, both in direction and strength: Hindi Heartland might swing hard for Hindutva, hard against Secularism, and only mildly for or against something else — different policies, different numbers for the same region, not one shared value repeated everywhere. <code>supportTags</code>/<code>opposeTags</code> entries each carry their own strength, drawn from the same tier scale as before — tier 1 = 12%, tier 2 = 8%, tier 3 = 4% — just picked per region instead of once for the whole policy. (Note: "tier" here means this per-region magnitude bucket, not the Large/Mid/Small tiering used for Regional Dominance groups elsewhere in this document, and not a policy's own top-level <code>tier</code> field, which is unrelated.)</p>
  <p>A policy costing seats in one part of the country while gaining them elsewhere isn't a flaw to smooth away — real political platforms work exactly that way, and a politician may deliberately spend an agenda to lock down a core base at a cost elsewhere. The net-negative policies in the ranking below should be read in that light, not as bugs by default — though a few may still turn out to be accidental tag overlaps like pre-fix National Defense rather than deliberate polarization, worth an individual look.</p>
  <div class="example">
    <p class="label">Implementation notes</p>
    <div class="table-wrap"><pre style="background:var(--paper);border:none;border-radius:0;margin:0;padding:12px 14px;font-family:var(--mono);font-size:12px;line-height:1.65;color:var(--ink);white-space:pre-wrap;">costPerTap = 500                        // Cr, flat, any policy
completionPerTap = 25%                  // 4 taps = fully maxed

effect(state, policy) =
  if policy.nationwideBonus is set:  apply it flat, uniformly, to every state
  else:                              Σ policy.tagEffects[tag] for every tag the state has

// tagEffects replaces supportTags/opposeTags/baseMagnitude: one signed
// magnitude per region, e.g. National Defense = { EasternBorder: 12,
// WesternBorder: 12, CoastalIndia: -12 }. Not yet migrated in
// data/policy-tags.json (still the old shared-baseMagnitude shape) — the
// ranking below uses each region defaulted to its policy's current
// baseMagnitude until someone does the real per-region tuning pass.</pre></div>
  </div>

  <h3>Full policy ranking — computed 2026-07-22</h3>
  <p class="section-note">Every policy, run through the <code>Σ tagEffects[tag]</code> formula above against the real map, ranked by national seat-equivalent. Validated against the four figures already established elsewhere in this document (Economic Liberalization, Education, National Defense, the three nationwide-bonus policies), all of which this reproduces exactly. <b>The numbers below are unchanged from before this redesign</b> — expected, not a mistake: every region still defaults to its policy's old <code>baseMagnitude</code>, so the total per policy comes out identical until someone actually assigns different magnitudes to individual regions. This table will move once that tuning pass happens; right now it's a faithful re-derivation, not a new result.</p>
  <div class="example warn">
    <p class="label">The pool is 24 entries, not 23 — one is defined but unreachable</p>
    <p><code>data/policy-tags.json</code> defines 24 policies, not the 23 this document has referred to throughout. The reconciliation: <b>Privatization</b> is fully defined with real tags and a positive effect (+7.0 seat-equivalent, rank 10 of 24) but isn't assigned to <i>any</i> of the 20 politicians' agenda lists — every other policy is drawn by at least one politician, so it's the only one currently unreachable in actual play. "23-policy pool" elsewhere in this document describes what politicians can actually draw from, which is accurate; the data file just has one orphaned extra entry. Worth a decision: give Privatization to a politician, or drop it from the file since nothing references it.</p>
  </div>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Rank</th><th>Policy</th><th>Seat-equivalent</th></tr></thead>
    <tbody>
      <tr><td class="num">1</td><td class="feat">Economic Liberalization</td><td class="num">+51.8</td></tr>
      <tr><td class="num">2</td><td class="feat">Education</td><td class="num">+49.4</td></tr>
      <tr><td class="num">3</td><td class="feat">Women's Empowerment <span class="source-note">(nationwide)</span></td><td class="num">+21.7</td></tr>
      <tr><td class="num">4</td><td class="feat">Healthcare <span class="source-note">(nationwide)</span></td><td class="num">+21.7</td></tr>
      <tr><td class="num">5</td><td class="feat">Anti-Corruption <span class="source-note">(nationwide)</span></td><td class="num">+21.7</td></tr>
      <tr><td class="num">6</td><td class="feat">Judicial Activism</td><td class="num">+17.6</td></tr>
      <tr><td class="num">7</td><td class="feat">Press Freedom</td><td class="num">+12.4</td></tr>
      <tr><td class="num">8</td><td class="feat">Law and Order</td><td class="num">+8.3</td></tr>
      <tr><td class="num">9</td><td class="feat">State's Rights</td><td class="num">+8.1</td></tr>
      <tr><td class="num">10</td><td class="feat">Privatization <span class="source-note">(unused — see above)</span></td><td class="num">+7.0</td></tr>
      <tr><td class="num">11</td><td class="feat">Water and Mineral Rights</td><td class="num">+5.8</td></tr>
      <tr><td class="num">12</td><td class="feat">Hindutva</td><td class="num">+5.3</td></tr>
      <tr><td class="num">13</td><td class="feat">Infrastructure</td><td class="num">+3.0</td></tr>
      <tr><td class="num">14</td><td class="feat">National Defense <span class="source-note">(post-fix)</span></td><td class="num">+1.8</td></tr>
      <tr><td class="num">15</td><td class="feat">Rural Development</td><td class="num">+1.7</td></tr>
      <tr><td class="num">16</td><td class="feat">Land Reforms</td><td class="num">−6.0</td></tr>
      <tr><td class="num">17</td><td class="feat">Public Sector</td><td class="num">−7.0</td></tr>
      <tr><td class="num">18</td><td class="feat">Digital Transformation</td><td class="num">−7.5</td></tr>
      <tr><td class="num">19</td><td class="feat">Uniform Civil Code</td><td class="num">−9.6</td></tr>
      <tr><td class="num">20</td><td class="feat">Caste Reservation</td><td class="num">−10.2</td></tr>
      <tr><td class="num">21</td><td class="feat">Indigenous Rights</td><td class="num">−12.1</td></tr>
      <tr><td class="num">22</td><td class="feat">Agricultural Reforms</td><td class="num">−14.1</td></tr>
      <tr><td class="num">23</td><td class="feat">Hindi Language</td><td class="num">−16.8</td></tr>
      <tr class="verdict-row"><td class="num">24</td><td>Secularism — now the single worst pick in the pool</td><td class="num">−20.3</td></tr>
    </tbody>
  </table>
  </div>
  <div class="example">
    <p class="label">9 of 24 policies are net-negative nationally</p>
    <p>Ranks 16–24: Land Reforms, Public Sector, Digital Transformation, Uniform Civil Code, Caste Reservation, Indigenous Rights, Agricultural Reforms, Hindi Language, and Secularism (worst, −20.3) — more than a third of the pool. Worth auditing individually which of these are polarizing for a real thematic reason (Secularism genuinely cutting against Hindi Heartland and Pilgrimage) versus an accidental tag overlap nobody chose deliberately (the National Defense failure mode) — that distinction doesn't show up in the seat-equivalent number alone. Tier doesn't predict quality either: tier-1 "Mega Policy" agendas span the entire range, from the two best picks in the pool (Economic Liberalization +51.8, Education +49.4) to three of the four worst.</p>
  </div>
</section>

<section id="regional">
  <h2>Regional dominance</h2>
  <div class="flow-grid">
    <div class="flow-card">
      <h3>🎯 Trigger</h3>
      <div class="step decided">every single state in the group at 50% or higher — not an average across the group</div>
    </div>
    <div class="flow-card">
      <h3>🗺️ Groups</h3>
      <div class="step decided">15 groups, 5 per tier (Large / Mid / Small by seat count) — full membership lists in <code>data/states_data.json</code></div>
    </div>
    <div class="flow-card">
      <h3>💰 Payout</h3>
      <div class="step decided">payout = 5 Cr for every seat across all the group's states, added up — corrected from an earlier version that paid only a tenth of this</div>
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
  <div class="example">
    <p class="label">Implementation notes</p>
    <div class="table-wrap"><pre style="background:var(--paper);border:none;border-radius:0;margin:0;padding:12px 14px;font-family:var(--mono);font-size:12px;line-height:1.65;color:var(--ink);white-space:pre-wrap;">dominanceActive(group, player) =
  every state in group.members: player.pop_bps[state] ≥ 5000

payout(group) = 5 × sum(state.seats for state in group.members)     // Cr

→ re-evaluate dominanceActive every phase, not once — payout stops the instant
  any single member state drops below 5000 bps, even if it re-crosses later</pre></div>
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
  <p class="section-note"><b>Recomputed 2026-07-22</b> against the values decided this session (5% rally tokens, 5% Nationwide Rally, the exact investment decay formula) — replaces the earlier ~195 / ~278 figures below.</p>

  <div class="table-wrap">
  <table>
    <thead><tr><th>Scenario</th><th>Best-case seat total</th></tr></thead>
    <tbody>
      <tr><td class="feat">Cash only — full 12,500 Cr budget, optimally spread</td><td class="num">~203 / 543 (37.4%)</td></tr>
      <tr><td class="feat">Cash + full 20 tokens (12 crafted into Nationwide Rally + 8 played individually) + 2 strong agendas (Economic Liberalization, Education)</td><td class="num">~333 / 543 (61.3%)</td></tr>
      <tr class="verdict-row"><td colspan="2">Majority is comfortably reachable at the model's best case — a ~61-seat margin, not the ~6-seat razor's edge this table previously showed.</td></tr>
    </tbody>
  </table>
  </div>

  <p>Cash alone still cannot win under any circumstances — it's a hard mathematical wall, not a skill ceiling: the entire lifetime budget only buys enough popularity to add ~61 seats on top of a player's starting position, and 272 requires closing a much bigger gap than that. Tokens and agendas remain the only way to reach a majority — but the margin for using them well turns out to be much wider than previously modeled, for three separate reasons:</p>

  <div class="example">
    <p class="label">Why the combined-strategy number moved so much</p>
    <p><b>Starting position (~142 seats, up from ~135):</b> the old figure came from the fixed stronghold table this document has since replaced with a randomized generator (see Starting position, above). ~142 is that generator's expected value, averaged across a home state at baseline+25%, ~110 seats of drawn 35–65% advantage, and everything else at the 5–29% baseline — not a guaranteed number the way the old table was, so any individual match will land above or below it.</p>
    <p><b>Cash contribution at the reduced 8,500 Cr allocation (~42 seats, up from a ~21-seat estimate):</b> recomputed directly from the decay formula now documented in the Investment section's implementation notes — tapping every state once costs a flat 5,430 Cr regardless of which states (seats × 10 Cr/tap, but there are always exactly 543 total seats to tap once), so 8,500 Cr buys one full nationwide round of 5% taps plus a partial second round. This is a materially more rigorous number than the earlier estimate, computed with a formula that didn't exist in this document until this session.</p>
    <p><b>Token contribution (~48 seats, up from ~21):</b> partly the 4%→5% per-token increase, but mostly a strategy the earlier estimate didn't consider — crafting 12 of the 20 tokens into a Nationwide Rally sweeps <i>all</i> 543 seats at 5%, whereas 20 individually-played tokens are capped at 2-per-state and can only ever reach the biggest 10 states (worth ~38 seats, not ~48). Nationwide Rally beats individual play specifically because it reaches the medium and small states individual tokens structurally cannot touch.</p>
    <p>Agenda contribution (+101.2, Economic Liberalization + Education combined) is carried over unchanged — it wasn't affected by anything decided this session, and re-verifying it is already tracked below as its own open item.</p>
  </div>

  <div class="example">
    <p class="label">The ~61-seat passive-opponent margin is intentional — confirmed 2026-07-22</p>
    <p>This ~61-seat figure is a ceiling against an opponent doing nothing, not the number that matters for real play. The design intent: a real, adversarial opponent contesting the same states whittles this back down toward 272 — the two-active-player case (still unmodeled, tracked below) is expected to erode most or all of this margin, not treated as a threat to a razor-thin number that needs protecting. A wide passive-opponent ceiling is exactly what should be true if the game is meant to come down to a close race once both players are actually playing against each other, rather than each player racing a ghost.</p>
  </div>

  <div class="example">
    <p class="label">Agenda pick quality swings harder than the winning margin</p>
    <p>Full 24-policy ranking now computed (see the Agenda section above): national seat-equivalent ranges from <b>+51.8</b> (Economic Liberalization, best) down to <b>−20.3</b> (Secularism, now the actual worst pick, having overtaken pre-fix National Defense's old −25.3 once that policy was fixed) — a ~72-seat swing from a single agenda slot, against a margin that's no longer razor-thin (see above) but is still large relative to it. Nine of the 24 defined policies are net-negative nationally and none of them have had an individual audit the way National Defense got — worth doing before treating the roster as balanced.</p>
  </div>
</section>

<section id="open">
  <h2>Still open</h2>
  <p class="section-note">Everything else in this document — the redistribution rule, all category pipelines, the price scale, the group payout formula, the private-agenda model — is decided. These aren't yet.</p>
  <div class="open-card">
    <ul>
      <li><b>Individual special-power balance numbers</b> across the 20-entry roster — Rajinikanth flagged by name as needing a pass; the roster hasn't had a full cost/benefit audit. Now confirmed to include costing the 6-token Special Powerup craft, since that craft <i>is</i> how a politician's unique power gets activated, not a separate mechanic.</li>
      <li><b>Per-region magnitude tuning</b> — <code>tagEffects</code> (see Agenda section above) still defaults every region to its policy's old shared <code>baseMagnitude</code>; the real point of the redesign — different regions reacting with different strength to the same policy — needs an actual hand-tuning pass, plus migrating <code>data/policy-tags.json</code> to the new shape.</li>
      <li><b>Auditing the 9 net-negative policies for real vs. accidental polarization</b> — worth doing alongside the tuning pass above, to catch any accidental tag overlaps (the pre-fix National Defense pattern) hiding among deliberate ones.</li>
      <li><b>Privatization is orphaned</b> — defined with a real, positive effect (+7.0 seat-equivalent) but not assigned to any of the 20 politicians, so it's currently unreachable in play. Decide whether to give it to a politician or drop it from the file.</li>
      <li><b>Two-active-player seat ceiling</b> — every plausibility number above assumes a passive opponent, and best-case play now clears 272 by ~61 seats against that ghost. Design intent (confirmed 2026-07-22): a real adversarial opponent should whittle this back down toward 272, not leave the same wide margin — nobody has modeled the two-active-player case yet to confirm it actually lands there rather than overshooting into a blowout or undershooting into hung-parliament territory.</li>
      <li><b>Hung-parliament resolution</b> — given the above, worth deciding whether "neither player reaches 272" should stay a null/no-winner result, or resolve some other way (plurality tiebreak, a scored secondary-objective system). Not decided either way yet; flagged here as a live open question, not settled either direction.</li>
    </ul>
  </div>
</section>

<footer>
  <p style="margin:0 0 10px;">This document supersedes the narrower "economy status map" it started as — scope expanded 2026-07-22 to cover the full finalized design (core loop, win condition, starting position, and the politician/agenda roster), not just cost/boost numbers, per explicit request to keep one authoritative reference for the build cycle to target.</p>
  <p style="margin:0 0 10px;">Implementation note (carried over): <code>phase-system.js</code> used to fetch <code>game-config.json</code> independently of the rest of the app — that's why its fallback default had drifted to 500/phase against the real 1,000. Removed; it now shares <code>config-manager.js</code>'s <code>getGameConfig()</code> with every other system.</p>
  <p style="margin:0;" class="source-note">Sources: <code>design/plan.md</code>, <code>CHANGELOG.md</code> (decisions D1–D9, two unrelated series), <code>findings.md</code>, ADR-0004/0005, direct design decisions made 2026-07-22 (National Defense fix, nationwideBonus field), <code>data/policy-tags.json</code>, <code>data/politicians-data.json</code>, <code>data/states_data.json</code>, desktop <code>js/*.js</code> (cited via <code>findings.md</code>) vs. mobile <code>data/game-config.json</code> + <code>js/investment-system.js</code> + <code>js/phase-system.js</code>. <code>check_data_consistency.js</code> run 2026-07-22 after the policy-tags.json edits: clean (3 pre-existing, unrelated implementation-gap failures — <code>NortheastIndia</code>/<code>BorderLands</code> stale references, tracked separately as build status, not design status).</p>
</footer>
