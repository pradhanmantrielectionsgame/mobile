// Batch balance simulator — `node mobile/balance-sim.js [gamesPerOrderedPair]`.
// Every politician plays p1 against every other politician's p2 across
// several seeds, with BOTH seats driven by the real AI (Game.runAIFull),
// via Game.setupAI(game, 'p1', rng) flipping p1 into an AI-controlled seat
// the same way p2 always is — so win rate differences reflect the
// politician's kit, not a strategy-skill gap between the two seats. A hung
// parliament (no one hits the seat majority — 48-98% of games depending on
// the politician) is scored as half a win for each side here, matching the
// real game's own rule (ADR-0010: hung parliament is always a draw).
// Appends one JSONL row per game to mobile/balance-log.jsonl, then prints
// win rate + avg final seats + avg own-home-state popularity, per
// politician-as-p1.
const fs = require('fs');
const path = require('path');
require(path.join(__dirname, 'engine.js'));
const Game = require(path.join(__dirname, 'game.js'));

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function homeStatesOf(pol) {
  return [pol.homeState].concat(pol.secondaryHomeStates || []);
}

function runOneGame(data, p1Id, p2Id, seedFn, rung) {
  const game = Game.createGame(data, p1Id, p2Id, seedFn);
  Game.setupAI(game, 'p1', seedFn, rung);
  Game.setupAI(game, 'p2', seedFn, rung);
  Game.runAIFull(game, 'p2');
  let iter = 0;
  let powerUsedPhase = null;
  while (!game.winner && iter++ < 10) {
    Game.runAIFull(game, 'p1');
    if (powerUsedPhase === null && game.players.p1.usedSpecial) powerUsedPhase = game.phase;
    Game.endPhase(game);
    Game.runAIFull(game, 'p2');
  }

  const p1Homes = homeStatesOf(game.players.p1.politician).map(name =>
    game.states.find(s => s.name === name));
  let homePopBps = null;
  if (p1Homes[0]) {
    const pop = game.pop[p1Homes[0].svgId];
    if (pop) homePopBps = pop.p1;
  }

  return {
    p1: p1Id, p2: p2Id,
    winner: game.winner, hung: !!game.hungParliament,
    seatsP1: game.finalSeats ? game.finalSeats.p1 : null,
    seatsP2: game.finalSeats ? game.finalSeats.p2 : null,
    seatsOthers: game.finalSeats ? game.finalSeats.others : null,
    powerUsedPhase: powerUsedPhase,
    p1HomeState: p1Homes[0] ? (p1Homes[0].name || p1Homes[0].State) : null,
    p1HomePopBpsAtEnd: homePopBps
  };
}

const data = Game.loadGameDataSync(path.join(__dirname, '..', 'data'));
const gamesPerOrderedPair = parseInt(process.argv[2], 10) || 3;
// Optional 2nd arg: force both seats onto a named AI ladder rung (e.g. level-8).
const rung = process.argv[3] || undefined;
const logPath = path.join(__dirname, 'balance-log.jsonl');
const rows = [];

data.politicians.forEach((p1) => {
  data.politicians.forEach((p2) => {
    if (p1.id === p2.id) return;
    for (let s = 0; s < gamesPerOrderedPair; s++) {
      const seed = 1 + s * 7919 + p1.id.length * 31 + p2.id.length;
      rows.push(runOneGame(data, p1.id, p2.id, mulberry32(seed), rung));
    }
  });
});

fs.writeFileSync(logPath, rows.map(r => JSON.stringify(r)).join('\n') + '\n');

const byPol = {};
rows.forEach(r => {
  const b = byPol[r.p1] || (byPol[r.p1] = { games: 0, wins: 0, hung: 0, seats: 0, homePop: 0, homePopN: 0 });
  b.games++;
  // A hung parliament scores 0.5 here, same as game.winner === 'draw'
  // already reads in the real game (ADR-0010) — kept as an explicit branch
  // on r.hung rather than relying on the 'draw' string so this still scores
  // correctly if that string value ever changes.
  if (r.hung) { b.wins += 0.5; b.hung++; }
  else if (r.winner === 'p1') b.wins++;
  b.seats += r.seatsP1 || 0;
  if (r.p1HomePopBpsAtEnd !== null) { b.homePop += r.p1HomePopBpsAtEnd; b.homePopN++; }
});

const summary = Object.keys(byPol).map(id => {
  const b = byPol[id];
  return {
    politician: id,
    games: b.games,
    winRatePct: +(100 * b.wins / b.games).toFixed(1),
    hungPct: +(100 * b.hung / b.games).toFixed(1),
    avgFinalSeats: +(b.seats / b.games).toFixed(1),
    avgHomePopPct: b.homePopN ? +(b.homePop / b.homePopN / 100).toFixed(1) : null
  };
}).sort((a, b) => a.winRatePct - b.winRatePct);

console.log(`${rows.length} games logged to ${logPath}\n`);
console.table(summary);
