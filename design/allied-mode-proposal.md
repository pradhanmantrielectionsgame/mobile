# Allied Mode — Proposal / Discussion Notes

**Status: under discussion, NOT decided. Nothing built.** This captures a brainstorm
(2026-08-30) so it can be picked up later without re-deriving. The user wants to
think more before committing. Where the user has leaned one way, it's marked
**(leaning)**; genuinely open points are in "Open questions".

## The idea in one line

A new gameplay axis: regional politics. Parts of the map become **regional
fortresses** that resist both players, and the way through them is to **ally with
the regional force holding that turf** — which you earn by committing to the
agenda that force cares about.

It's one system with two player-facing parts (fortresses + allies), not two
features.

---

## Part A — Regional strongholds ("Others" as a regional force)

### What it models

Real regional parties (DMK/AIADMK, TMC, BJD, AAP, BRS, JD(U), the NE regionals)
have entrenched strongholds where national parties genuinely struggle. Today the
game treats every state as equally winnable for p1/p2, which is both unrealistic
and makes the map bland. Fortresses fix that.

### Mechanic: scripted resistance, NOT a literal third player **(decided in discussion)**

The engine's **output side is already 3-way** but its **input side is rigidly
2-way**:

- `pop[svgId]` is `{p1, p2, others}` in basis points everywhere. `apportionSeats()`
  and `nationalSeats()` already split seats across `['p1','p2','others']` — Others
  already wins seats (~70–95 per game in sim output). Starting position already
  makes Others the largest bloc (~66% mean; `randInt(rng, 500, 2900)` per player).
- BUT `otherPlayer(actor)` is `actor === 'p1' ? 'p2' : 'p1'` — a hard binary,
  called inside `gainAt` / `loseAt` / `resolveSimultaneousGain` / `computeScore` /
  the starting draw / the AI scorer. `startPhase` and all three payout functions
  hard-code `['p1','p2'].forEach`. The whole action layer + `aiStep` assume the
  actor is p1 or p2.

`gainAt` is "the one mechanic every lever routes through." Making Others a real
spending actor means rewriting it to be genuinely 3-way plus auditing every
`['p1','p2']` loop plus driving a third agent through `aiStep` under the
human-fair-pacing rule plus fixing `simulate.js` / `balance-sim.js`. Wide blast
radius through the most load-bearing, most carefully-rounded code in the project.

Scripted resistance operates **only on the output side** — it nudges `pop`
directly at phase boundaries, which the seat math already understands. Not a hack;
working with the grain. If a real 3-way FFA mode is ever wanted, do the
`otherPlayer` rework *then*, for a feature that exists.

### Simplest viable logic — hidden, so it can be dumb **(leaning)**

The resistance mechanism is invisible to the player, so it does not need to be
smart. A player can't distinguish "reactively defended the weak point" from "flat
amount into each stronghold every phase." So:

