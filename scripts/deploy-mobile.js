// Builds the public "mobile" repo (github.com/pradhanmantrielectionsgame/mobile)
// from mobile/*'s real source, and commits it in a local worktree.
//
// Ships only what the live game needs — mobile/index.html plus its sibling
// .js files, and the assets/data/sounds folders — leaving out the legacy
// desktop code (js/, styles/), design/docs, and dev-only scripts. Every
// copied file's `../assets/`, `../data/`, `../sounds/` references get the
// `../` stripped, since those folders are siblings at the deploy repo's
// root instead of nested one level below mobile/ the way they are here.
//
// Usage:
//   node scripts/deploy-mobile.js          builds + commits locally only
//   node scripts/deploy-mobile.js --push   also pushes to the mobile remote's main
//
// ponytail: no npm deps — fs.cpSync + a handful of literal string swaps is
// the whole job. Upgrade to a real bundler only if the runtime files ever
// stop being plain, path-relative vanilla JS.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const WORKTREE = path.join(ROOT, '.deploy-worktree');
const MOBILE = path.join(ROOT, 'mobile');

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd: cwd || ROOT, stdio: 'pipe', encoding: 'utf8' });
}

function stripRelativePaths(text) {
  return text
    .split("'../' + p.partyLogo").join('p.partyLogo')
    .split("'../' + p.image").join('p.image')
    .split('../assets/').join('assets/')
    .split('../data/').join('data/')
    .split('../sounds/').join('sounds/');
}

function ensureWorktree() {
  if (fs.existsSync(WORKTREE)) {
    run('git', ['fetch', 'mobile', 'main']);
    run('git', ['reset', '--hard', 'mobile/main'], WORKTREE);
    return;
  }
  run('git', ['fetch', 'mobile', 'main']);
  run('git', ['worktree', 'add', '-B', 'mobile-deploy', WORKTREE, 'mobile/main']);
}

function wipeWorktree() {
  for (const entry of fs.readdirSync(WORKTREE)) {
    if (entry === '.git') continue;
    fs.rmSync(path.join(WORKTREE, entry), { recursive: true, force: true });
  }
}

function copyTransformed(srcRel, destRel) {
  const text = fs.readFileSync(path.join(MOBILE, srcRel), 'utf8');
  fs.writeFileSync(path.join(WORKTREE, destRel), stripRelativePaths(text));
}

// Media (art + sounds) lives in its own service-worker cache, deliberately not
// keyed to sw.js's CACHE: that key bumps on every code deploy, and wiping ~7MB
// of portraits and mp3s on a CSS tweak is what used to make sounds vanish (a
// forced re-download that failed on a flaky connection left that <audio> dead).
//
// So the media key is stamped here from a hash of what actually ships in
// assets/ + sounds/. It rotates when media content changes and never on a
// code-only deploy — which closes the one case a stable key gets wrong,
// replacing a file's contents under the same name. Adding a new file already
// works without a bump (cache miss -> network), and activate() drops the old
// key's entries once this rotates, so orphaned media doesn't accumulate either.
// Hand-bumping a constant would have been a third silently-failing manual step
// in this script; the allowlist and the '../' rewrite are enough of those.
function hashMediaTree(dirs) {
  const h = crypto.createHash('sha256');
  for (const dir of dirs) {
    const root = path.join(ROOT, dir);
    const walk = rel => {
      const abs = path.join(root, rel);
      for (const name of fs.readdirSync(abs).sort()) {
        const childRel = rel ? rel + '/' + name : name;
        const st = fs.statSync(path.join(abs, name));
        if (st.isDirectory()) walk(childRel);
        // Path as well as bytes: a pure rename must rotate the key too.
        else { h.update(dir + '/' + childRel); h.update(fs.readFileSync(path.join(abs, name))); }
      }
    };
    walk('');
  }
  return h.digest('hex').slice(0, 12);
}

// sw.js is copied with that hash substituted for the placeholder key. Asserts
// the swap landed: a silent miss here would ship a key that never rotates,
// and the symptom (users keep hearing an old sound) is invisible from a deploy.
function copyServiceWorker(mediaVersion) {
  const src = fs.readFileSync(path.join(MOBILE, 'sw.js'), 'utf8');
  const RE = /'pme-mobile-media-[^']*'/;
  if (!RE.test(src)) {
    console.error("Refusing to deploy: no 'pme-mobile-media-*' key found in mobile/sw.js.");
    process.exit(1);
  }
  fs.writeFileSync(path.join(WORKTREE, 'sw.js'), src.replace(RE, "'pme-mobile-media-" + mediaVersion + "'"));
}

function copyVerbatim(srcRel, destRel) {
  fs.copyFileSync(path.join(MOBILE, srcRel), path.join(WORKTREE, destRel));
}

