# ADR-0005: Token Economy as Unlock Gate for Special Powers

## Status

Accepted

## Context

Iterated through several candidates for special-power unlock triggers during the replayability redesign:

1. **Agenda-completion gate** (4/4 agendas committed): Suffers from the duration-based lateness bug (see [ADR-0004](0004-instant-effect-special-powers.md)) — power unlocks at game end, leaving zero phases to apply duration-based effects.

2. **Nationwide popularity threshold** (e.g., >50% popular vote across all states): Creates a "reward the leader" bias — whichever player is already winning gets the power first, accelerating their lead. Violates the principle of giving trailing players comeback opportunities.

3. **Projected seats threshold** (e.g., >50% of 545 projected seats): Initially thought this would be "swingy" due to assumption that seats flip dramatically (winner-take-all semantics), but investigation showed `seat-projection.js` computes seats proportionally per state, so seat thresholds have the same smooth-slope reward-the-leader bias as popularity thresholds.

4. **No gate; scaling-power design** (power always usable, magnitude scales with agenda investment): Flattens strategy — removes the "should I bank tokens for a big unlock or spend now" tension and makes the power just another stat that scales with effort rather than a truly scarce resource.

5. **Token-economy gate** (crafted from rally tokens): Token income is symmetric regardless of which player is winning. A trailing player can earn tokens at the same rate as the leader. This sidesteps the reward-vs-comeback dilemma entirely, while creating real, felt opportunity cost (tokens banked for unlock vs. spent on immediate rallies).

## Decision

Special-power and mega-token unlocks are gated by token crafting within the redesigned rally-token economy:

- **Special Powerup**: Crafted from 6 State Rally tokens. Grants one use of the politician's special power per game (one-time unlock, one-time use). Once used, the power is exhausted for that game.
- **Nationwide Rally**: Crafted from 12 State Rally tokens. Replaces the old random-chance "special rally token" mechanic entirely. Also one use per game.

Token income is symmetric (both players earn 2 State Rally tokens per phase, +2 bonus per fully-committed agenda, up to a 24-token cap in an 8-phase game), so a trailing player has the same opportunity to bank resources toward an unlock as the leader does.

## Consequences

### Positive

- **Symmetric opportunity**: Token income is independent of current game state, so both players have equal *opportunity* to pursue the unlock, regardless of who's currently winning.
- **Opportunity cost**: Creates real player tension — every token banked toward an unlock is a token *not* spent on rallies this phase. Decision-making is forced; no strategy is obviously dominant.
- **Player agency**: Unlock timing is determined by player choice (when to start banking tokens), not by a hardcoded gate (agenda completion, popularity threshold). Players feel like they earned the unlock.
- **Robustness to game changes**: If game length changes or phase count changes, the symmetric token income scales appropriately. No re-tuning of unlock thresholds needed.

### Negative

- **"Poor-player" scenario**: A player who gets far behind in popularity/seats still has equal token income, but rally effectiveness is independent of token *quantity* — a trailing player might accumulate tokens for an unlock but find that rallies (the main tool to catch up) are less impactful when you're already losing. This is intentional design, not a bug, but designers must monitor this trade-off.
- **Complexity**: Token crafting adds a second layer to resource management (earn tokens → craft mid-tier tokens → deploy unlocks). Designers must ensure the payoff is worth the mental load.

## Alternatives Rejected

### Agenda completion gate

- **Problem**: Suffers from the duration-based lateness bug documented in [ADR-0004](0004-instant-effect-special-powers.md). Power unlocks too late.
- **Secondary problem**: Creates a linear progression feel ("get to agenda 4, unlock power") rather than a player-choice feel.

### Popularity or seat threshold

- **Problem**: Reward-the-leader bias. Trailing players are punished; leader is rewarded with more power. Creates snowball risk.
- **Symptom**: "I'm already winning, so I also get the best tool" is not a comeback mechanic.

### No gate; scaling-power design

- **Problem**: Removes the scarcity that creates interesting decisions. Power is always available, magnitude just scales. Feels like a stat, not a strategic unlock.
- **Problem**: Undermines the "special power as a distinctive tool" goal from [D3](0000-parent-design-decisions.md) and [D4](0000-parent-design-decisions.md).

## Related Decisions

- **[D2] Personal, non-contested agendas**: Agendas no longer compete with opponent; each player owns their own 4 + special power. This frees the unlock gate from being tied to agenda-completion, enabling the token-economy gate instead.
- **[D4] Matched Cost/Benefit Tradeoffs**: Every special power has a real cost. In this design, the cost is tokens (opportunity cost against immediate rallies); the benefit is one-time access to a powerful, distinctive action.
- **[D5] Instant-Effect-Only Powers**: Powers resolve immediately when unlocked. This decision removes the forward-duration dependency that made agenda-completion gates fragile.
- **[D7] 3-Flavor Rally-Token Economy**: Defines the token mechanics that make this gate work (State Rally acquisition, crafting recipes, caps).

## Implementation Notes

- Token income (State Rally per phase) is earned unconditionally, not tied to player state or choice.
- Crafting (6 tokens → Special Powerup, 12 tokens → Nationwide Rally) is player-initiated; player chooses when to "spend" banked tokens.
- Once a Special Powerup is crafted, it's immediately usable (player can press the "use special power" button once); after use, it's exhausted for the game.
- Hard caps on total tokens prevent infinite accumulation (24 tokens in an 8-phase game with max bonuses).
