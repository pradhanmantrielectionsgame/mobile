// PME Mobile — DOM wiring. Reads/writes the DOM only; every rule lives in
// engine.js/game.js. This file is the only one allowed to touch `document`.
(function () {
  'use strict';
  var E = window.PMEEngine, G = window.PMEGame;
  var GAME_VERSION = '2.5.0';
  // Canonical public URL for the end-of-game "share result" link — hardcoded,
  // not location.href, so the shared link is always the clean site root and
  // never a /index.html deep link, a ?query string, or a Capacitor
  // app-internal URL once this is wrapped for the app stores.
  var SITE_URL = 'https://kaunbanegapradhanmantri.in/';
  // The version label doubles as a build marker during AI-ladder playtests:
  // "+ai" means mobile/ai.js loaded at all, and "+<key>" that a ?ai= override
  // is actually in force. Without it, a device that quietly loaded an older
  // build is indistinguishable from a bot that simply played badly — which
  // cost two playtests on 2026-08-31.
  // A stored choice beats the query string: ?ai= kept getting lost between the
  // link and the page on a real phone (2026-08-31), so tapping the version
  // label cycles the forced profile instead and localStorage remembers it
  // across launches, home-screen installs and shared links alike.
  var AI_FORCE_KEY = 'pme_force_ai';
  function forcedAIKey() {
    var stored = null;
    try { stored = localStorage.getItem(AI_FORCE_KEY); } catch (e) { /* private mode */ }
    var key = stored || new URLSearchParams(location.search).get('ai');
    return (key && window.PMEAI && window.PMEAI.profileByKey(key)) ? key : null;
  }
  // ---- AI difficulty ladder ----
  // Eight measured levels (mobile/ai.js). 'auto' adapts: three straight wins
  // moves up a level, three straight losses moves down. Draws (a hung
  // parliament, the most common single outcome) count as neither, so a run of
  // them leaves the level where it is rather than drifting it.
  var AI_LEVEL_KEY = 'pme_ai_level', AI_STREAK_KEY = 'pme_ai_streak', AI_MODE_KEY = 'pme_ai_mode';
  var START_LEVEL = 3;
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) { /* private mode */ } }
  function maxLevel() { return (window.PMEAI && window.PMEAI.MAX_LEVEL) || 8; }
  function clampLevel(n) { return Math.min(maxLevel(), Math.max(1, n | 0)); }
  // 'auto' or a level number as a string.
  function aiMode() { var m = lsGet(AI_MODE_KEY, 'auto'); return m === 'auto' ? 'auto' : String(clampLevel(parseInt(m, 10))); }
  function adaptiveLevel() { return clampLevel(parseInt(lsGet(AI_LEVEL_KEY, START_LEVEL), 10) || START_LEVEL); }
  function effectiveLevel() { var m = aiMode(); return m === 'auto' ? adaptiveLevel() : clampLevel(parseInt(m, 10)); }
  function loadStreak() {
    var raw = lsGet(AI_STREAK_KEY, '');
    try { var o = JSON.parse(raw); return { w: o.w | 0, l: o.l | 0 }; } catch (e) { return { w: 0, l: 0 }; }
  }
  function saveStreak(st) { lsSet(AI_STREAK_KEY, JSON.stringify({ w: st.w, l: st.l })); }

  // Called once per completed rated match (game.ratedMatch is a one-shot flag
  // set at creation, so the tutorial sign-off path and replays can't count).
  function updateLadderAfterMatch() {
    if (!game || !game.ratedMatch) return;
    game.ratedMatch = false;
    if (game.winner !== 'p1' && game.winner !== 'p2') return; // draw: no change
    var st = loadStreak(), lvl = adaptiveLevel();
    if (game.winner === 'p1') { st.w++; st.l = 0; } else { st.l++; st.w = 0; }
    if (st.w >= 3) {
      st.w = 0;
      if (lvl < maxLevel()) { lvl++; showToast('Difficulty up — Level ' + lvl); }
    } else if (st.l >= 3) {
      st.l = 0;
      if (lvl > 1) { lvl--; showToast('Difficulty down — Level ' + lvl); }
    }
    lsSet(AI_LEVEL_KEY, lvl); saveStreak(st);
    renderVersionLabels();
  }

  function renderDifficultyLabel() {
    var el = document.getElementById('difficultyState');
    if (el) el.textContent = aiMode() === 'auto' ? 'Auto (Level ' + adaptiveLevel() + ')' : 'Level ' + effectiveLevel();
    var slider = document.getElementById('difficultyRange');
    if (slider) {
      // Position 0 is Auto, 1..MAX_LEVEL are the fixed levels. Max comes from
      // the profile list so adding a level never needs a markup edit.
      slider.max = String(maxLevel());
      slider.value = aiMode() === 'auto' ? '0' : String(effectiveLevel());
    }
  }

  function renderVersionLabels() {
    // With a single-entry pool (playtest build) the tag names that profile
    // outright, so "is max actually running?" is answerable at a glance.
    // Bare version in the shipped build: the level a match was played at is
    // already on the end card's seat row ("Rajinikanth (AI 5)"). Only a
    // forced playtest profile still tags the badge, which is the build-
    // identity safeguard that cost two inconclusive playtests to learn.
    var forced = forcedAIKey();
    var tag = forced ? '+' + forced : '';
    ['welcomeVersion', 'stageVersion'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = 'v' + GAME_VERSION + tag;
    });
    // The end card carries the level it actually played in its own stats row
    // (aiLevelLabel), and the ladder may have promoted the player by the time
    // the card renders — so the badge here is the bare version, never a tag
    // that would then disagree with the row above it.
    var endEl = document.getElementById('endVersion');
    if (endEl) endEl.textContent = 'v' + GAME_VERSION;
  }
  renderVersionLabels();
  // Playtest hook: tap the version label to cycle opponent AI profile ->
  // off. Deliberately undiscoverable rather than hidden behind a build flag —
  // the label is 10px of footer text a normal player has no reason to tap.
  (function () {
    var el = document.getElementById('welcomeVersion');
    if (!el || !window.PMEAI) return;
    el.style.cursor = 'pointer';
    el.style.padding = '8px 12px';
    el.addEventListener('click', function () {
      // 'max' first — it is the one a ladder playtest almost always wants.
      var others = window.PMEAI.AI_PROFILES.map(function (p) { return p.key; }).filter(function (k) { return k !== 'max'; });
      var keys = ['', 'max'].concat(others);
      var next = keys[(keys.indexOf(forcedAIKey() || '') + 1) % keys.length];
      try {
        if (next) localStorage.setItem(AI_FORCE_KEY, next);
        else localStorage.removeItem(AI_FORCE_KEY);
      } catch (e) { /* private mode: the tap just won't stick */ }
      renderVersionLabels();
      showToast(next ? 'Next match vs: ' + next : 'AI profile: random (default)');
    });
  })();

  // Phone-only install gate. After the viewport migration (v2.0.0) the layout
  // reflows and .stage scrolls, so a browser tab's shorter chrome-reduced
  // viewport no longer clips fixed UI — a tablet/iPad plays fine in-tab. The
  // gate stays for phones: iOS Safari's disappearing toolbar is worst on a
  // small screen, and Add-to-Home-Screen is also what protects localStorage
  // (unlock progress) + the offline cache from iOS's 7-day ITP purge.
  // Desktop/mouse (no coarse pointer) and tablets (wider than a phone) skip it.
  if (window.matchMedia('(pointer: coarse)').matches &&
      window.matchMedia('(max-width: 700px)').matches &&
      !(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)) {
    document.getElementById('installGateOverlay').hidden = false;
    document.getElementById('welcomeOverlay').hidden = true;
  }

  var TIP_URL = 'https://buymeacoffee.com/pradhanmantri';
  ['tipLinkWelcome', 'tipLinkEnd'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.href = TIP_URL;
  });

  // Version baked into the subject line (not just the body) since some mail
  // clients truncate/hide the body preview — keeps it visible at a glance.
  (function () {
    var el = document.getElementById('reportBugBtn');
    if (!el) return;
    var body = 'What happened:\n\n\nGame version: v' + GAME_VERSION;
    el.href = 'mailto:pradhanmantrielections@gmail.com?subject=' +
      encodeURIComponent('PME Mobile bug report (v' + GAME_VERSION + ')') +
      '&body=' + encodeURIComponent(body);
  })();

  // Local-only politician unlock progression: start with 3, unlock the rest
  // by beating them (as the AI opponent) in a match. Enforced client-side
  // only (localStorage) — a determined player can edit around it via
  // devtools, which is accepted: this is a single-player nudge, not
  // anti-cheat, and closing that hole needs a real account/server backend.
  var UNLOCK_KEY = 'pme_unlocked_politicians';
  // Weighted opponent draw: this much of the time, prefer a still-locked
  // politician as your AI opponent so unlocking the roster doesn't stall
  // out on luck once you're down to a few remaining locked names.
  var LOCKED_OPPONENT_CHANCE = 0.70;
  var STARTER_POLITICIAN_IDS = ['narendra-modi', 'manmohan-singh', 'atal-bihari-vajpayee'];
  // Returns the unlocked-id array, or null if storage is unavailable/broken
  // (private browsing, quota, etc.) — null means "treat everyone as
  // unlocked" so a storage failure can't softlock the roster.
  function loadUnlockedPoliticians() {
    try {
      var raw = localStorage.getItem(UNLOCK_KEY);
      if (!raw) return STARTER_POLITICIAN_IDS.slice();
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : STARTER_POLITICIAN_IDS.slice();
    } catch (e) { return null; }
  }
  function isPoliticianUnlocked(unlockedList, id) {
    return unlockedList === null || unlockedList.indexOf(id) !== -1;
  }
  // Adds id to the unlocked list if it isn't already there. Returns true if
  // this call actually unlocked something new (so the caller can toast it).
  function unlockPolitician(id) {
    try {
      var list = loadUnlockedPoliticians();
      if (list === null || list.indexOf(id) !== -1) return false;
      list.push(id);
      localStorage.setItem(UNLOCK_KEY, JSON.stringify(list));
      return true;
    } catch (e) { return false; }
  }

  // Same local-only enforcement caveat as the unlock progression above: each
  // politician has 3 "ink" charges (diamonds on their card); playing them
  // spends one. Hit zero and they're out of ink for a 6h cooldown, then
  // refill to 3. Storage: { [id]: { used: 0-3, cooldownStart: ms|null } }.
  var CHARGES_KEY = 'pme_politician_charges';
  var MAX_CHARGES = 3;
  var CHARGE_COOLDOWN_MS = 6 * 60 * 60 * 1000;
  function loadCharges() {
    try {
      var raw = localStorage.getItem(CHARGES_KEY);
      var obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === 'object') ? obj : {};
    } catch (e) { return {}; }
  }
  function saveCharges(map) {
    try { localStorage.setItem(CHARGES_KEY, JSON.stringify(map)); } catch (e) {}
  }
  // { remaining: 0-3, cooldownMs: 0 if not on cooldown else ms left }.
  // Auto-refills (clears storage) the moment an expired cooldown is checked.
  function chargeState(id) {
    var map = loadCharges();
    var entry = map[id];
    if (!entry) return { remaining: MAX_CHARGES, cooldownMs: 0 };
    if (entry.cooldownStart) {
      var left = CHARGE_COOLDOWN_MS - (Date.now() - entry.cooldownStart);
      if (left > 0) return { remaining: 0, cooldownMs: left };
      delete map[id];
      saveCharges(map);
      return { remaining: MAX_CHARGES, cooldownMs: 0 };
    }
    return { remaining: MAX_CHARGES - entry.used, cooldownMs: 0 };
  }
  function useCharge(id) {
    var map = loadCharges();
    var entry = map[id] || { used: 0, cooldownStart: null };
    entry.used++;
    if (entry.used >= MAX_CHARGES) entry.cooldownStart = Date.now();
    map[id] = entry;
    saveCharges(map);
  }
  function formatCooldown(ms) {
    var totalSec = Math.ceil(ms / 1000);
    var h = Math.floor(totalSec / 3600);
    if (h > 0) return h + 'h ' + Math.floor((totalSec % 3600) / 60) + 'm';
    var m = Math.floor(totalSec / 60), s = totalSec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // p1/p2 default to placeholder colors here but are overwritten in
  // startGame() with each politician's real party color (primaryColor).
  var COLORS = { p1: '#E8871C', p2: '#1C8A4B', others: '#AEB4C0' };
  var PARTY_SYMBOLS = {
    'BJP': '🪷', 'INC': '✋', 'AAP': '🧹', 'AITC': '💐',
    'JD(U)': '🏹', 'AIADMK': '🍃', 'Independent': '🗳️'
  };
  function partySymbol(party) { return PARTY_SYMBOLS[party] || '🗳️'; }

  // Real party logo (data/politicians-data.json's partyLogo) where one
  // exists, falling back to the PARTY_SYMBOLS emoji otherwise/on load error.
  function partyBadge(p) {
    var wrap = document.createElement('span');
    wrap.className = 'pol-seal';
    if (p.partyLogo) {
      var img = document.createElement('img');
      img.alt = p.party;
      img.src = '../' + p.partyLogo;
      img.onerror = function () { wrap.textContent = partySymbol(p.party); };
      wrap.appendChild(img);
    } else {
      wrap.textContent = partySymbol(p.party);
    }
    return wrap;
  }

  // Same real-logo-first fallback as partyBadge() above, but writes into an
  // existing element instead of building a new .pol-seal wrapper — used for
  // the in-game HUD/end-card party-symbol spans, which previously always
  // showed the PARTY_SYMBOLS emoji even when a real partyLogo existed.
  function setPartySymbol(el, p) {
    el.textContent = '';
    el.classList.remove('party-symbol-icon');
    if (p.partyLogo) {
      var img = document.createElement('img');
      img.className = 'party-symbol-icon';
      img.alt = p.party;
      img.src = '../' + p.partyLogo;
      img.onerror = function () { el.textContent = partySymbol(p.party); };
      el.appendChild(img);
    } else {
      el.textContent = partySymbol(p.party);
    }
  }

  // Sets a politician portrait <img>, falling back to a colored initial
  // circle (same className, so existing CSS sizing still applies) if the
  // image fails to load.
  function setPortrait(imgEl, p) {
    imgEl.alt = p.name;
    imgEl.style.background = p.primaryColor || '#ccc';
    imgEl.src = '../' + p.image;
    imgEl.onerror = function () {
      var w = imgEl.clientWidth || 34;
      var span = document.createElement('span');
      span.className = imgEl.className;
      span.textContent = p.name.trim().charAt(0);
      span.style.cssText = 'display:flex;align-items:center;justify-content:center;' +
        'font-weight:700;font-size:' + Math.round(w * 0.5) + 'px;color:#fff;' +
        'background:' + (p.primaryColor || '#999') + ';border-radius:50%;';
      imgEl.replaceWith(span);
    };
  }
  var AGENDA_ICONS = {
    'Education': '🎓', 'Rural Development': '🌾', "Women's Empowerment": '👩', 'Healthcare': '⚕️',
    'Land Reforms': '🗺️', 'Agricultural Reforms': '🚜', 'Water and Mineral Rights': '💧',
    'Infrastructure': '🏗️', 'Economic Liberalization': '💹', 'Privatization': '🏦',
    'Public Sector': '🏛️', 'Digital Transformation': '💻', 'Anti-Corruption': '🧹',
    'Judicial Activism': '⚖️', 'Press Freedom': '📰', 'Law and Order': '👮', 'Hindi Language': '🅰️',
    'Hindutva': '🕉️', 'Secularism': '☮️', 'Indigenous Rights': '🏹', 'Caste Reservation': '📋',
    'Uniform Civil Code': '📜', "State's Rights": '🚩', 'National Defense': '🛡️'
  };

  var data = null, game = null, selectedId = 'INUP', armed = null; // armed: null | 'stateRally' | 'powerTarget'
  var replay = null; // non-null while a replay is playing: { rec, idx, speed, playing, timer, savedGame }
  var REPLAY_KEY = 'pme:lastReplay';
  var HIGH_SCORE_KEY = 'pme:highScore';
  // Retrieves the player's best composite score from localStorage.
  // Returns 0 if storage is unavailable (private browsing, quota exceeded, etc.).
  function loadHighScore() {
    try { return parseInt(localStorage.getItem(HIGH_SCORE_KEY), 10) || 0; } catch (e) { return 0; }
  }
  var tutorialMode = false; // true between "How to Play" and starting the tutorial game — locks select screen to Modi only
  var TUTORIAL_POL_ID = 'narendra-modi';
  // Two step types:
  //  'slide'  — the opaque full-screen card (used only for the welcome step)
  //  'coach'  — a banner overlaid on the real, live select screen underneath.
  //             freeze locks carousel swipe (and snaps back to Modi first);
  //             pulse highlights either the agenda chips or the power block;
  //             requireAgendaTap gates Next until a real chip tap on Modi's card.
  var TUTORIAL_STEPS = [
    {
      type: 'slide',
      title: 'Welcome to the Pradhan Mantri Elections Game!',
      body: "You are campaigning to become India's next Prime Minister. Your goal is to cross 272 seats (out of a possible 543) in India's Lok Sabha (the people's house)."
    },
    {
      type: 'coach', freeze: false,
      title: 'Choose your candidate',
      body: 'Each candidate has their own unique strengths, agendas, and special abilities. Browse through the different available options.'
    },
    {
      type: 'coach', freeze: true, pulse: 'agendas', requireAgendaTap: true,
      body: "For this tutorial, you'll be playing as Modi. Click on each agenda item to find out more."
    },
    {
      type: 'coach', freeze: true, pulse: 'power',
      body: 'Each candidate also has a special ability — Modi\'s is Demonetization.'
    },
    {
      type: 'coach', freeze: true, pulse: 'play',
      body: 'Click "Play as Modi" to begin your campaign!'
    }
  ];
  var TUTORIAL_LAST_STEP = TUTORIAL_STEPS.length - 1; // the "click Play as Modi" step — forward from here happens by tapping the real button, not Next
  var tutorialStep = 0;
  var tutorialAgendaTapped = false; // set once any agenda chip is tapped during a requireAgendaTap step

  // Shared across both step engines (select-screen + in-game) so playtesting
  // and player-facing progress both read one continuous "Step N/total" count.
  // +1 for the phase-10 sign-off card, which isn't part of either step array
  // but is still counted as the final step of the tutorial. Computed inside
  // the function (not as a top-level const) since TUTORIAL_STAGE_STEPS isn't
  // declared yet at this point in the file.
  function updateTutorialCounter(current) {
    var text = 'Step ' + current + '/' + (TUTORIAL_STEPS.length + TUTORIAL_STAGE_STEPS.length + 1);
    $('tutorialStepCounterA').textContent = text;
    $('tutorialStepCounterB').textContent = text;
    $('tutorialStepCounterC').textContent = text;
  }

  function scrollCarouselToModi(behavior) {
    var track = $('polCarousel');
    var idx = data ? data.politicians.findIndex(function (p) { return p.id === TUTORIAL_POL_ID; }) : 0;
    track.scrollTo({ left: Math.max(idx, 0) * track.clientWidth, behavior: behavior });
  }

  // Renders whichever step tutorialStep points at (the welcome slide, a coach
  // banner over the live select screen, or free browsing past the last step)
  // and updates the persistent nav buttons — single source of truth so
  // Back/Next never fall out of sync with what's shown.
  function renderTutorialStep() {
    var step = TUTORIAL_STEPS[tutorialStep]; // undefined once we're past the last step (free browsing)
    var isSlide = step && step.type === 'slide';
    var isCoach = step && step.type === 'coach';

    $('tutorialOverlay').hidden = !isSlide;
    $('tutorialCoach').hidden = !isCoach;
    $('polCarousel').classList.toggle('tutorial-frozen', !!(isCoach && step.freeze));
    $('polCarousel').classList.toggle('tutorial-pulse-agendas', !!(isCoach && step.pulse === 'agendas'));
    $('polCarousel').classList.toggle('tutorial-pulse-power', !!(isCoach && step.pulse === 'power'));
    $('polCarousel').classList.toggle('tutorial-pulse-play', !!(isCoach && step.pulse === 'play'));
    $('selectOverlay').classList.toggle('tutorial-modi-locked', tutorialStep < TUTORIAL_LAST_STEP);
    updateTutorialCounter(tutorialStep + 1);

    if (isSlide) {
      $('tutorialSlideTitle').innerHTML = step.title;
      $('tutorialSlideBody').innerHTML = step.body;
      $('tutorialSlide').appendChild($('tutorialNavRow')); // Back/Next dock to whichever card is showing, not a fixed corner
    } else if (isCoach) {
      $('tutorialCoachTitle').innerHTML = step.title || '';
      $('tutorialCoachTitle').hidden = !step.title;
      $('tutorialCoachBody').innerHTML = step.body;
      $('tutorialCoach').appendChild($('tutorialNavRow'));
    }

    $('tutorialBackBtn').disabled = (tutorialStep === 0);
    var needsTap = isCoach && step.requireAgendaTap && !tutorialAgendaTapped;
    $('tutorialNextBtn').disabled = !step || needsTap || tutorialStep === TUTORIAL_LAST_STEP;
  }

  function goTutorialStep(delta) {
    var next = tutorialStep + delta;
    if (next < 0 || next > TUTORIAL_LAST_STEP) return;
    tutorialStep = next;
    var step = TUTORIAL_STEPS[tutorialStep];
    if (step && step.type === 'coach' && step.freeze) scrollCarouselToModi('auto'); // browsing (previous step) may have swiped away from Modi
    if (step && step.type === 'coach' && step.requireAgendaTap) tutorialAgendaTapped = false;
    renderTutorialStep();
  }

  function onTutorialAgendaTap() {
    var step = TUTORIAL_STEPS[tutorialStep];
    if (!tutorialAgendaTapped && step && step.type === 'coach' && step.requireAgendaTap) {
      tutorialAgendaTapped = true;
      renderTutorialStep();
    }
  }

  // In-game coaching, once the tutorial game itself starts. Same pulse +
  // Back/Next pattern as the select-screen coach steps, but the nav buttons
  // live inside the banner itself (not a fixed top bar) — the stage's three
  // regions (topstrip/map/info-panel) already fill the whole screen with no
  // free space, so anything fixed would cover the very element being highlighted.
  var TUTORIAL_GUJARAT_ID = 'INGJ';
  var TUTORIAL_GROUP_KEY = 'WesternBorder'; // much smaller/cheaper than Eastern Border (5 states/70 seats vs 14/197) — Gujarat, already heavily invested by this point, is a member too
  var TUTORIAL_STAGE_STEPS = [
    { pulse: 'phase', body: 'The game is played in 10 phases.' },
    { pulse: 'clock', body: 'Each phase lasts for 45 seconds.' },
    { pulse: 'funds', title: 'Campaign funds', body: 'This is the amount of funds you start with.' },
    {
      pulse: 'info', requireMapTap: true, title: 'Popularity',
      body: "Each territory on the map is colored by popularity — Modi's is orange. The stronger the lead, the more intense the color. Tap any state and you can see your popularity score (as well as your opponent's) in the info bar on the bottom of the screen."
    },
    {
      pulse: 'gujarat', requireInvestGujarat: true, title: 'Spending campaign funds',
      body: 'There are a few ways to increase your popularity.<br>Option 1: direct investment. Double tap on Gujarat to invest funds.'
    },
    {
      pulse: 'seats', title: 'Spending campaign funds',
      body: 'Higher popularity in any territory means more seats in the Lok Sabha. Keep investing in Gujarat to watch your projected seats climb.'
    },
    {
      pulse: 'gujarat', requireGujaratPopularityBps: 7000, title: 'Spending campaign funds',
      body: 'Each double tap deducts funds in proportion to the number of Lok Sabha seats that state or union territory contributes — larger states cost more, smaller states cost less. Keep investing in Gujarat until your popularity there is above 70%.'
    },
    {
      pulse: 'rally', title: 'Rallies',
      body: 'Option 2: Rallies. Rallies are a cheap way to increase your popularity in any given region. You receive 2 free rally tokens per phase.'
    },
    {
      pulse: 'rally', requireRallyPlaysInGujarat: 1, title: 'Rallies',
      body: 'Click on rally tokens and then click on Gujarat to hold a rally there. Each rally gives a 5% popularity boost.'
    },
    {
      pulse: 'gujarat', requireRallyPlaysInGujarat: 2, title: 'Rallies',
      body: 'Place another rally token in Gujarat. You may only place 2 rally tokens in any given phase of the game.'
    },
    {
      pulse: 'gujarat', title: 'Rallies',
      body: 'Any single state can have a maximum of 2 rallies per game — this includes any rallies your opponent holds in that state. Use them strategically.'
    },
    {
      pulse: 'agendatray', title: 'Political agendas',
      body: 'You can get additional tokens by fully committing to agenda items.'
    },
    {
      pulse: 'targetagenda', targetAgendaName: 'National Defense', requireAgendaComplete: 'National Defense', title: 'Political agendas',
      body: 'You can partially commit to an agenda by investing 500 crores. Full commitment requires 2000 crores. Tap on National Defense until that agenda is completed.'
    },
    {
      pulse: 'info', title: 'Political agendas',
      body: 'Not all agendas are equally popular everywhere. You can see the info bar for more information on how each agenda will affect your popularity in different parts of the country.'
    },
    {
      pulse: 'gujarat', requireGujaratPopularityBps: 10000, title: 'Clean sweep bonus',
      body: 'Keep investing in Gujarat until your popularity hits 100%. Once hit, you receive a small cash bonus for achieving a clean sweep.'
    },
    {
      title: 'Diminishing Returns',
      body: 'Repeated investments in the same state or territory have a smaller and smaller impact on popularity each time you spend campaign funds there. Manage your funds carefully!'
    },
    {
      pulse: 'groups', requireGroupClick: true, title: 'State Groups',
      body: 'Notice the buttons on your left. Each button corresponds to a different group of states (or UTs). Click on a few and check the bottom info bar to see which states belong to which group.'
    },
    {
      title: 'State Groups',
      body: 'Controlling a state group unlocks additional funds for your campaign. Large state groups (in terms of number of seats) are harder to control but unlock more funds for your campaign.'
    },
    {
      title: 'State Groups',
      body: 'Controlling a state group requires you to achieve a popularity of 50% or greater in <b>each</b> territory within that group.'
    },
    {
      pulse: 'targetgroup', targetGroupKey: TUTORIAL_GROUP_KEY, requireGroupDominance: TUTORIAL_GROUP_KEY, title: 'State Groups',
      body: "Let's try to get control over the Western Border group. Here are some additional funds. Keep investing in all the territories in the Western Border group until you achieve 50% or higher in every territory within the group."
    },
    {
      pulse: 'targetgroup', targetGroupKey: TUTORIAL_GROUP_KEY, unpinGroupOnEnter: true, title: 'State Groups',
      body: 'Once control is achieved you receive a cash bonus and the group button lights up with your player color.'
    },
    {
      title: 'Group control bonus',
      body: 'Keep holding a group into the next phase and you earn a smaller bonus again — sustained popularity keeps drawing fundraising, phase after phase, as long as you hold it.'
    },
    {
      pulse: 'hardstates',
      body: 'Some hard to reach states can be accessed via the buttons below. Click on Goa, Delhi or Kerala to invest funds there.'
    },
    {
      pulse: 'utsne',
      body: 'Small UTs and the Northeast 8 have their own buttons as well.'
    },
    {
      pulse: 'utexample', targetGroupKey: 'SouthIndia', targetStateSvgId: 'INPY', title: 'Maintaining group control',
      body: "Watch out: some state groups include a Union Territory as a member. South India (shown below) includes tiny Puducherry. Losing control of just that one small UT can break your whole group's bonus — don't let the big states distract you from defending the small ones."
    },
    {
      title: 'Try it yourself',
      body: 'Try playing the game on your own. Keep investing funds, conducting rallies and trying to control as many state groups as you can.'
    },
    {
      waitForPhase: 2, title: 'AI opponent',
      body: 'You may have noticed the AI player has been playing on the same game board.'
    },
    {
      pulse: 'opponent', title: 'AI opponent',
      body: "Your opponent for this tutorial is Rahul Gandhi (INC). You'll never be paired against an opponent from your own party — worth remembering once you start unlocking politicians by defeating them, since that also decides who you might face."
    },
    {
      title: 'AI opponent',
      body: "The AI player will try to stop you from achieving a majority of seats. Observe your opponent's actions carefully and change your strategy accordingly. Press next to continue."
    },
    {
      pulse: 'special', waitForPhase: 3, grantSpecialTokens: true, requirePowerActivated: true, title: 'Special Ability',
      body: "Modi's special ability unlocks at phase 3 and requires 6 unspent rally tokens. Here are some extra tokens — use the special ability now!"
    },
    {
      title: 'Special Ability',
      body: "Great move! You just implemented Demonetization. This freezes your opponent's funds for 2 phases. Act quickly and try to control as many states as you can!"
    },
    {
      waitForPhase: 6, title: 'Nationwide Rally',
      body: 'A nationwide rally can be unlocked at phase 6. And requires 12 unspent tokens.'
    },
    {
      pulse: 'nationwide', grantNationwideTokens: true, requireNationwideRally: true, title: 'Nationwide Rally',
      body: "Here's some extra tokens to help you out. Launch a nationwide rally now!"
    },
    {
      title: 'Nationwide Rally',
      body: 'A nationwide rally gives you a big popularity boost — 5% in every state and territory all at once. Keep the momentum going and go for the win!'
    }
  ];
  var tutorialStageStep = 0;
  var tutorialMapTapped = false;
  var tutorialGujaratInvested = false;
  var tutorialGroupClicked = false;
  var tutorialGroupFundsGranted = false;
  var tutorialWaitingForPhase = false; // true while coach is hidden and the game is running live, waiting for game.phase to reach a waitForPhase step's target
  var tutorialPowerActivated = false;
  var tutorialNationwideRallyLaunched = false;
  var wasTutorialGame = false; // sticky for the whole match, unlike tutorialMode which turns off mid-game once coaching finishes

  function startStageTutorial() {
    timerPaused = true;
    clearInterval(timerHandle);
    $('pauseToggleBtn').textContent = '▶'; $('pauseToggleBtn').title = 'Resume';
    tutorialStageStep = 0;
    tutorialMapTapped = false;
    tutorialGujaratInvested = false;
    tutorialGroupClicked = false;
    tutorialGroupFundsGranted = false;
    tutorialWaitingForPhase = false;
    tutorialPowerActivated = false;
    tutorialNationwideRallyLaunched = false;
    $('tutorialCoachStage').hidden = false;
    renderTutorialStageStep();
  }

  function finishStageTutorial() {
    tutorialMode = false;
    $('tutorialCoachStage').hidden = true;
    $('stage').classList.remove('tutorial-pulse-phase', 'tutorial-pulse-clock', 'tutorial-pulse-funds', 'tutorial-pulse-info',
      'tutorial-pulse-seats', 'tutorial-pulse-rally', 'tutorial-pulse-agendatray', 'tutorial-pulse-groups',
      'tutorial-pulse-hardstates', 'tutorial-pulse-utsne', 'tutorial-pulse-special', 'tutorial-pulse-nationwide');
    tutorialWaitingForPhase = false;
    var gj = document.getElementById(TUTORIAL_GUJARAT_ID);
    if (gj) gj.classList.remove('tutorial-target');
    var prevAgendaBtn = document.querySelector('#agendaTray .tutorial-target');
    if (prevAgendaBtn) prevAgendaBtn.classList.remove('tutorial-target');
    var prevGroupChip = document.querySelector('.gchip.tutorial-target');
    if (prevGroupChip) prevGroupChip.classList.remove('tutorial-target');
    timerPaused = false;
    resumePhaseTimer();
    $('pauseToggleBtn').textContent = '⏸'; $('pauseToggleBtn').title = 'Pause';
  }

  // Simulates investCash's own math (tap boost + gainAt redistribution) on a
  // cloned pop object — no side effects — to compute the real Cr cost of
  // bringing one state's p1 share up to a target, so the group funds grant
  // below can be sized exactly instead of a guessed flat number.
  function estimateInvestCostToReach(svgId, targetBps) {
    var real = game.pop[svgId];
    var sim = { p1: real.p1, p2: real.p2, others: real.others };
    var tapNum = game.players.p1.investmentTaps[svgId] || 0;
    var costPerTap = game.statesById[svgId].seats * game.cfg.investment.costPerSeatCr;
    var totalCost = 0, guard = 0;
    while (sim.p1 < targetBps && guard++ < 300) {
      tapNum++;
      E.gainAt(sim, 'p1', E.investmentBoostBps(tapNum, game.cfg.investment), 'both');
      totalCost += costPerTap;
    }
    return totalCost;
  }

  // One-time setup when the player reaches the target-group step (from
  // either direction) — pins the group card open so progress is visible
  // while investing, and grants exactly the funds needed to bring every
  // member state to 50%, not a flat guess: a flat ₹10,000cr grant failed in
  // real testing against the (much bigger) Eastern Border group — Western
  // Border is cheaper, but this stays generic/exact rather than re-guessing
  // a new flat number for whichever group TUTORIAL_GROUP_KEY points at.
  function enterTargetGroupStep() {
    activeGroup = TUTORIAL_GROUP_KEY; groupPinned = true;
    document.querySelectorAll('.gchip').forEach(function (x) { x.classList.toggle('on', x.dataset.key === activeGroup); });
    applyGroupHighlight();
    updateCard();
    if (tutorialGroupFundsGranted) return;
    tutorialGroupFundsGranted = true;
    var members = game.states.filter(function (s) { return s.tags.indexOf(TUTORIAL_GROUP_KEY) !== -1; });
    var needed = 0;
    members.forEach(function (s) {
      if (game.pop[s.svgId].p1 < game.cfg.regionalDominance.thresholdBps) {
        needed += estimateInvestCostToReach(s.svgId, game.cfg.regionalDominance.thresholdBps);
      }
    });
    var grant = needed + 1000; // small buffer for rounding
    game.players.p1.fundsCr += grant;
    showToast('🎁 +₹' + grant + 'Cr tutorial bonus funds');
    renderAll();
  }

  function tutorialStageStepSatisfied(step) {
    if (step.requireMapTap) return tutorialMapTapped;
    if (step.requireInvestGujarat) return tutorialGujaratInvested;
    if (step.requireGujaratPopularityBps) return (game.pop[TUTORIAL_GUJARAT_ID].p1 >= step.requireGujaratPopularityBps);
    if (step.requireRallyPlaysInGujarat) return (game.rallyPlaysByState[TUTORIAL_GUJARAT_ID] || []).length >= step.requireRallyPlaysInGujarat;
    if (step.requireAgendaComplete) return (game.players.p1.agendaProgress[step.requireAgendaComplete] || 0) >= game.cfg.agenda.tapsToComplete;
    if (step.requireGroupClick) return tutorialGroupClicked;
    if (step.requireGroupDominance) {
      var group = game.groups.filter(function (g) { return g.key === step.requireGroupDominance; })[0];
      return group ? E.dominanceActive(group, game.states, game.pop, 'p1', game.cfg.regionalDominance.thresholdBps) : false;
    }
    if (step.requirePowerActivated) return tutorialPowerActivated;
    if (step.requireNationwideRally) return tutorialNationwideRallyLaunched;
    return true;
  }

  // Tops up loose rally tokens to exactly `need` — reuses the exact-not-flat
  // sizing approach from the group funds grant above, since the player may
  // already hold a few tokens. Shared by the special-power and nationwide-
  // rally token grants (different craft costs, same top-up logic).
  function grantTutorialTokens(need) {
    var have = game.players.p1.tokens.stateRally;
    if (have >= need) return;
    game.players.p1.tokens.stateRally += (need - have);
    showToast('🎁 +' + (need - have) + ' tutorial rally tokens');
    renderAll();
  }

  function renderTutorialStageStep() {
    var step = TUTORIAL_STAGE_STEPS[tutorialStageStep];
    $('tutorialCoachStageTitle').innerHTML = step.title || '';
    $('tutorialCoachStageTitle').hidden = !step.title;
    $('tutorialCoachStageBody').innerHTML = step.body;
    updateTutorialCounter(TUTORIAL_STEPS.length + tutorialStageStep + 1);
    var stageEl = $('stage');
    stageEl.classList.toggle('tutorial-pulse-phase', step.pulse === 'phase');
    stageEl.classList.toggle('tutorial-pulse-clock', step.pulse === 'clock');
    stageEl.classList.toggle('tutorial-pulse-funds', step.pulse === 'funds');
    stageEl.classList.toggle('tutorial-pulse-info', step.pulse === 'info');
    stageEl.classList.toggle('tutorial-pulse-seats', step.pulse === 'seats');
    stageEl.classList.toggle('tutorial-pulse-rally', step.pulse === 'rally');
    stageEl.classList.toggle('tutorial-pulse-agendatray', step.pulse === 'agendatray');
    stageEl.classList.toggle('tutorial-pulse-groups', step.pulse === 'groups');
    stageEl.classList.toggle('tutorial-pulse-hardstates', step.pulse === 'hardstates');
    stageEl.classList.toggle('tutorial-pulse-utsne', step.pulse === 'utsne');
    stageEl.classList.toggle('tutorial-pulse-special', step.pulse === 'special');
    stageEl.classList.toggle('tutorial-pulse-nationwide', step.pulse === 'nationwide');
    stageEl.classList.toggle('tutorial-pulse-opponent', step.pulse === 'opponent');
    var gj = document.getElementById(TUTORIAL_GUJARAT_ID);
    if (gj) gj.classList.toggle('tutorial-target', step.pulse === 'gujarat');
    var prevAgendaBtn = document.querySelector('#agendaTray .tutorial-target');
    if (prevAgendaBtn) prevAgendaBtn.classList.remove('tutorial-target');
    if (step.pulse === 'targetagenda') {
      var safeId = 'agenda' + step.targetAgendaName.replace(/[^a-zA-Z0-9]/g, '');
      var btn = $(safeId);
      if (btn) btn.classList.add('tutorial-target');
    }
    var prevGroupChip = document.querySelector('.gchip.tutorial-target');
    if (prevGroupChip) prevGroupChip.classList.remove('tutorial-target');
    if (step.pulse === 'targetgroup') {
      var groupChip = document.querySelector('.gchip[data-key="' + step.targetGroupKey + '"]');
      if (groupChip) groupChip.classList.add('tutorial-target');
    }
    var prevLedChip = document.querySelector('#cardGroups .led-chip.tutorial-target');
    if (prevLedChip) prevLedChip.classList.remove('tutorial-target');
    if (step.pulse === 'utexample') {
      var ledChip = document.querySelector('#cardGroups .led-chip[data-svgid="' + step.targetStateSvgId + '"]');
      if (ledChip) ledChip.classList.add('tutorial-target');
    }
    $('tutorialStageBackBtn').disabled = (tutorialStageStep === 0);
    $('tutorialStageNextBtn').disabled = !tutorialStageStepSatisfied(step);
    $('tutorialStageNextBtn').textContent = (tutorialStageStep === TUTORIAL_STAGE_STEPS.length - 1) ? "Let's play →" : 'Next →';
  }

  // Shared by both entry paths: an immediate Next-click landing on a step,
  // and a deferred landing once a waitForPhase gate (below) is satisfied.
  function enterTutorialStageStep() {
    var step = TUTORIAL_STAGE_STEPS[tutorialStageStep];
    if (step.requireGroupClick) tutorialGroupClicked = false; // re-arm each time this step is (re-)entered, same as the agenda-tap gate
    if (step.requirePowerActivated) tutorialPowerActivated = false;
    if (step.requireNationwideRally) tutorialNationwideRallyLaunched = false;
    if (step.pulse === 'targetgroup') enterTargetGroupStep();
    // Passive illustration (no funds grant, no pin) — just auto-selects the
    // group card so the concrete Puducherry example is visible without
    // requiring the player to tap anything.
    if (step.pulse === 'utexample') { activeGroup = step.targetGroupKey; updateCard(); }
    if (step.unpinGroupOnEnter) { groupPinned = false; updateCard(); }
    // Token grants live here (not just in the phase-gate resolver) so a step
    // reached by a plain Next click — not a waitForPhase gate — still tops
    // the player up; the nationwide-rally grant step is one step after its
    // own waitForPhase:6 gate, so it's always entered this way.
    if (step.grantSpecialTokens) grantTutorialTokens(game.cfg.rally.specialPowerupCraftCost);
    if (step.grantNationwideTokens) grantTutorialTokens(game.cfg.rally.nationwideRallyCraftCost);
    renderTutorialStageStep();
  }

  // Hides the coach entirely and lets the game run live (timer + AI) until
  // game.phase reaches the pending step's waitForPhase — this is the
  // "pause the tutorial, let the player explore" gap between coached
  // moments, not the end of the tutorial.
  function enterTutorialPhaseWait() {
    tutorialWaitingForPhase = true;
    $('tutorialCoachStage').hidden = true;
    timerPaused = false;
    resumePhaseTimer();
    $('pauseToggleBtn').textContent = '⏸'; $('pauseToggleBtn').title = 'Pause';
  }

  // Called from doEndPhase once game.phase has just advanced. Returns true
  // (and re-pauses + shows the coach) if that advance is what a waiting
  // tutorial step was sitting on; false means normal, uncoached phase turnover.
  function checkTutorialPhaseGate() {
    if (!tutorialMode || !tutorialWaitingForPhase) return false;
    var step = TUTORIAL_STAGE_STEPS[tutorialStageStep];
    if (!step || !step.waitForPhase || game.phase < step.waitForPhase) return false;
    tutorialWaitingForPhase = false;
    timerPaused = true; clearInterval(timerHandle);
    $('pauseToggleBtn').textContent = '▶'; $('pauseToggleBtn').title = 'Resume';
    $('tutorialCoachStage').hidden = false;
    enterTutorialStageStep();
    return true;
  }

  function goTutorialStageStep(delta) {
    var next = tutorialStageStep + delta;
    if (next < 0) return;
    if (next >= TUTORIAL_STAGE_STEPS.length) { finishStageTutorial(); return; }
    tutorialStageStep = next;
    var step = TUTORIAL_STAGE_STEPS[tutorialStageStep];
    if (step.waitForPhase && game.phase < step.waitForPhase) { enterTutorialPhaseWait(); return; }
    enterTutorialStageStep();
  }

  function onTutorialMapTap() {
    var step = TUTORIAL_STAGE_STEPS[tutorialStageStep];
    if (!tutorialMapTapped && step && step.requireMapTap) {
      tutorialMapTapped = true;
      renderTutorialStageStep();
    }
  }

  function onTutorialInvest(svgId) {
    if (!tutorialMode || tutorialStageStep >= TUTORIAL_STAGE_STEPS.length) return;
    if (svgId === TUTORIAL_GUJARAT_ID) tutorialGujaratInvested = true;
    var step = TUTORIAL_STAGE_STEPS[tutorialStageStep];
    if (step.requireInvestGujarat || step.requireGujaratPopularityBps || step.requireGroupDominance) renderTutorialStageStep();
  }

  // These gates are all computed live from game state (rally plays, agenda
  // progress, group dominance) rather than a one-time flag, so re-rendering
  // after any relevant action is enough to keep Next's disabled state correct.
  function onTutorialRally(svgId) {
    if (!tutorialMode) return;
    var step = TUTORIAL_STAGE_STEPS[tutorialStageStep];
    if (step && step.requireRallyPlaysInGujarat) renderTutorialStageStep();
  }

  function onTutorialAgendaInvest(name) {
    if (!tutorialMode) return;
    var step = TUTORIAL_STAGE_STEPS[tutorialStageStep];
    if (step && step.requireAgendaComplete === name) renderTutorialStageStep();
  }

  function onTutorialGroupClick(key) {
    if (!tutorialMode) return;
    tutorialGroupClicked = true;
    var step = TUTORIAL_STAGE_STEPS[tutorialStageStep];
    if (step && step.requireGroupClick) renderTutorialStageStep();
  }
  var activeAgenda = null; // agenda name currently shown in the info panel, or null
  var activeAction = null; // 'rally' | 'nationwide' | 'special' currently shown in the info panel, or null
  var activeCluster = null; // 'ALL_UTS' | 'ALL_NE' currently shown in the info panel, or null
  var CLUSTER_DEFS = {
    ALL_UTS: { icon: '🏛️', label: 'Small UTs', ids: G.SMALL_UT_IDS.filter(function (id) { return id !== 'INDL' && id !== 'INGA'; }) },
    ALL_NE: { icon: '🌄', label: 'Northeast 8', ids: G.NORTHEAST_IDS }
  };
  var timerHandle = null, timeLeft = 0, timerPaused = false;
  var lastMapTapId = null, lastMapTapTime = 0, lastBtnTapId = null, lastBtnTapTime = 0;
  var DOUBLE_TAP_MS = 400;

  // ---------------------------------------------------------------------
  // Audio — design doc "Audio" section, 8 file-to-trigger mappings
  // ---------------------------------------------------------------------
  var soundEnabled = true, musicEnabled = true;
  var sounds = {};
  ['cash_added', 'money_spent', 'invalid_action', 'fanfare', 'game_over', 'phase_reset', 'rally_sound']
    .forEach(function (name) { sounds[name] = new Audio('../sounds/' + name + '.mp3'); });
  sounds.bg_music = new Audio('../sounds/bg_music.mp3');
  sounds.intro_music = new Audio('../sounds/saare_jahan_se_accha.mp3');
  var LOOP_TRACKS = ['bg_music', 'intro_music'];
  var BG_MUSIC_VOLUME = 0.35, BG_MUSIC_DUCKED_VOLUME = 0;
  LOOP_TRACKS.forEach(function (name) { sounds[name].loop = true; sounds[name].volume = BG_MUSIC_VOLUME; });
  var currentMusicKey = null;

  // Tap-feedback SFX (played synchronously off a real user gesture, so any
  // latency reads directly as "the tap felt delayed") get a Web Audio
  // AudioBufferSourceNode path instead of the plain <audio> element every
  // other sound uses. HTMLAudioElement.play() has real, often 100ms+,
  // hardware/session-negotiation latency on mobile — reordering JS (see the
  // money_spent call-site fix) can't touch that, since the delay is in the
  // browser/OS audio pipeline, not app code. A pre-decoded AudioBuffer
  // starts a fresh voice with near-sample-accurate timing instead. Falls
  // back to the normal <audio> path below if Web Audio is unavailable or
  // the buffer hasn't finished decoding yet (e.g. a tap in the first
  // second after "Begin Campaign").
  var TAP_SFX = ['money_spent', 'rally_sound', 'invalid_action'];
  var sfxCtx = null, sfxBuffers = {};
  function primeTapSfx() {
    try {
      if (!sfxCtx) sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (sfxCtx.state === 'suspended') sfxCtx.resume();
      TAP_SFX.forEach(function (name) {
        if (sfxBuffers[name]) return;
        fetch('../sounds/' + name + '.mp3')
          .then(function (r) { return r.arrayBuffer(); })
          .then(function (buf) { return sfxCtx.decodeAudioData(buf); })
          .then(function (decoded) { sfxBuffers[name] = decoded; })
          .catch(function () { /* stays on the <audio> fallback below */ });
      });
    } catch (e) { /* Web Audio unavailable — everything stays on <audio> */ }
  }
  function playTapSfxBuffer(name) {
    var buf = sfxBuffers[name];
    // iOS Safari auto-suspends an AudioContext on any idle/background stretch
    // — far more aggressively for a bookmarked tab than an installed
    // standalone PWA. resume() is async; starting a source before it
    // actually finishes produces silence, not an error, so this must
    // confirm the context is running *right now* rather than assume
    // resume() worked — otherwise a silent tap gets reported as a success
    // and never falls back to the always-audible <audio> path below.
    if (!buf || !sfxCtx || sfxCtx.state !== 'running') {
      if (sfxCtx && sfxCtx.state === 'suspended') sfxCtx.resume(); // best-effort, helps the *next* tap
      return false;
    }
    var src = sfxCtx.createBufferSource();
    src.buffer = buf;
    src.connect(sfxCtx.destination);
    src.start(0);
    return true;
  }

  function playSound(name) {
    var a = sounds[name];
    if (!a) return;
    if (LOOP_TRACKS.indexOf(name) !== -1) { if (musicEnabled) a.play().catch(function () {}); return; }
    if (!soundEnabled) return;
    if (TAP_SFX.indexOf(name) !== -1 && playTapSfxBuffer(name)) return;
    a.currentTime = 0;
    a.play().catch(function () {});
  }
  // Switches between the two looping tracks (welcome/select-screen theme vs
  // in-game theme) — pauses whichever one is playing before starting the
  // other, so they never both play at once.
  function switchMusic(name) {
    currentMusicKey = name;
    LOOP_TRACKS.forEach(function (n) { if (n !== name) sounds[n].pause(); });
    playSound(name);
  }

  // Some sounds (game_over, cash_added, phase_reset) only ever fire from a
  // setInterval callback, never a tap — iOS Safari blocks .play() on a media
  // element until that specific element has been played from within a real
  // user gesture at least once. Unlock every element here, on the first
  // gesture in the app, so those still work later with no gesture attached.
  function unlockSounds() {
    Object.keys(sounds).forEach(function (name) {
      var a = sounds[name];
      var p = a.play();
      if (p && p.catch) p.catch(function () {});
      a.pause();
      a.currentTime = 0;
    });
    primeTapSfx();
  }

  // Per-politician special-power sound — sounds/<Politician_Name>.mp3
  // (spaces -> underscores, e.g. "Amitabh Bachchan" -> Amitabh_Bachchan.mp3).
  // Falls back to the generic fanfare for politicians without their own file yet.
  var powerSounds = {}, powerGains = {}, audioCtx = null;
  // ponytail: element.volume caps at 1.0, and some clips (e.g. Rajinikanth.mp3)
  // are mastered too quiet to hear even with bg music fully ducked — route
  // through a shared GainNode to push past that ceiling. One flat boost for
  // all clips since we can't listen to individually recalibrate; back off (or
  // add a per-key override) if a specific clip starts clipping/distorting.
  var POWER_SOUND_GAIN = 2.5;
  function playPowerSound(politicianName) {
    if (!soundEnabled) return;
    var key = politicianName.replace(/\s+/g, '_');
    if (!powerSounds[key]) powerSounds[key] = new Audio('../sounds/' + key + '.mp3');
    var a = powerSounds[key];
    if (!powerGains[key]) {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var gain = audioCtx.createGain();
        gain.gain.value = POWER_SOUND_GAIN;
        audioCtx.createMediaElementSource(a).connect(gain).connect(audioCtx.destination);
        powerGains[key] = gain;
      } catch (e) { /* Web Audio unavailable — plays at normal volume instead */ }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    a.currentTime = 0;
    var restore = function () { sounds.bg_music.volume = BG_MUSIC_VOLUME; };
    if (musicEnabled) sounds.bg_music.volume = BG_MUSIC_DUCKED_VOLUME;
    a.addEventListener('ended', restore, { once: true });
    a.play().catch(function () {
      // no dedicated file for this politician — duck stays applied for the fanfare fallback too
      sounds.fanfare.currentTime = 0;
      sounds.fanfare.addEventListener('ended', restore, { once: true });
      sounds.fanfare.play().catch(restore);
    });
  }

  // ---------------------------------------------------------------------
  // Feedback fx — design doc "Touch interaction & feedback": one-shot,
  // non-blocking, never gates the next action.
  // ---------------------------------------------------------------------
  function viewportPoint(el) {
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function spawnFlash(x, y, colorClass) {
    var el = document.createElement('div');
    el.className = 'fx-flash' + (colorClass ? ' ' + colorClass : '');
    el.style.left = x + 'px'; el.style.top = y + 'px';
    $('fxLayer').appendChild(el);
    setTimeout(function () { el.remove(); }, 500);
  }
  function spawnMoneyText(x, y, amountCr, sign, colorClass) {
    if (!amountCr) return;
    var el = document.createElement('div');
    el.className = 'fx-money ' + (colorClass || (sign > 0 ? 'gain' : 'spend'));
    el.textContent = (sign > 0 ? '+₹' : '-₹') + Math.round(Math.abs(amountCr)) + 'Cr';
    el.style.left = x + 'px'; el.style.top = y + 'px';
    $('fxLayer').appendChild(el);
    setTimeout(function () { el.remove(); }, 700);
  }
  function spawnPowerBurst(playerKey, powerName, politicianName, emoji) {
    var el = document.createElement('div');
    el.className = 'power-burst';
    el.style.setProperty('--glow-color', playerKey === 'p2' ? COLORS.p2 : COLORS.p1);
    var glow = document.createElement('div'); glow.className = 'glow';
    var rays = document.createElement('div'); rays.className = 'rays';
    var card = document.createElement('div'); card.className = 'card';
    var bolt = document.createElement('div'); bolt.className = 'bolt'; bolt.textContent = emoji || '⚡';
    var name = document.createElement('div'); name.className = 'name'; name.textContent = powerName;
    var who = document.createElement('div'); who.className = 'who'; who.textContent = politicianName;
    card.appendChild(bolt); card.appendChild(name); card.appendChild(who);
    el.appendChild(glow); el.appendChild(rays); el.appendChild(card);
    $('fxLayer').appendChild(el);
    setTimeout(function () { el.remove(); }, 5000);
  }

  // Same full-screen glow+rays treatment as spawnPowerBurst above, but with
  // its own bigger card (real portrait, spin-in) for the rarer "you just
  // unlocked a politician" moment — reuses the .power-burst/.glow/.rays
  // classes so it shares that celebration's visual language.
  function spawnUnlockCelebration(politician) {
    var el = document.createElement('div');
    el.className = 'power-burst unlock-burst';
    el.style.setProperty('--glow-color', politician.primaryColor || '#C9A227');
    var glow = document.createElement('div'); glow.className = 'glow';
    var rays = document.createElement('div'); rays.className = 'rays';
    var card = document.createElement('div'); card.className = 'card unlock-card';
    var portrait = document.createElement('img'); portrait.className = 'unlock-card-portrait';
    setPortrait(portrait, politician);
    var headline = document.createElement('div'); headline.className = 'name'; headline.textContent = '🔓 New Card Unlocked!';
    var who = document.createElement('div'); who.className = 'who'; who.textContent = politician.name;
    card.appendChild(portrait); card.appendChild(headline); card.appendChild(who);
    el.appendChild(glow); el.appendChild(rays); el.appendChild(card);
    $('fxLayer').appendChild(el);
    setTimeout(function () { el.remove(); }, 5000);
  }

  // Same glow/rays/card treatment as spawnUnlockCelebration, for a new
  // personal-best composite score (see game.js computeScore).
  // Displays a brief celebratory pop-up (trophy seal + "New High Score" badge)
  // when the player beats their stored personal best. Matches the visual style
  // of the politician-unlock celebration.
  function spawnHighScoreCelebration(score) {
    var el = document.createElement('div');
    el.className = 'power-burst';
    el.style.setProperty('--glow-color', '#C9A227');
    var glow = document.createElement('div'); glow.className = 'glow';
    var rays = document.createElement('div'); rays.className = 'rays';
    var card = document.createElement('div'); card.className = 'card';
    var bolt = document.createElement('div'); bolt.className = 'bolt'; bolt.textContent = '🏆';
    var name = document.createElement('div'); name.className = 'name'; name.textContent = 'New High Score';
    var who = document.createElement('div'); who.className = 'who'; who.textContent = score.toLocaleString();
    card.appendChild(bolt); card.appendChild(name); card.appendChild(who);
    el.appendChild(glow); el.appendChild(rays); el.appendChild(card);
    $('fxLayer').appendChild(el);
    setTimeout(function () { el.remove(); }, 5000);
  }

  // Renders the high-score badge on the welcome screen ("🏆 Best score N").
  // Hides the badge until the first game completes and seeds a baseline score.
  function renderWelcomeHighScore() {
    var hs = loadHighScore(), el = $('welcomeHighScore');
    if (!el) return;
    el.hidden = hs <= 0;
    $('welcomeHighScoreVal').textContent = hs.toLocaleString();
  }

  // Records the player's (p1) composite score if it beats the stored best.
  // Fanfare only once there's a prior best to beat — the first completed
  // game silently seeds the baseline.
  function maybeRecordHighScore() {
    var score = game.score != null ? game.score : G.computeScore(game, 'p1').score;
    var prev = loadHighScore();
    if (score <= prev) return;
    try { localStorage.setItem(HIGH_SCORE_KEY, String(score)); } catch (e) {}
    if (prev > 0) { spawnHighScoreCelebration(score); playSound('fanfare'); }
  }
  function shakeInvalid(el) {
    if (el) {
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      setTimeout(function () { el.classList.remove('shake'); }, 400);
    }
    if (navigator.vibrate) navigator.vibrate(80);
    playSound('invalid_action');
  }

  function $(id) { return document.getElementById(id); }

  // Binds a game action to pointerdown instead of click. A `click` cannot
  // fire until the finger LIFTS, so every action was gated behind the
  // player's own press duration (~70-120ms of dwell on a real tap) before
  // the sound or FX could start. That reads as lag even though nothing on
  // screen is actually slow — and it's invisible to Playwright, whose
  // synthetic taps press and release in the same tick (measured: click
  // lands 7ms after touchstart there, vs. dwell+7ms on a real finger).
  // Only for action controls that never scroll; the carousel keeps `click`
  // so a swipe doesn't fire a card. The click fallback keeps keyboard
  // activation working on real <button>s, which pointerdown alone breaks.
  function fastTap(el, fn) {
    if (!el) return;
    var lastPointer = 0;
    el.addEventListener('pointerdown', function (e) {
      if (e.button) return; // ignore right/middle mouse
      lastPointer = e.timeStamp || Date.now();
      fn(e);
    });
    el.addEventListener('click', function (e) {
      if ((e.timeStamp || Date.now()) - lastPointer < 700) return; // already handled on press
      fn(e);
    });
  }

  function fmtPct(bps) { return Math.round(bps / 100) + '%'; }
  function fmtClock(sec) { sec = Math.max(0, sec); var m = Math.floor(sec / 60), s = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }

  // margin-based color mix — design doc "Map visualization — state color"
  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mixHex(fromHex, toHex, t) {
    var a = hexToRgb(fromHex), b = hexToRgb(toHex);
    var r = Math.round(a[0] + (b[0] - a[0]) * t);
    var g = Math.round(a[1] + (b[1] - a[1]) * t);
    var bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function showToast(msg) {
    clearTimeout(showToastSequence._h); // a plain toast cancels any pending part-2 handoff from a prior sequence
    var t = $('toast');
    t.textContent = msg;
    // Anchor above Ladakh's actual on-screen top edge rather than a fixed
    // pixel offset — toast height varies with message length (a short one
    // is one line, a real payout message like the clean-sweep bonus wraps
    // to two), and a fixed value either sits on the phase timer (too high)
    // or overlaps the tappable map (too low). Falls back to a fixed spot
    // pre-game, when the map/Ladakh isn't on screen yet to measure.
    var ladakh = document.getElementById('INLA');
    var lr = ladakh && ladakh.getBoundingClientRect();
    t.style.top = (lr && lr.height ? Math.max(170, lr.top - 12 - t.offsetHeight) : 195) + 'px';
    t.classList.add('show');
    clearTimeout(showToast._h);
    showToast._h = setTimeout(function () { t.classList.remove('show'); }, 1600);
  }

  // Two short toasts back-to-back instead of one long one — a combined
  // payout line like "You swept Uttar Pradesh 100% — +₹800Cr clean sweep
  // bonus" wraps to two lines, which is too tall for the space between the
  // topstrip and Ladakh (see showToast's positioning comment).
  function showToastSequence(parts) {
    showToast(parts[0]);
    clearTimeout(showToastSequence._h);
    showToastSequence._h = setTimeout(function () { showToast(parts[1]); }, 900);
  }

  function syncNewsFeed() {
    var track = $('newsTrack');
    // Ticker-eligible entries from the CURRENT phase only (agenda
    // completions, group dominance, state/nationwide rallies, special
    // power use) — not the full game history.
    var phaseEntries = game.log.filter(function (e) { return e.ticker && e.phase === game.phase; }).slice(0, 6);
    // Payout events (clean sweep, regional dominance) have no other UI
    // feedback the moment they land — pop them as a toast too, not just the
    // scrolling marquee, so they're not easy to miss mid-game.
    phaseEntries.forEach(function (e) {
      if (e.instant && !e.toasted) {
        e.toasted = true;
        if (e.toastParts) showToastSequence(e.toastParts); else showToast(e.msg);
      }
    });
    var items;
    if (phaseEntries.length) {
      items = phaseEntries.map(function (e) { return e.msg; });
    } else if (!track.dataset.inited) {
      items = ['Welcome to Pradhanmantri Elections — the campaign trail begins.'];
    } else {
      // Nothing current this phase — no news is not itself a headline, so
      // the ticker just goes quiet rather than announcing its own silence.
      track.dataset.inited = '1';
      if (track.dataset.key) { track.dataset.key = ''; track.innerHTML = ''; }
      return;
    }
    track.dataset.inited = '1';
    // syncNewsFeed runs on every render, not just when news actually
    // changes — skip the rebuild (and the animation restart below) unless
    // the item set is actually different, so a mid-scroll headline isn't
    // constantly yanked back to the start by unrelated re-renders.
    var key = items.join('|');
    if (track.dataset.key === key) return;
    track.dataset.key = key;
    var html = items.map(function (m) { return '<span>' + m + '</span>'; }).join('<span aria-hidden="true">&nbsp;&nbsp;•&nbsp;&nbsp;</span>');
    track.innerHTML = html + '<span aria-hidden="true">&nbsp;&nbsp;•&nbsp;&nbsp;</span>' + html;
    // Restart the scroll from the right edge so a new headline doesn't wait
    // out however much of the 22s loop is left — it enters view right away.
    track.style.animation = 'none';
    void track.offsetWidth;
    track.style.animation = '';
  }

  // ---------------------------------------------------------------------
  // Pre-game: politician select
  // ---------------------------------------------------------------------
  // What an agenda actually does, read straight from policy-tags.json's
  // tagEffects (or nationwideBonus) — shared by the in-game agenda-info
  // panel (renderAgendaCard) and the pre-game politician carousel, so
  // there's one place that knows how to turn a policy into chips.
  function agendaEffectChips(name) {
    var policy = data.policyTags[name];
    var chips = [];
    if (!policy) return chips;
    if (policy.nationwideBonus) {
      chips.push({ cls: 'eff-pos', text: '🇮🇳 Nationwide +' + policy.nationwideBonus });
      return chips;
    }
    var effects = policy.tagEffects || {};
    Object.keys(effects).sort(function (a, b) { return Math.abs(effects[b]) - Math.abs(effects[a]); })
      .forEach(function (key) {
        var g = data.groups.filter(function (x) { return x.key === key; })[0];
        var val = effects[key];
        chips.push({ cls: val > 0 ? 'eff-pos' : 'eff-neg', text: (g ? g.icon + ' ' + g.label : key) + ' ' + (val > 0 ? '+' : '') + val });
      });
    return chips;
  }

  // Rectangular art-window portrait — a dedicated fallback (not setPortrait's
  // circular-avatar one) since a bare initial-on-gradient reads right inside
  // the ballot card's photo window, where a small circular avatar wouldn't.
  function setArtPortrait(imgEl, p) {
    imgEl.alt = p.name;
    // Carousel holds all ~21 cards in one scroll track — only fetch a
    // portrait once its card is near the viewport.
    imgEl.loading = 'lazy';
    imgEl.src = '../' + p.image;
    imgEl.onerror = function () {
      var fallback = document.createElement('div');
      fallback.className = 'pol-art-fallback';
      fallback.textContent = p.name.trim().charAt(0);
      imgEl.replaceWith(fallback);
    };
  }

  // Ticket-stub die-cut edge between the art window and the bio panel —
  // matches design/prototypes/pol-card-mockup.html's approved look.
  function stubEdgeSvg(w) {
    var teeth = 14, path = 'M0,10 ';
    for (var i = 0; i <= teeth; i++) {
      var x = (w / teeth) * i;
      path += 'L' + x + ',' + (i % 2 === 0 ? 10 : 3) + ' ';
    }
    return '<svg viewBox="0 0 ' + w + ' 10" preserveAspectRatio="none"><path d="' + path + 'L' + w + ',10 Z" fill="var(--paper)"/></svg>';
  }

  // Redraws one card's diamond row + play-button label from live charge
  // state — shared by the initial build and the once-a-second cooldown tick.
  function renderCardCharges(card, p, locked) {
    var charge = chargeState(p.id);
    card.classList.toggle('pol-locked', !!(locked || charge.cooldownMs));
    var chargesEl = card.querySelector('.pol-charges');
    if (chargesEl) {
      chargesEl.innerHTML = '';
      for (var i = 0; i < MAX_CHARGES; i++) {
        var d = document.createElement('span');
        d.className = 'pol-diamond' + (i < charge.remaining ? ' full' : '');
        d.textContent = i < charge.remaining ? '♦' : '♢';
        chargesEl.appendChild(d);
      }
    }
    var btn = card.querySelector('.pol-play-btn');
    if (btn && !locked) {
      btn.textContent = charge.cooldownMs ? '🧊 Cooldown: ' + formatCooldown(charge.cooldownMs) :
        'Play as ' + p.name.replace(/\s*\([^)]*\)\s*$/, '').split(' ').slice(-1)[0];
    }
    return charge;
  }

  function buildPolCard(p, locked) {
    var color = p.primaryColor || '#999';
    var card = document.createElement('div');
    card.className = 'pol-card' + (locked ? ' pol-card-hard-locked' : '');

    var ballot = document.createElement('div');
    ballot.className = 'ballot-card';
    ballot.style.setProperty('--acc', color);

    ballot.innerHTML = '<div class="tricolor"><span class="saffron"></span><span class="white"></span><span class="green"></span></div>' +
      '<div class="pol-art"><div class="pol-art-img-slot"></div><div class="pol-stub">' + stubEdgeSvg(336) + '</div></div>' +
      '<div class="pol-bio">' +
        '<div class="pol-name-row"><div class="pol-name">' + p.name + '</div><div class="pol-seal-slot"></div></div>' +
        '<div class="pol-meta"><span class="pol-party-pill">' + p.party + '</span><span>🏠 ' + [p.homeState].concat(p.secondaryHomeStates || []).join(' + ') + '</span></div>' +
        '<div class="pol-section-label">Agenda</div>' +
        '<div class="pol-agendas"></div>' +
        '<div class="pol-section-label">Special Ability</div>' +
        '<div class="pol-power"><div class="pow-seal">⚡</div><div class="pow-name">' + p.power.name + '</div>' +
          '<div class="pow-benefit">Benefit: ' + p.specialPower.effect + '</div>' +
          '<div class="pow-cost">Cost: ' + p.specialPower.cost + '</div>' +
          '<div class="pow-unlock">Unlocks at: Phase ' + (p.power.requiresMinPhase || 1) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pol-footer"><div class="pol-charges"></div></div>';

    var img = document.createElement('img');
    setArtPortrait(img, p);
    ballot.querySelector('.pol-art-img-slot').replaceWith(img);
    ballot.querySelector('.pol-seal-slot').replaceWith(partyBadge(p));

    var agList = ballot.querySelector('.pol-agendas');
    var openChip = null;
    p.policies.forEach(function (pl) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'pol-agenda-chip';
      chip.innerHTML = '<span class="bullet"></span>' +
        '<span class="ic">' + (AGENDA_ICONS[pl.name] || '📌') + '</span>' +
        '<span class="nm">' + pl.name + '</span>' +
        '<span class="chev">›</span>';
      // Each plank gets its own adjacent detail row (CSS ".active + .show"
      // sibling selector) so the breakdown opens directly under the plank
      // that was tapped, not fixed at the bottom of the whole list.
      var detail = document.createElement('div');
      detail.className = 'pol-agenda-detail';
      agendaEffectChips(pl.name).forEach(function (c) {
        var pill = document.createElement('span');
        pill.className = 'pol-eff-chip ' + c.cls;
        pill.textContent = c.text;
        detail.appendChild(pill);
      });
      chip.addEventListener('click', function () {
        if (tutorialMode) onTutorialAgendaTap();
        if (openChip && openChip.chip === chip) {
          chip.classList.remove('active');
          detail.classList.remove('show');
          openChip = null;
          return;
        }
        if (openChip) { openChip.chip.classList.remove('active'); openChip.detail.classList.remove('show'); }
        chip.classList.add('active');
        detail.classList.add('show');
        openChip = { chip: chip, detail: detail };
      });
      agList.appendChild(chip);
      agList.appendChild(detail);
    });

    card.setAttribute('data-pol-id', p.id);

    var btn = document.createElement('button');
    btn.className = 'pol-play-btn';
    btn.style.background = color;
    btn.textContent = locked ? '🔒 Defeat to unlock' : 'Play as ' + p.name.replace(/\s*\([^)]*\)\s*$/, '').split(' ').slice(-1)[0];
    btn.addEventListener('click', function () {
      if (locked) {
        showToast('Beat ' + p.name + ' in a match to unlock them — you\'re never matched against your own party, so pick someone from a different party to face them');
        return;
      }
      var liveCharge = chargeState(p.id);
      if (liveCharge.cooldownMs) {
        showToast(p.name + ' is in their Cooldown Period — available again in ' + formatCooldown(liveCharge.cooldownMs));
        return;
      }
      if (tutorialMode && p.id !== TUTORIAL_POL_ID) {
        showToast('The tutorial plays as Modi — swipe back to select him');
        return;
      }
      if (tutorialMode && tutorialStep < TUTORIAL_LAST_STEP) {
        showToast('Finish the tutorial steps first — tap Next to continue');
        return;
      }
      startGame(p.id);
    });
    ballot.querySelector('.pol-footer').appendChild(btn);

    card.appendChild(ballot);
    renderCardCharges(card, p, locked);
    return card;
  }

  var polScrollTimer = null;
  function updateActiveDot(idx) {
    var dots = $('polDots').children;
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('on', i === idx);
  }
  function onCarouselScroll() {
    clearTimeout(polScrollTimer);
    polScrollTimer = setTimeout(function () {
      var track = $('polCarousel');
      updateActiveDot(Math.round(track.scrollLeft / track.clientWidth));
    }, 60);
  }

  function renderPolGrid() {
    var track = $('polCarousel'), dots = $('polDots');
    track.innerHTML = ''; dots.innerHTML = '';
    var unlocked = loadUnlockedPoliticians();
    // Unlocked politicians always sort first, so a newly-unlocked pick never
    // sits behind a locked card you'd have to scroll past. Stable sort keeps
    // each group's relative order otherwise unchanged.
    data.politicians.sort(function (a, b) {
      return (isPoliticianUnlocked(unlocked, a.id) ? 0 : 1) - (isPoliticianUnlocked(unlocked, b.id) ? 0 : 1);
    });
    data.politicians.forEach(function (p, i) {
      track.appendChild(buildPolCard(p, !isPoliticianUnlocked(unlocked, p.id)));
      var dot = document.createElement('button');
      dot.className = 'pol-dot' + (i === 0 ? ' on' : '');
      dot.setAttribute('aria-label', p.name);
      dot.addEventListener('click', function () {
        track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
      });
      dots.appendChild(dot);
    });
    track.addEventListener('scroll', onCarouselScroll);
  }

  // Live-updates every rendered card's diamonds/countdown once a second, and
  // flips a card back to playable the moment its cooldown hits zero.
  setInterval(function () {
    var track = $('polCarousel');
    // The select screen is hidden for the whole match, but this interval kept
    // running through it — 21 localStorage reads + 21 JSON.parses + 21
    // innerHTML rebuilds a second, for cards nobody can see.
    if (!track || $('selectOverlay').hidden) return;
    Array.prototype.forEach.call(track.children, function (card) {
      if (card.classList.contains('pol-card-hard-locked')) return;
      var id = card.getAttribute('data-pol-id');
      var p = id && data.politicians.filter(function (x) { return x.id === id; })[0];
      if (p) renderCardCharges(card, p, false);
    });
  }, 1000);

  function startGame(p1Id) {
    useCharge(p1Id);
    var p1Pol = data.politicians.filter(function (p) { return p.id === p1Id; })[0];
    // Same-party matchups don't make sense (e.g. two BJP candidates running
    // against each other) — "Independent" isn't a real shared affiliation,
    // so independents are exempt from this exclusion.
    var others = data.politicians.filter(function (p) {
      return p.id !== p1Id && (p1Pol.party === 'Independent' || p.party !== p1Pol.party);
    });
    // Opponent draw is weighted toward still-locked politicians
    // (LOCKED_OPPONENT_CHANCE) so unlocking the roster keeps moving — falls
    // back to a uniform draw over `others` if that split isn't available
    // (e.g. everything's already unlocked, or everything eligible is locked).
    var unlockedForDraw = loadUnlockedPoliticians();
    var lockedOthers = others.filter(function (p) { return !isPoliticianUnlocked(unlockedForDraw, p.id); });
    var unlockedOthers = others.filter(function (p) { return isPoliticianUnlocked(unlockedForDraw, p.id); });
    var opponentPool = (lockedOthers.length && unlockedOthers.length)
      ? (Math.random() < LOCKED_OPPONENT_CHANCE ? lockedOthers : unlockedOthers)
      : others;
    // Tutorial always faces Rahul Gandhi — a random opponent could nullify
    // Modi's power before the step-30 "use your special ability" gate, which
    // would leave that gate stuck forever (see finishActivatePower).
    var p2Id = tutorialMode ? 'rahul-gandhi' : opponentPool[Math.floor(Math.random() * opponentPool.length)].id;
    // Playtest hook: ?p2=<politician id> forces the opponent, bypassing the
    // unlock pool — pairs with ?ai= below so a specific kit can be retested
    // against a specific AI profile instead of waiting for the random draw.
    var forcedP2 = new URLSearchParams(location.search).get('p2');
    if (forcedP2 && !tutorialMode && data.politicians.some(function (p) { return p.id === forcedP2; })) p2Id = forcedP2;
    // Seeded rng (not Math.random) so game.actionLog can be replayed back to
    // the same outcome from just the seed + the action list (see startReplay).
    var seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    game = G.createGame(data, p1Id, p2Id, G.mulberry32(seed));
    game.seed = seed;
    window.__game = game; // debug/test hook — inspect live state from devtools
    // Playtest hook: ?ai=<profile key> forces the opponent's AI profile
    // instead of the random draw — the ladder profiles (e.g. ?ai=max) are
    // deliberately not in that draw, so this is the only way to face one.
    // Skipped in the tutorial, which needs its own scripted opponent.
    var forcedAI = forcedAIKey();
    if (!tutorialMode) {
      var levelKey = forcedAI || ('level-' + effectiveLevel());
      G.setupAI(game, 'p2', G.mulberry32(seed ^ 0x5eed), levelKey);
      game.forcedAIProfile = forcedAI || null;
      // Only an unforced auto-mode match feeds the adaptive ladder: a hand-
      // picked level is the player's own choice and shouldn't move itself.
      game.ratedMatch = !forcedAI && aiMode() === 'auto';
      if (forcedAI) showToast('AI profile: ' + forcedAI);
    }
    // Tutorial AI never crafts/activates its special power or nationwide
    // rally — both are entirely gated on !usedSpecial/!usedNationwide, so
    // marking them pre-used is enough to turn them off without touching
    // game.js's AI logic. The nationwide rally is scripted as a player-only
    // moment (tutorial grants the player tokens for it at phase 6) — without
    // this the AI could craft/launch its own first.
    if (tutorialMode) { game.players.p2.usedSpecial = true; game.players.p2.usedNationwide = true; }
    // tutorialMode itself flips false once coaching finishes (around phase
    // 6, after the nationwide rally) — this survives to phase 10 so the
    // end-of-game sign-off still knows the match started as a tutorial.
    wasTutorialGame = tutorialMode;

    // Map/UI colors and party symbols follow whichever politicians were
    // actually picked, not a fixed p1=orange/p2=green default.
    COLORS.p1 = game.players.p1.politician.primaryColor || '#E8871C';
    COLORS.p2 = game.players.p2.politician.primaryColor || '#1C8A4B';
    document.documentElement.style.setProperty('--p1', COLORS.p1);
    document.documentElement.style.setProperty('--p2', COLORS.p2);
    setPartySymbol($('p1PartySymbol'), game.players.p1.politician);
    setPartySymbol($('p2PartySymbol'), game.players.p2.politician);
    setPartySymbol($('cardP1Symbol'), game.players.p1.politician);
    setPartySymbol($('cardP2Symbol'), game.players.p2.politician);
    setPortrait($('p1Portrait'), game.players.p1.politician);
    setPortrait($('p2Portrait'), game.players.p2.politician);
    $('p1Name').textContent = game.players.p1.politician.name;
    $('p2Name').textContent = game.players.p2.politician.name;

    armed = null; activeGroup = null; groupPinned = false; activeAgenda = null; activeAction = null; activeCluster = null;
    lastMapTapId = null; lastBtnTapId = null; timerPaused = false;
    $('pauseToggleBtn').textContent = '⏸'; $('pauseToggleBtn').title = 'Pause';
    G.pushLog(game, '🗳️ Your opponent this match: ' + game.players.p2.politician.name + ' (' + game.players.p2.politician.party + ')');

    $('selectOverlay').hidden = true;
    $('endOverlay').hidden = true;
    $('stage').hidden = false;
    $('tutorialNavbar').hidden = true; // select-screen's fixed nav is done; in-game coaching (if any) uses its own in-flow banner instead

    buildGroupsBox();
    buildAgendaTray();
    selectedId = game.players.p1.politician.homeState ? homeStateSvgId('p1') : 'INUP';
    selectState(selectedId);
    renderAll();
    startPhaseTimer();
    if (tutorialMode) startStageTutorial();
    switchMusic('bg_music');
    playSound('phase_reset');
  }

  function homeStateSvgId(pk) {
    var name = game.players[pk].politician.homeState;
    var s = game.states.filter(function (st) { return st.name === name; })[0];
    return s ? s.svgId : 'INUP';
  }

  // ---------------------------------------------------------------------
  // AI pacing — the AI acts one move at a time via G.aiStep() so it plays
  // out visibly instead of dumping all its funds/taps instantly. A fixed
  // 2-4s cooldown only gives it ~15 ticks in a 45s phase, which isn't
  // enough to spend a phase's funds once agenda taps and rally compete for
  // those same ticks — funds were quietly piling up unspent all game. So
  // the interval is planned per phase instead of fixed: dry-run the AI's
  // remaining turn on a throwaway clone of the game to count how many
  // actions it actually needs this phase, then spread exactly that many
  // ticks evenly across the phase's real duration (clamped so it never
  // looks instant or dead) — same total spend as before, evenly paced
  // rather than fixed-interval-and-often-incomplete.
  // ---------------------------------------------------------------------
  var AI_MIN_TICK_MS = 300, AI_MAX_TICK_MS = 4000;
  var aiTickIntervalMs = 3000;

  function planAITickPacing(game) {
    if (typeof structuredClone !== 'function') return; // keep prior default
    var rng = game.rng;
    game.rng = null; // functions aren't structured-cloneable
    var clone = structuredClone(game);
    game.rng = rng;
    clone.rng = Math.random; // dry run only needs *a* count, not the real sequence
    var count = 0;
    while (G.aiStep(clone) && count < 500) count++;
    var phaseMs = game.cfg.phaseDurationSeconds * 1000;
    var interval = count > 0 ? phaseMs / count : AI_MAX_TICK_MS;
    aiTickIntervalMs = Math.max(AI_MIN_TICK_MS, Math.min(AI_MAX_TICK_MS, interval));
  }

  // Visual FX for one action, from either the live AI tick or a replay step.
  // pk drives the colour; withSound is off during fast replay to keep 2x/3x
  // from turning into a wall of noise.
  function playActionFx(action, pk, withSound) {
    if (!action) return;
    pk = pk || 'p2';
    if (action.svgId) {
      var el = document.getElementById(action.svgId);
      var pt = viewportPoint(el);
      if (el && el.animate) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 220 });
      spawnFlash(pt.x, pt.y, pk);
      if (action.costCr) spawnMoneyText(pt.x, pt.y, action.costCr, -1, pk);
    }
    if (action.type === 'power') {
      if (withSound) playPowerSound(game.players[pk].politician.name);
      spawnPowerBurst(pk, game.players[pk].politician.power.name, game.players[pk].politician.name);
    } else if (action.type === 'nationwide') {
      if (withSound) playSound('fanfare');
      spawnPowerBurst(pk, 'Nationwide Rally', game.players[pk].politician.name, '🇮🇳');
    }
  }

  function scheduleAITick() {
    var delay = aiTickIntervalMs * (0.8 + Math.random() * 0.4); // +-20% jitter, stays organic
    setTimeout(function () {
      if (game && !timerPaused && !game.winner && !replay) {
        var action = G.aiStep(game);
        if (action) {
          renderAll();
          playActionFx(action, 'p2', true);
        }
      }
      scheduleAITick();
    }, delay);
  }

  // ---------------------------------------------------------------------
  // Phase timer
  // ---------------------------------------------------------------------
  // Resets the clock + AI pacing for a fresh phase without starting the
  // countdown — split out of startPhaseTimer so doEndPhase can always reset
  // on every phase transition, even when a tutorial phase-gate is about to
  // keep the game paused (otherwise timeLeft stays at the ~0 it just hit,
  // and resuming later instantly re-triggers doEndPhase again).
  function resetPhaseTimer() {
    clearInterval(timerHandle);
    timeLeft = game.cfg.phaseDurationSeconds;
    $('phaseTimer').textContent = fmtClock(timeLeft);
    planAITickPacing(game);
  }

  function startPhaseTimer() {
    resetPhaseTimer();
    resumePhaseTimer();
  }

  function resumePhaseTimer() {
    clearInterval(timerHandle);
    timerHandle = setInterval(function () {
      timeLeft--;
      $('phaseTimer').textContent = fmtClock(timeLeft);
      if (timeLeft <= 0) doEndPhase();
    }, 1000);
  }

  function doEndPhase() {
    clearInterval(timerHandle);
    var fundsBefore = game.players.p1.fundsCr;
    G.endPhase(game);
    var fundsGained = game.players.p1.fundsCr - fundsBefore;
    if (fundsGained > 0) {
      var pt = viewportPoint($('p1Funds'));
      spawnMoneyText(pt.x, pt.y, fundsGained, 1);
      playSound('cash_added');
    }
    if (game.winner) {
      playSound('game_over'); renderAll();
      if (wasTutorialGame) {
        wasTutorialGame = false;
        updateTutorialCounter(TUTORIAL_STEPS.length + TUTORIAL_STAGE_STEPS.length + 1);
        $('tutorialSignoffOverlay').hidden = false;
      }
      else showEndOverlay();
      return;
    }
    if (game.log.slice(0, 10).some(function (e) { return e.msg.indexOf('💰 You hold') === 0; })) playSound('fanfare');
    renderAll();
    playSound('phase_reset');
    showToast('Phase ' + game.phase + ' begins');
    resetPhaseTimer(); // always give the new phase a full clock, whether or not a tutorial gate is about to pause it
    if (!checkTutorialPhaseGate()) resumePhaseTimer();
  }

  // ---------------------------------------------------------------------
  // Replay — record on game.actionLog (game.js), re-run the same action
  // calls through the engine from the recorded seed. Version-locked: an
  // engine balance change invalidates an older saved replay (we warn, not
  // crash). See CLAUDE.md discussion.
  // ---------------------------------------------------------------------
  function currentReplayRecord() {
    if (!game || !game.actionLog || game.seed == null) return null;
    return {
      v: GAME_VERSION, seed: game.seed,
      p1: game.players.p1.politician.id,
      p2: game.players.p2.politician.id,
      log: game.actionLog,
      finalSeats: game.finalSeats || null,
      score: game.score != null ? game.score : null
    };
  }

  function saveReplay() {
    var rec = currentReplayRecord();
    if (!rec) return;
    try { localStorage.setItem(REPLAY_KEY, JSON.stringify(rec)); } catch (e) { /* quota / private mode — in-memory replay still works this session */ }
  }

  function loadSavedReplay() {
    try {
      var rec = JSON.parse(localStorage.getItem(REPLAY_KEY) || 'null');
      return rec && rec.log ? rec : null;
    } catch (e) { return null; }
  }

  // Apply one recorded entry and return an FX descriptor (same shape aiStep
  // returns) so the replay can fire the same flashes/bursts a live move does.
  function applyReplayEntry(e) {
    if (e.fn === 'endPhase') {
      var before = game.players.p1.fundsCr;
      G.endPhase(game);
      return { type: 'endPhase', fundsGained: game.players.p1.fundsCr - before };
    }
    var fn = G[e.fn];
    if (typeof fn !== 'function') return null;
    var r = fn.apply(null, [game, e.pk].concat(e.args || []));
    if (!r || !r.ok) return null;
    var svgId = (e.fn === 'investCash' || e.fn === 'playRallyToken') ? e.args[0]
      : (e.fn === 'activatePower' && e.args[0]) ? e.args[0].targetStateSvgId : null;
    var type = e.fn === 'activatePower' ? 'power'
      : e.fn === 'activateNationwideRally' ? 'nationwide'
        : e.fn === 'investCash' ? 'invest'
          : e.fn === 'playRallyToken' ? 'rally'
            : e.fn === 'tapAgenda' ? 'agenda' : 'craft';
    return { type: type, pk: e.pk, svgId: svgId, costCr: r.cost || null };
  }

  function startReplay(rec) {
    if (!rec || !rec.log || replay) return;
    if (!data) { showToast('Still loading…'); return; }
    if (rec.v && rec.v !== GAME_VERSION) {
      showToast('Replay recorded on v' + rec.v + ' — may not match exactly');
    }
    clearInterval(timerHandle);
    var savedGame = game;
    game = G.createGame(data, rec.p1, rec.p2, G.mulberry32(rec.seed));
    game.seed = rec.seed;
    window.__game = game;
    replay = { rec: rec, idx: 0, speed: 1, playing: true, timer: null, savedGame: savedGame };

    COLORS.p1 = game.players.p1.politician.primaryColor || '#E8871C';
    COLORS.p2 = game.players.p2.politician.primaryColor || '#1C8A4B';
    document.documentElement.style.setProperty('--p1', COLORS.p1);
    document.documentElement.style.setProperty('--p2', COLORS.p2);
    setPartySymbol($('p1PartySymbol'), game.players.p1.politician);
    setPartySymbol($('p2PartySymbol'), game.players.p2.politician);
    setPortrait($('p1Portrait'), game.players.p1.politician);
    setPortrait($('p2Portrait'), game.players.p2.politician);
    $('p1Name').textContent = game.players.p1.politician.name;
    $('p2Name').textContent = game.players.p2.politician.name;

    activeGroup = null; activeAgenda = null; activeAction = null; activeCluster = null; armed = null;
    $('endOverlay').hidden = true;
    $('selectOverlay').hidden = true;
    $('welcomeOverlay').hidden = true;
    $('stage').hidden = false;
    $('replayBar').hidden = false;
    buildGroupsBox();
    buildAgendaTray();
    selectState('INUP');
    renderAll();
    updateReplayBar();
    scheduleReplayStep();
  }

  function scheduleReplayStep() {
    if (!replay) return;
    clearTimeout(replay.timer);
    if (!replay.playing) return;
    replay.timer = setTimeout(function () {
      if (!replay) return;
      if (replay.idx >= replay.rec.log.length) { replay.playing = false; updateReplayBar(); verifyReplay(); return; }
      var action = applyReplayEntry(replay.rec.log[replay.idx++]);
      renderAll();
      var sound = replay.speed === 1;
      if (action && action.type === 'endPhase') {
        if (action.fundsGained > 0) {
          var fp = viewportPoint($('p1Funds'));
          spawnMoneyText(fp.x, fp.y, action.fundsGained, 1);
        }
        if (sound) playSound('phase_reset');
        if (!game.winner) showToast('Phase ' + game.phase + ' begins');
      } else if (action) {
        playActionFx(action, action.pk, sound);
        if (sound && action.type === 'invest') playSound('money_spent');
        else if (sound && action.type === 'rally') playSound('rally_sound');
      }
      updateReplayBar();
      scheduleReplayStep();
    }, 620 / replay.speed);
  }

  function verifyReplay() {
    var want = replay.rec.finalSeats;
    if (want) {
      var got = E.nationalSeats(game.states, game.pop);
      if (got.p1 !== want.p1 || got.p2 !== want.p2 || got.others !== want.others) {
        console.error('[replay] final seats mismatch — got', got, 'expected', want,
          '(engine changed since this game was recorded?)');
      }
    }
    // Composite score folds in groups/agendas/sweeps/margin, so it's a
    // stricter integrity check than seats alone — a divergence that happened
    // to preserve seat count still trips this.
    if (replay.rec.score != null && game.score != null && game.score !== replay.rec.score) {
      console.error('[replay] score mismatch — got', game.score, 'expected', replay.rec.score);
    }
  }

  function updateReplayBar() {
    if (!replay) return;
    var total = replay.rec.log.length;
    $('replayProgress').textContent = 'Phase ' + game.phase + ' · ' + Math.min(replay.idx, total) + '/' + total;
    $('replayPlayBtn').textContent = replay.playing ? '⏸' : (replay.idx >= total ? '↺' : '▶');
    ['1', '2', '3'].forEach(function (s) {
      $('replaySpeed' + s).classList.toggle('on', String(replay.speed) === s);
    });
  }

  function exitReplay() {
    if (!replay) return;
    clearTimeout(replay.timer);
    game = replay.savedGame;
    window.__game = game;
    replay = null;
    $('replayBar').hidden = true;
    COLORS.p1 = game.players.p1.politician.primaryColor || '#E8871C';
    COLORS.p2 = game.players.p2.politician.primaryColor || '#1C8A4B';
    document.documentElement.style.setProperty('--p1', COLORS.p1);
    document.documentElement.style.setProperty('--p2', COLORS.p2);
    $('endOverlay').hidden = false;
  }

  function wireReplayControls() {
    fastTap($('replayPlayBtn'), function () {
      if (!replay) return;
      if (replay.idx >= replay.rec.log.length) { // restart
        game = G.createGame(data, replay.rec.p1, replay.rec.p2, G.mulberry32(replay.rec.seed));
        game.seed = replay.rec.seed;
        window.__game = game;
        replay.idx = 0; replay.playing = true;
        selectState('INUP'); renderAll();
      } else {
        replay.playing = !replay.playing;
      }
      updateReplayBar();
      scheduleReplayStep();
    });
    ['1', '2', '3'].forEach(function (s) {
      fastTap($('replaySpeed' + s), function () {
        if (!replay) return;
        replay.speed = parseInt(s, 10);
        updateReplayBar();
        if (replay.playing) scheduleReplayStep();
      });
    });
    fastTap($('replayExitBtn'), exitReplay);
    fastTap($('watchReplayBtn'), function () { startReplay(currentReplayRecord()); });
    fastTap($('welcomeReplayBtn'), function () { startReplay(loadSavedReplay()); });
    $('welcomeReplayBtn').hidden = !loadSavedReplay();
  }

  function showEndOverlay() {
    saveReplay();
    maybeRecordHighScore();
    updateLadderAfterMatch();
    var seats = game.finalSeats;
    var seal, headline, sub;
    if (game.winner === 'p1') {
      seal = '🏆'; headline = 'You won the election'; sub = 'You crossed 272 seats.';
      if (unlockPolitician(game.players.p2.politician.id)) {
        sub += ' 🔓 ' + game.players.p2.politician.name + ' unlocked!';
        spawnUnlockCelebration(game.players.p2.politician);
        playSound('fanfare');
      }
    }
    else if (game.hungParliament) {
      seal = '⚖️';
      headline = 'Hung parliament — a draw';
      sub = 'Neither side reached 272 seats.';
    }
    else { seal = '💔'; headline = 'You lost the election'; sub = game.players.p2.politician.name + ' crossed 272 seats.'; }
    $('declareSeal').textContent = seal;
    $('endHeadline').textContent = headline;
    $('endSub').textContent = sub;
    renderEndWinnerPortrait();
    renderEndLedger(seats);
    renderParliamentChart(seats);
    renderEndStats();
    $('playAgainBtn').style.background = COLORS.p1;
    $('endOverlay').hidden = false;
    sounds.bg_music.pause();
  }

  // Framed as a challenge to a friend, not a stats dump — the point is to
  // get them to go play, not just report the score.
  function buildShareText() {
    var seats = game.finalSeats;
    var me = game.players.p1.politician.name;
    var opp = game.players.p2.politician.name;
    var url = SITE_URL;
    var line;
    if (game.winner === 'p1') {
      line = 'I just won India as ' + me + ' in Kaun Banega Pradhan Mantri (' + seats.p1 + '-' + seats.p2 + ')! Think you can do better?';
    } else if (game.winner === 'p2') {
      line = opp + ' just beat me ' + seats.p2 + '-' + seats.p1 + ' in Kaun Banega Pradhan Mantri. Think you can do better?';
    } else {
      line = 'Hung parliament! ' + me + ' and ' + opp + ' tied ' + seats.p1 + '-' + seats.p2 + ' in Kaun Banega Pradhan Mantri. Think you can do better?';
    }
    return line + ' ' + url;
  }

  function shareResult() {
    var text = buildShareText();
    buildShareCardBlob(function (blob) {
      var file = blob && new File([blob], 'pme-result.png', { type: 'image/png' });
      // File-attachment sharing needs a secure context (https, or literal
      // localhost) — silently absent over a plain-http LAN address, which
      // is why this must fall through to the link-only sheet in that case
      // rather than erroring.
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: text, title: 'Kaun Banega Pradhan Mantri' }).catch(function () {});
      } else {
        openShareOverlay(text, blob);
      }
    });
  }

  // A real screenshot of the actual on-screen declare-card (headline,
  // portrait, parliament chart, ledger, match stats) via html2canvas —
  // not a redrawn approximation, so it always matches whatever's actually
  // shown, including future edits to that card. The Play again/Share
  // buttons are excluded (ignoreElements) since they're UI chrome, not
  // part of the result. Calls back with a PNG Blob, or null on failure.
  // html2canvas is 194KB and its only job is screenshotting the end-of-game
  // declare card, which most sessions never reach — so it's fetched on the
  // first Share tap instead of blocking every boot. The callback(null) path
  // below was already the "library unavailable" fallback; a failed load just
  // reuses it.
  var html2canvasLoad = null;
  function loadHtml2Canvas() {
    if (typeof html2canvas === 'function') return Promise.resolve(true);
    if (html2canvasLoad) return html2canvasLoad;
    html2canvasLoad = new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = 'html2canvas.min.js';
      s.onload = function () { resolve(typeof html2canvas === 'function'); };
      s.onerror = function () { html2canvasLoad = null; resolve(false); };
      document.head.appendChild(s);
    });
    return html2canvasLoad;
  }

  function buildShareCardBlob(callback) {
    loadHtml2Canvas().then(function (ok) {
      if (!ok) { callback(null); return; }
      renderShareCardBlob(callback);
    });
  }

  function renderShareCardBlob(callback) {
    html2canvas(document.querySelector('.declare-card'), {
      backgroundColor: '#FBF8EF',
      useCORS: true,
      ignoreElements: function (el) { return el.classList && el.classList.contains('declare-footer'); }
    }).then(function (canvas) {
      canvas.toBlob(function (blob) { callback(blob); }, 'image/png');
    }).catch(function () { callback(null); });
  }

  // Fallback sheet — used whenever native file-sharing isn't available
  // (desktop, older Android, or a plain-http origin that can't reach the
  // secure-context-gated Web Share API at all). Every deep link here embeds
  // the full challenge text directly (wa.me's `text=`, the SMS `body=`),
  // which — unlike routing the same string through navigator.share's own
  // `text` field on iOS — reliably survives into WhatsApp: going through
  // the OS share sheet lets it auto-detect the URL inside the string and
  // hand WhatsApp's extension a bare URL attachment, dropping everything
  // else, a known OS/WhatsApp limitation confirmed via real-device testing.
  function openShareOverlay(full, blob) {
    var enc = encodeURIComponent(full);
    $('shareWhatsapp').href = 'https://wa.me/?text=' + enc;
    $('shareX').href = 'https://twitter.com/intent/tweet?text=' + enc;
    $('shareSms').href = 'sms:&body=' + enc;
    $('shareCopyBtn').onclick = function () {
      $('shareOverlay').hidden = true;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(full).then(function () {
          showToast('Result copied to clipboard');
        }).catch(function () { window.prompt('Copy your result:', full); });
      } else {
        window.prompt('Copy your result:', full);
      }
    };
    var saveBtn = $('shareSaveImageBtn');
    if (blob) {
      saveBtn.hidden = false;
      saveBtn.href = URL.createObjectURL(blob);
      saveBtn.download = 'pme-result.png';
    } else {
      saveBtn.hidden = true;
    }
    $('shareOverlay').hidden = false;
  }

  // Only shown for a clean win — a hung parliament has no winner to portray.
  function renderEndWinnerPortrait() {
    var img = $('endWinnerPortrait');
    if (game.winner !== 'p1' && game.winner !== 'p2') { img.hidden = true; return; }
    img.hidden = false;
    setPortrait(img, game.players[game.winner].politician);
  }

  // Opponent seat-row label: "(AI 3)". Read off the live game rather than
  // the difficulty setting — the setting can change mid-match, and the
  // adaptive ladder may already have promoted the player by the time this
  // card renders; the game's own profile is what was actually played.
  function aiSeatLabel() {
    var pr = game.players.p2.aiProfile;
    if (!pr) return 'AI';
    var m = /^level-(\d+)$/.exec(pr.key);
    return m ? 'AI ' + m[1] : 'AI ' + pr.key;
  }

  function renderEndLedger(seats) {
    var rows = [
      { pol: game.players.p1.politician, type: 'You', n: seats.p1, color: COLORS.p1, win: game.winner === 'p1' },
      { pol: game.players.p2.politician, type: aiSeatLabel(), n: seats.p2, color: COLORS.p2, win: game.winner === 'p2' }
    ];
    $('endSeats').innerHTML = rows.map(function (r) {
      return '<div class="ledger-row' + (r.win ? ' winner' : '') + '">' +
        '<img class="ledger-portrait" data-ledger-pol="' + r.pol.id + '" alt="">' +
        '<span class="ledger-dot" style="background:' + r.color + '"></span>' +
        '<span class="ledger-name">' + r.pol.name + ' <span class="ledger-type">(' + r.type + ')</span></span>' +
        '<span class="ledger-seats">' + r.n + ' seats</span></div>';
    }).join('') +
      '<div class="ledger-row others">' +
      '<span class="ledger-dot" style="background:' + COLORS.others + '"></span>' +
      '<span class="ledger-name">Others</span>' +
      '<span class="ledger-seats">' + seats.others + ' seats</span></div>';
    rows.forEach(function (r) {
      var img = document.querySelector('[data-ledger-pol="' + r.pol.id + '"]');
      if (img) setPortrait(img, r.pol);
    });
  }

  // Rally/dominance/agenda counts are derived from live match state rather
  // than tracked as separate running counters, matching this project's
  // existing pattern (e.g. renderGroupCaptureBadges reading E.dominanceActive
  // live instead of a stored flag).
  function ralliesDeployedBy(pk) {
    var n = 0;
    Object.keys(game.rallyPlaysByState).forEach(function (svgId) {
      (game.rallyPlaysByState[svgId] || []).forEach(function (k) { if (k === pk) n++; });
    });
    return n;
  }
  function groupsDominatedBy(pk) {
    var threshold = game.cfg.regionalDominance.thresholdBps;
    return game.groups.filter(function (g) { return E.dominanceActive(g, game.states, game.pop, pk, threshold); }).length;
  }
  function agendasCompletedBy(pk) {
    var pl = game.players[pk];
    return Object.keys(pl.agendaProgress).filter(function (k) { return pl.agendaProgress[k] >= game.cfg.agenda.tapsToComplete; }).length;
  }
  function cleanSweepsBy(pk) {
    return game.states.filter(function (s) { return game.pop[s.svgId][pk] === E.BPS; }).length;
  }

  function renderEndStats() {
    var p1Score = game.score != null ? game.score : G.computeScore(game, 'p1').score;
    var p2Score = G.computeScore(game, 'p2').score;
    // "Final score" sits at the bottom styled like a table's total row — it
    // isn't literally the sum of the rows above, but reads as their upshot.
    var stats = [
      { label: 'Rallies deployed', p1: ralliesDeployedBy('p1'), p2: ralliesDeployedBy('p2') },
      { label: 'Regions dominated', p1: groupsDominatedBy('p1'), p2: groupsDominatedBy('p2') },
      { label: 'Clean sweeps', p1: cleanSweepsBy('p1'), p2: cleanSweepsBy('p2') },
      { label: 'Agendas completed', p1: agendasCompletedBy('p1'), p2: agendasCompletedBy('p2') },
      { label: 'Special power used', p1: game.players.p1.usedSpecial ? 'Yes' : 'No', p2: game.players.p2.usedSpecial ? 'Yes' : 'No' },
      { label: 'Nationwide rally used', p1: game.players.p1.usedNationwide ? 'Yes' : 'No', p2: game.players.p2.usedNationwide ? 'Yes' : 'No' },
      { label: 'Final score', p1: p1Score.toLocaleString(), p2: p2Score.toLocaleString(), total: true }
    ];
    $('endStats').innerHTML = '<div class="pol-section-label">Match stats</div>' + stats.map(function (s) {
      return '<div class="stat-row' + (s.total ? ' stat-total' : '') + '">' +
        '<span class="stat-val p1">' + s.p1 + '</span>' +
        '<span class="stat-label">' + s.label + '</span>' +
        '<span class="stat-val p2">' + s.p2 + '</span></div>';
    }).join('');
  }

  // Desktop's end-game hemicycle, ported as-is: fetch the real 543-seat
  // parliamentarch SVG (assets/icons/Parliament_diagram.svg, unused until
  // now), strip its real-world party colors, and recolor circles in
  // document order — a contiguous P1 block, then Others, then P2 — which
  // approximates a clean left/center/right hemicycle split because that
  // SVG's seats are emitted in the same angular sweep order.
  var parliamentSvgText = null;
  function renderParliamentChart(seats) {
    var container = $('endParliamentChart');
    function paint(svgText) {
      parliamentSvgText = svgText;
      container.innerHTML = svgText;
      var svg = container.querySelector('svg');
      if (!svg) return;
      if (!svg.getAttribute('viewBox')) {
        var w = parseFloat(svg.getAttribute('width') || '360');
        var h = parseFloat(svg.getAttribute('height') || '185');
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      }
      svg.removeAttribute('width'); svg.removeAttribute('height');
      var circles = svg.querySelectorAll('circle');
      var blocks = [
        { n: seats.p1, color: COLORS.p1 },
        { n: seats.others, color: COLORS.others },
        { n: seats.p2, color: COLORS.p2 }
      ];
      var i = 0;
      blocks.forEach(function (b) {
        for (var k = 0; k < b.n && i < circles.length; k++, i++) circles[i].style.fill = b.color;
      });
    }
    if (parliamentSvgText) { paint(parliamentSvgText); return; }
    fetch('../assets/icons/Parliament_diagram.svg')
      .then(function (r) { return r.text(); })
      .then(paint)
      .catch(function () { container.innerHTML = ''; });
  }

  // ---------------------------------------------------------------------
  // Map / groups / card rendering
  // ---------------------------------------------------------------------
  function leaderColor(svgId) {
    var p = game.pop[svgId];
    if (!p) return COLORS.others;
    if (p.p1 === p.p2) return COLORS.others;
    var leader = p.p1 > p.p2 ? COLORS.p1 : COLORS.p2;
    var intensity = Math.min(1, Math.abs(p.p1 - p.p2) / 10000);
    return mixHex(COLORS.others, leader, intensity);
  }
  // Clean-sweep glow is a live readout (like renderGroupCaptureBadges' own
  // dominance check) rather than reading game.cleanSweepHeld — that flag
  // exists only to gate the one-time payout, not to drive this visual.
  function paintMap() {
    document.querySelectorAll('.india-map path[id], .india-map circle[id]').forEach(function (el) {
      el.style.fill = leaderColor(el.id);
      var p = game.pop[el.id];
      el.classList.toggle('swept-p1', !!p && p.p1 === E.BPS);
      el.classList.toggle('swept-p2', !!p && p.p2 === E.BPS);
    });
  }

  // Persistent colored dot per rally token played on a state (as opposed to
  // the transient fx-flash/money-text effects), so it stays visible as a
  // reminder of which states are capped out vs still open for a rally.
  // Delhi/Goa/Kerala are still real (small but non-zero) shapes on the map,
  // just too small/narrow to TAP reliably — the whole reason they get a
  // corner button instead. A token dot at their real map position is
  // therefore easy to miss, same problem the button exists to solve — so
  // always anchor their dot to the button, not the map shape underneath it.
  var SMALL_STATE_BTN_ID = { INDL: 'delhiBtn', INGA: 'goaBtn', INKL: 'keralaBtn' };
  // Every getBoundingClientRect() runs BEFORE any DOM write, then the dots go
  // in as one fragment. Reading a rect after an append forces a synchronous
  // layout recalculation, so the old read/append/read/append loop paid for one
  // full layout per rallied state — measured 2.19ms vs 0.09ms batched (24x) at
  // 20 states on desktop WebKit, and it grew with every rally played.
  function renderRallyTokens() {
    var layer = $('rallyTokenLayer');
    var spots = [];
    Object.keys(game.rallyPlaysByState).forEach(function (svgId) {
      var plays = game.rallyPlaysByState[svgId];
      if (!plays || !plays.length) return;
      var btnId = SMALL_STATE_BTN_ID[svgId];
      if (btnId) {
        var br = $(btnId).getBoundingClientRect();
        if (!br.width) return;
        // top-right corner, clear of the icon/label
        spots.push({ plays: plays, cx: br.right - 12, cy: br.top + 12, w: br.width });
      } else {
        var el = document.getElementById(svgId);
        if (!el) return;
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return; // hidden map element (e.g. a dropped small UT)
        spots.push({ plays: plays, cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width });
      }
    });
    // Dot pitch: the v2.0.0 rem migration moved the stylesheet off fixed px but
    // missed this JS-side constant, which stayed at 16px while the dot itself
    // is 0.375rem (~6px) — so two dots sat nearly two full dot-widths apart.
    // Now derived from the live rem scale AND clamped to the state's own width,
    // so a pair reads as one tight cluster on a small state instead of
    // straddling its borders.
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var frag = document.createDocumentFragment();
    spots.forEach(function (s) {
      var pitch = Math.min(0.55 * rem, Math.max(0.28 * rem, s.w * 0.38));
      s.plays.forEach(function (pk, i) {
        var dot = document.createElement('div');
        dot.className = 'rally-token';
        dot.style.left = (s.cx + (i - (s.plays.length - 1) / 2) * pitch) + 'px';
        dot.style.top = s.cy + 'px';
        dot.style.background = COLORS[pk];
        frag.appendChild(dot);
      });
    });
    layer.innerHTML = '';
    layer.appendChild(frag);
  }

  function updateCard() {
    if (activeAction) { renderActionInfo(activeAction); return; }
    if (activeAgenda) { renderAgendaCard(activeAgenda); return; }
    if (activeCluster) { renderClusterCard(activeCluster); return; }
    if (activeGroup) { renderGroupCard(activeGroup); return; }
    renderStateCard();
  }

  // Rally / nationwide / special-power info — same info-panel slot again,
  // as a plain-text description instead of chips (see design doc's rally
  // config for the numbers; special power's description already ships in
  // politicians-data.json, so it's reused verbatim rather than re-authored).
  function renderActionInfo(kind) {
    $('cardVsBar').hidden = true;
    $('cardPinBtn').hidden = true;
    var el = $('cardGroups');
    el.dataset.key = ''; // cardGroups is shared; drop renderMemberCard's rebuild key
    el.className = 'info-groups desc';
    var rc = game.cfg.rally;
    if (kind === 'rally') {
      $('cardName').textContent = '📢 State Rally';
      $('cardSeats').textContent = game.players.p1.tokens.stateRally + ' tokens';
      el.textContent = 'Free token, earned from investment milestones. Deploy on a state for +' +
        (rc.tokenBoostBps / 100) + '% popularity there (max ' + rc.maxPlaysPerStateShared + ' plays/state, shared with your opponent).';
    } else if (kind === 'nationwide') {
      var nState = craftSlotState('nationwide');
      $('cardName').textContent = '🇮🇳 Nationwide Rally';
      $('cardSeats').textContent = nState === 'used' ? 'Used' : nState === 'ready' ? 'Ready' :
        game.players.p1.tokens.stateRally + '/' + rc.nationwideRallyCraftCost + ' tokens';
      el.textContent = 'Craft for ' + rc.nationwideRallyCraftCost + ' rally tokens (unlocks phase ' +
        rc.nationwideRallyMinPhase + '+), one-time use. Activating gives +' + (rc.nationwideRallyBoostBps / 100) +
        '% popularity in every state at once.';
    } else if (kind === 'special') {
      var pol = game.players.p1.politician, power = pol.power, sState = craftSlotState('special');
      $('cardName').textContent = '⭐ ' + power.name;
      $('cardSeats').textContent = sState === 'used' ? 'Used' : sState === 'ready' ? 'Ready' :
        game.players.p1.tokens.stateRally + '/' + rc.specialPowerupCraftCost + ' tokens';
      // Same pol-power block (seal + benefit/cost/unlock) as the politician
      // select card, reused verbatim rather than the raw engine description
      // text, so the two places a player checks a power's details agree.
      el.className = 'pol-power';
      el.innerHTML = '<div class="pow-seal">⚡</div><div class="pow-name">' + power.name + '</div>' +
        '<div class="pow-benefit">Benefit: ' + pol.specialPower.effect + '</div>' +
        '<div class="pow-cost">Cost: ' + pol.specialPower.cost + '</div>' +
        '<div class="pow-unlock">Unlocks at: Phase ' + (power.requiresMinPhase || 1) + '</div>';
    }
  }

  // Agenda-info mode — takes over the same info-panel space as the state/
  // group card to show which regions a tapped agenda helps or hurts, read
  // straight from policy-tags.json's tagEffects (no separate authored
  // description text to keep in sync).
  function renderAgendaCard(name) {
    var policy = game.policiesByName[name]; if (!policy) return;
    $('cardVsBar').hidden = true;
    $('cardPinBtn').hidden = true;
    $('cardName').textContent = (AGENDA_ICONS[name] || '📜') + ' ' + name;
    var taps = game.players.p1.agendaProgress[name] || 0;
    var done = taps >= game.cfg.agenda.tapsToComplete;
    var seatsEl = $('cardSeats');
    if (done) {
      seatsEl.textContent = 'Maxed';
    } else {
      var seatDelta = G.previewAgendaTapSeatDelta(game, 'p1', name);
      var cls = seatDelta > 0 ? 'gain' : seatDelta < 0 ? 'loss' : '';
      var sign = seatDelta > 0 ? '+' : '';
      seatsEl.innerHTML = taps + '/' + game.cfg.agenda.tapsToComplete + ' committed · next tap ~<span class="seat-preview ' +
        cls + '">' + sign + seatDelta + ' seats</span>';
    }
    var el = $('cardGroups');
    el.dataset.key = ''; // cardGroups is shared; drop renderMemberCard's rebuild key
    el.className = 'led-grid';
    el.innerHTML = '';
    var chips = agendaEffectChips(name);
    if (!chips.length) { el.innerHTML = '<span class="none">No regional effect</span>'; return; }
    chips.forEach(function (c) {
      var chip = document.createElement('span');
      chip.className = 'led-chip ' + c.cls;
      chip.textContent = c.text;
      el.appendChild(chip);
    });
  }

  function renderStateCard() {
    var s = game.statesById[selectedId], p = game.pop[selectedId];
    if (!s || !p) return;
    $('cardPinBtn').hidden = true;
    $('cardVsBar').hidden = false;
    $('cardName').textContent = s.name;
    $('cardSeats').textContent = s.seats + ' seats';
    $('cardP1Fill').style.width = (p.p1 / 100) + '%';
    $('cardOthFill').style.width = (p.others / 100) + '%';
    $('cardP2Fill').style.width = (p.p2 / 100) + '%';
    $('cardP1Pct').textContent = fmtPct(p.p1);
    $('cardP2Pct').textContent = fmtPct(p.p2);
    var groupsEl = $('cardGroups');
    groupsEl.dataset.key = ''; // cardGroups is shared; drop renderMemberCard's rebuild key
    groupsEl.className = 'info-groups';
    groupsEl.innerHTML = '';
    if (!s.tags.length) { groupsEl.innerHTML = '<span class="none">No group affiliations</span>'; }
    else s.tags.forEach(function (key) {
      var g = game.groups.filter(function (x) { return x.key === key; })[0]; if (!g) return;
      var chip = document.createElement('span');
      chip.className = 'chip'; chip.title = g.label; chip.textContent = g.icon;
      groupsEl.appendChild(chip);
    });
  }

  // Group overview — takes over the same info-panel space as the single-
  // state card. Shows every member state as an LED chip (2-letter code +
  // dot) so the player can see at a glance which states they already lead
  // (>= the regional-dominance threshold, same bar the group bonus uses)
  // and which ones are still worth investing in to clear the group.
  // Shared by renderGroupCard and renderClusterCard - the two differed only in
  // their header text and whether the pin button shows, but each carried its
  // own verbatim copy of this LED grid.
  //
  // The grid rebuild is guarded by a content key, the same trick syncNewsFeed
  // already uses: renderAll() runs this on every player tap AND every AI tick,
  // and it was wiping 5-15 buttons and rebinding a listener on each one every
  // time, even when nothing about the group had changed.
  function renderMemberCard(members, title, subtitle, showPin) {
    var threshold = game.cfg.regionalDominance.thresholdBps;
    $('cardName').textContent = title;
    $('cardSeats').textContent = subtitle;
    $('cardVsBar').hidden = true;
    $('cardPinBtn').hidden = !showPin;
    if (showPin) $('cardPinBtn').classList.toggle('on', groupPinned);

    var sorted = members.slice().sort(function (a, b) { return b.seats - a.seats; });
    var key = sorted.map(function (s) {
      return s.svgId + (game.pop[s.svgId].p1 >= threshold ? '1' : '0');
    }).join(',');
    var ledEl = $('cardGroups');
    ledEl.className = 'led-grid';
    // The other card renderers repurpose #cardGroups and each clear this key,
    // so a match here really does mean our own grid is still on screen.
    if (ledEl.dataset.key === key) return; // same members, same leading/trailing states
    ledEl.dataset.key = key;

    var frag = document.createDocumentFragment();
    sorted.forEach(function (s) {
      var isLeading = game.pop[s.svgId].p1 >= threshold;
      var chip = document.createElement('button');
      chip.className = 'led-chip' + (isLeading ? ' led-on' : '');
      chip.title = s.name;
      chip.dataset.svgid = s.svgId;
      chip.innerHTML = '<span class="led-dot"></span><span>' + s.svgId.slice(2) + '</span>';
      fastTap(chip, function () { selectState(s.svgId); });
      frag.appendChild(chip);
    });
    ledEl.innerHTML = '';
    ledEl.appendChild(frag);
  }

  function renderGroupCard(key) {
    var g = game.groups.filter(function (x) { return x.key === key; })[0];
    if (!g) return;
    var threshold = game.cfg.regionalDominance.thresholdBps;
    var members = game.states.filter(function (s) { return s.tags.indexOf(key) !== -1; });
    var leadingCount = members.filter(function (s) { return game.pop[s.svgId].p1 >= threshold; }).length;
    renderMemberCard(members, g.icon + ' ' + g.label,
      g.seats + ' seats · leading ' + leadingCount + '/' + members.length +
        (leadingCount === members.length ? ' — bonus qualified!' : ''),
      true);
  }

  // Info for the NE8 / Small UTs quick-invest clusters — same led-grid
  // layout as a regional-dominance group card, but these aren't official
  // dominance groups (no bonus payout), so no "bonus qualified" wording.
  function renderClusterCard(key) {
    var c = CLUSTER_DEFS[key];
    if (!c) return;
    var threshold = game.cfg.regionalDominance.thresholdBps;
    var members = game.states.filter(function (s) { return c.ids.indexOf(s.svgId) !== -1; });
    var leadingCount = members.filter(function (s) { return game.pop[s.svgId].p1 >= threshold; }).length;
    var totalSeats = members.reduce(function (sum, s) { return sum + s.seats; }, 0);
    renderMemberCard(members, c.icon + ' ' + c.label,
      totalSeats + ' seats · leading ' + leadingCount + '/' + members.length, false);
  }

  function selectState(id) {
    document.querySelectorAll('.india-map path.selected, .india-map circle.selected').forEach(function (p) { p.classList.remove('selected'); });
    var el = document.getElementById(id); if (el) el.classList.add('selected');
    selectedId = id;
    activeAgenda = null; activeAction = null; activeCluster = null; // picking a state drills out of agenda/action-info mode too
    // Picking a specific state normally drills out of group view too — unless
    // the group card is pinned, in which case it's meant to survive exactly
    // this (checking leads, investing in a state, rechecking) without having
    // to re-tap the group chip every time.
    if (activeGroup && !groupPinned) exitGroupMode();
    updateCard();
  }

  var activeGroup = null, groupPinned = false;
  function exitGroupMode() {
    activeGroup = null;
    groupPinned = false;
    document.querySelectorAll('.gchip').forEach(function (x) { x.classList.remove('on'); });
    applyGroupHighlight();
  }
  function toggleGroupPin() {
    if (!activeGroup) return;
    groupPinned = !groupPinned;
    updateCard();
  }
  function setActiveGroup(key) {
    if (tutorialMode) onTutorialGroupClick(key);
    activeAgenda = null; activeAction = null; activeCluster = null; // picking a group drills out of agenda/action-info mode too
    if (activeGroup === key) { exitGroupMode(); } else {
      activeGroup = key;
      document.querySelectorAll('.gchip').forEach(function (x) { x.classList.toggle('on', x.dataset.key === activeGroup); });
      applyGroupHighlight();
    }
    updateCard();
  }
  function applyGroupHighlight() {
    var members = !activeGroup ? null : game.states.filter(function (s) { return s.tags.indexOf(activeGroup) !== -1; }).map(function (s) { return s.svgId; });
    document.querySelectorAll('.india-map path[id], .india-map circle[id]').forEach(function (p) {
      p.style.fillOpacity = (!members || members.indexOf(p.id) !== -1) ? '1' : '0';
    });
    document.querySelectorAll('.gchip').forEach(function (c) { c.classList.remove('qualified'); });
    if (!members) return;
    var set = game.states.filter(function (s) { return members.indexOf(s.svgId) !== -1; });
    var qualifying = set.filter(function (s) { return game.pop[s.svgId].p1 >= game.cfg.regionalDominance.thresholdBps; }).length;
    if (qualifying === set.length) {
      var chip = document.querySelector('.gchip[data-key="' + activeGroup + '"]'); if (chip) chip.classList.add('qualified');
    }
  }

  var groupChipEls = {};
  function buildGroupsBox() {
    var box = $('groupsBox');
    box.innerHTML = '';
    groupChipEls = {};
    var rows = [game.groups.slice(0, 8), game.groups.slice(8)];
    rows.forEach(function (rowMembers, i) {
      var row = document.createElement('div');
      row.className = 'hex-row ' + (i === 0 ? 'row-a' : 'row-b');
      rowMembers.forEach(function (g) {
        var b = document.createElement('button');
        b.className = 'gchip'; b.dataset.key = g.key; b.title = g.label + ' — ' + g.seats + ' seats';
        b.innerHTML = '<span class="hex">' + g.icon + '</span><span class="badge"></span>';
        fastTap(b, function () { setActiveGroup(g.key); });
        // Kept in a side map, NOT on the group object: `game` gets
        // structuredClone()d by planAITickPacing, and a DOM node is not
        // cloneable — hanging one off game.groups throws there, which left
        // game.rng nulled and broke the AI for the rest of the match.
        groupChipEls[g.key] = b;
        row.appendChild(b);
      });
      box.appendChild(row);
    });
  }

  // ---------------------------------------------------------------------
  // Agenda tray (built per-politician — see design doc: agendas are drawn
  // from a shared 24-policy pool, 4 per politician, not a fixed set)
  // ---------------------------------------------------------------------
  // Progress toward tapsToComplete is a small number of discrete steps (not
  // a smooth percentage), so a segmented health-bar (one pip per tap) reads
  // its state at a glance better than a "75%" badge — decided after the
  // percentage badge was reported as fiddly to parse mid-game.
  function buildAgendaTray() {
    var tray = $('agendaTray');
    tray.innerHTML = '';
    var pipCount = game.cfg.agenda.tapsToComplete;
    var pips = '';
    for (var i = 0; i < pipCount; i++) pips += '<span class="pip"></span>';
    game.players.p1.politician.policies.forEach(function (policy) {
      var name = policy.name, safeId = 'agenda' + name.replace(/[^a-zA-Z0-9]/g, '');
      var btn = document.createElement('button');
      btn.className = 'action-btn'; btn.id = safeId; btn.title = name;
      btn.innerHTML = (AGENDA_ICONS[name] || '📜') +
        '<span class="badge" id="' + safeId + 'Badge" hidden>✓</span>' +
        '<span class="agenda-bar" id="' + safeId + 'Bar">' + pips + '</span>';
      fastTap(btn, function () { handleAgendaTap(name); });
      tray.appendChild(btn);
    });
  }

  function renderAgendas() {
    var policies = game.players.p1.politician.policies;
    policies.forEach(function (policy) {
      var name = policy.name, safeId = 'agenda' + name.replace(/[^a-zA-Z0-9]/g, '');
      var taps = game.players.p1.agendaProgress[name] || 0;
      var done = taps >= game.cfg.agenda.tapsToComplete;
      var badgeEl = $(safeId + 'Badge'), btnEl = $(safeId), barEl = $(safeId + 'Bar');
      if (badgeEl) badgeEl.hidden = !done;
      if (barEl) {
        var pipEls = barEl.querySelectorAll('.pip');
        for (var i = 0; i < pipEls.length; i++) pipEls[i].classList.toggle('filled', i < taps);
      }
      if (btnEl) btnEl.classList.toggle('agenda-done', done);
    });
  }

  // Single tap shows what this agenda does in the info panel (no cost);
  // double tap (within DOUBLE_TAP_MS on the same agenda) invests — same
  // select/double-tap-invest gating as the map and small-UT buttons.
  function handleAgendaTap(name) {
    var now = Date.now();
    if (lastBtnTapId === name && (now - lastBtnTapTime) < DOUBLE_TAP_MS) {
      lastBtnTapId = null; lastBtnTapTime = 0;
      doTapAgenda(name);
    } else {
      lastBtnTapId = name; lastBtnTapTime = now;
      activeAgenda = name; activeAction = null;
      updateCard();
    }
  }

  function doTapAgenda(name) {
    var safeId = 'agenda' + name.replace(/[^a-zA-Z0-9]/g, '');
    activeAgenda = name; activeAction = null; // show what this agenda does in the info panel either way
    var groupEffects = G.agendaGroupEffects(game, name);
    var r = G.tapAgenda(game, 'p1', name);
    if (!r.ok) {
      showToast(r.reason === 'insufficient_funds' ? 'Not enough funds' : 'Agenda already maxed');
      if (r.reason === 'insufficient_funds') shakeInvalid($(safeId));
      updateCard();
      return;
    }
    var pt = viewportPoint($(safeId));
    spawnMoneyText(pt.x, pt.y, game.cfg.agenda.costPerTapCr, -1);
    playSound('money_spent');
    if (r.completed) playSound('fanfare');
    showToast((r.completed ? name + ' agenda completed!' : 'Invested in ' + name));
    renderAll();
    spawnGroupEmojiReactions(groupEffects);
    if (tutorialMode) onTutorialAgendaInvest(name);
  }

  // Every policy-tags.json tagEffects magnitude is one of ±4/±8/±12
  // (Administrative Reform, Coastal Economy, Food Security, Heritage and
  // Tourism, Environmental Conservation, Sports and Entertainment, and
  // Nationalization were normalized onto this convention 2026-08-26 — see
  // CHANGELOG) — so the emoji tier is a direct lookup, not a threshold sweep.
  var GROUP_EMOJI_BY_MAGNITUDE = { 4: '🙂', 8: '😄', 12: '😍' };
  var GROUP_EMOJI_BY_MAGNITUDE_NEG = { 4: '🙁', 8: '😟', 12: '😡' };
  function emojiForGroupMagnitude(mag) {
    var table = mag > 0 ? GROUP_EMOJI_BY_MAGNITUDE : GROUP_EMOJI_BY_MAGNITUDE_NEG;
    return table[Math.abs(mag)] || null;
  }
  function spawnGroupEmojiReactions(groupEffects) {
    var keys = Object.keys(groupEffects);
    keys.forEach(function (key, i) {
      var emoji = emojiForGroupMagnitude(groupEffects[key]);
      if (!emoji) return;
      setTimeout(function () { spawnGroupEmojiReaction(key, emoji); }, i * 80);
    });
  }
  function spawnGroupEmojiReaction(groupKey, emoji) {
    var chip = document.querySelector('.gchip[data-key="' + groupKey + '"]');
    if (!chip) return;
    var pt = viewportPoint(chip);
    var el = document.createElement('div');
    el.className = 'fx-group-emoji';
    el.textContent = emoji;
    el.style.left = pt.x + 'px'; el.style.top = pt.y + 'px';
    $('fxLayer').appendChild(el);
    setTimeout(function () { el.remove(); }, 1100);
  }

  // ---------------------------------------------------------------------
  // Tokens: State Rally / Special Powerup / Nationwide Rally
  // ---------------------------------------------------------------------
  function craftSlotState(flavor) {
    var pl = game.players.p1;
    var usedFlag = flavor === 'special' ? 'usedSpecial' : 'usedNationwide';
    var craftedFlag = flavor === 'special' ? 'craftedSpecial' : 'craftedNationwide';
    if (pl[usedFlag]) return 'used';
    if (pl[craftedFlag]) return 'ready';
    var cost = flavor === 'special' ? game.cfg.rally.specialPowerupCraftCost : game.cfg.rally.nationwideRallyCraftCost;
    return pl.tokens.stateRally >= cost ? 'craftable' : 'locked';
  }

  function renderTokens() {
    var pl = game.players.p1;
    $('rallyBadge').textContent = pl.tokens.stateRally;
    $('rallyBtn').classList.toggle('depleted', pl.tokens.stateRally <= 0);
    $('rallyBtn').classList.toggle('armed', armed === 'stateRally');

    [['special', 'specialBtn', 'specialBadge', game.cfg.rally.specialPowerupCraftCost],
    ['nationwide', 'nationwideBtn', 'nationwideBadge', game.cfg.rally.nationwideRallyCraftCost]]
      .forEach(function (row) {
        var flavor = row[0], btn = $(row[1]), badge = $(row[2]), cost = row[3];
        var state = craftSlotState(flavor);
        btn.classList.remove('locked', 'craftable', 'used', 'armed');
        if (state === 'locked') { btn.classList.add('locked'); badge.textContent = pl.tokens.stateRally + '/' + cost; }
        else if (state === 'craftable') { btn.classList.add('craftable'); badge.textContent = pl.tokens.stateRally + '/' + cost; }
        else if (state === 'ready') { btn.classList.toggle('armed', armed === flavor); badge.textContent = 'READY'; }
        else { btn.classList.add('used'); badge.textContent = '✓'; }
      });
  }

  function setArmed(next) {
    armed = (armed === next) ? null : next;
    $('targetBanner').hidden = armed !== 'powerTarget';
    renderTokens();
  }

  function onRallyBtn() {
    activeAgenda = null; activeAction = 'rally'; updateCard();
    if (game.players.p1.tokens.stateRally <= 0) { showToast('No State Rally tokens'); shakeInvalid($('rallyBtn')); return; }
    setArmed('stateRally');
    if (armed) showToast('Tap a state to deploy');
  }

  function onSpecialBtn() {
    activeAgenda = null; activeAction = 'special'; updateCard();
    var state = craftSlotState('special');
    if (state === 'locked') { showToast('Need ' + game.cfg.rally.specialPowerupCraftCost + ' tokens (have ' + game.players.p1.tokens.stateRally + ')'); shakeInvalid($('specialBtn')); return; }
    if (state === 'used') return;
    if (state === 'craftable') {
      var r = G.craftToken(game, 'p1', 'special');
      renderAll();
      showToast(r.ok ? '⭐ Special Powerup crafted — tap to activate' : (r.reason === 'too_early' ? 'Too early to craft (min phase ' + game.cfg.rally.specialPowerupMinPhase + ')' : 'Cannot craft yet'));
      return;
    }
    // ready — resolve target requirements before activating
    var power = game.players.p1.politician.power;
    if (power.requiresTargetState) { setArmed('powerTarget'); showToast('Tap a state to target'); return; }
    var opts = {};
    if (power.requiresCompletedAgenda) {
      var done = Object.keys(game.players.p1.agendaProgress).filter(function (k) { return game.players.p1.agendaProgress[k] >= game.cfg.agenda.tapsToComplete; });
      if (!done.length) { showToast('Complete an agenda first'); return; }
      done.sort(function (a, b) { return G.totalNetEffect(game, b) - G.totalNetEffect(game, a); });
      opts.targetAgendaName = done[0];
    }
    finishActivatePower(opts);
  }

  function finishActivatePower(opts) {
    var r = G.activatePower(game, 'p1', opts);
    renderAll();
    if (!r.ok) { showToast('Cannot activate: ' + r.reason); shakeInvalid($('specialBtn')); return; }
    if (!r.nullified) {
      playPowerSound(game.players.p1.politician.name);
      spawnPowerBurst('p1', game.players.p1.politician.power.name, game.players.p1.politician.name);
    }
    showToast(r.nullified ? 'Your power fizzled — it had been secretly nullified' : '⚡ ' + game.players.p1.politician.power.name + ' activated');
    if (tutorialMode && !r.nullified) { tutorialPowerActivated = true; renderTutorialStageStep(); }
  }

  function onNationwideBtn() {
    activeAgenda = null; activeAction = 'nationwide'; updateCard();
    var state = craftSlotState('nationwide');
    if (state === 'locked') { showToast('Need ' + game.cfg.rally.nationwideRallyCraftCost + ' tokens (have ' + game.players.p1.tokens.stateRally + ')'); shakeInvalid($('nationwideBtn')); return; }
    if (state === 'used') return;
    if (state === 'craftable') {
      var r = G.craftToken(game, 'p1', 'nationwide');
      renderAll();
      showToast(r.ok ? '🇮🇳 Nationwide Rally crafted — tap to activate' : (r.reason === 'too_early' ? 'Too early to craft (min phase ' + game.cfg.rally.nationwideRallyMinPhase + ')' : 'Cannot craft yet'));
      return;
    }
    var r = G.activateNationwideRally(game, 'p1');
    renderAll();
    playSound('fanfare');
    spawnPowerBurst('p1', 'Nationwide Rally', game.players.p1.politician.name, '🇮🇳');
    showToast('🇮🇳 Nationwide Rally activated');
    if (tutorialMode && r.ok) { tutorialNationwideRallyLaunched = true; renderTutorialStageStep(); }
  }

  // ---------------------------------------------------------------------
  // Investment (map tap / UT quick-invest buttons)
  // ---------------------------------------------------------------------
  function investPaid(svgId, point) {
    var el = document.getElementById(svgId);
    var pt = point || viewportPoint(el);
    var r = G.investCash(game, 'p1', svgId);
    if (!r.ok) { showToast('Not enough funds'); shakeInvalid(el); return; }
    // Sound AND the tap FX both fire before renderAll(), not after —
    // renderAll() repaints the whole map and rebuilds the token layer, which
    // on real hardware is enough to make the feedback audibly/visibly lag the
    // tap if it waits behind. Everything the player perceives as "the tap
    // registered" happens first; the state re-render follows.
    playSound('money_spent');
    if (el && el.animate) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 220 });
    spawnFlash(pt.x, pt.y);
    spawnMoneyText(pt.x, pt.y, r.cost, -1);
    renderAll();
    if (tutorialMode) onTutorialInvest(svgId);
    // Still a valid, spendable tap (a real campaign doesn't always know when
    // to stop) — engine.js's gainAt already clamps the actual boost to 0
    // once a state is fully owned, so r.gained===0 is exactly "that money
    // just bought nothing." Warn rather than block.
    if (r.gained === 0) showToast('⚠️ ' + game.statesById[svgId].name + ' already maxed out');
  }

  // Single tap selects (shows detail panel); double tap (within DOUBLE_TAP_MS
  // on the same state) invests — design doc "Touch interaction & feedback."
  // Armed states (rally target / power target) resolve on a single tap,
  // since that's targeting an action already in flight, not a fresh invest.
  function handleMapTap(svgId, point) {
    if (tutorialMode) onTutorialMapTap();
    if (armed === 'stateRally' || armed === 'powerTarget') { onMapTap(svgId, point); return; }
    var now = Date.now();
    if (lastMapTapId === svgId && (now - lastMapTapTime) < DOUBLE_TAP_MS) {
      lastMapTapId = null; lastMapTapTime = 0;
      onMapTap(svgId, point);
    } else {
      lastMapTapId = svgId; lastMapTapTime = now;
      selectState(svgId);
    }
  }

  function onMapTap(svgId, point) {
    selectState(svgId);
    if (armed === 'stateRally') {
      var r = G.playRallyToken(game, 'p1', svgId);
      if (!r.ok) { showToast(r.reason === 'state_cap' ? 'This state is capped at 2 rally plays' : 'Spend cap reached this phase'); shakeInvalid(document.getElementById(svgId)); return; }
      showToast('📢 State Rally deployed'); playSound('rally_sound'); armed = null; renderAll();
      if (tutorialMode) onTutorialRally(svgId);
      return;
    }
    if (armed === 'powerTarget') {
      finishActivatePower({ targetStateSvgId: svgId });
      armed = null; $('targetBanner').hidden = true; renderAll(); return;
    }
    investPaid(svgId, point);
  }

  // Same select/double-tap-invest gating for the small-UT button cluster —
  // confirmed 2026-07-23 to apply uniformly, not just the map.
  function handleButtonTap(key, investFn) {
    var now = Date.now();
    if (lastBtnTapId === key && (now - lastBtnTapTime) < DOUBLE_TAP_MS) {
      lastBtnTapId = null; lastBtnTapTime = 0;
      investFn();
    } else {
      lastBtnTapId = key; lastBtnTapTime = now;
      showToast('Tap again to invest');
    }
  }

  // ---------------------------------------------------------------------
  // Header / full render
  // ---------------------------------------------------------------------
  function renderHeader() {
    var seats = E.nationalSeats(game.states, game.pop);
    var total = game.cfg.totalSeats;
    $('segP1').style.width = (seats.p1 / total * 100) + '%';
    $('segOth').style.width = (seats.others / total * 100) + '%';
    $('segP2').style.width = (seats.p2 / total * 100) + '%';
    $('p1Funds').textContent = '₹' + game.players.p1.fundsCr + 'Cr';
    $('p2Funds').textContent = '₹' + game.players.p2.fundsCr + 'Cr';
    $('p1Seats').textContent = seats.p1 + ' seats';
    $('p2Seats').textContent = seats.p2 + ' seats';
    $('phaseNum').textContent = game.phase + '/' + game.cfg.totalPhases;
  }

  // Ambient capture indicator — independent of which group card (if any) is
  // open, so a hex lights up in the holder's color the moment every member
  // state clears the regional-dominance threshold, and clears the moment it
  // doesn't. Reads live game.pop via E.dominanceActive rather than game's
  // payout-gating dominanceHeld flag, since that flag exists only to avoid
  // re-paying a bonus and is beside the point for a live visual readout.
  function renderGroupCaptureBadges() {
    var threshold = game.cfg.regionalDominance.thresholdBps;
    game.groups.forEach(function (g) {
      var chip = groupChipEls[g.key]; // cached in buildGroupsBox; never replaced
      if (!chip) return;
      var p1 = E.dominanceActive(g, game.states, game.pop, 'p1', threshold);
      var p2 = E.dominanceActive(g, game.states, game.pop, 'p2', threshold);
      chip.classList.toggle('captured-p1', p1);
      chip.classList.toggle('captured-p2', p2 && !p1);
    });
  }

  function renderAll() {
    paintMap();
    updateCard();
    if (activeGroup) applyGroupHighlight();
    renderHeader();
    renderTokens();
    renderAgendas();
    renderGroupCaptureBadges();
    syncNewsFeed();
    // Runs LAST, deliberately. It's a pure measure-then-place pass over the
    // live map (getBoundingClientRect in viewport coords), so anything above
    // that can change the layout must have already run. updateCard() in
    // particular resizes the info panel — a longer state name wrapping to two
    // lines, or switching between a state card and a group card's LED grid —
    // which resizes .map-wrap and moves every state. Placing the dots before
    // that left them pinned to the previous layout until the next render.
    renderRallyTokens();
  }

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  fastTap(document.getElementById('map'), function (e) {
    var path = e.target.closest('path[id], circle[id]'); if (!path) return;
    handleMapTap(path.id, { x: e.clientX, y: e.clientY });
  });
  $('cardPinBtn').addEventListener('click', toggleGroupPin);
  fastTap($('utsBtn'), function () {
    activeAgenda = null; activeAction = null; activeCluster = 'ALL_UTS'; updateCard();
    handleButtonTap('ALL_UTS', function () {
      var pt = viewportPoint($('utsBtn')), any = false, totalCost = 0;
      G.SMALL_UT_IDS.forEach(function (id) {
        if (id === 'INDL' || id === 'INGA') return;
        var r = G.investCash(game, 'p1', id);
        if (r.ok) { any = true; totalCost += r.cost; }
      });
      if (any) playSound('money_spent');
      renderAll();
      if (any) { spawnFlash(pt.x, pt.y); spawnMoneyText(pt.x, pt.y, totalCost, -1); showToast('Invested in all Small UTs'); }
      else { shakeInvalid($('utsBtn')); showToast('Not enough funds'); }
    });
  });
  fastTap($('neBtn'), function () {
    activeAgenda = null; activeAction = null; activeCluster = 'ALL_NE'; updateCard();
    handleButtonTap('ALL_NE', function () {
      var pt = viewportPoint($('neBtn')), any = false, totalCost = 0;
      G.NORTHEAST_IDS.forEach(function (id) {
        var r = G.investCash(game, 'p1', id);
        if (r.ok) { any = true; totalCost += r.cost; }
      });
      if (any) playSound('money_spent');
      renderAll();
      if (any) { spawnFlash(pt.x, pt.y); spawnMoneyText(pt.x, pt.y, totalCost, -1); showToast('Invested in all Northeast states'); }
      else { shakeInvalid($('neBtn')); showToast('Not enough funds'); }
    });
  });
  // Delhi/Goa/Kerala route through these buttons instead of a direct map tap
  // (too small to hit reliably), but they're still single states, not a
  // cluster batch — so like a real map tap, an armed rally/power target
  // resolves on the first tap here too, same as handleMapTap. Only then does
  // an unarmed tap fall back to the existing select/double-tap-invest flow.
  function smallStateBtnTap(svgId, btn) {
    var pt = viewportPoint(btn);
    if (armed === 'stateRally' || armed === 'powerTarget') { onMapTap(svgId, pt); return; }
    selectState(svgId);
    handleButtonTap(svgId, function () { investPaid(svgId, pt); });
  }
  fastTap($('delhiBtn'), function () { smallStateBtnTap('INDL', $('delhiBtn')); });
  fastTap($('goaBtn'), function () { smallStateBtnTap('INGA', $('goaBtn')); });
  fastTap($('keralaBtn'), function () { smallStateBtnTap('INKL', $('keralaBtn')); });
  fastTap($('rallyBtn'), onRallyBtn);
  fastTap($('specialBtn'), onSpecialBtn);
  fastTap($('nationwideBtn'), onNationwideBtn);
  $('endPhaseBtn').addEventListener('click', doEndPhase);
  $('playAgainBtn').addEventListener('click', function () {
    $('endOverlay').hidden = true;
    $('selectOverlay').hidden = false;
    renderPolGrid(); // picks up any politician unlocked by the game just played
    // A tutorial game already flips tutorialMode off mid-match
    // (finishStageTutorial, around phase 6), but that alone leaves several
    // select-screen classes from the tutorial's coaching steps stuck —
    // setTutorialMode(false) clears all of them (see there for detail).
    setTutorialMode(false);
    switchMusic('intro_music');
  });
  $('shareResultBtn').addEventListener('click', shareResult);
  wireReplayControls();
  renderWelcomeHighScore();
  $('closeShareBtn').addEventListener('click', function () { $('shareOverlay').hidden = true; });
  $('shareBackdrop').addEventListener('click', function () { $('shareOverlay').hidden = true; });

  $('settingsBtn').addEventListener('click', function () { renderDifficultyLabel(); $('settingsOverlay').hidden = false; });
  $('closeSettingsBtn').addEventListener('click', function () { $('settingsOverlay').hidden = true; });
  $('soundToggleBtn').addEventListener('click', function () {
    soundEnabled = !soundEnabled;
    $('soundToggleState').textContent = soundEnabled ? 'On' : 'Off';
  });
  // Slider: 0 is Auto, 1..MAX_LEVEL pick a fixed level. Most players never
  // open this; the adaptive default is the intended experience. 'input' not
  // 'change' so the label tracks the thumb while dragging.
  $('difficultyRange').addEventListener('input', function () {
    var v = parseInt(this.value, 10) || 0;
    lsSet(AI_MODE_KEY, v === 0 ? 'auto' : String(v));
    renderDifficultyLabel();
    renderVersionLabels();
  });
  $('musicToggleBtn').addEventListener('click', function () {
    musicEnabled = !musicEnabled;
    $('musicToggleState').textContent = musicEnabled ? 'On' : 'Off';
    if (musicEnabled) { if (currentMusicKey) playSound(currentMusicKey); }
    else { sounds.bg_music.pause(); sounds.intro_music.pause(); }
  });
  $('pauseToggleBtn').addEventListener('click', function () {
    timerPaused = !timerPaused;
    var btn = $('pauseToggleBtn');
    btn.textContent = timerPaused ? '▶' : '⏸';
    btn.title = timerPaused ? 'Resume' : 'Pause';
    if (timerPaused) clearInterval(timerHandle); else resumePhaseTimer();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  function setTutorialMode(on) {
    tutorialMode = on;
    $('selectOverlay').classList.toggle('tutorial-locked', on);
    $('tutorialNavbar').hidden = !on;
    if (!on) {
      // A completed tutorial run's last coaching step freezes the carousel
      // on Modi's card and pulses his Play button (TUTORIAL_STEPS' freeze/
      // pulse:'play') — renderTutorialStep() never runs again after the
      // game starts, so those classes otherwise stay stuck through the
      // whole match. Without clearing them here, Play Again reopens the
      // select screen still frozen on Modi instead of a free pick.
      $('selectOverlay').classList.remove('tutorial-modi-locked');
      $('polCarousel').classList.remove('tutorial-frozen', 'tutorial-pulse-agendas', 'tutorial-pulse-power', 'tutorial-pulse-play');
      // The tutorial's last step is a coach banner ("Click 'Play as Modi' to
      // begin your campaign!") left showing (renderTutorialStep() only runs
      // during the tutorial itself, never again after) — without this, Play
      // Again reopens the select screen with that stale banner still up.
      $('tutorialCoach').hidden = true;
      $('tutorialOverlay').hidden = true;
    }
  }

  $('welcomeStartBtn').addEventListener('click', function () {
    unlockSounds();
    setTutorialMode(false);
    $('welcomeOverlay').hidden = true;
    $('selectOverlay').hidden = false;
    switchMusic('intro_music');
  });

  $('howToPlayBtn').addEventListener('click', function () {
    unlockSounds();
    setTutorialMode(true);
    $('welcomeOverlay').hidden = true;
    $('selectOverlay').hidden = false;
    scrollCarouselToModi('auto');
    switchMusic('intro_music');

    tutorialStep = 0;
    renderTutorialStep();
  });

  $('tutorialBackBtn').addEventListener('click', function () { goTutorialStep(-1); });
  $('tutorialNextBtn').addEventListener('click', function () { goTutorialStep(1); });
  $('tutorialStageBackBtn').addEventListener('click', function () { goTutorialStageStep(-1); });
  $('tutorialStageNextBtn').addEventListener('click', function () { goTutorialStageStep(1); });
  $('tutorialSignoffContinueBtn').addEventListener('click', function () {
    $('tutorialSignoffOverlay').hidden = true;
    showEndOverlay();
  });

  // Rally dots are placed in viewport coordinates from a live measurement of
  // the map, so they go stale on ANY layout change — not only the ones that
  // route through renderAll(). Selecting a state, a group or a quick-invest
  // cluster calls updateCard() directly, and the info panel's height follows
  // its content (a two-line state name, a group's LED grid, a shorter cluster
  // header), which resizes .map-wrap and moves every state out from under the
  // dots. Observing the map's own box catches all of those paths at once —
  // plus rotation, window resize, and mobile browser chrome sliding in and out
  // — without having to chase down every caller.
  // No feedback loop: renderRallyTokens only writes into #rallyTokenLayer, a
  // position:fixed sibling that cannot affect .map-wrap's size.
  var mapWrap = document.querySelector('.map-wrap');
  if (mapWrap && typeof ResizeObserver === 'function') {
    new ResizeObserver(function () { if (game) renderRallyTokens(); }).observe(mapWrap);
  }

  scheduleAITick();

  G.loadGameData('../data/').then(function (d) {
    data = d;
    renderPolGrid();
    // Warm the first two portraits before unlocking, so the opening cards
    // aren't visibly filling in.
    //
    // This used to wait on the carousel's own <img> elements, which never
    // worked: all 21 are loading="lazy" inside #selectOverlay, which is
    // hidden behind the welcome screen — and a browser never fetches a lazy
    // image in a hidden subtree. So load/error never fired, img.complete
    // stayed false, and every single boot sat out the full 3,500ms timeout
    // (measured: 0 of 21 complete, 0 decoded, at the moment the button
    // unlocked). new Image() ignores visibility, so this actually preloads.
    // Written as `'../' + p.image` rather than hoisting the path into a
    // variable: scripts/deploy-mobile.js rewrites paths by literal string
    // match, and `'../' + p.image` is one of the exact forms it knows. A
    // local like `'../' + src` survives the rewrite and 404s on the live
    // site, where these files sit at the root instead of one level up.
    var firstArt = (data.politicians || []).slice(0, 2).filter(function (p) { return p.image; });
    var portraitReady = firstArt.length ? new Promise(function (resolve) {
      var left = firstArt.length;
      var done = function () { if (--left <= 0) resolve(); };
      setTimeout(resolve, 1500); // straggler guard, no longer the normal path
      firstArt.forEach(function (p) {
        var img = new Image();
        img.onload = img.onerror = done;
        img.src = '../' + p.image;
      });
    }) : Promise.resolve();
    portraitReady.then(function () {
      $('welcomeLoading').hidden = true;
      $('welcomeStartBtn').disabled = false;
      $('howToPlayBtn').disabled = false;
    });
  }).catch(function (err) {
    console.error('Failed to load game data — is this served over http(s), not file://?', err);
    showToast('Failed to load game data — serve this over http(s), not file://');
    $('welcomeLoading').classList.add('welcome-loading-error');
    $('welcomeLoading').querySelector('.welcome-loading-label').textContent = 'Couldn’t load — check your connection';
  });
})();
