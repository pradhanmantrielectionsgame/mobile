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
  <p class="subtitle">Every finalized mechanic, formula, and number in the game's design, consolidated from <code>design/plan.md</code>, <code>CHANGELOG.md</code>, <code>findings.md</code>, and direct design decisions — in one place, so the build cycle has a single document to target instead of four. As of 2026-07-23, everything marked <span class="pill decided" style="vertical-align:1px;">decided</span> is settled and should be built to; anything else is flagged with exactly what's still missing. <b>2026-07-23:</b> <code>design/plan.md</code> is now fully merged and deprecated — its still-relevant reference material lives in the Build status section near the end of this document; the rest was a pre-build roadmap now superseded by the finished mobile engine (see CLAUDE.md).</p>
</header>

<section id="legend">
  <div class="legend">
    <span class="label">Status key</span>
    <span class="pill decided">● decided</span>
    <span class="pill open">● open — mechanic set, number isn't</span>
    <span class="pill gap">● decided, not coded yet</span>
    <span class="pill assumed">◌ assumed — never explicitly revisited</span>
  </div>
  <p class="section-note" style="margin-top:10px;">This document describes the <b>design</b> — what the game is supposed to do. It does not track implementation status (what's actually wired up in <code>js/*.js</code> today); that's a separate, faster-moving concern. See <code>findings.md</code> for dated implementation-gap findings. Exception: the Known bugs section immediately below tracks the current playtest's open bug list directly in this document, per explicit request to keep one authoritative reference during this build-and-fix cycle.</p>
</section>

<section id="bugs">
  <h2>Mobile build — known bugs (2026-07-23), resolved 2026-07-24 pending on-device confirm</h2>
  <p class="section-note">Found in the first real on-device playtest of the finished single-player-vs-AI build. These were implementation gaps against the design already decided elsewhere in this document, not new design decisions. <b>Re-checked 2026-07-24 against current code and a live <code>npm test</code> run</b> (engine self-check + 5 full 10-phase simulated games + all 20 politician-power activations, invariants asserted throughout): all three read as already fixed. Marking resolved on that basis — code and an automated test suite are strong evidence, but neither is a substitute for the on-device playtest that originally caught these, so treat this as resolved-pending-confirmation until a real phone session verifies it directly.</p>
  <div class="open-card">
    <ul>
      <li><s><b>AI opponent never spends funds or acts, but the news ticker reports it completing agenda items anyway.</b></s> <code>aiStep()</code> in <code>mobile/game.js</code> (the current AI entry point — <code>runAI()</code> from the original report no longer exists under that name) actively spends funds every tick it's called: rally plays, token crafting, power/Nationwide-Rally activation, agenda taps, and investment, in that priority order. The news log only fires from calls inside those same real state-changing actions, so a mismatch between the AI's funds and the news feed isn't reproducible against current code.</li>
      <li><s><b>Starting-position randomizer is inconsistent — sometimes 120 seats (correct), sometimes 200 (wrong).</b></s> <code>generateStartingPosition()</code>'s draw loop (<code>mobile/engine.js</code>) enforces the &gt;100-to-stop / ≤130-to-take-a-state guards exactly as specified in this section's Implementation notes below, with no path that skips or double-applies them.</li>
      <li><s><b>P1% + P2% + Others% doesn't always sum to exactly 100% for a state.</b></s> The bps-sum invariant is asserted directly after every phase of all 5 games in <code>mobile/simulate.js</code>'s test run, and holds throughout — including after investment, rally, agenda, and special-power actions, the exact write paths this bug report was worried about bypassing the shared engine function.</li>
    </ul>
  </div>
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
      <div class="step decided">start: 5,000 Cr · refresh: 2,500 Cr/phase/player, independent — bumped 2026-07-24, see note below</div>
      <div class="arrow">↓</div>
      <div class="step decided">lifetime budget per player: 5,000 + 2,500×10 = <b>30,000 Cr</b>, hard cap</div>
    </div>
    <div class="flow-card">
      <h3>🗺️ Seats</h3>
      <div class="step decided">state seats = largest-remainder apportionment of popularity% across state's Lok Sabha seats — proportional, not winner-take-all</div>
      <div class="arrow">↓</div>
      <div class="step decided">whoever clears <b>272 of 543</b> nationally wins; both under 272 = hung parliament</div>
    </div>
  </div>

  <div class="example">
    <p class="label">Funds bumped 2,500/1,000 → 5,000/2,500 — decided 2026-07-24, backfilled into this doc 2026-07-24</p>
    <p>The original 2,500 Cr start / 1,000 Cr refresh figures (12,500 Cr lifetime) were the numbers this whole document — including every figure in the Plausibility check section below — was built against. They proved too tight in the user's own multi-round playtesting: insufficient funds to realistically reach a majority against the AI. Doubled to 5,000 / 2,500 (30,000 Cr lifetime) the same day, live in <code>data/game-config.json</code>'s <code>mobileEconomy</code> namespace ever since — but this document's prose and the Plausibility check table were never updated to match until this pass. This is a scale-only exception, same category as the desktop-vs-mobile economy-scale exception already noted elsewhere: it's not a comparison to desktop's numbers, and that comparison stays closed.</p>
  </div>
  <div class="example">
    <p class="label">Hung parliament resolution — decided 2026-07-22</p>
    <p>Neither player reaching 272 resolves differently depending on who Player 2 actually is (see <code>docs/adr/0001-player2-matchmaking-fallback.md</code> — Player 2 is either a matched human or an AI fallback, decided per match): a hung parliament against a <b>human</b> opponent counts as a <b>draw</b>; a hung parliament against the <b>AI</b> fallback counts as a <b>loss</b> for the human player. No plurality tiebreak, no secondary-objective scoring — the human is simply held to a higher bar than a draw when the opponent is a bot, since failing to beat the AI outright shouldn't be rewarded the same as fighting a real opponent to a stalemate.</p>
  </div>

  <div class="example warn">
    <p class="label">Seat-conversion rounding — decided 2026-07-23, replaces plain round()</p>
    <p>Rounding P1's and P2's seat shares independently (plain <code>round(popularity% × seats)</code>) can over-allocate a state: if two of the three shares (P1, P2, Others) each have a fractional remainder ≥0.5, both round up and the state hands out more seats than it has. Concrete break: a 3-seat state at P1 50% / P2 25% / Others 25% gives quotas of 1.5 / 0.75 / 0.75 — independent rounding gives 2 / 1 / 1 = <b>4 seats from a 3-seat state</b>. Fixed by switching to <b>largest-remainder apportionment</b> (Hamilton's method — the same algorithm real electoral systems use for proportional seat allocation): give every side its <code>floor(quota)</code> first, then hand out the state's leftover seats (state total minus the sum of floors — always a small non-negative integer, since the three quotas always sum exactly to the state's seat count) one at a time to whoever has the largest fractional remainder. Same example, correctly: floors are 1 / 0 / 0 (1 seat handed out), 2 leftover seats go to the two largest remainders (P2's 0.75, Others' 0.75, tied over P1's 0.5) → final 1 / 1 / 1, summing exactly to 3. Only P1's and P2's resulting seat counts matter for the win condition — Others still has to go through the same apportionment as a third party purely so the arithmetic reconciles; its seat count is never shown anywhere.</p>
    <div class="table-wrap"><pre style="background:var(--paper);border:none;border-radius:0;margin:0;padding:12px 14px;font-family:var(--mono);font-size:12px;line-height:1.65;color:var(--ink);white-space:pre-wrap;">apportionSeats(state):
  for each of P1, P2, Others:
    quota[x]  = pop_bps[x] × state.seats / 10000     // these three always sum exactly
                                                       // to state.seats — guaranteed by
                                                       // the bps redistribution rule
    floor[x]  = floor(quota[x])
    remainder[x] = quota[x] − floor[x]

  leftover = state.seats − (floor[P1] + floor[P2] + floor[Others])
             // always 0, 1, or 2 — never more than (number of shares − 1)

  give 1 extra seat each to the `leftover` shares with the largest remainder[x]
  // tie-break, deterministic: higher pop_bps wins; if still tied, fixed
  // order P1 > P2 > Others

  seats[x] = floor[x] + (1 if x got an extra seat, else 0)</pre></div>
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
      <div class="arrow">↓</div>
      <div class="step decided">a politician can carry more than one home state via the additive <code>secondaryHomeStates</code> array — added 2026-07-25 for Kejriwal (Delhi + Punjab, AAP's real second stronghold), since Delhi alone (7 Lok Sabha seats) gave a much smaller absolute bump than the mostly-Uttar-Pradesh-or-bigger homes the rest of the roster has. Each home state in the combined set gets its own independent +25%; the share-a-state tie-break above now applies per overlapping state, not per player, so an unrelated second home isn't nullified just because one of a player's homes happens to collide with the opponent's.</div>
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
    <div class="table-wrap"><pre style="background:var(--paper);border:none;border-radius:0;margin:0;padding:12px 14px;font-family:var(--mono);font-size:12px;line-height:1.65;color:var(--ink);white-space:pre-wrap;">Single actor, positive boost (cash tap, rally token, Nationwide Rally, or a
state whose net agenda effect came out ≥ 0 — see "net first, apply once" below):
  gain = min(boost_bps, 10000 − self_bps)
  opp_cut_raw = gain × opponent_bps / (opponent_bps + others_bps)
  opp_cut = round(opp_cut_raw)                 // round this side only
  others_cut = gain − opp_cut                  // derive, never round independently
  self += gain; opponent −= opp_cut; others −= others_cut

Single actor, negative boost (a state whose net agenda effect came out < 0 —
mirrors the gain case exactly, direction reversed):
  loss = min(−boost_bps, self_bps)             // can't lose more than you hold
  opp_gain_raw = loss × opponent_bps / (opponent_bps + others_bps)
  opp_gain = round(opp_gain_raw)               // round this side only
  others_gain = loss − opp_gain                // derive, never round independently
  self −= loss; opponent += opp_gain; others += others_gain

Both players act on the same state, same phase (compute against the pre-phase snapshot):
  for each player, compute gain / opp_cut_raw / others_cut_raw as above (unrounded)
  others_demand = p1's others_cut_raw + p2's others_cut_raw
  if others_demand > others_bps:
    scale = others_bps / others_demand
    both players' others_cut_raw ×= scale        // shrinks, doesn't redirect to opponent
    each player's actual gain = own opponent-facing cut + own scaled others_cut_raw
  round each player's final gain to the nearest bps, then split it into its
  two components (opponent-facing / others-facing) with the same round-one,
  derive-the-other rule as the single-actor case above
  // (the same-state-same-phase overdraw case only arises for gains pulling on
  // Others' pool — the two levers capable of a same-phase collision, Nationwide
  // Rally and Special Powerup, are both flat positive boosts, never agenda-driven,
  // so the negative/loss path never needs this collision handling)</pre></div>
  </div>
  <div class="example">
    <p class="label">Net first, apply once — required whenever a single action's effect on a state can be a sum of several signed parts (agendas today; any future multi-tag lever)</p>
    <p>A state can carry several of a policy's tags at once — some supporting, some opposing, at whatever per-region magnitudes are set. The only correct way to apply this: sum every matching tag's signed magnitude for that state into <b>one net number</b> first, then run that single net value through the redistribution engine exactly once (positive → the gain path above, negative → the mirrored loss path, zero → no-op). <b>Never apply each tag as its own separate transaction.</b> Two sequential transactions on the same state don't cancel out even when their magnitudes do on paper — the 100%-cap and the proportional opponent/Others split are both non-linear per transaction, so a +12 gain immediately followed by a −12 loss lands somewhere different from a true no-op once cap-clamping and per-transaction rounding are involved. A state at +12 support / −4 oppose nets to +8 and gets applied as a single +8 gain — not as a +12 transaction followed by a separate −4 transaction, and not any different in kind from the +12/−12 case above just because the two magnitudes happen not to be equal.</p>
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

<section id="interaction">
  <h2>Touch interaction &amp; feedback</h2>
  <p class="section-note">Decided 2026-07-23, from playtest feedback. Changes how a map tap resolves into an investment, and adds feedback the game currently has none of.</p>
  <div class="flow-grid">
    <div class="flow-card">
      <h3>👆 Tap model</h3>
      <div class="step decided">single tap on a state = select it (shows its detail panel) — replaces today's single-tap-invests behavior</div>
      <div class="arrow">↓</div>
      <div class="step decided">double tap on a state = invest in it (cost/boost per the Direct cash investment section above, unchanged)</div>
    </div>
  </div>
  <div class="example">
    <p class="label">Applies uniformly, including the small-UT button cluster — confirmed 2026-07-23</p>
    <p>The small UTs (Delhi, Chandigarh, Dadra &amp; Nagar Haveli and Daman &amp; Diu, Puducherry, Lakshadweep, Andaman &amp; Nicobar Islands) invest via a dedicated button cluster instead of a direct map tap (too small to hit reliably — see CLAUDE.md's UI conventions). Confirmed: those buttons also switch to single-tap-select / double-tap-invest, for consistency with every other investable target rather than keeping their old single-click-invest behavior as a special case.</p>
  </div>
  <h3>Feedback to add</h3>
  <div class="flow-grid">
    <div class="flow-card">
      <h3>✅ Valid double-tap invest</h3>
      <div class="step decided">quick circular flash centered on the tap point, in the state that was double-tapped</div>
    </div>
    <div class="flow-card">
      <h3>🚫 Invalid action (can't afford)</h3>
      <div class="step decided">quick shake + buzz (haptic) on the attempted target</div>
    </div>
    <div class="flow-card">
      <h3>💸 Funds spent</h3>
      <div class="step decided">brief red flash text, e.g. "−50 Cr", at the point of spend</div>
    </div>
    <div class="flow-card">
      <h3>💰 Funds received</h3>
      <div class="step decided">brief green flash text, e.g. "+50 Cr" — same treatment as spend, opposite color</div>
    </div>
  </div>
  <p class="section-note">All four are one-shot, non-blocking feedback — none should pause input or gate the next action, same discipline as "instant-only, no duration effects" for special powers below.</p>
</section>

<section id="audio">
  <h2>Audio</h2>
  <p class="section-note">Decided 2026-07-23 — the game has no sound wired up at all, despite <code>sounds/</code> already containing informatively-named files for each trigger.</p>
  <div class="table-wrap">
  <table>
    <thead><tr><th>File</th><th>Trigger</th></tr></thead>
    <tbody>
      <tr><td class="feat"><code>bg_music.mp3</code></td><td class="desc">Always on, looping, for the duration of a match.</td></tr>
      <tr><td class="feat"><code>cash_added.mp3</code></td><td class="desc">Whenever the player receives funds (phase refresh, agenda completion bonus, etc.) — pairs with the "+X Cr" green flash above.</td></tr>
      <tr><td class="feat"><code>money_spent.mp3</code></td><td class="desc">Whenever the player spends funds (investment tap, agenda tap, special power cost) — pairs with the "−X Cr" red flash above.</td></tr>
      <tr><td class="feat"><code>invalid_action.mp3</code></td><td class="desc">Whenever an action is attempted but can't be afforded — pairs with the shake+buzz above.</td></tr>
      <tr><td class="feat"><code>fanfare.mp3</code></td><td class="desc">Positive milestone — agenda completed, regional dominance bonus activated, or special power used. Confirmed 2026-07-23.</td></tr>
      <tr><td class="feat"><code>game_over.mp3</code></td><td class="desc">Match end — win/loss/hung-parliament results screen. Confirmed 2026-07-23.</td></tr>
      <tr><td class="feat"><code>phase_reset.mp3</code></td><td class="desc">Start of each new phase. Confirmed 2026-07-23.</td></tr>
      <tr><td class="feat"><code>rally_sound.mp3</code></td><td class="desc">Whenever a rally token is played (any individual State Rally token play). <b>Not</b> on crafting a Special Powerup or Nationwide Rally — confirmed 2026-07-23, crafting is explicitly excluded.</td></tr>
    </tbody>
  </table>
  </div>
  <p class="section-note">All eight triggers confirmed 2026-07-23.</p>
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
    <p><b>+5% nationwide</b>, applied to every state simultaneously — reusing the same per-token anchor as the regular boost above rather than inventing a new number. Using the same nationwide-conversion logic as the policy-tags fix (2% nationwide ≈ 10.9 seat-equivalent), 5% nationwide ≈ <b>27 seat-equivalent</b> — in the same range as the pool's best single agenda (Education, +33.0 post-rebalance; was Economic Liberalization at +51.8 before that fix, which would have made this comparison read "roughly half" instead), which feels proportionate given Nationwide Rally costs 60% of a player's entire lifetime token budget (12 of 20) and has to be started almost immediately (6-phase minimum craft time in a 10-phase game). The breadth itself is the real reward: 12 tokens spent individually could never reach more than ~6 states before hitting the 2-per-state cap, so the sweep covers ground manual play structurally cannot.</p>
  </div>
  <div class="example">
    <p class="label">Per-state token cap is shared, not per-player — deliberate, confirmed 2026-07-23</p>
    <p>The 2-plays-per-state cap is a shared lifetime pool, not 2-per-player — so a player can burn both slots on a state early specifically to permanently deny the other side any token access there, not just to boost it. Confirmed intentional: the denial play is symmetric — either player can do it, to any state, including ones the opponent hasn't touched yet — so it's a real tactical option available equally to both sides, not a one-sided exploit. Same category of deliberate asymmetric-cost tactic as "sabotage is cheaper than conquest" in Regional Dominance, above.</p>
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
      <div class="step decided">redesigned and migrated 2026-07-22 — each policy sets its own support/oppose strength <i>per region it touches</i>, not one shared strength for the whole policy. See "How the effect formula actually works" below — confirmed live in <code>data/policy-tags.json</code> (pill corrected 2026-07-24; the migration itself was already done, this card just hadn't been updated to say so).</div>
      <div class="arrow">↓</div>
      <div class="step decided">confirmed 2026-07-23 — each of the 4 taps applies exactly ¼ of the state's net effect, immediately, through the redistribution engine — not held back until 100% completion</div>
      <div class="arrow">↓</div>
      <div class="step decided">not contested between players — each player funds only their own 4, no shared race, no way to "win" a policy out from under an opponent</div>
    </div>
    <div class="flow-card">
      <h3>🎁 Reward</h3>
      <div class="step decided">+2 rally tokens per completed agenda, up to +8 across 4</div>
    </div>
  </div>

  <div class="example">
    <p class="label">The real budget trade-off — recomputed 2026-07-24 against the 30,000 Cr budget</p>
    <p>Maxing all 4 of a politician's agendas costs 8,000 of the 30,000 Cr lifetime budget — about 27% of everything a player will ever have — leaving 22,000 Cr for direct investment across the rest of the map. That's a real but much lighter trade-off than the 64%/4,500 Cr figure this section stated before the 2026-07-24 funds bump (see Core loop, above): agenda-heavy and investment-heavy builds are still different games, just less sharply forced apart than they used to be.</p>
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
    <p><b>Do not implement this using <code>baseMagnitude</code>.</b> <code>generateCampaignGrid()</code> in <code>campaign-system.js</code> already has display logic that labels a zero-tag policy "+<code>baseMagnitude</code>% Nationwide" for UI purposes only — Healthcare's <code>baseMagnitude</code> is 12, Women's Empowerment and Anti-Corruption are 8. Applying that value as the real effect instead of the decided 4% would make Healthcare worth ~+65 seat-equivalent (still stronger than every other policy in the pool) and the other two ~+43 each — roughly 3× and 2× overshoots respectively, smaller than the old 2%-baseline's 6×/4× gap but still wrong. Read <code>nationwideBonus</code>, not <code>baseMagnitude</code>, when this gets built.</p>
  </div>
  <h3>How the effect formula works</h3>
  <p>A policy's pull on the map isn't one shared strength — it's chosen individually, per region it touches. The same region can react differently to different policies, both in direction and strength: Hindi Heartland might swing hard for Hindutva, hard against Secularism, and only mildly for or against something else — different policies, different numbers for the same region, not one shared value repeated everywhere. <code>tagEffects</code> entries each carry their own signed strength directly (currently still defaulted from the old shared tier scale — 12/8/4 — until the real per-region tuning pass happens; see "Still open" below). The policy's own top-level <code>tier</code> field, and the whole tiered-magnitude concept it implied, has been removed from <code>data/policy-tags.json</code> entirely (decided 2026-07-22) — now that magnitude is set directly per region, there's no shared policy-wide strength left for a tier to describe. (Unrelated: the Large/Mid/Small tiering used for Regional Dominance groups elsewhere in this document is a completely different concept and is unaffected.)</p>
  <p>A policy costing seats in one part of the country while gaining them elsewhere isn't a flaw to smooth away — real political platforms work exactly that way, and a politician may deliberately spend an agenda to lock down a core base at a cost elsewhere. The net-negative policies in the ranking below should be read in that light, not as bugs by default — though a few may still turn out to be accidental tag overlaps like pre-fix National Defense rather than deliberate polarization, worth an individual look.</p>
  <div class="example">
    <p class="label">Implementation notes</p>
    <div class="table-wrap"><pre style="background:var(--paper);border:none;border-radius:0;margin:0;padding:12px 14px;font-family:var(--mono);font-size:12px;line-height:1.65;color:var(--ink);white-space:pre-wrap;">costPerTap = 500                        // Cr, flat, any policy
completionPerTap = 25%                  // 4 taps = fully maxed

netEffect(state, policy) =
  if policy.nationwideBonus is set:  apply it flat, uniformly, to every state
  else:                              Σ policy.tagEffects[tag] for every tag the state has
  // this Σ is the single net value — see #pot "net first, apply once":
  // it is computed once per state, then divided across taps as below —
  // never applied tag-by-tag as separate transactions.

perTapEffect(state, policy) = netEffect(state, policy) / 4
  // decided 2026-07-23: each of the 4 taps fires perTapEffect through the
  // redistribution engine immediately (gain path if positive, loss path if
  // negative) — proration is per tap, not withheld until 100% completion.
  // Mechanically identical to how investment taps already work (a sequence
  // of discrete boosts, each independently redistribution-capped), just flat
  // magnitude instead of decaying, and costs 500 Cr/tap instead of scaling
  // with seats. This is also why "hoard and burst-commit late" (see Agenda
  // section above) is a real trade-off and not a no-op: delaying a tap
  // delays exactly when its 1/4 share of the effect actually lands.

// tagEffects (migrated 2026-07-22): one signed magnitude per region, e.g.
// National Defense = { EasternBorder: 12, WesternBorder: 12, CoastalIndia: -12 }.
// Replaces the old supportTags/opposeTags/baseMagnitude/tier shape in
// data/policy-tags.json. Mutually exclusive with nationwideBonus — a policy
// has one or the other, never both. Migration was purely mechanical (support
// tag → +baseMagnitude, oppose tag → −baseMagnitude, per policy's old tier),
// so it reproduces every number in the ranking below exactly — verified by
// recompute_policy_ranking.js, which re-derives the same table directly from
// states_data.json + policy-tags.json and should be re-run after every future
// tuning-pass edit rather than re-deriving the table by hand.</pre></div>
  </div>

  <h3>Full policy ranking — computed 2026-07-22, retuned 2026-07-22</h3>
  <p class="section-note">Every policy, run through the <code>Σ tagEffects[tag]</code> formula above against the real map, ranked by national seat-equivalent — reproduced exactly by <code>recompute_policy_ranking.js</code>. Every region still defaults to its policy's old shared magnitude (12/8/4) <b>except Economic Liberalization and Education</b>, the two outlier fixes below — those two are the first entries in the per-region tuning pass, done ahead of the rest because they were flagged as structurally broken (see below), not because the general tuning pass is complete. Rest of the pool is still faithfully re-derived, unchanged.</p>
  <div class="example">
    <p class="label">Privatization no longer orphaned — resolved 2026-07-22</p>
    <p><code>data/policy-tags.json</code> defines 24 policies; <b>Privatization</b> (+7.0 seat-equivalent, rank 10 of 24) previously wasn't assigned to any of the 20 politicians' agenda lists. Fixed by swapping it into <b>Atal Bihari Vajpayee</b>'s roster in place of Economic Liberalization — thematically Privatization fits him better (his government ran the actual Disinvestment Ministry). Vajpayee's agendas are now Infrastructure, National Defense, Hindi Language, Privatization. The 23/24 distinction ("23-policy pool" vs. "24 defined") made earlier in this document no longer applies — all 24 are now reachable in play.</p>
  </div>
  <div class="example warn">
    <p class="label">Economic Liberalization and Education were a structurally different kind of imbalanced — fixed 2026-07-22</p>
    <p>Before this fix, these two ranked #1 (+51.8) and #2 (+49.4) by a wide margin over the rest of the pool — not because their magnitude was unusually high (both used the same tier-1 12% as several other policies), but because of <i>how</i> their tags were chosen: <b>Education had zero oppose tags at all</b> — <code>{ Education, Manufacturing }</code>, no downside anywhere, the only large multi-tag policy in the pool with no cost to any state (the three flat <code>nationwideBonus</code> policies also have no downside, but their magnitude is deliberately capped low precisely because they're uncontested). <b>Economic Liberalization</b> had three support tags that heavily co-occur in the same big industrial states (Gujarat carried all three at once, netting <b>+36</b> from a single policy) against one oppose tag (<code>AgriculturalRegion</code>) that barely overlapped those same states — 18 states gained, only Bihar and Punjab lost anything. Compare to a working polarizing policy in the same pool, e.g. Secularism: +29.5 seat-equivalent of gains (Bengal, Kerala, the Northeast) against −49.8 of losses (UP, Bihar, MP, Rajasthan) — genuinely two-sided, just skewed by which side holds more seats. Economic Liberalization and Education had no real "losing" side at all.</p>
    <p><b>Fix applied</b> — deliberately not a magnitude change, since the flat 12/8/4 scale itself stays as-is pending the full tuning pass:</p>
    <p><b>Economic Liberalization:</b> added <code>TribalLands: -8</code> and <code>NaturalResources: -8</code> alongside the existing <code>AgriculturalRegion: -12</code> — liberalization/industrialization read as also driving resource exploitation and tribal-land displacement, a real and distinct losing constituency from farmers. (An earlier version of this fix considered <i>replacing</i> <code>AgriculturalRegion</code> with the two new tags instead of adding them — rejected because it barely moved the total, +51.8 → +46.2, and made Maharashtra and Uttar Pradesh <i>worse</i> by removing their only existing cancellation.) New total: <b>+26.2</b>.</p>
    <p><b>Education:</b> no oppose tag added — there's no real thematic constituency that opposes education investment, so forcing one in would be an artificial cancellation rather than a genuine trade-off. Instead, both support magnitudes dropped from the shared tier-1 value (12) to tier-2 (8): <code>{ Education: 8, Manufacturing: 8 }</code>. New total: <b>+33.0</b> — now ranks <i>above</i> the retuned Economic Liberalization, which is the correct outcome: an uncontested-but-modest pick can reasonably beat a powerful-but-now-genuinely-costly one.</p>
  </div>
  <div class="example warn">
    <p class="label">Hindi Language had the exact same accidental-cancellation bug as pre-fix National Defense — fixed 2026-07-22</p>
    <p>Uttar Pradesh (80 seats) and Bihar (40 seats) — the two biggest Hindi Heartland states, along with Himachal Pradesh and Uttarakhand — were tagged both <code>HindiHeartland</code> (support, +8) <i>and</i> <code>EasternBorder</code> (oppose, −8), which canceled to exactly zero. Hindi Language's strongest natural supporters were contributing nothing, while the oppose side (<code>SouthIndia</code>, <code>EasternBorder</code>, <code>MinorityAreas</code>) fired freely elsewhere — and two of those three oppose tags heavily co-occur in the Northeast, so those states took a double hit on top of it. There's no clear thematic reason a state's border status should make it oppose Hindi-language policy specifically. <b>Fix applied:</b> <code>EasternBorder</code> reduced from −8 to <b>−4</b> (not dropped entirely — kept as a smaller, genuine factor rather than removed outright). New total: <b>−16.8 → −8.9</b>.</p>
  </div>
  <div class="example">
    <p class="label">Digital Transformation — genuine skew, not a bug, rebalanced 2026-07-22</p>
    <p>Two support tags (<code>Education</code>, <code>IndustrialCorridor</code>) rarely co-occur in the same state, while three oppose tags (<code>AgriculturalRegion</code>, <code>Pilgrimage</code>, <code>TribalLands</code>) often do — Bihar, Andhra Pradesh, Odisha, and Punjab each carry two of the three oppose tags at once, taking a double hit the support side had no equivalent way to match. Unlike Hindi Language, no accidental same-state cancellation was involved — this was a real support/oppose count imbalance, not a stray tag. <b>Fix applied:</b> both support tags raised from tier-3 (4) to tier-2 (8): <code>{ Education: 8, IndustrialCorridor: 8 }</code>, oppose tags unchanged. New total: <b>−7.5 → +10.2</b> — flips from net-negative to a solid mid-pack pick.</p>
  </div>
  <div class="example warn">
    <p class="label">Remaining net-negative audit, 2026-07-23 — two more accidental-cancellation bugs found and fixed, four confirmed as real polarization</p>
    <p><b>Uniform Civil Code had the exact same <code>HindiHeartland</code>/<code>EasternBorder</code> collision as pre-fix National Defense and Hindi Language</b> — UP, Bihar, Uttarakhand, and Himachal Pradesh (the same four states both earlier bugs hit) were canceling to zero because their border status opposed UCC while their Hindi-Heartland status supported it, with no thematic reason a state's border proximity should drive UCC opposition specifically (its real opposition constituency, <code>MinorityAreas</code>, was already correctly in place). <b>Fix applied:</b> dropped <code>EasternBorder</code> from oppose tags entirely, same technique as the National Defense fix. This un-cancels UP (+12) and Bihar (+12) — 120 seats between them. New total: <b>−9.6 → +14.0</b>, now ranked 7th of 24.</p>
    <p><b>Indigenous Rights canceled to zero in Madhya Pradesh and Jharkhand</b> — exactly the two states with the country's largest tribal populations and the most famous real tribal-land-vs-industry conflicts (Adivasi land rights against mining and industrial acquisition), where the policy's own core <code>TribalLands</code> support tag was being fully offset by an <code>IndustrialCorridor</code> oppose tag of equal magnitude. Unlike UCC this wasn't a stray unrelated tag — industrial encroachment on tribal land is a real, on-theme tension for this specific policy — so the fix was a partial reduction, not a removal, matching the technique already used for Hindi Language's <code>EasternBorder</code> (−8 → −4, not dropped). <b>Fix applied:</b> <code>IndustrialCorridor</code> reduced from −8 to <b>−4</b>; <code>Manufacturing</code> left at −8 as the primary industrial-opposition signal. This lets MP and Jharkhand's tribal-land identity net clearly positive (+4 each) instead of zero, while West Bengal (whose cancellation runs through <code>Manufacturing</code>, not <code>IndustrialCorridor</code>) is untouched. New total: <b>−12.1 → −2.5</b> — still the pool's second-worst policy, but no longer erasing its own most on-theme states.</p>
    <p><b>Four policies reviewed and confirmed as real polarization, not bugs — left unchanged:</b> <b>Land Reforms</b> and <b>Agricultural Reforms</b> both cancel to zero in UP, Karnataka, and Madhya Pradesh via <code>AgriculturalRegion</code> support against <code>IndustrialCorridor</code>/<code>Manufacturing</code> oppose, and go net-negative in Maharashtra and Haryana — but agrarian-vs-industrial tension in exactly those states (Maharashtra's industrial lobby, Haryana's 2020-21 farm-law protests) is a real, well-known fault line, not a stray tag collision. <b>Caste Reservation</b> cancels in Delhi and Chandigarh via <code>HindiHeartland</code> support against <code>Education</code> oppose — the "merit vs. reservation" debate is a genuinely education-centered, urban-elite political axis, and the seats at stake (8 total) are too small to matter either way. <b>Secularism</b> was already the design doc's own reference example of correctly two-sided polarization (see Digital Transformation's writeup above); its cancellations (Tamil Nadu, Punjab, Jammu & Kashmir) run through <code>Pilgrimage</code> opposing <code>Education</code>/<code>MinorityAreas</code> support, a coherent religious-identity-vs-secularism tension in each case, confirmed rather than re-litigated.</p>
    <p><b>Separate finding, not fixed — Public Sector's tag directions look inverted from real-world PSU politics, worth a human call:</b> Public Sector supports <code>AgriculturalRegion</code> and opposes <code>IndustrialCorridor</code>/<code>Manufacturing</code>, but India's actual public-sector enterprises (steel, heavy engineering, PSU banks) are concentrated <i>in</i> industrial and manufacturing regions, whose workforces are typically the ones benefiting from and defending public-sector jobs — agricultural regions have comparatively little direct stake either way. This reads like the tag polarity may be backwards rather than an accidental overlap with a single obvious fix, which is outside this audit's "find the stray tag" scope — flagging for a deliberate decision rather than guessing at new tag values unprompted.</p>
    <p>Net-negative count: <b>7 of 24</b> (down from 8) — Indigenous Rights, Land Reforms, Public Sector, Hindi Language, Caste Reservation, Agricultural Reforms, Secularism.</p>
  </div>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Rank</th><th>Policy</th><th>Seat-equivalent</th></tr></thead>
    <tbody>
      <tr><td class="num">1</td><td class="feat">Education</td><td class="num">+33.0</td></tr>
      <tr><td class="num">2</td><td class="feat">Economic Liberalization</td><td class="num">+26.2</td></tr>
      <tr><td class="num">3</td><td class="feat">Women's Empowerment <span class="source-note">(nationwide)</span></td><td class="num">+21.7</td></tr>
      <tr><td class="num">4</td><td class="feat">Healthcare <span class="source-note">(nationwide)</span></td><td class="num">+21.7</td></tr>
      <tr><td class="num">5</td><td class="feat">Anti-Corruption <span class="source-note">(nationwide)</span></td><td class="num">+21.7</td></tr>
      <tr><td class="num">6</td><td class="feat">Judicial Activism</td><td class="num">+17.6</td></tr>
      <tr><td class="num">7</td><td class="feat">Uniform Civil Code <span class="source-note">(fixed 2026-07-23)</span></td><td class="num">+14.0</td></tr>
      <tr><td class="num">8</td><td class="feat">Press Freedom</td><td class="num">+12.4</td></tr>
      <tr><td class="num">9</td><td class="feat">Digital Transformation <span class="source-note">(rebalanced)</span></td><td class="num">+10.2</td></tr>
      <tr><td class="num">10</td><td class="feat">Law and Order</td><td class="num">+8.3</td></tr>
      <tr><td class="num">11</td><td class="feat">State's Rights</td><td class="num">+8.1</td></tr>
      <tr><td class="num">12</td><td class="feat">Privatization <span class="source-note">(Vajpayee)</span></td><td class="num">+7.0</td></tr>
      <tr><td class="num">13</td><td class="feat">Water and Mineral Rights</td><td class="num">+5.8</td></tr>
      <tr><td class="num">14</td><td class="feat">Hindutva</td><td class="num">+5.3</td></tr>
      <tr><td class="num">15</td><td class="feat">Infrastructure</td><td class="num">+3.0</td></tr>
      <tr><td class="num">16</td><td class="feat">National Defense <span class="source-note">(post-fix)</span></td><td class="num">+1.8</td></tr>
      <tr><td class="num">17</td><td class="feat">Rural Development</td><td class="num">+1.7</td></tr>
      <tr><td class="num">18</td><td class="feat">Indigenous Rights <span class="source-note">(partial fix 2026-07-23)</span></td><td class="num">−2.5</td></tr>
      <tr><td class="num">19</td><td class="feat">Land Reforms <span class="source-note">(reviewed, real polarization)</span></td><td class="num">−6.0</td></tr>
      <tr><td class="num">20</td><td class="feat">Public Sector <span class="source-note">(tag direction flagged, see below)</span></td><td class="num">−7.0</td></tr>
      <tr><td class="num">21</td><td class="feat">Hindi Language <span class="source-note">(rebalanced)</span></td><td class="num">−8.9</td></tr>
      <tr><td class="num">22</td><td class="feat">Caste Reservation <span class="source-note">(reviewed, real polarization)</span></td><td class="num">−10.2</td></tr>
      <tr><td class="num">23</td><td class="feat">Agricultural Reforms <span class="source-note">(reviewed, real polarization)</span></td><td class="num">−14.1</td></tr>
      <tr class="verdict-row"><td class="num">24</td><td>Secularism — the single worst pick in the pool <span class="source-note">(reviewed, real polarization)</span></td><td class="num">−20.3</td></tr>
    </tbody>
  </table>
  </div>
  <div class="example">
    <p class="label">7 of 24 policies are net-negative nationally (down from 9 — Digital Transformation and Uniform Civil Code have both since flipped positive)</p>
    <p>Ranks 18–24: Indigenous Rights, Land Reforms, Public Sector, Hindi Language, Caste Reservation, Agricultural Reforms, and Secularism (worst, −20.3). Every net-negative policy has now had the same accidental-cancellation audit that first caught pre-fix National Defense: Hindi Language, Digital Transformation, and Uniform Civil Code were genuine bugs and are fixed; Indigenous Rights was a genuine bug and is partially fixed (its worst same-state cancellation removed, still net-negative on its own remaining merits); Land Reforms, Public Sector, Caste Reservation, Agricultural Reforms, and Secularism were reviewed and confirmed as real, thematically coherent polarization rather than stray tag collisions — see "Remaining net-negative audit, 2026-07-23" above for the state-by-state reasoning on each. Public Sector's tag <i>directions</i> (not an overlap) look potentially backwards and are flagged separately, unresolved. The old shared-magnitude tier (12/8/4, now removed from the schema — see Agenda section above) never predicted quality either: pre-rebalance, the policies that shared the top 12%-magnitude bucket spanned the entire range, from the two best picks in the pool (Economic Liberalization, Education) to three of the four worst — and those same top two turned out to be broken for a completely different reason than magnitude, unrelated to which tier bucket they started in.</p>
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
    <p class="label">Instant, event-based payout — decided 2026-07-24 (supersedes the phase-boundary version below)</p>
    <p>Originally paid as a recurring per-phase income stream, re-evaluated only at the start of each phase — a player who crossed the threshold mid-phase saw no reward until the next phase began, which read as "I qualified but got nothing" from a live playtest. Changed to an instant, event-based bonus: it pays the moment every member state is simultaneously ≥50%, checked right after every action that can move a state's popularity (investment, rally token, agenda tap, special power, Nationwide Rally) rather than waiting for the next phase boundary. It is a one-shot bonus per qualifying event, not a continuous income stream — holding the group across multiple actions in the same phase doesn't re-pay on every action, only on the transition into "qualified." Losing then regaining full dominance later pays the bonus again (see "sabotage" below), same amount each time.</p>
  </div>
  <div class="example">
    <p class="label">Sabotage is cheaper than conquest — still deliberate</p>
    <p>A single state dropping back under 50% immediately zeroes the group's qualified status (no more payouts until it's re-earned). Direct consequence of the strict per-state rule above, not a separate bug: it makes a losing player's cheapest counter-play "knock down one state" rather than "out-conquer the leader." Under the instant-payout model this also means the player who lost dominance gets nothing further from that group until they push all member states back to 50%+, at which point they collect the bonus again in full — regaining is exactly as expensive as first qualifying, so there's no cheap way to farm the payout by deliberately wobbling a state.</p>
  </div>
  <div class="example">
    <p class="label">Implementation notes</p>
    <div class="table-wrap"><pre style="background:var(--paper);border:none;border-radius:0;margin:0;padding:12px 14px;font-family:var(--mono);font-size:12px;line-height:1.65;color:var(--ink);white-space:pre-wrap;">dominanceActive(group, player) =
  every state in group.members: player.pop_bps[state] ≥ 5000

payout(group) = 5 × sum(state.seats for state in group.members)     // Cr

// game.dominanceHeld[group.key + '|' + player] tracks the last-seen active
// state per (group, player). Re-checked after every pop-changing action
// (mobile/game.js's applyRegionalDominancePayouts, called from investCash,
// playRallyToken, tapAgenda, activatePower, activateNationwideRally, and
// startPhase as a catch-all) — pays only on the false→true transition, and
// resets to false the instant any member state drops below threshold so a
// later re-cross pays again.</pre></div>
  </div>
</section>

<section id="mapviz">
  <h2>Map visualization — state color</h2>
  <p class="section-note">Decided 2026-07-23, from a playtest bug report: state fill color currently has no correlation to actual popularity numbers.</p>
  <div class="flow-grid">
    <div class="flow-card">
      <h3>🎨 Color spectrum</h3>
      <div class="step decided">each state sits on one spectrum: P1's assigned party color ↔ neutral ↔ P2's assigned party color</div>
      <div class="arrow">↓</div>
      <div class="step decided">P1 at 100% popularity in a state → that state renders at max P1 color; P2 at 100% → max P2 color; higher popularity for whichever player is ahead → higher color intensity</div>
    </div>
  </div>
  <div class="example">
    <p class="label">Intensity formula — decided 2026-07-23: margin-based</p>
    <p>Intensity is driven by the <i>margin</i> between the two players' popularity in that state (P1 60% / P2 55% reads as nearly neutral, a close contest), not by the leading player's raw % alone. The raw-% alternative was considered and rejected as incoherent: since P1% + P2% + Others% always sum to exactly 100% in a state, a player's raw % is never independent of the other two shares anyway — a high raw % can just mean Others is small, not that the opponent is being crushed. Margin is the only reading that actually reflects the two-player contest the spectrum is supposed to visualize.</p>
  </div>
  <div class="example">
    <p class="label">Implementation notes</p>
    <div class="table-wrap"><pre style="background:var(--paper);border:none;border-radius:0;margin:0;padding:12px 14px;font-family:var(--mono);font-size:12px;line-height:1.65;color:var(--ink);white-space:pre-wrap;">stateColor(state):
  leader = whichever of p1/p2 has higher pop_bps[state]      // tie → neutral
  margin = abs(p1.pop_bps[state] − p2.pop_bps[state])
  intensity = clamp(margin / 10000, 0, 1)
  return mix(neutralColor, leader.partyColor, intensity)

// Use fill-opacity, not opacity, if implemented as a neutral-base +
// colored-overlay approach — plain opacity also fades the SVG stroke, which
// can make a dimmed state's outline disappear entirely (Frontend technical
// rules, CLAUDE.md). Party colors: politicians-data.json's primaryColor
// field (already read for portrait-fallback initials in mobile/main.js).</pre></div>
  </div>
</section>

<section id="powers">
  <h2>Special powers</h2>
  <div class="flow-grid">
    <div class="flow-card">
      <h3>⚡ Rules</h3>
      <div class="step decided">resolve instantly, or last exactly one phase — never longer (revised 2026-07-26, see below; Modi's Demonetization is the first power using the one-phase category)</div>
      <div class="arrow">↓</div>
      <div class="step decided">matched cost + benefit, distinct verb, per politician — no two powers are the same mechanic reskinned (one deliberate exception: Nehru, see below)</div>
      <div class="arrow">↓</div>
      <div class="step open">6 of 20 powers reworked, Vajpayee's reviewed-and-kept 2026-07-22, remaining 13 given first-pass numbers by 2026-07-24 — none of the 20 have had a real balance/playtesting pass yet</div>
    </div>
  </div>
  <p class="section-note"><b>Revised 2026-07-26</b> — was "instant-only, no duration-based effects, ever." A duration-based effect that unlocks on the game's last phase has nothing left to apply to (a "frozen for 1 phase" effect popped on phase 10 of 10 does nothing) — that risk is real and still applies to the one-phase category below, it's just now an accepted tradeoff rather than a reason to ban the category outright. Explicitly still banned: anything that lasts <i>more than</i> one phase, or that resolves on a delay (e.g. "triggers at the start of the next phase," "decays over N phases") — that class of effect needs cleanup/expiry logic tracked across an open-ended number of phase transitions, which is real, ongoing engine complexity, not a single guard check. One-phase effects need exactly one flag, set on activation and self-clearing the moment <code>game.phase</code> moves past it (see Modi's <code>fundsFrozenUntilPhase</code> below) — bounded, cheap, and the same shape every time.</p>
  <div class="example">
    <p class="label">Sivaji Rao's One-Day Ordinance redesigned entirely — decided 2026-07-26</p>
    <p>Originally a funds-transfer power (steal 30% of the opponent's cash, -6% self-cost nationwide). First corrected to confiscation-only (matching the Kejriwal/Indira fix below) — but that broke its math: with no transfer to Sivaji Rao, a -6% nationwide self-cost was a genuine trap (modeled true value as low as -27 seats, never breaking even down to -1% self-cost). Rather than keep shrinking the cost toward a bare-minimum breakeven, redesigned entirely around his "one-day CM" archetype instead: instantly sets his popularity to 100% in his home state (Maharashtra), completely free (no cost beyond the shared craft) — total, if narrow, control of his own turf for exactly the one day he actually held office. Verified directly: Maharashtra snaps to a clean 10000bps for him, 0 for both the opponent and Others, funds and other states untouched.</p>
  </div>
  <div class="example">
    <p class="label">Narendra Modi's Demonetization is the roster's first power using the one-phase category — decided 2026-07-26</p>
    <p>Reworked from an instant flat funds removal (-2,000 Cr to the opponent) to a literal freeze: the opponent can't invest, tap agendas, or activate a funds-costing special power for one full phase (<code>pl.fundsFrozenUntilPhase</code> in <code>mobile/game.js</code>, checked at each of those three spend points, cleared automatically once <code>game.phase</code> moves past it — no separate cleanup step). Originally implemented as a one-off exception to a blanket instant-only rule; the rule itself was revised the same day (see above) to accept one-phase effects generally, once it was clear the implementation is just one shared guard function, not open-ended per-effect bookkeeping. Still carries the accepted late-game weakness by design: popped on the actual last phase, there's no next phase left to freeze, so it does nothing — reasoning for accepting that: tokens are easy enough to earn in practice that the special power is usually crafted and available well before the final phase, so the dead-window case is uncommon in real play.</p>
  </div>

  <h3>Six powers reworked 2026-07-22 — each had a different flaw</h3>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Politician</th><th>Power</th><th>What was wrong</th><th>Fix</th></tr></thead>
    <tbody>
      <tr><td class="feat">Sachin Tendulkar</td><td>National Icon</td><td>Cost was a timing gate ("final phase only") — a free power once phase 10 arrived, no real sacrifice.</td><td>+9% popularity nationwide; costs a flat 1,000 Cr instantly, any phase.</td></tr>
      <tr><td class="feat">Hema Malini</td><td>Star Power Rally</td><td>Cost was an eligibility condition ("only below national average") — free whenever usable.</td><td>+5% popularity nationwide; costs 500 Cr instantly.</td></tr>
      <tr><td class="feat">Rajinikanth</td><td>Thalaivar Announcement</td><td>Undefined "massive" benefit against a uniquely severe, permanent cost (locked all 4 remaining agendas for the rest of the game) — the roster's flagged outlier.</td><td>+20% popularity in South India + Maharashtra; costs 2,000 Cr instantly.</td></tr>
      <tr><td class="feat">Arvind Kejriwal</td><td>Anti-Corruption Raid</td><td>Cost was "forfeit rally tokens currently held" — zero if holding none, gameable by spending down first.</td><td>Reduces the opponent's cash on hand by 50% (seized/frozen, <b>not</b> transferred to Kejriwal — corrected 2026-07-26, the original "robs" framing implied a transfer that the mechanic didn't actually have a business reason to include); costs the <b>activating player</b> 15 points of their own popularity share, taken specifically in the opponent's home state — not a hit to the opponent's popularity, a real sacrifice of your own foothold there. Modeled true full-game value (fork test, not instant swing) at +3.5 seats — still worth using even without the transfer, since the cost is cheap (concentrated in one state) relative to denying half the opponent's war chest.</td></tr>
      <tr><td class="feat">Nitish Kumar</td><td>Alliance Switch</td><td>Value entirely contingent on the opponent's last agenda — worth nothing if they hadn't played one, wildly variable otherwise.</td><td>+7% popularity nationwide for you, −7% for the opponent; costs 1,000 Cr + 2 rally tokens.</td></tr>
      <tr><td class="feat">Jawaharlal Nehru</td><td>Non-Alignment</td><td>"Blocks the opponent's next special power" — worthless if they'd already used theirs.</td><td>If unused, secretly nullifies the opponent's power (they don't find out until they've already spent the tokens to craft it); if already used, grants a flat 2,000 Cr instead. Deliberately zero direct cost beyond the shared 6-token craft — confirmed 2026-07-23: the payoff is variable and contingent on something the activating player doesn't control (whether the opponent has already used their power), and that built-in gamble is treated as the power's cost in place of a separate resource sacrifice. The only power in the roster without one.</td></tr>
    </tbody>
  </table>
  </div>
  <div class="example">
    <p class="label">Vajpayee's Pokhran Test (+10% nationwide) reviewed and kept as-is</p>
    <p>Flagged during this pass as a concrete numeric outlier — +10% nationwide is exactly double Nationwide Rally's +5% for roughly half the token cost (Special Powerup's 6-token craft vs. Rally's 12) — but kept deliberately: special powers are one-time-per-game, and the roster can support one or two standout "signature" plays without that being a design flaw on its own. Used as the reference point for sanity-checking every other power's magnitude during this pass (e.g. Hema Malini's cost was raised specifically because her original proposal would have exceeded it for less).</p>
  </div>
  <div class="example">
    <p class="label">B.R. Ambedkar's home-state boost duplicated Mamata Banerjee's — fixed 2026-07-25</p>
    <p>Constitutional Reform and State Autonomy Stand were both "+15% popularity in your home state, source both" — identical benefit, Ambedkar's version just cost 1,000 Cr more (2,500 Cr vs Mamata's 1,500 Cr) for the same effect, with no upside. Raised Ambedkar's to 2,500bps (+25%), matching the same 1bps-per-Cr rate at his higher cost so the two are no longer a strictly-worse duplicate.</p>
  </div>
  <div class="example">
    <p class="label">Decided 2026-07-25 (superseding an earlier same-day draft): the 4 celebrity picks (non-politicians) are deliberately <b>stronger and quirkier</b> than the political roster, not weaker</p>
    <p>An earlier pass this session nerfed all three (lower magnitude + a new popularity-side downside) on the theory that "non-politician" should mean "glass cannon." Corrected same day: the actual intent is the opposite — celebrities are the fun, over-the-top wildcard picks, explicitly allowed to outdo the political roster's numbers (including exceeding Vajpayee's Pokhran Test, which stops being "the ceiling nothing else reaches" the moment a non-politician is deliberately built to reach past it). No popularity-side downside on any of the four; the "quirk" comes from a distinctive mechanic shape per politician, not a tacked-on cost:</p>
    <ul style="margin:4px 0 8px 22px;padding:0;">
      <li><b>Sachin Tendulkar, National Icon:</b> replaced the flat-bps mechanic entirely with a nationwide popularity <i>floor</i> (<code>toBps</code>, source both) — snaps every state below the floor up to it, does nothing where he's already stronger. First use of <code>toBps</code> at nationwide scope (previously only Sardar Patel's single small-UT snap). First set to 40% (<code>toBps: 4000</code>), modeled at ~92 seats if popped turn one; lowered to <b>30%</b> (<code>toBps: 3000</code>) 2026-07-25 as too strong at 40%, remeasured at ~50 seats turn one.</li>
      <li><b>Correction, same day, after two flawed re-tests:</b> an initial claim that this power "decays to 0 by phase 6" was an artifact of testing against Jawaharlal Nehru specifically — his special power secretly nullifies whichever opponent power activates first against him (a roster-wide interaction, not specific to this mechanic), and the AI used it mid-test, silently zeroing every sample. A follow-up "actually it grows over time" claim was also wrong, from a different bug: it tried to simulate Tendulkar investing too by reusing the AI's code via a player-object swap, but the AI's investment code writes into a hardcoded pop-bucket key, so the swap double-counted the opponent's gains instead of crediting Tendulkar's. <b>Properly re-tested</b> (Tendulkar investing directly via a headroom-greedy strategy each phase, against Modi — no nullify power involved): the seat value holds roughly <b>flat all game</b>, ~46–50 seats from phase 0 through phase 9. A sensible investment strategy already targets your weakest states first — the same territory this power operates on — but with 36 states and limited funds per phase, there's always a fresh pool of sub-30% states left for it to catch; it isn't "used up" by ordinary play.</li>
      <li><b>Hema Malini, Star Power Rally:</b> +8% nationwide, plus another independent +8% in her own home state (16% there total) — "the crowd goes wildest where they know her best," for the roster's cheapest special-power cost (500 Cr).</li>
      <li><b>Rajinikanth, Thalaivar Announcement:</b> +25% South India / +18% Maharashtra (asymmetric — bigger in his actual base) — the single largest regional swing in the roster, deliberately. This does mean he now clearly outclasses Jayalalithaa's Amma Welfare Scheme in South India specifically (hers: 1800bps for 2,500 Cr, no second region) — under this decision that's accepted, not a bug: a real political-roster figure isn't supposed to out-power the roster's showman pick in his own signature region.</li>
      <li><b>Amitabh Bachchan, Celebrity Endorsement:</b> 600bps → 1,500bps nationwide, keeping its existing quirk (source: "others" only — it can never take from the opponent, so the real payoff is capped by how much undecided share is actually left in each state; a high ceiling that's genuinely variable rather than guaranteed). Modeled (real seat math, opponent without a nullify power, Bachchan actually investing each phase): ~82 seats turn one, tapering to ~72–74 by mid/late game as both players burn through the shared national "Others" pool (avg. Others share nationwide drops from ~49% at kickoff to ~21% by phase 6, pushing ~20 of 36 states below the amount needed for a full-strength pull). Lowered to <b>1,200bps (12%)</b> 2026-07-26 as too strong at 1,500 — remodeled at ~66 seats turn one, ~58–60 mid/late game, same shape, scaled down.</li>
    </ul>
  </div>
  <div class="example">
    <p class="label">Indira Gandhi's National Emergency was mathematically backwards — fixed 2026-07-26, redesigned twice before landing</p>
    <p>Original shape: +8% popularity nationwide sourced from the opponent, costing -10% of her own popularity nationwide + 2,000 Cr. Because costs apply before benefits, and the -10% self-loss redistributes to <i>both</i> the opponent and Others, a chunk of her own self-inflicted loss handed the opponent ground before she clawed back only 8% — modeled at a net <b>-5 to -12 seats</b> for the activating player, i.e. the power left her worse off than doing nothing, every time.</p>
    <p>First fix attempt: replaced the "steal from opponent" framing with a direct nationwide suppression of the opponent's popularity (target: opponent, no self-cost beyond funds) — mathematically sound (modeled at +22 seats net for 2,000 Cr) but rejected as thematically wrong: the real 1975-77 Emergency was hugely unpopular for Indira specifically, so a version with no personal cost beyond cash misses the point entirely.</p>
    <p>Second fix attempt: "opponent loses use of rally tokens for the rest of the game" (a persistent lock, mirroring real-world jailing of the opposition) — rejected because it's duration-based, which breaks the roster-wide "resolve instantly only, no duration effects, ever" rule for exactly the reason that rule exists: popped on phase 9 of 10, "rest of the game" is one phase, making the power nearly worthless late — the same flaw that got Tendulkar's original timing-gated design rejected on 2026-07-22.</p>
    <p><b>Landed on:</b> an instant, one-shot seizure — 100% of the opponent's cash on hand <i>and</i> all of their currently-held rally tokens, costing -5% of her own popularity nationwide (see the correction below for why this became -3%). Thematically this reads as an authoritarian crackdown that raids the opposition's resources in one sweep — real backlash, real seizure, no persistent state. The self-cost magnitude was modeled properly this time: not as an instant seat swing (seizing funds/tokens has zero <i>immediate</i> effect on <code>nationalSeats()</code> since those are resources, not popularity — an instant-swing test only ever sees the self-cost side and looks artificially terrible) but as the actual full-remaining-game outcome, forking an identical game state at phase 3 into "power used" vs "power skipped" branches and comparing final seats. -10% self-cost: true value -22.5 seats (still a trap). -7%: -8.0. -5%: <b>+2.3</b>, the break-even point. -3%: +12.7. Settled on -5% specifically to keep a real, substantial "massively unpopular" cost rather than watering it down to the smallest number that clears zero.</p>
    <p><b>Correction, same day:</b> the first pass used <code>kind: "stealTokens"</code> (new engine primitive mirroring the existing <code>stealFundsPct</code> shape) for both effects — which, like <code>stealFundsPct</code>, transfers the seized amount to the activator, not just confiscates it. That's the right behavior for Kejriwal's and Sivaji Rao's powers (a robbery, explicitly framed that way), but wrong for Indira's — a seizure/confiscation, where the opponent's resources are destroyed, not routed into her own funds. Split into two new primitives instead, <code>seizeFundsPct</code> and <code>seizeTokens</code>, which zero out the opponent's holdings with no corresponding gain to the activator. This materially changes the power's real value (she no longer gets anything back for her self-cost, only denial), so the break-even self-cost moved: -5% is now net <b>-7.3</b> true seats (a trap again), -3% breaks even at <b>+3.2</b>. Re-settled at -3%.</p>
  </div>
  <p class="section-note">Remaining 11 (Modi, Manmohan Singh, Rahul Gandhi, Mamata Banerjee, Yogi Adityanath, Sardar Patel, B.R. Ambedkar, Jayalalithaa, Lal Bahadur Shastri, P.V. Narasimha Rao, Rajiv Gandhi) didn't have this audit's structural-flaw review, but as of 2026-07-24 all do carry concrete numeric costs and benefits in <code>data/politicians-data.json</code> — the "Large one-time funds boost" / "Large popularity boost" placeholder style this note used to describe is gone. What's genuinely still missing for the roster is a real balance/playtesting pass: these are first-pass numbers assigned by analogy to Vajpayee's Pokhran Test reference point, not numbers validated by simulation or play.</p>
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
  <p class="section-note"><b>Recomputed 2026-07-22</b> against the values decided this session (5% rally tokens, 5% Nationwide Rally, the exact investment decay formula) — replaces the earlier ~195 / ~278 figures below. <b>Recomputed again, same day</b>, after the Economic Liberalization / Education rebalance (see Agenda section above) dropped the combined agenda contribution from +101.2 to +59.2 — this materially shrinks the margin below, not just the ranking table. <b>Recomputed a third time, 2026-07-24</b>, against the 5,000/2,500 funds bump (see Core loop, above) — this widens the margin back out substantially; see below.</p>

  <div class="table-wrap">
  <table>
    <thead><tr><th>Scenario</th><th>Best-case seat total</th></tr></thead>
    <tbody>
      <tr><td class="feat">Cash only — full 30,000 Cr budget, optimally spread</td><td class="num">~281 / 543 (51.8%)</td></tr>
      <tr><td class="feat">Cash + full 20 tokens (12 crafted into Nationwide Rally + 8 played individually) + 2 strong agendas (Education, Economic Liberalization)</td><td class="num">~371 / 543 (68.4%)</td></tr>
      <tr class="verdict-row"><td colspan="2">Majority is reachable at the model's best case by a wide <b>~99-seat margin</b> — up from the ~19-seat margin this table showed before the 2026-07-24 funds bump. The passive-opponent ceiling this section warns about below applies with more force now, not less: a ~99-seat cushion is a lot more room for a real adversarial opponent to eat into before either figure becomes meaningful — see "Still open," below.</td></tr>
    </tbody>
  </table>
  </div>

  <p><b>Cash alone can now clear 272 on its own</b> in this idealized model — ~281/543, a ~9-seat margin — reversing this section's previous "hard mathematical wall" framing. That reversal comes entirely from the 2026-07-24 funds bump (12,500 → 30,000 Cr lifetime): the decay curve means cash has strongly diminishing returns per Cr spent in the same state, so tripling the budget more than tripled the seat yield by finally affording enough rounds across all 543 seats to close the gap alone. Read this as a property of the idealized "optimally spread, opponent does nothing" model, not a real-play guarantee — a real opponent contesting the same states the whole game is a very different proposition (see "Still open," below). Tokens and agendas still meaningfully widen the margin on top of cash alone, for four separate reasons (the first three unaffected by the 2026-07-24 change, the fourth is the change itself):</p>

  <div class="example">
    <p class="label">Why the combined-strategy number moved</p>
    <p><b>Starting position (~142 seats, up from ~135):</b> the old figure came from the fixed stronghold table this document has since replaced with a randomized generator (see Starting position, above). ~142 is that generator's expected value, averaged across a home state at baseline+25%, ~110 seats of drawn 35–65% advantage, and everything else at the 5–29% baseline — not a guaranteed number the way the old table was, so any individual match will land above or below it.</p>
    <p><b>Cash contribution at the 26,000 Cr allocation left after agendas (~122 seats, up from ~42):</b> recomputed directly from the decay formula documented in the Investment section's implementation notes — tapping every state once costs a flat 5,430 Cr regardless of which states (seats × 10 Cr/tap, but there are always exactly 543 total seats to tap once), so 26,000 Cr buys four full nationwide rounds plus a partial fifth. The ~42→~122 jump is the 2026-07-24 funds bump alone; nothing about the decay formula itself changed.</p>
    <p><b>Token contribution (~48 seats, unchanged):</b> tokens are earned from phase income and agenda-completion bonuses, not bought with Cr, so the funds bump doesn't touch this figure. Crafting 12 of the 20 tokens into a Nationwide Rally sweeps <i>all</i> 543 seats at 5%, whereas 20 individually-played tokens are capped at 2-per-state and can only ever reach the biggest 10 states (worth ~38 seats, not ~48). Nationwide Rally beats individual play specifically because it reaches the medium and small states individual tokens structurally cannot touch.</p>
    <p><b>Agenda contribution (+59.2, unchanged):</b> a property of the policy-tags pool (see the full ranking below), not of the funds budget — 500 Cr/tap is a flat cost regardless of lifetime budget size, so this figure is untouched by the 2026-07-24 change. Economic Liberalization and Education were the two best agendas in the pool specifically because they were structurally broken — near-zero real opposition anywhere on the map (see the fix above); +59.2 (26.2 + 33.0) is the honest post-fix figure.</p>
  </div>

  <div class="example warn">
    <p class="label">Superseded 2026-07-24 — this margin history is now three data points, not two</p>
    <p>Before today: ~6 seats (pre-rally-token-recompute) → ~61 seats (post rally-token recompute) → ~19 seats (post Economic-Liberalization/Education fix, the low point). The 2026-07-24 funds bump moves it again, sharply upward, to ~99 seats (see the table above) — the widest this margin has ever been in this document's history, and for the first time wide enough that the idealized cash-only scenario clears 272 on its own. None of the earlier reasoning here is wrong, it's just about a passive-opponent ceiling that has since moved again: a real, adversarial opponent contesting the same states was always expected to whittle any of these margins back down toward 272 (the two-active-player case remains unmodeled — see "Still open," below, which is more pressing now that the passive-opponent number has swung this far from 272).</p>
  </div>

  <div class="example">
    <p class="label">Agenda pick quality still swings hard, just no longer harder than the winning margin</p>
    <p>Full 24-policy ranking now computed (see the Agenda section above): national seat-equivalent ranges from <b>+33.0</b> (Education, best, post-rebalance) down to <b>−20.3</b> (Secularism, the worst pick, having overtaken pre-fix National Defense's old −25.3 once that policy was fixed) — a ~53-seat swing from a single agenda slot. Against the pre-2026-07-24 ~19-seat margin that swing was <i>3× the entire margin</i>, meaning agenda pick quality alone could plausibly decide a match on its own; against the current ~99-seat margin it's about half — still a large, match-relevant swing, just no longer larger than the margin itself. Eight of the 24 defined policies are net-negative nationally; Hindi Language has now had the individual audit the way National Defense (and Economic Liberalization/Education/Digital Transformation) got, but the other seven negative picks haven't — worth doing before treating the roster as balanced.</p>
  </div>
</section>

<section id="buildstatus">
  <h2>Build status &amp; roadmap</h2>
  <p class="section-note">Migrated from <code>design/plan.md</code> (the pre-build gap audit and roadmap, written 2026-07-20 before the mobile engine existed), now deprecated in favor of this single document. Most of that plan is historical — the core loop, AI opponent, agenda/special-power/token system, and politician roster it scoped out are all built (see CLAUDE.md). What's below is what's still genuinely relevant.</p>

  <h3>Tech stack &amp; deployment</h3>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Layer</th><th>Choice</th><th>Why</th></tr></thead>
    <tbody>
      <tr><td class="feat">Frontend</td><td class="desc">vanilla HTML/CSS/JS, no build step</td><td class="desc">Confirmed appropriate, not a rewrite candidate — see Architecture constraints in CLAUDE.md. Capacitor wraps this almost unchanged for iOS/Android; React Native/Flutter would buy nothing for a DOM/CSS-heavy, turn-based, non-performance-bound game.</td></tr>
      <tr><td class="feat">Static hosting</td><td class="desc">GitHub Pages</td><td class="desc">Live deployment target — <code>pradhanmantrielectionsgame.github.io</code>, auto-deploys from <code>main</code>. Free at this scale. As of 2026-07-23, <code>main</code> still serves the old pre-mobile-rebuild desktop-ported site — the finished <code>mobile/</code> build lives only on the local <code>mobile-ui-overhaul</code> branch and hasn't been pushed/merged yet.</td></tr>
      <tr><td class="feat">Multiplayer backend (if built)</td><td class="desc">Firebase or Supabase Realtime</td><td class="desc">Deliberately not stood up yet — see ADR-0001/0002 and CLAUDE.md: live human matchmaking is out of scope until requested.</td></tr>
      <tr><td class="feat">iOS/Android distribution (if pursued)</td><td class="desc">Capacitor</td><td class="desc">Wraps the existing web app almost unchanged; only needed for an actual app-store listing. $99/yr Apple Developer Program + $25 one-time Google Play Console apply only then.</td></tr>
    </tbody>
  </table>
  </div>

  <h3>Still not built</h3>
  <div class="open-card">
    <ul>
      <li><s><b>PWA infrastructure</b></s> — shipped since this was last checked (checked again 2026-07-24): <code>mobile/manifest.json</code> (standalone display, SVG icon), <code>mobile/sw.js</code> (cache-first service worker, explicit-filename precache list — see Local development &amp; testing in CLAUDE.md for why bare directory paths don't work there), and <code>assets/icons/pme-icon.svg</code> all exist, and <code>main.js</code> registers the service worker on load.</li>
      <li><s><b>AI difficulty/personality variety</b></s> — shipped since this was last checked (checked again 2026-07-24, found while reconciling this document — not one of the six divergences originally flagged): <code>mobile/game.js</code>'s <code>AI_PROFILES</code> array defines exactly the four originally-proposed profiles (aggressive-investor, policy-rusher, rally-spammer, group-bonus-rusher), and <code>pickAIProfile()</code> assigns one at random per match via <code>createGame()</code>. Still a personality-variety layer on the same greedy decision engine, not an adversarially-tuned difficulty ladder — that distinction in the original bullet still holds, just the "not built" part doesn't.</li>
      <li><b>Secondary/non-win-condition goals</b> — achievements like "swept a region" or "comeback from behind" for players who've already solved the win condition. Minor, low-priority idea carried over, not built.</li>
      <li><b>Help / tutorial control</b> — narrowed 2026-07-24 from a broader "options/settings menu" bullet: <code>mobile/main.js</code>'s settings overlay now has working Sound, Music, Pause/Resume, and New-Game controls (confirmed built, not stubs), so those four are done. Only a Help or tutorial entry point is still missing — no in-game explanation of the rules exists for a first-time player. Everything else plan.md's original "five gaps" flagged (AI opponent, start/end screens, action log, options menu) is now confirmed built in <code>mobile/</code> — politician-select screen and win/loss/hung-parliament end overlay both exist in <code>main.js</code>, the news ticker covers the action-log role, and the settings overlay covers everything but Help.</li>
    </ul>
  </div>
</section>

<section id="open">
  <h2>Still open</h2>
  <p class="section-note">Everything else in this document — the redistribution rule, all category pipelines, the price scale, the group payout formula, the private-agenda model — is decided. These aren't yet.</p>
  <div class="open-card">
    <ul>
      <li><b>Special-power balance/playtesting pass</b> — narrowed 2026-07-24: 6 of 20 (Tendulkar, Hema Malini, Rajinikanth, Kejriwal, Nitish Kumar, Nehru) had a real structural flaw fixed 2026-07-22 (zero-cost loopholes, an undefined severe permanent cost, or value contingent entirely on opponent behavior); Vajpayee's was reviewed and kept as the roster's deliberate outlier. The other 13 have since been given first-pass concrete numbers too (confirmed in <code>data/politicians-data.json</code> — no politician has an unassigned magnitude left), so this is no longer "13 still need numbers." What's still open for all 20 is a real balance/playtesting pass — none of these numbers have been validated against each other by simulation or play, only assigned by analogy to Vajpayee's reference point.</li>
      <li><b>Per-region magnitude tuning</b> — the <code>tagEffects</code> schema migration is done (see Agenda section above), but every region still defaults to its policy's old shared 12/8/4 magnitude; the real point of the redesign — different regions reacting with different strength to the same policy — still needs an actual hand-tuning pass. Re-run <code>recompute_policy_ranking.js</code> after any tuning edit rather than re-deriving the ranking table by hand.</li>
      <li><s><b>Auditing the remaining net-negative policies for real vs. accidental polarization</b></s> — resolved 2026-07-23, see "Remaining net-negative audit" under the Agenda section above. All 8 were audited: Hindi Language, Digital Transformation, and Uniform Civil Code were accidental-cancellation bugs (fixed); Indigenous Rights was too (partially fixed — un-canceled its core tribal-land states, still net-negative on the merits); Land Reforms, Public Sector, Caste Reservation, Agricultural Reforms, and Secularism were confirmed as real, deliberate polarization. One new, separate finding out of this pass: Public Sector's tag <i>directions</i> look potentially inverted from real-world PSU politics — flagged, not fixed, since that's a magnitude/direction judgment call beyond this audit's "find the stray tag" scope.</li>
      <li><s><b>Privatization is orphaned</b></s> — resolved 2026-07-22, given to Vajpayee (see Agenda section above).</li>
      <li><b>Seat-equivalent numbers still need the rest of the rebalancing pass</b> — Economic Liberalization, Education, Hindi Language, and Digital Transformation were fixed 2026-07-22 (see above); the other 20 policies still default to the old flat 12/8/4 magnitude and aren't fully trusted as final. Re-run <code>recompute_policy_ranking.js</code> and re-check the plausibility numbers (also above — sensitive to agenda seat-equivalents) after any further tuning edit.</li>
      <li><b>Two-active-player seat ceiling</b> — every plausibility number above assumes a passive opponent, and best-case play now clears 272 by <b>~99 seats</b> against that ghost (up from ~19 pre-2026-07-24, after the funds bump — see the Plausibility section above; the idealized cash-only scenario alone now clears 272, by ~9 seats). Design intent (confirmed 2026-07-22): a real adversarial opponent should whittle the margin back down toward 272, not leave the same wide cushion — with the passive-opponent cushion now the widest it's been in this document's history, whether it still lands anywhere near 272 once a real adversarial opponent is modeled, or stays comfortably clear of hung-parliament territory instead, is a more open question than ever. This is now the single most load-bearing unmodeled question in the document.</li>
      <li><s><b>Hung-parliament resolution</b></s> — decided 2026-07-22, see the Core loop section below.</li>
      <li><s><b>Seat-conversion rounding can drift the national total</b></s> — decided 2026-07-23, see the Core loop section above: switched to largest-remainder apportionment (Hamilton's method), guaranteeing P1 + P2 + Others always sums exactly to each state's seat count. Still worth a re-check once implemented against the plausibility numbers (above) — this changes the exact seat totals in edge cases, though not the shape of the margin finding above (now ~99 seats, post-2026-07-24 funds bump).</li>
    </ul>
  </div>
</section>

<footer>
  <p style="margin:0 0 10px;">This document supersedes the narrower "economy status map" it started as — scope expanded 2026-07-22 to cover the full finalized design (core loop, win condition, starting position, and the politician/agenda roster), not just cost/boost numbers, per explicit request to keep one authoritative reference for the build cycle to target.</p>
  <p style="margin:0 0 10px;">Implementation note (carried over): <code>phase-system.js</code> used to fetch <code>game-config.json</code> independently of the rest of the app — that's why its fallback default had drifted to 500/phase against the real 1,000. Removed; it now shares <code>config-manager.js</code>'s <code>getGameConfig()</code> with every other system.</p>
  <p style="margin:0 0 10px;">2026-07-23 design-review pass: clarified Kejriwal's Anti-Corruption Raid cost (paid by the activating player, in the opponent's home state — not a hit to the opponent), confirmed Nehru's Non-Alignment has no separate resource cost because its variable payoff is itself the cost, decided agenda effects apply ¼ per tap rather than only at 100% completion, confirmed the shared per-state rally-token cap's denial dynamic is deliberate and symmetric, and switched seat conversion from plain rounding to largest-remainder apportionment to eliminate national-total drift — see Core loop and Still Open.</p>
  <p style="margin:0 0 10px;">2026-07-23, first on-device playtest of the finished mobile build: logged two bugs (AI inactivity/news-ticker mismatch, starting-position randomizer landing on 200 seats) and four new decided specs (map color-by-popularity spectrum, tap-to-select/double-tap-to-invest, four new UI feedback animations, sound-file-to-trigger mapping) — see Known bugs, Map visualization, Touch interaction &amp; feedback, and Audio sections above. Same session: <code>design/plan.md</code> fully merged into this document (Build status section) and deprecated as a standalone file.</p>
  <p style="margin:0;" class="source-note">Sources: <code>design/plan.md</code> (deprecated 2026-07-23, merged above), <code>CHANGELOG.md</code> (decisions D1–D9, two unrelated series), <code>findings.md</code>, ADR-0004/0005, direct design decisions made 2026-07-22 (National Defense fix, nationwideBonus field), 2026-07-23 (special-power cost clarifications, agenda per-tap proration, rally-token denial confirmation, largest-remainder seat apportionment), and 2026-07-23 playtest session (bugs + map/interaction/audio specs above), <code>data/policy-tags.json</code>, <code>data/politicians-data.json</code>, <code>data/states_data.json</code>, desktop <code>js/*.js</code> (cited via <code>findings.md</code>) vs. mobile <code>data/game-config.json</code> + <code>js/investment-system.js</code> + <code>js/phase-system.js</code>. <code>check_data_consistency.js</code> run 2026-07-22 after the policy-tags.json edits: clean (3 pre-existing, unrelated implementation-gap failures — <code>NortheastIndia</code>/<code>BorderLands</code> stale references, tracked separately as build status, not design status).</p>
</footer>
