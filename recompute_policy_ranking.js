#!/usr/bin/env node
// ponytail: one-shot calculator, not a persistent tool — re-run by hand after any
// policy-tags.json tuning pass, paste the printed table back into
// design/economy-status-map.md's "Full policy ranking" section.
//
// For every policy: for each state, net effect = sum of tagEffects[tag] over every
// tag that state actually has (nets automatically when a state carries both a
// support and an oppose tag for the same policy — see design/economy-status-map.md
// #pot, "net first, apply once"). Nationwide-bonus policies apply their flat value
// to every state instead. Seat-equivalent = sum(state.seats * effect% / 100).

const fs = require('fs');
const path = require('path');

function readJson(relPath) {
  let raw = fs.readFileSync(path.join(__dirname, relPath), 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw);
}

const states = readJson('data/states_data.json');
const { policyTags } = readJson('data/policy-tags.json');

function netEffectPercent(state, policy) {
  if (policy.nationwideBonus != null) return policy.nationwideBonus;
  let net = 0;
  for (const [tag, magnitude] of Object.entries(policy.tagEffects || {})) {
    if (state[tag] === 'TRUE') net += magnitude;
  }
  return net;
}

const ranking = Object.entries(policyTags).map(([name, policy]) => {
  const seatEquivalent = states.reduce((total, state) => {
    const seats = Number(state.LokSabhaSeats);
    const effectPercent = netEffectPercent(state, policy);
    return total + (seats * effectPercent) / 100;
  }, 0);
  return { name, seatEquivalent };
});

ranking.sort((a, b) => b.seatEquivalent - a.seatEquivalent);

console.log('Rank  Seat-equiv  Policy');
ranking.forEach((r, i) => {
  console.log(`${String(i + 1).padStart(2)}    ${r.seatEquivalent.toFixed(1).padStart(6)}      ${r.name}`);
});
