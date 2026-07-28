// Batch balance simulator — `node mobile/balance-sim.js [gamesPerOrderedPair]`.
// Every politician plays p1 (naive/random human stand-in) against every other
// politician's AI (p2, the real runAIFull) across several seeds, so win rate
// differences reflect the politician's kit, not strategy quality (both p1
// slots always use the same naive strategy). Appends one JSONL row per game
// to mobile/balance-log.jsonl, then prints win rate + avg final seats +
// avg own-home-state popularity at game end, per politician-as-p1.
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

function runOneGame(data, p1Id, p2Id, seedFn) {
  const game = Game.createGame(data, p1Id, p2Id, seedFn);
  Game.runAIFull(game);
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
    let powerUsedPhase = null;
    if (Game.canActivatePower(game, 'p1')) {
      const power = game.players.p1.politician.power;
      const opts = {};
      if (power.requiresTargetState) opts.targetStateSvgId = stateIds[0];
      if (power.requiresCompletedAgenda) {
        const done = Object.keys(game.players.p1.agendaProgress).filter(k => game.players.p1.agendaProgress[k] >= 4);
        if (done.length) opts.targetAgendaName = done[0];
      }
      const res = Game.activatePower(game, 'p1', opts);
      if (res.ok) powerUsedPhase = game.phase;
    }
    if (game.players.p1.craftedNationwide && !game.players.p1.usedNationwide) Game.activateNationwideRally(game, 'p1');
    Game.endPhase(game);
    Game.runAIFull(game);
    if (powerUsedPhase !== null) game._powerUsedPhase = powerUsedPhase;
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
    powerUsedPhase: game._powerUsedPhase || null,
    p1HomeState: p1Homes[0] ? (p1Homes[0].name || p1Homes[0].State) : null,
    p1HomePopBpsAtEnd: homePopBps
  };
}

const data = Game.loadGameDataSync(path.join(__dirname, '..', 'data'));
const gamesPerOrderedPair = parseInt(process.argv[2], 10) || 3;
const logPath = path.join(__dirname, 'balance-log.jsonl');
const rows = [];

data.politicians.forEach((p1) => {
  data.politicians.forEach((p2) => {
    if (p1.id === p2.id) return;
    for (let s = 0; s < gamesPerOrderedPair; s++) {
      const seed = 1 + s * 7919 + p1.id.length * 31 + p2.id.length;
      rows.push(runOneGame(data, p1.id, p2.id, mulberry32(seed)));
    }
  });
});

fs.writeFileSync(logPath, rows.map(r => JSON.stringify(r)).join('\n') + '\n');

const byPol = {};
rows.forEach(r => {
  const b = byPol[r.p1] || (byPol[r.p1] = { games: 0, wins: 0, seats: 0, homePop: 0, homePopN: 0 });
  b.games++;
  if (r.winner === 'p1') b.wins++;
  b.seats += r.seatsP1 || 0;
  if (r.p1HomePopBpsAtEnd !== null) { b.homePop += r.p1HomePopBpsAtEnd; b.homePopN++; }
});

const summary = Object.keys(byPol).map(id => {
  const b = byPol[id];
  return {
    politician: id,
    games: b.games,
    winRatePct: +(100 * b.wins / b.games).toFixed(1),
    avgFinalSeats: +(b.seats / b.games).toFixed(1),
    avgHomePopPct: b.homePopN ? +(b.homePop / b.homePopN / 100).toFixed(1) : null
  };
}).sort((a, b) => a.winRatePct - b.winRatePct);

console.log(`${rows.length} games logged to ${logPath}\n`);
console.table(summary);
