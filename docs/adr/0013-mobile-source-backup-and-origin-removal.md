# ADR-0013: Backup Mobile Source to a Separate Branch and Remove the Origin Remote

**Status:** Accepted

**Date:** 2026-08-29

## Context

This repo contains mobile-specific work (`mobile/`, `data/`, `assets/`, `sounds/`, `design/`, `scripts/`) that deliberately deletes the root-level files (75 files including `index.html`, `welcome-screen.html`, `styles/`, `favicon.ico`, `ads.txt`) belonging to the desktop game.

The desktop game is served live from `https://github.com/pradhanmantrielectionsgame/pradhanmantrielectionsgame.github.io`, a public GitHub Pages site. That repo was cloned into this working copy as the `origin` remote.

After merging all mobile feature branches into `main` and deleting the feature branches (per a direct user request), the local `main` branch was 145 commits ahead of `origin/main`. By commit count, this looked like a clean fast-forward (0 commits behind, 0 divergence). The root-level file diff told a different story: **75 files deleted**, including the live `index.html`, 30,034 bytes, serving HTTP 200 at that moment.

A single `git push origin main` would have silently deleted the entire live desktop game website.

The danger was structural: mobile `main` and desktop `origin/main` are permanently divergent (mobile deletes desktop's files), so the ahead/behind count is actively misleading — what appears safe can be catastrophic, and only a manual root-level file diff can detect it. Relying on that manual check indefinitely is error-prone; the mistake only needs to be made once.

Additionally, the mobile **source code** had no remote backup at all. The `mobile` remote's `main` branch holds only the flattened deploy build (output of `scripts/deploy-mobile.js`), not the full source tree. The most recent source snapshot anywhere off-machine was 7 commits behind local `main` — a week's worth of v2.1.0-v2.1.2 work existed only on this laptop.

## Decision

1. Create a new `mobile/source` branch carrying the full source tree and push it to the `mobile` remote.
2. Configure local `main` to track `mobile/source` (not `origin/main`).
3. Remove the `origin` remote from this clone entirely.
4. Retain the two feature branches already in use:
   - `mobile-deploy` checked out in `.deploy-worktree` (infrastructure, not a feature branch — used by `scripts/deploy-mobile.js`)
   - Keep all other branches deleted (as already done).

## Consequences

**Positive:**
- The mobile source now has a real off-machine backup (essential after nearly losing a week of work).
- The `mobile` remote now clearly separates two jobs:
  - `mobile/main` = flattened deploy build (written only by `scripts/deploy-mobile.js --push`)
  - `mobile/source` = full source tree (ordinary git push target)
- The destructive-push failure mode is now **impossible** rather than dependent on memory. There is no way to accidentally push code that deletes the desktop game, because the desktop remote doesn't exist.

**Negative:**
- A developer wanting to work on the desktop game must clone its repo separately (`https://github.com/pradhanmantrielectionsgame/pradhanmantrielectionsgame.github.io.git`). It is no longer reachable from this working copy.
- Requires a discipline to never push source to `mobile/main` — the branch *exists* and will accept pushes, but doing so will corrupt the live game. The README and CLAUDE.md document this; automation (a pre-push hook) could enforce it but isn't implemented.

**Measurement:**
- Deploy pipeline (`npm test` + `node scripts/deploy-mobile.js`) confirmed still functional post-change.
- Live desktop game still HTTP 200 (verified before and after, no difference).
- Live mobile game still HTTP 200, v2.1.2 (verified after).

## Rationale for Rejecting Alternatives

**Keep `origin` and rely on never pushing:** Leaves a live footgun dependent on discipline and memory. The mistake is still one `git push` away, reachable by anyone in the future who forgets or doesn't know the rule.

**Drop `origin` with no replacement backup for source:** The 7-commit source loss would have been permanent.

**Full restructure into two separate local clones immediately:** Deferred to a future session if desired. The immediate issue (backup + safety) is solved.

## Related Findings

See `findings.md` entries for 2026-08-29:
- "Consolidating onto main created a one-command path to deleting the live desktop game" — detailed the discovery and the danger the ahead/behind count masked.
- "The deploy repo's main is a build artifact, not a backup — 7 commits of source existed only on one disk" — detailed the source-backup gap.
