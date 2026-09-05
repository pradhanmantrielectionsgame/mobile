# PradhanMantri Elections Game

**[▶ Play now — pradhanmantrielectionsgame.com](https://pradhanmantrielectionsgame.com/)**

A turn-based election strategy game played on an interactive map of India. Pick a leader, campaign across 28 states and 8 union territories, and try to clear 272 of 543 Lok Sabha seats before the tenth phase runs out. Single player, against a computer opponent that adjusts to how well you are doing.

Free, no ads, no account, no data collection. Runs in the browser on any phone.

---

## How to play

You and your rival each hold a share of every state's popularity. The rest sits with the undecided middle. Everything in the game is a way of pulling that share your way.

**The match**

- 10 phases, about 45 seconds each. Both sides act at the same time — there is no waiting for a turn.
- You start with ₹5,000 Cr and collect ₹2,500 Cr at the top of every phase.
- Each state's seats split in proportion to popularity, so a state is never all-or-nothing.
- First to **272 of 543** seats wins. If nobody gets there by the end of phase 10, it is a hung parliament — a draw.

**Four ways to spend**

| | What it does |
|---|---|
| 💰 **Invest** | Tap a state to put cash into it. The first tap on a state is the strongest; keep hammering the same state and each tap does less. Cost scales with the state's size, so spreading out beats obsessing. |
| 📢 **Rally tokens** | You earn 2 a phase and can play 2 a phase. A rally is a flat boost with no falloff. Only 2 rallies ever land on a given state — across *both* players — so you can also use one to lock your rival out. |
| 📜 **Agendas** | Your leader has 4 signature policies. Funding one shifts opinion in the regions that care about it, and hurts you in the regions that don't. Completing one pays out extra rally tokens. |
| ⭐ **Special power** | Save up 6 rally tokens to craft your leader's unique one-shot move. Save 12 for a Nationwide Rally that boosts every state at once. |

**Regional dominance** — hold *every* state in a region above 50% and the region pays a lump sum, plus a small stipend each phase you keep it. Every state, not an average — one stubborn holdout denies you the whole thing.

**Difficulty** finds its own level. Win three in a row and the AI steps up; lose three and it steps down. Eight levels. You can also drag the slider yourself in Settings.

**Unlocking leaders** — you start with three. Beat one of the others as your opponent and they join your roster.

---

## Installing it

The game is a PWA, so there is nothing to download on either platform.

**iPhone / iPad** — open the site in Safari, tap Share, then **Add to Home Screen**. This is worth doing: iOS wipes a website's saved data after about a week of not visiting, and that includes your unlocked leaders and your offline copy of the game. Installing to the home screen stops that.

**Android** — Chrome offers **Install app** from the ⋮ menu.

**Desktop** — it plays fine in any modern browser, but it is designed for a phone.

Once installed it works offline, after the first visit has finished downloading the art and sound.

---

## Privacy

No accounts, no sign-in, no personal data, no cookies. Page views are counted with [GoatCounter](https://pradhanmantrielections.goatcounter.com), which is cookieless and does not track individuals. Your progress is stored in your own browser and never sent anywhere.

Full policy: [pradhanmantrielectionsgame.com/privacy.html](https://pradhanmantrielectionsgame.com/privacy.html)

---

## About

Built as a side project. Vanilla HTML, CSS and JavaScript — no framework, no build step.

The politicians and parties depicted are real public figures, portrayed satirically for a game. Nothing here is an endorsement of, or affiliation with, any person or party.

If you enjoy it: [buy me a coffee](https://buymeacoffee.com/pradhanmantri) ☕

---

## Running it locally

```bash
npm install
npm test        # assertion suite: engine math, 5 full simulated games, service-worker checks
npm run serve   # http://localhost:8934/mobile/index.html
```

`mobile/` is the game. `data/*.json` holds every tunable number — the economy, the roster, the policy pool, the state and region tables. `docs/wiki.html` is the design reference: how each mechanic works and why.

To try it on a real phone, expose the dev server rather than using a `localhost` URL:

```bash
npx -y cloudflared tunnel --url http://localhost:8934
```