- At game start, pick ~6 strongholds from a curated pool, seeded from `rng`
  (exclude both players' home states). Bias those states' starting `pop` toward
  Others (~50–60% there, concentrated so it survives longer than the incidental
  national average).
- Each phase boundary: `reclaimToOthers(pop, actor, bps)` — move a flat amount of
  share off p1 and p2, back to Others, in each stronghold.

### Three things that still need care (none are "complexity")

1. **It's basis points, not crores.** The engine has no Others-spends-money path.
   "Drop ₹X Cr into a state" → "move Y bps off p1 and p2 there." Keep a crore
   framing only as log flavor if desired. Config: `resistanceBpsPerStatePerPhase`
   (illustratively 100–150; **sim-tune, don't reason from first principles** per
   the project's balance rules).
2. **Keep exactly one piece of logic: the fade.** A flat schedule for all 10
   phases makes strongholds *permanently* hard and kills the "fades late, break
   through at the end" dynamic (the user liked this — mirrors "Others gets no
   refreshers"). Give it a stop: either `resistancePhases: 7` (hard cutoff) or a
   depleting `reserveBps` per state (~700–900, spent down each phase → cracks at a
   slightly different phase each game). **Leaning: the budget** — one
   `reserve -= spent` line, gives natural game-to-game variance.
3. **Split the reclaim evenly from p1 and p2**, not from whoever leads that state.
   Hitting the leader is stealth rubber-banding. `reclaimToOthers` clamps to what
   each actually holds, so no overshoot. Side effect: holding ground in a fortress
   costs ~one extra invest tap per phase there — real opportunity cost, fits the
   action-economy principle.

### Stronghold candidate pool (~12, draw 6)

Tamil Nadu, West Bengal, Odisha, Delhi, Punjab, Telangana, Andhra Pradesh, Kerala,
Bihar, Jharkhand, the Northeast (as one unit — matches the existing `#neBtn`
quick-invest group), J&K. Refine against `states_data.json`.

---

## Part B — Hidden regional allies

### Anonymity — keep identities hidden **(decided in discussion)**

Not "Ally with Shiv Sena" — "Ally with Ally 1" (or an invented flavored name like
"the Konkan Front"). Reasons:

1. **Attribution risk.** "Shiv Sena wants Hindutva" is a claim about a live
   political actor — different from the game having Modi/Yogi/Mamata as playable
   characters with documented public records. Hidden identity = deniability, and
   "outsiders often don't understand how/why alliances form" justifies the hidden
   unlock gate *diegetically*.
2. **Future-proofing.** Real regional parties split, merge, and switch sides
   constantly. Hard-code Shiv Sena and the game ages badly at every realignment.
   Invented profiles never go stale, and there's less to keep in sync with reality.

The player still sees the **region** (it's on the map). Hidden = the party name
and the unlock reason, not the geography. Claude leaned toward invented flavored
names over bare "Ally N" to preserve the political texture that is the game's
whole appeal; user has not confirmed which. (Open question.)

### Agenda-gated unlocks **(strong idea, leaning yes)**

Certain alliances open only after a specific agenda is invested in (e.g. an ally
opens if Hindutva is maxed). Why it's good:

- Turns agenda choice into a strategic *key*, not just a popularity lever — a
  Hindutva build unlocks different allies than a welfare build.
- Reuses `agendaProgress` / `tapsToComplete` as-is. Maxing one agenda is 2,000 Cr /
  4 taps — cheap enough to unlock 2–3 allies a game if you prioritize.
- Creates build diversity and matchup texture.

Concerns:
- **Discoverability** — a first-time player has no way to know "max Hindutva →
  this ally." Needs at least a hint, or accept it's learned over repeated games
  (fits the existing unlock-progression loop).
- **4-agenda ceiling** — a politician can only ever unlock allies tied to their 4
  agendas. Fine thematically, but ally variety is semi-predetermined by your pick.
- Not every regional party has a clean single-agenda hook (Shiv Sena↔Hindutva is
  obvious; TMC / BJD / TDP are fuzzier).
- **Leaning: tiered** — partial agenda progress unlocks a weak ally, maxed unlocks
  the strong one.

### Compatibility check — some fortresses are un-allyable for your pick **(decided in discussion)**

"The Left won't ally with BJP for ideological reasons" is exactly the texture worth
having. The hidden profile needs a compatibility check *against your politician*
(party / agenda kit), not just an agenda gate. A BJP pick simply cannot open the
Left-analog force, max whatever you like.

- Player experiences this as "that force never came to the table" — and with
  anonymity, they don't know why, which is thematically perfect.
- Each game: some of the 6 strongholds are alliable, some are permanent walls.
  SouthIndia dominance (etc.) is just off the table some runs. Fine — 1 of 15
  groups, draw changes each game.
- **UX mitigation to consider:** a late soft signal ("talks have broken down") so
  a player isn't grinding all game toward a mathematically impossible unlock with
  zero feedback. Still no name, no reason.
- This also intentionally interacts with the regional-dominance AND-gate: a
  fortress you can't ally is a permanent veto on its groups. Thematically accurate,
  accepted.

### How allying resolves a stronghold — OPEN

Options: (a) stop that stronghold's resistance for the rest of the game;
(b) transfer most of the Others share in that region to you; (c) full flip.
**Leaning: (a) + (b)** — stop the pushback and swing most of the Others share
over. Not decided.

---

## How the two parts connect

The 6 stronghold "Others" forces **are** the hidden ally profiles. You neutralize
a fortress by allying with its incumbent, which requires committing to that
party's agenda (and not being ideologically incompatible with it). "Bengal is
locked up by Ally 2 this game → Ally 2 wants State's Rights → max it → Bengal
swings to me." Complete axis: the map has gates, agendas are the keys, alliance
converts an obstacle into a stronghold.

---

## Optional / advanced-mode only **(decided in discussion)**

Ships as an opt-in toggle for advanced players, not the default:

- Novices get the current clean game.
- **`balance-sim.js` runs the base game** — so the harness's roster win-rate
  readings aren't distorted by fortresses eating seats unevenly across politicians.
  This also neutralizes the main hung-parliament worry (see Risks).
- Toggle lives in the existing settings overlay or as a mode pick on the select
  screen; `localStorage` persists it like unlocks/charges. Free toggle (a warning
  label, not a grind-gated lock).
- **Replays need a `mode` flag** (the record already carries `v` for version) so
  an advanced-mode replay doesn't desync on a base-mode client.

Flags the user accepted going in:
- Playtester-pool fragmentation (base vs advanced splits an already-small cohort).
- "Optional" tends to become mandatory — if it's good, everyone toggles it on and
  the base game becomes de-facto tutorial mode; you still maintain and balance both.

---

## Risks

- **Hung-parliament inflation** — fortresses pull ~40–70+ seats out of easy reach.
  The AI-vs-AI sim already draws 48–98% of games. *But* the user reports routinely
  crossing 300 vs the AI in real play (and a 341–143 blowout report exists), so
  human games are far more decisive than the sim — this friction is arguably
  wanted. Largely neutralized by advanced-mode-only (sim runs base game). Still
  run a sim before shipping.
- **Regional-dominance AND-gate** — an un-allyable fortress permanently vetoes its
  groups. Accepted as thematically accurate (see Part B).
- **Home-state overlap** — exclude both players' home states from the stronghold
  draw, or a regional pick (Mamata, Nitish) fights their own turf.
- **Ally variety constrained by your 4 agendas** — semi-predetermined by pick.

---

## Open questions (the decision list)

1. Invented flavored ally names vs bare "Ally N".
2. Stronghold list: weighted draw from the ~12 pool, or a fixed thematic set.
3. **Do players see which 6 states are strongholds this game, or discover it
   through play?** (The un-allyable-fortress case makes pure opacity read as
   "Bengal is inexplicably sticky and I'll never know why." Tying the reveal to an
   ally-unlock prompt fixes the allyable ones only.)
4. Fade mechanism: hard `resistancePhases` cutoff vs depleting `reserveBps`
   budget. (Leaning budget.)
5. Unlock: tiered by agenda progress vs binary at max. (Leaning tiered.)
6. How allying resolves a stronghold: stop pushback / partial transfer / full flip.
   (Leaning stop + partial transfer.)
7. Does the AI opponent recruit allies too, or is the ally system player-only with
   Others as the shared environmental force? (Claude leaned player-only — far less
   balancing surface. Not confirmed.)

---

## Rough implementation surface (for whoever picks this up)

Grep/re-verify line numbers — code moves.

- **`mobile/engine.js`**: add `reclaimToOthers(pop, actor, deltaBps)` (~6 lines,
  same round-one-derive-the-other discipline as `gainAt`/`loseAt`). Bias
  strongholds in `generateStartingPosition` (or a post-process pass on `pop`).
  `apportionSeats` / `nationalSeats` / `finalizeGame` — **no change**.
- **`mobile/game.js`**: in `createGame`, pick strongholds from `game.rng` + init
  `game.othersReserve` (or phase counter) + `game.strongholds`. Add
  `applyOthersResistance(game)`, call it from `startPhase` (after the snapshot,
  before payouts). Ally state: `game.allies` (per-stronghold: revealed?, unlocked?,
  allied?, compatible-with-this-pick?). Ally unlock check hooks off `agendaProgress`
  in whatever advances it. `aiStep` — no change if allies are player-only.
- **`game-config.json`**: new additive `mobileRegional` (or `mobileAllies`)
  namespace alongside `mobileEconomy` — `resistanceBpsPerStatePerPhase`,
  `reserveBps` / `resistancePhases`, stronghold count, agenda-unlock tiers.
- **`data/`**: ally profiles — new file `data/regional-allies.json` (hidden name,
  home region svgIds or a `states_data.json` group key, agenda unlock gate,
  incompatible parties/agendas, effect magnitude). Keep it JSON per the
  data-over-hardcode convention.
- **`data/politicians-data.json`**: already has `party` / `policies` / `homeState`
  — the compatibility check reads these, no schema change expected.
- **`mobile/main.js`**: advanced-mode toggle (settings overlay), `mode` on the
  replay record, map rendering for revealed strongholds + allied regions, an
  ally-opportunity prompt, the "talks broke down" soft signal. `GAME_VERSION` bump.
- **`mobile/index.html`**: ally strip UI — the map's dead NE/SE zones are the
  intended home for floating panels (per CLAUDE.md). Respect the "no tabs,
  everything visible" rule.
- **Tests**: `simulate.js` / `balance-sim.js` run base mode (no change needed if
  advanced-only). A determinism check on the stronghold draw + resistance schedule
  (must be pure from seed).
- **`docs/wiki.html`**: update once/if this ships — it's the authoritative
  finalized-design reference.
