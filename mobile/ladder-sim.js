// AI difficulty-ladder tournament — `node mobile/ladder-sim.js [seedsPerPair]`.
//
// Measures AI *profiles* against each other, which balance-sim.js cannot do:
// that harness varies the politician and leaves both seats on the same
// profile, so nothing in its output is attributable to a bot's capability.
//
// Design notes, because the naive version of this measures the wrong thing:
//   - Seat MARGIN (p1 - p2), not win rate. Hung parliaments are 48-98% of
//     games (ADR-0010 scores them a draw), so win rate is mostly draw signal
//     and needs ~10x the games for the same confidence.
//   - MIRRORED pairs. Each seed plays the same two politicians in the same
//     two seats twice, with the profiles swapped. Averaging the two runs
//     cancels both the seat advantage and the politician kit gap, which are
//     each far larger than the effect being measured.
//   - ROUND ROBIN, not just margin-vs-anchor. An anchored measurement assumes
//     the ladder is transitive; only the full matrix can show it isn't (a
//     rung beating the one above it means the flags interact and the ordering
//     is not real).
const path = require('path');
require(path.join(__dirname, 'engine.js'));
const Game = require(path.join(__dirname, 'game.js'));
const AI = global.PMEAI;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns p1's final seat margin. Both seats are forced to a named rung —
// p2 is re-setup after createGame, which already gave it the default profile.
function playMatch(data, p1Id, p2Id, p1Rung, p2Rung, seed) {
  const game = Game.createGame(data, p1Id, p2Id, mulberry32(seed));
  Game.setupAI(game, 'p1', mulberry32(seed ^ 0xa11ce), p1Rung);
  Game.setupAI(game, 'p2', mulberry32(seed ^ 0xb0b), p2Rung);
  Game.runAIFull(game, 'p2');
  let iter = 0;
  while (!game.winner && iter++ < 10) {
    Game.runAIFull(game, 'p1');
    Game.endPhase(game);
    Game.runAIFull(game, 'p2');
  }
  const f = game.finalSeats || { p1: 0, p2: 0 };
  return f.p1 - f.p2;
}

const data = Game.loadGameDataSync(path.join(__dirname, '..', 'data'));
const seedsPerPair = parseInt(process.argv[2], 10) || 12;
const rungs = AI.AI_PROFILES.map(p => p.key);
const pols = data.politicians.map(p => p.id);

// margins[a][b] = every observed seat margin for rung a playing rung b
const margins = {};
rungs.forEach(a => { margins[a] = {}; rungs.forEach(b => { margins[a][b] = []; }); });

let games = 0;
for (let i = 0; i < rungs.length; i++) {
  for (let j = i + 1; j < rungs.length; j++) {
    const a = rungs[i], b = rungs[j];
    for (let s = 0; s < seedsPerPair; s++) {
      const seed = 1000003 + s * 7919 + i * 101 + j * 17;
      const rp = mulberry32(seed ^ 0xf00d);
      const polA = pols[Math.floor(rp() * pols.length)];
      let polB = pols[Math.floor(rp() * pols.length)];
      if (polB === polA) polB = pols[(pols.indexOf(polA) + 1) % pols.length];
      // Same politicians, same seats, profiles swapped: seat and kit cancel.
      const m1 = playMatch(data, polA, polB, a, b, seed);
      const m2 = playMatch(data, polA, polB, b, a, seed);
      margins[a][b].push(m1, -m2);
      margins[b][a].push(-m1, m2);
      games += 2;
    }
  }
}

const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length;
// Standard error of the mean, for "is this gap real or noise".
function stderr(xs) {
  const m = mean(xs);
  const v = xs.reduce((s, x) => s + (x - m) * (x - m), 0) / Math.max(1, xs.length - 1);
  return Math.sqrt(v / xs.length);
}

console.log(`${games} games, ${seedsPerPair} mirrored seeds per rung pair\n`);
console.log('Mean seat margin, row rung vs column rung (positive = row is stronger):');
const matrix = {};
rungs.forEach(a => {
  matrix[a] = {};
  rungs.forEach(b => { matrix[a][b] = a === b ? '-' : Math.round(mean(margins[a][b])); });
});
console.table(matrix);

const overall = rungs.map(r => {
  const all = [].concat.apply([], rungs.filter(x => x !== r).map(x => margins[r][x]));
  return { rung: r, avgMargin: +mean(all).toFixed(1), stdErr: +stderr(all).toFixed(1), games: all.length };
}).sort((a, b) => a.avgMargin - b.avgMargin);
console.log('\nOverall strength (mean margin vs the whole field):');
console.table(overall);

// The ladder is only a ladder if each rung beats the one below it. Anything
// listed here means the flags interact and the ordering is not real.
const breaks = [];
for (let i = 0; i < rungs.length - 1; i++) {
  const lo = rungs[i], hi = rungs[i + 1];
  const m = mean(margins[hi][lo]);
  if (m <= 0) breaks.push(`${hi} does NOT beat ${lo} (margin ${m.toFixed(1)})`);
}
console.log('\nMonotonicity (each rung should beat the one below):');
console.log(breaks.length ? breaks.join('\n') : '  ok - every rung beats the rung below it.');

console.log('\nPer-flag value (margin gained by adding one capability):');
for (let i = 0; i < rungs.length - 1; i++) {
  const lo = rungs[i], hi = rungs[i + 1];
  const xs = margins[hi][lo];
  const se = stderr(xs);
  const m = mean(xs);
  const verdict = Math.abs(m) < 2 * se ? '  (within noise)' : '';
  console.log(`  ${lo} -> ${hi}: ${m.toFixed(1)} +/- ${se.toFixed(1)} seats head-to-head${verdict}`);
}