const DEPLOY_README = `# PradhanMantri Elections Game — Mobile

Play at https://pradhanmantrielectionsgame.com/

This repo is a built artifact: it's regenerated from the \`mobile/\` folder of
the main development repo by \`scripts/deploy-mobile.js\` and pushed here as-is.
Don't hand-edit files here — edit the source repo and re-run that script.
`;

// Playtest switches in mobile/main.js that must never reach the live site:
// both let a player skip the unlock progression (UNLOCK_ALL hides it outright,
// PLAYTEST_BUILD arms a long-press that unlocks everything plus the ?vs=/?p1=
// hooks). Their own comments say "flip it back before committing" — this is
// what makes that true rather than remembered, since nothing else catches it:
// npm test and npm run serve both read mobile/, where the flag being on is the
// whole point, so the mistake is invisible right up until it is live.
function assertPlaytestFlagsOff() {
  const src = fs.readFileSync(path.join(MOBILE, 'main.js'), 'utf8');
  // Regex literals, not new RegExp(string): the string form needs the
  // backslashes double-escaped and a slip there fails open, silently matching
  // nothing and waving the deploy through — which is exactly what it did on
  // the first attempt at this check.
  const FLAGS = [
    ['UNLOCK_ALL', /var\s+UNLOCK_ALL\s*=\s*true/],
    ['PLAYTEST_BUILD', /var\s+PLAYTEST_BUILD\s*=\s*true/],
  ];
  const on = FLAGS.filter(function (f) { return f[1].test(src); }).map(function (f) { return f[0]; });
  if (on.length) {
    console.error('');
    console.error('Refusing to deploy: ' + on.join(' and ') + ' is true in mobile/main.js.');
    console.error('Set it back to false, then deploy again.');
    console.error('');
    process.exit(1);
  }
}

function main() {
  assertPlaytestFlagsOff();
  ensureWorktree();
  wipeWorktree();

  copyTransformed('index.html', 'index.html');
  copyTransformed('game.js', 'game.js');
  copyTransformed('main.js', 'main.js');
  copyTransformed('manifest.json', 'manifest.json');
  copyVerbatim('engine.js', 'engine.js');
  copyVerbatim('ai.js', 'ai.js');
  const mediaVersion = hashMediaTree(['assets', 'sounds']);
  copyServiceWorker(mediaVersion);
  console.log('Media cache key: pme-mobile-media-' + mediaVersion);
  copyVerbatim('html2canvas.min.js', 'html2canvas.min.js');
  copyVerbatim('privacy.html', 'privacy.html');

  // GitHub Pages custom domain. Must be regenerated here every deploy —
  // wipeWorktree() nukes it otherwise, and a domain set only in the repo's
  // web UI would vanish on the next push.
  fs.writeFileSync(path.join(WORKTREE, 'CNAME'), 'pradhanmantrielectionsgame.com\n');

  // Jekyll (GitHub Pages' default build) drops every path starting with a dot,
  // which would 404 the .well-known/assetlinks.json an Android TWA needs to
  // verify it owns this domain. Without that verification the packaged app
  // renders a Chrome address bar over the game. .nojekyll turns Jekyll off.
  fs.writeFileSync(path.join(WORKTREE, '.nojekyll'), '');

  // Digital Asset Links for the Play Store build. PWABuilder hands you the
  // finished JSON (it carries your signing key's SHA-256 fingerprint) — save
  // it as mobile/.well-known/assetlinks.json and it ships from here.
  const WELL_KNOWN = path.join(MOBILE, '.well-known');
  if (fs.existsSync(WELL_KNOWN)) {
    fs.cpSync(WELL_KNOWN, path.join(WORKTREE, '.well-known'), { recursive: true });
  } else {
    console.log('Note: no mobile/.well-known/assetlinks.json - Android TWA will show a URL bar.');
  }

  fs.cpSync(path.join(ROOT, 'assets'), path.join(WORKTREE, 'assets'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'data'), path.join(WORKTREE, 'data'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'sounds'), path.join(WORKTREE, 'sounds'), { recursive: true });

  fs.writeFileSync(path.join(WORKTREE, 'README.md'), DEPLOY_README);

  run('git', ['add', '-A'], WORKTREE);
  const status = run('git', ['status', '--porcelain'], WORKTREE);
  if (!status.trim()) {
    console.log('Nothing changed — deploy worktree already matches mobile/.');
    return;
  }

  const sourceSha = run('git', ['rev-parse', '--short', 'HEAD']).trim();
  run('git', ['commit', '-m', `Deploy from ${sourceSha}`], WORKTREE);
  console.log(`Committed in ${WORKTREE}. Review with:\n  git -C .deploy-worktree show --stat`);

  if (process.argv.includes('--push')) {
    run('git', ['push', 'mobile', 'mobile-deploy:main'], WORKTREE);
    console.log('Pushed to mobile/main.');
  } else {
    console.log('Not pushed — re-run with --push, or:\n  git -C .deploy-worktree push mobile mobile-deploy:main');
  }
}

main();
