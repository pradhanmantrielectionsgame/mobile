# ADR-0011: Wiki as Authoritative Design Reference, Design Doc Deprecated

Date: 2026-07-29
Status: Accepted

## Context

For many months, `design/economy-status-map.md` has served as the project's single authoritative reference for game design — core loop, win condition, starting position, redistribution rule, all mechanic categories, the politician roster, and plausibility validation.

During a 2026-07-29 session refreshing `docs/wiki.html` to reflect the current codebase state (after multiple rounds of rebalancing and mechanic reworks across 2026-07-25 through 2026-07-28), the design doc was cross-checked against actual code and data (`mobile/game.js`, `data/policy-tags.json`, `data/politicians-data.json`, CLAUDE.md). Multiple concrete drift points were found, despite the design doc having been actively edited as recently as 2026-07-26 for unrelated sections:

1. **Hung parliament resolution rule** — the doc still describes ADR-0006's asymmetric rule (draw vs. human, loss vs. AI), even though `mobile/game.js`'s `finalizeGame()` implements ADR-0010's "always a draw" since 2026-07-28, the same day the doc file was last touched.

2. **Public Sector policy tag direction** — the doc still notes this as "a separate finding, not fixed," even though `data/policy-tags.json` shows the fix (industrial/manufacturing support, agricultural oppose) shipped 2026-07-26, and CLAUDE.md records the decision.

3. **Regional Dominance worked example** — the example still cites the pre-2026-07-24 budget figure (12,500 Cr lifetime per player), which a different section of the same document already says was corrected to 30,000 Cr.

This is not a unique historical gap. The design doc has been known to drift since earlier sessions, and the pattern is clear: documenting a decision in CLAUDE.md is not enough to keep a separate authoritative design reference in sync if that reference isn't being actively refreshed in the same session as the code changes themselves.

The wiki (`docs/wiki.html`) is a comprehensive, consolidated reference built 2026-07-29 specifically against the current codebase state, including sections for game mechanics, architecture/multiplayer planning, AI/testing methodology, and a full divergence/discovery log recording where the design doc itself was found stale.

## Decision

We will formally deprecate `design/economy-status-map.md` as the authoritative reference and promote `docs/wiki.html` as its successor. The design doc will be preserved (not deleted) with a visible deprecation banner and kept as a dated historical decision log, but any future "how does X work" question should consult the wiki first.

Specifically:

1. **`design/economy-status-map.md`** — add a visible deprecation banner at the top (title, meta description, header eyebrow, notice div) dated 2026-07-29, pointing readers to `docs/wiki.html` as the authoritative reference. Keep the content below the banner unchanged as historical record.

2. **`docs/wiki.html`** — declared as the single authoritative reference for finalized game design in CLAUDE.md, replacing the design doc. Include an explicit divergence/discovery log documenting places the design doc was found stale (entries 8–11 in the current findings.md, plus the entry about hung parliament rule dated 2026-07-28).

3. **`CLAUDE.md`** — rewrite the "Game design principles" authority bullet to point to `docs/wiki.html` instead of `design/economy-status-map.md`. Repoint roughly 6 other forward-looking "see design/economy-status-map.md's X section" citations throughout that section to the equivalent `docs/wiki.html` section instead. Add a new cautionary bullet: "**`docs/wiki.html` itself needs the same discipline the design doc was held to: don't let it drift.** When a numeric constant or mechanic changes, update the wiki's relevant section in the same session, not 'later' — recording the decision in this file is not enough to keep the wiki in sync, exactly the failure mode that got the design doc deprecated in the first place."

4. **`CLAUDE.md` "Data & config conventions"** — update the reference count for policy-tags.json from 24 to 25 (a `Film and TV` entry was added without a decision record) and add a note: "If policy additions like this happen again without a recorded decision, they'll keep silently invalidating any doc's policy-count and ranking-table claims — worth a one-line CLAUDE.md note next time a policy is added."

## Rationale

A design reference document only remains authoritative if it's actively synchronized with code changes in the sessions where those changes land. Keeping a separate document that "should be kept in sync" has consistently failed in practice on this project — it drifts despite good intentions, particularly when edits to different sections happen on different days/sessions. The wiki was built specifically to consolidate current-state information (code, data, testing methodology, divergence log) into one place, eliminating the need for a separate source of truth.

The design doc's historical value is preserved — it documents the reasoning, rejected alternatives, and worked examples for decisions now in the code. It's kept in the repo exactly so that future sessions can understand *how* decisions were made, not as a current-state reference.

## Consequences

### Positive
- A single, actively-maintained reference (`docs/wiki.html`) that consolidates all game-mechanics documentation in one place, eliminating the sync burden of maintaining a separate doc.
- The deprecation banner makes it explicit that readers should not treat the design doc as current, reducing confusion from drift.
- Future "how does X work" questions have a clear first place to check, eliminating back-and-forth about which doc is current.

### Negative
- The wiki needs the same active-maintenance discipline the design doc was supposed to have — it's not a "write once, forget" artifact. If it drifts, we've just traded one maintenance problem for another (bigger) one.
- The historical design doc is no longer the quick reference, which may slow down some legacy-context lookups.

### Neutral / Tradeoffs
- The design doc is not deleted, only relegated to historical-record status. Its decision reasoning and worked examples remain in the repo for future context.
- Any future "point a new session at the design doc for context" references should instead point at the wiki's divergence log or CLAUDE.md's decision-summary bullets.

## Alternatives Considered

1. **Patch both files in lockstep** — every code change, update the design doc and the wiki together. Rejected: this project's workflow doesn't consistently call for updating both documents; the separation creates work without eliminating the gap.

2. **Delete the design doc entirely** — cleaner, but loses the historical decision reasoning and worked examples. Rejected by the user's request to keep it as a record.

3. **Keep both as-is and accept periodic drift as a known limitation** — rejected: the current drift led to concrete confusion (multiple docs claiming conflicting current-state facts) and was the direct trigger for this decision.

## Related decisions

- ADR-0001 through ADR-0010 continue as written, with design rationale archived in the deprecated design doc where applicable.
- The multiplayer architecture plan (`design/multiplayer-implementation-plan.md`, written 2026-07-28) is a separate planning document and remains unaffected by this change — it's a forward-looking roadmap, not a current-state reference.

## Revision history

- 2026-07-29: Initial decision to deprecate `design/economy-status-map.md` and promote `docs/wiki.html` as the authoritative design reference.
