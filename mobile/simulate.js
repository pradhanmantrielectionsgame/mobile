// Full-game simulation smoke test — `node mobile/simulate.js`.
// p1 = a randomized human stand-in, p2 = the real AI opponent (already
// wired into startPhase). Runs several full 10-phase games plus an
// isolated activation of all 20 politicians' special powers, asserting
// core invariants throughout: every state's shares sum to 10000 bps,
// funds/tokens never negative, national seats always sum to 543.
const path = require('path');
const assert = require('assert');
require(path.join(__dirname, 'engine.js'));
const Game = require(path.join(__dirname, 'game.js'));

function checkInvariants(game, label) {
  game.states.forEach(s => {
    const p = game.pop[s.svgId];
    const sum = p.p1 + p.p2 + p.others;
    assert.strictEqual(sum, 10000, `${label}: ${s.svgId} sums to ${sum}`);
    assert.ok(p.p1 >= 0 && p.p2 >= 0 && p.others >= 0, `${label}: ${s.svgId} negative share`);
  });
  ['p1', 'p2'].forEach(pk => {
    assert.ok(game.players[pk].fundsCr >= 0, `${label}: ${pk} negative funds`);
    assert.ok(game.players[pk].tokens.stateRally >= 0, `${label}: ${pk} negative tokens`);
  });
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function runOneGame(data, p1Id, p2Id, seedFn) {
  const game = Game.createGame(data, p1Id, p2Id, seedFn);
  Game.runAIFull(game);
  checkInvariants(game, 'phase 1 start (after AI)');

  const stateIds = game.states.map(s => s.svgId);
  let iter = 0;
  while (!game.winner && iter++ < 10) {
    for (let i = 0; i < 15; i++) {
      Game.investCash(game, 'p1', stateIds[Math.floor(seedFn() * stateIds.length)]);
    }
    let spent = 0;
    while (spent < 2 && game.players.p1.tokens.stateRally > 0) {
      const r = Game.playRallyToken(game, 'p1', stateIds[Math.floor(seedFn() * stateIds.length)]);
      if (r.ok) spent++; else break;
    }
    game.players.p1.politician.policies.map(p => p.name).forEach(name => {
      for (let t = 0; t < 4; t++) {
        if (game.players.p1.fundsCr >= game.cfg.agenda.costPerTapCr) Game.tapAgenda(game, 'p1', name);
      }
    });
    Game.craftToken(game, 'p1', 'special');
    Game.craftToken(game, 'p1', 'nationwide');
    if (Game.canActivatePower(game, 'p1')) {
      const power = game.players.p1.politician.power;
      const opts = {};
      if (power.requiresTargetState) opts.targetStateSvgId = stateIds[0];
      if (power.requiresCompletedAgenda) {
        const done = Object.keys(game.players.p1.agendaProgress).filter(k => game.players.p1.agendaProgress[k] >= 4);
        if (done.length) opts.targetAgendaName = done[0];
      }
      Game.activatePower(game, 'p1', opts);
    }
    if (game.players.p1.craftedNationwide && !game.players.p1.usedNationwide) Game.activateNationwideRally(game, 'p1');
    checkInvariants(game, `phase ${game.phase} pre-end`);
    Game.endPhase(game);
    Game.runAIFull(game);
    checkInvariants(game, `phase ${game.phase} post-end`);
  }
  assert.ok(game.winner, 'game did not finalize after 10 phases');
  assert.strictEqual(game.finalSeats.p1 + game.finalSeats.p2 + game.finalSeats.others, 543, 'final seats must sum to 543');
  return game;
}

const data = Game.loadGameDataSync(path.join(__dirname, '..', 'data'));

const pairs = [
  ['narendra-modi', 'rahul-gandhi'], ['jawaharlal-nehru', 'sachin-tendulkar'],
  ['arvind-kejriwal', 'yogi-adityanath'], ['sardar-patel', 'pv-narasimha-rao'],
  ['rajinikanth', 'hema-malini']
];
pairs.forEach((pair, i) => {
  const g = runOneGame(data, pair[0], pair[1], mulberry32(1000 + i));
  console.log(`${pair[0]} vs ${pair[1]}: winner=${g.winner} hung=${g.hungParliament} seats p1=${g.finalSeats.p1} p2=${g.finalSeats.p2} others=${g.finalSeats.others}`);
});

let powerFailures = [];
data.politicians.forEach((pol, i) => {
  const opponentId = data.politicians[(i + 1) % data.politicians.length].id;
  try {
    const g = Game.createGame(data, pol.id, opponentId, mulberry32(42 + i));
    g.players.p1.fundsCr = 100000;
    g.players.p1.tokens.stateRally = 100;
    while (g.phase < 6) Game.endPhase(g);
    g.players.p1.fundsCr = 100000;
    Game.craftToken(g, 'p1', 'special');
    if (!g.players.p1.craftedSpecial) throw new Error('failed to craft special');
    const opts = {};
    if (pol.power.requiresTargetState) opts.targetStateSvgId = g.states[0].svgId;
    if (pol.power.requiresCompletedAgenda) {
      const name = pol.policies[0].name;
      for (let t = 0; t < 4; t++) Game.tapAgenda(g, 'p1', name);
      opts.targetAgendaName = name;
    }
    const res = Game.activatePower(g, 'p1', opts);
    if (!res.ok) throw new Error('activatePower not ok: ' + res.reason);
    checkInvariants(g, `power test ${pol.id}`);
  } catch (e) {
    powerFailures.push(pol.id + ': ' + e.message);
  }
});
if (powerFailures.length) {
  console.error('Power activation failures:\n' + powerFailures.join('\n'));
  process.exit(1);
}
console.log(`All ${data.politicians.length} politician powers activate cleanly.`);
console.log(`mobile/simulate.js: all invariants held across 5 full games + ${data.politicians.length} isolated power activations.`);
