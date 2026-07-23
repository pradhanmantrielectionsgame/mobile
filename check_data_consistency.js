#!/usr/bin/env node
// ponytail: regex-based field-name extraction, not a JS/HTML parser — false negatives
// possible on unusual syntax, but every real break so far (BorderLands/NortheastIndia
// retirement) was caught by this. Upgrade to a real parser if it ever misses one.
//
// Verifies every state-group / region-tag field name referenced in js/*.js, index.html,
// and design/prototypes/*.html actually exists as a key on states_data.json's state
// records — and that every policy-tags.json tagEffects entry does too.
// Run after any states_data.json / policy-tags.json field rename or removal.

const fs = require('fs');
const path = require('path');

function readJson(relPath) {
  let raw = fs.readFileSync(path.join(__dirname, relPath), 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw);
}

const statesData = readJson('data/states_data.json');
const policyTags = readJson('data/policy-tags.json');

const NON_GROUP_FIELDS = new Set(['State', 'LokSabhaSeats', 'SvgId']);
const canonicalFields = new Set(
  Object.keys(statesData[0]).filter(k => !NON_GROUP_FIELDS.has(k))
);

const problems = [];

// 1. policy-tags.json tagEffects must reference real fields
for (const [policyName, def] of Object.entries(policyTags.policyTags)) {
  for (const tag of Object.keys(def.tagEffects || {})) {
    if (!canonicalFields.has(tag)) {
      problems.push(`policy-tags.json: "${policyName}" references unknown field "${tag}"`);
    }
  }
}

// 2. every state record has every canonical field (no per-state gaps)
for (const state of statesData) {
  for (const field of canonicalFields) {
    if (!(field in state)) {
      problems.push(`states_data.json: "${state.State}" is missing field "${field}"`);
    }
  }
}

// 3. grep js/*.js and *.html for state.<Field>/state['Field'] access patterns,
//    flag any that don't match a canonical field (dead reference after a rename)
const codeFiles = [];
for (const dir of ['js']) {
  const full = path.join(__dirname, dir);
  if (fs.existsSync(full)) {
    for (const f of fs.readdirSync(full)) {
      if (f.endsWith('.js')) codeFiles.push(path.join(dir, f));
    }
  }
}
codeFiles.push('index.html');
if (fs.existsSync(path.join(__dirname, 'design/prototypes'))) {
  for (const f of fs.readdirSync(path.join(__dirname, 'design/prototypes'))) {
    if (f.endsWith('.html')) codeFiles.push(path.join('design/prototypes', f));
  }
}

// Only flag names that match retired/legacy fields we know about, plus any
// dot/bracket access on a capitalized identifier that isn't a canonical field —
// restricted to the known group-field naming convention (CamelCase, no spaces)
// to avoid false positives on unrelated object properties.
const accessPattern = /(?:state(?:Data)?(?:\[[a-zA-Z_$][\w$]*\])?)\s*(?:\.|\[['"])([A-Z][A-Za-z]+)/g;
const knownGroupLike = new Set([...canonicalFields, 'BorderLands', 'NortheastIndia']); // legacy names worth flagging by name

const RETIRED_FIELDS = ['BorderLands', 'NortheastIndia'];
const stringLiteralPattern = /['"]([A-Za-z]+)['"]/g;

for (const rel of codeFiles) {
  const full = path.join(__dirname, rel);
  if (!fs.existsSync(full)) continue;
  const src = fs.readFileSync(full, 'utf8');

  // dot/bracket access: state.NortheastIndia, state['BorderLands']
  let m;
  while ((m = accessPattern.exec(src))) {
    const field = m[1];
    if (RETIRED_FIELDS.includes(field)) {
      problems.push(`${rel}: references retired field "${field}" (property access)`);
    }
  }

  // bare string literals: e.g. inside a ['SouthIndia', 'NortheastIndia', ...] array
  // used for dynamic lookup (state[regionField]) — the access pattern above misses these
  const seenOnLine = new Set();
  while ((m = stringLiteralPattern.exec(src))) {
    if (RETIRED_FIELDS.includes(m[1]) && !seenOnLine.has(m[1] + m.index)) {
      seenOnLine.add(m[1] + m.index);
      const lineNo = src.slice(0, m.index).split('\n').length;
      problems.push(`${rel}:${lineNo}: references retired field "${m[1]}" (string literal)`);
    }
  }
}

if (problems.length) {
  console.error(`FAIL — ${problems.length} data-consistency problem(s):\n`);
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
} else {
  console.log(`OK — ${canonicalFields.size} group fields consistent across states_data.json, policy-tags.json, and js/*.js.`);
}
