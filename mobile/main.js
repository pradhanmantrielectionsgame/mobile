// PME Mobile — DOM wiring. Reads/writes the DOM only; every rule lives in
// engine.js/game.js. This file is the only one allowed to touch `document`.
(function () {
  'use strict';
  var E = window.PMEEngine, G = window.PMEGame;

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

  // Sets a politician portrait <img>, falling back to a colored initial
  // circle (same className, so existing CSS sizing still applies) if the
  // image file doesn't exist — 11 of 20 portraits don't yet (see CLAUDE.md).
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
  var activeAgenda = null; // agenda name currently shown in the info panel, or null
  var activeAction = null; // 'rally' | 'nationwide' | 'special' currently shown in the info panel, or null
  var activeCluster = null; // 'ALL_UTS' | 'ALL_NE' currently shown in the info panel, or null
  var CLUSTER_DEFS = {
    ALL_UTS: { icon: '🏛️', label: 'Small UTs', ids: G.SMALL_UT_IDS.filter(function (id) { return id !== 'INDL' && id !== 'INGA'; }) },
    ALL_NE: { icon: '🌄', label: 'Northeast 8', ids: G.NORTHEAST_IDS }
  };
  var timerHandle = null, timeLeft = 0, lastLogShown = 0, timerPaused = false;
  var lastMapTapId = null, lastMapTapTime = 0, lastBtnTapId = null, lastBtnTapTime = 0;
  var DOUBLE_TAP_MS = 400;

  // ---------------------------------------------------------------------
  // Audio — design doc "Audio" section, 8 file-to-trigger mappings
  // ---------------------------------------------------------------------
  var soundEnabled = true, musicEnabled = true;
  var sounds = {};
  ['bg_music', 'cash_added', 'money_spent', 'invalid_action', 'fanfare', 'game_over', 'phase_reset', 'rally_sound']
    .forEach(function (name) { sounds[name] = new Audio('../sounds/' + name + '.mp3'); });
  sounds.bg_music.loop = true;
  var BG_MUSIC_VOLUME = 0.35, BG_MUSIC_DUCKED_VOLUME = 0;
  sounds.bg_music.volume = BG_MUSIC_VOLUME;
  function playSound(name) {
    var a = sounds[name];
    if (!a) return;
    if (name === 'bg_music') { if (musicEnabled) a.play().catch(function () {}); return; }
    if (!soundEnabled) return;
    a.currentTime = 0;
    a.play().catch(function () {});
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
  }

  // Per-politician special-power sound — sounds/<Politician_Name>.mp3
  // (spaces -> underscores, e.g. "Amitabh Bachchan" -> Amitabh_Bachchan.mp3).
  // Falls back to the generic fanfare for politicians without their own file yet.
  var powerSounds = {};
  function playPowerSound(politicianName) {
    if (!soundEnabled) return;
    var key = politicianName.replace(/\s+/g, '_');
    if (!powerSounds[key]) powerSounds[key] = new Audio('../sounds/' + key + '.mp3');
    var a = powerSounds[key];
    a.currentTime = 0;
    if (musicEnabled) sounds.bg_music.volume = BG_MUSIC_DUCKED_VOLUME;
    a.addEventListener('ended', function () { sounds.bg_music.volume = BG_MUSIC_VOLUME; }, { once: true });
    a.play().catch(function () { sounds.bg_music.volume = BG_MUSIC_VOLUME; playSound('fanfare'); });
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
  function shakeInvalid(el) {
    if (el) {
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      setTimeout(function () { el.classList.remove('shake'); }, 400);
    }
    if (navigator.vibrate) navigator.vibrate(80);
    playSound('invalid_action');
  }

  function $(id) { return document.getElementById(id); }
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
    var t = $('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(showToast._h);
    showToast._h = setTimeout(function () { t.classList.remove('show'); }, 1600);
  }

  function syncNewsFeed() {
    var track = $('newsTrack');
    var entries = game.log.slice(0, Math.max(0, game.log.length - lastLogShown)).slice(0, 6).reverse();
    lastLogShown = game.log.length;
    if (!entries.length && !track.dataset.inited) {
      entries = [{ msg: 'Welcome to Booth Ink — the campaign trail begins.' }];
    }
    track.dataset.inited = '1';
    var items = game.log.slice(0, 6).map(function (e) { return e.msg; });
    if (!items.length) items = ['Welcome to Booth Ink — the campaign trail begins.'];
    var html = items.map(function (m) { return '<span>' + m + '</span>'; }).join('<span aria-hidden="true">&nbsp;&nbsp;•&nbsp;&nbsp;</span>');
    track.innerHTML = html + '<span aria-hidden="true">&nbsp;&nbsp;•&nbsp;&nbsp;</span>' + html;
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

  function buildPolCard(p) {
    var color = p.primaryColor || '#999';
    var card = document.createElement('div');
    card.className = 'pol-card';

    var ballot = document.createElement('div');
    ballot.className = 'ballot-card';
    ballot.style.setProperty('--acc', color);

    ballot.innerHTML = '<div class="tricolor"><span class="saffron"></span><span class="white"></span><span class="green"></span></div>' +
      '<div class="pol-art"><div class="pol-art-img-slot"></div><div class="pol-stub">' + stubEdgeSvg(336) + '</div></div>' +
      '<div class="pol-bio">' +
        '<div class="pol-name-row"><div class="pol-name">' + p.name + '</div><div class="pol-seal-slot"></div></div>' +
        '<div class="pol-meta"><span class="pol-party-pill">' + p.party + '</span><span>🏠 ' + [p.homeState].concat(p.secondaryHomeStates || []).join(' + ') + '</span></div>' +
        '<div class="pol-section-label">Manifesto</div>' +
        '<div class="pol-agendas"></div>' +
        '<div class="pol-section-label">Special Power</div>' +
        '<div class="pol-power"><div class="pow-seal">⚡</div><div class="pow-name">' + p.power.name + '</div>' +
          '<div class="pow-benefit">Benefit: ' + p.specialPower.effect + '</div>' +
          '<div class="pow-cost">Cost: ' + p.specialPower.cost + '</div>' +
          (p.power.requiresMinPhase ? '<div class="pow-unlock">Unlocks at: Phase ' + p.power.requiresMinPhase + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="pol-footer"></div>';

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

    var btn = document.createElement('button');
    btn.className = 'pol-play-btn';
    btn.style.background = color;
    btn.textContent = 'Play as ' + p.name.split(' ').slice(-1)[0];
    btn.addEventListener('click', function () { startGame(p.id); });
    ballot.querySelector('.pol-footer').appendChild(btn);

    card.appendChild(ballot);
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
    data.politicians.forEach(function (p, i) {
      track.appendChild(buildPolCard(p));
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

  function startGame(p1Id) {
    var p1Pol = data.politicians.filter(function (p) { return p.id === p1Id; })[0];
    // Same-party matchups don't make sense (e.g. two BJP candidates running
    // against each other) — "Independent" isn't a real shared affiliation,
    // so independents are exempt from this exclusion.
    var others = data.politicians.filter(function (p) {
      return p.id !== p1Id && (p1Pol.party === 'Independent' || p.party !== p1Pol.party);
    });
    var p2Id = others[Math.floor(Math.random() * others.length)].id;
    game = G.createGame(data, p1Id, p2Id, Math.random);
    window.__game = game; // debug/test hook — inspect live state from devtools

    // Map/UI colors and party symbols follow whichever politicians were
    // actually picked, not a fixed p1=orange/p2=green default.
    COLORS.p1 = game.players.p1.politician.primaryColor || '#E8871C';
    COLORS.p2 = game.players.p2.politician.primaryColor || '#1C8A4B';
    document.documentElement.style.setProperty('--p1', COLORS.p1);
    document.documentElement.style.setProperty('--p2', COLORS.p2);
    var p1Symbol = partySymbol(game.players.p1.politician.party);
    var p2Symbol = partySymbol(game.players.p2.politician.party);
    $('p1PartySymbol').textContent = p1Symbol;
    $('p2PartySymbol').textContent = p2Symbol;
    $('cardP1Symbol').textContent = p1Symbol;
    $('cardP2Symbol').textContent = p2Symbol;
    setPortrait($('p1Portrait'), game.players.p1.politician);
    setPortrait($('p2Portrait'), game.players.p2.politician);
    $('p1Name').textContent = game.players.p1.politician.name;
    $('p2Name').textContent = game.players.p2.politician.name;

    lastLogShown = 0;
    armed = null; activeGroup = null; groupPinned = false; activeAgenda = null; activeAction = null; activeCluster = null;
    lastMapTapId = null; lastBtnTapId = null; timerPaused = false;
    $('pauseToggleBtn').textContent = '⏸'; $('pauseToggleBtn').title = 'Pause';
    G.pushLog(game, '🗳️ Your opponent this match: ' + game.players.p2.politician.name + ' (' + game.players.p2.politician.party + ')');

    $('selectOverlay').hidden = true;
    $('endOverlay').hidden = true;
    $('stage').hidden = false;

    buildGroupsBox();
    buildAgendaTray();
    selectedId = game.players.p1.politician.homeState ? homeStateSvgId('p1') : 'INUP';
    selectState(selectedId);
    renderAll();
    startPhaseTimer();
    playSound('bg_music');
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

  function animateAITap(action) {
    if (!action.svgId) return;
    var el = document.getElementById(action.svgId);
    var pt = viewportPoint(el);
    if (el && el.animate) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 220 });
    spawnFlash(pt.x, pt.y, 'p2');
    if (action.costCr) spawnMoneyText(pt.x, pt.y, action.costCr, -1, 'p2');
  }

  function scheduleAITick() {
    var delay = aiTickIntervalMs * (0.8 + Math.random() * 0.4); // +-20% jitter, stays organic
    setTimeout(function () {
      if (game && !timerPaused && !game.winner) {
        var action = G.aiStep(game);
        if (action) {
          renderAll(); animateAITap(action);
          if (action.type === 'power') playPowerSound(game.players.p2.politician.name);
        }
      }
      scheduleAITick();
    }, delay);
  }

  // ---------------------------------------------------------------------
  // Phase timer
  // ---------------------------------------------------------------------
  function startPhaseTimer() {
    clearInterval(timerHandle);
    timeLeft = game.cfg.phaseDurationSeconds;
    $('phaseTimer').textContent = fmtClock(timeLeft);
    planAITickPacing(game);
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
    if (game.winner) { playSound('game_over'); renderAll(); showEndOverlay(); return; }
    if (game.log.slice(0, 10).some(function (e) { return e.msg.indexOf('💰 You hold') === 0; })) playSound('fanfare');
    renderAll();
    startPhaseTimer();
    playSound('phase_reset');
    showToast('Phase ' + game.phase + ' begins');
  }

  function showEndOverlay() {
    var seats = game.finalSeats;
    var seal, headline, sub;
    if (game.winner === 'p1') { seal = '🏆'; headline = 'You won the election'; sub = 'You crossed 272 seats.'; }
    else if (game.hungParliament) {
      seal = '⚖️';
      var vsAI = game.players.p2.isAI;
      headline = vsAI ? 'Hung parliament — you lose' : 'Hung parliament';
      sub = 'Neither side reached 272 seats.';
    }
    else { seal = '💔'; headline = 'You lost the election'; sub = game.players.p2.politician.name + ' crossed 272 seats.'; }
    $('declareSeal').textContent = seal;
    $('endHeadline').textContent = headline;
    $('endSub').textContent = sub;
    renderEndLedger(seats);
    renderParliamentChart(seats);
    $('playAgainBtn').style.background = COLORS.p1;
    $('endOverlay').hidden = false;
    sounds.bg_music.pause();
  }

  function renderEndLedger(seats) {
    var rows = [
      { name: 'You', n: seats.p1, color: COLORS.p1, win: game.winner === 'p1' },
      { name: game.players.p2.politician.name, n: seats.p2, color: COLORS.p2, win: game.winner === 'p2' },
      { name: 'Others', n: seats.others, color: COLORS.others, win: false }
    ];
    $('endSeats').innerHTML = rows.map(function (r) {
      return '<div class="ledger-row' + (r.win ? ' winner' : '') + '">' +
        '<span class="ledger-dot" style="background:' + r.color + '"></span>' +
        '<span class="ledger-name">' + r.name + '</span>' +
        '<span class="ledger-seats">' + r.n + '</span></div>';
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
  function paintMap() {
    document.querySelectorAll('.india-map path[id], .india-map circle[id]').forEach(function (el) {
      el.style.fill = leaderColor(el.id);
    });
  }

  // Persistent colored dot per rally token played on a state (as opposed to
  // the transient fx-flash/money-text effects), so it stays visible as a
  // reminder of which states are capped out vs still open for a rally.
  function renderRallyTokens() {
    var layer = $('rallyTokenLayer');
    layer.innerHTML = '';
    Object.keys(game.rallyPlaysByState).forEach(function (svgId) {
      var plays = game.rallyPlaysByState[svgId];
      if (!plays || !plays.length) return;
      var el = document.getElementById(svgId);
      if (!el) return;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return; // hidden map element (e.g. a dropped small UT)
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      plays.forEach(function (pk, i) {
        var dot = document.createElement('div');
        dot.className = 'rally-token';
        dot.style.left = (cx + (i - (plays.length - 1) / 2) * 16) + 'px';
        dot.style.top = cy + 'px';
        dot.style.background = COLORS[pk];
        layer.appendChild(dot);
      });
    });
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
      var power = game.players.p1.politician.power, sState = craftSlotState('special');
      $('cardName').textContent = '⭐ ' + power.name;
      $('cardSeats').textContent = sState === 'used' ? 'Used' : sState === 'ready' ? 'Ready' :
        game.players.p1.tokens.stateRally + '/' + rc.specialPowerupCraftCost + ' tokens';
      el.textContent = power.description || '';
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
    $('cardSeats').textContent = done ? 'Maxed' : taps + '/' + game.cfg.agenda.tapsToComplete + ' taps invested';
    var el = $('cardGroups');
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
  function renderGroupCard(key) {
    var g = game.groups.filter(function (x) { return x.key === key; })[0];
    if (!g) return;
    var threshold = game.cfg.regionalDominance.thresholdBps;
    var members = game.states.filter(function (s) { return s.tags.indexOf(key) !== -1; });
    var leadingCount = members.filter(function (s) { return game.pop[s.svgId].p1 >= threshold; }).length;
    $('cardName').textContent = g.icon + ' ' + g.label;
    $('cardSeats').textContent = g.seats + ' seats · leading ' + leadingCount + '/' + members.length +
      (leadingCount === members.length ? ' — bonus qualified!' : '');
    $('cardVsBar').hidden = true;
    $('cardPinBtn').hidden = false;
    $('cardPinBtn').classList.toggle('on', groupPinned);
    var ledEl = $('cardGroups');
    ledEl.className = 'led-grid';
    ledEl.innerHTML = '';
    members.slice().sort(function (a, b) { return b.seats - a.seats; }).forEach(function (s) {
      var isLeading = game.pop[s.svgId].p1 >= threshold;
      var chip = document.createElement('button');
      chip.className = 'led-chip' + (isLeading ? ' led-on' : '');
      chip.title = s.name;
      chip.innerHTML = '<span class="led-dot"></span><span>' + s.svgId.slice(2) + '</span>';
      chip.addEventListener('click', function () { selectState(s.svgId); });
      ledEl.appendChild(chip);
    });
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
    $('cardName').textContent = c.icon + ' ' + c.label;
    $('cardSeats').textContent = totalSeats + ' seats · leading ' + leadingCount + '/' + members.length;
    $('cardVsBar').hidden = true;
    $('cardPinBtn').hidden = true;
    var ledEl = $('cardGroups');
    ledEl.className = 'led-grid';
    ledEl.innerHTML = '';
    members.slice().sort(function (a, b) { return b.seats - a.seats; }).forEach(function (s) {
      var isLeading = game.pop[s.svgId].p1 >= threshold;
      var chip = document.createElement('button');
      chip.className = 'led-chip' + (isLeading ? ' led-on' : '');
      chip.title = s.name;
      chip.innerHTML = '<span class="led-dot"></span><span>' + s.svgId.slice(2) + '</span>';
      chip.addEventListener('click', function () { selectState(s.svgId); });
      ledEl.appendChild(chip);
    });
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

  function buildGroupsBox() {
    var box = $('groupsBox');
    box.innerHTML = '';
    var rows = [game.groups.slice(0, 8), game.groups.slice(8)];
    rows.forEach(function (rowMembers, i) {
      var row = document.createElement('div');
      row.className = 'hex-row ' + (i === 0 ? 'row-a' : 'row-b');
      rowMembers.forEach(function (g) {
        var b = document.createElement('button');
        b.className = 'gchip'; b.dataset.key = g.key; b.title = g.label + ' — ' + g.seats + ' seats';
        b.innerHTML = '<span class="hex">' + g.icon + '</span><span class="badge"></span>';
        b.addEventListener('click', function () { setActiveGroup(g.key); });
        row.appendChild(b);
      });
      box.appendChild(row);
    });
  }

  // ---------------------------------------------------------------------
  // Agenda tray (built per-politician — see design doc: agendas are drawn
  // from a shared 24-policy pool, 4 per politician, not a fixed set)
  // ---------------------------------------------------------------------
  function buildAgendaTray() {
    var tray = $('agendaTray');
    tray.innerHTML = '';
    game.players.p1.politician.policies.forEach(function (policy) {
      var name = policy.name, safeId = 'agenda' + name.replace(/[^a-zA-Z0-9]/g, '');
      var btn = document.createElement('button');
      btn.className = 'action-btn'; btn.id = safeId; btn.title = name;
      btn.innerHTML = (AGENDA_ICONS[name] || '📜') +
        '<span class="badge" id="' + safeId + 'Badge">0%</span>';
      btn.addEventListener('click', function () { handleAgendaTap(name); });
      tray.appendChild(btn);
    });
  }

  function renderAgendas() {
    var policies = game.players.p1.politician.policies;
    policies.forEach(function (policy) {
      var name = policy.name, safeId = 'agenda' + name.replace(/[^a-zA-Z0-9]/g, '');
      var taps = game.players.p1.agendaProgress[name] || 0;
      var pct = Math.round(taps / game.cfg.agenda.tapsToComplete * 100);
      var done = taps >= game.cfg.agenda.tapsToComplete;
      var badgeEl = $(safeId + 'Badge'), btnEl = $(safeId);
      if (badgeEl) badgeEl.textContent = done ? '✓' : pct + '%';
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
    if (!r.nullified) playPowerSound(game.players.p1.politician.name);
    showToast(r.nullified ? 'Your power fizzled — it had been secretly nullified' : '⚡ ' + game.players.p1.politician.power.name + ' activated');
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
    G.activateNationwideRally(game, 'p1');
    renderAll();
    playSound('fanfare');
    showToast('🇮🇳 Nationwide Rally activated');
  }

  // ---------------------------------------------------------------------
  // Investment (map tap / UT quick-invest buttons)
  // ---------------------------------------------------------------------
  function investPaid(svgId, point) {
    var el = document.getElementById(svgId);
    var pt = point || viewportPoint(el);
    var r = G.investCash(game, 'p1', svgId);
    if (!r.ok) { showToast('Insufficient funds'); shakeInvalid(el); return; }
    renderAll();
    if (el && el.animate) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 220 });
    spawnFlash(pt.x, pt.y);
    spawnMoneyText(pt.x, pt.y, r.cost, -1);
    playSound('money_spent');
  }

  // Single tap selects (shows detail panel); double tap (within DOUBLE_TAP_MS
  // on the same state) invests — design doc "Touch interaction & feedback."
  // Armed states (rally target / power target) resolve on a single tap,
  // since that's targeting an action already in flight, not a fresh invest.
  function handleMapTap(svgId, point) {
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
      showToast('📢 State Rally deployed'); playSound('rally_sound'); armed = null; renderAll(); return;
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
      var chip = document.querySelector('.gchip[data-key="' + g.key + '"]');
      if (!chip) return;
      var p1 = E.dominanceActive(g, game.states, game.pop, 'p1', threshold);
      var p2 = E.dominanceActive(g, game.states, game.pop, 'p2', threshold);
      chip.classList.toggle('captured-p1', p1);
      chip.classList.toggle('captured-p2', p2 && !p1);
    });
  }

  function renderAll() {
    paintMap();
    renderRallyTokens();
    updateCard();
    if (activeGroup) applyGroupHighlight();
    renderHeader();
    renderTokens();
    renderAgendas();
    renderGroupCaptureBadges();
    syncNewsFeed();
  }

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  document.getElementById('map').addEventListener('click', function (e) {
    var path = e.target.closest('path[id], circle[id]'); if (!path) return;
    handleMapTap(path.id, { x: e.clientX, y: e.clientY });
  });
  $('cardPinBtn').addEventListener('click', toggleGroupPin);
  $('utsBtn').addEventListener('click', function () {
    activeAgenda = null; activeAction = null; activeCluster = 'ALL_UTS'; updateCard();
    handleButtonTap('ALL_UTS', function () {
      var pt = viewportPoint($('utsBtn')), any = false, totalCost = 0;
      G.SMALL_UT_IDS.forEach(function (id) {
        if (id === 'INDL' || id === 'INGA') return;
        var r = G.investCash(game, 'p1', id);
        if (r.ok) { any = true; totalCost += r.cost; }
      });
      renderAll();
      if (any) { spawnFlash(pt.x, pt.y); spawnMoneyText(pt.x, pt.y, totalCost, -1); playSound('money_spent'); showToast('Invested in all Small UTs'); }
      else { shakeInvalid($('utsBtn')); showToast('Insufficient funds'); }
    });
  });
  $('neBtn').addEventListener('click', function () {
    activeAgenda = null; activeAction = null; activeCluster = 'ALL_NE'; updateCard();
    handleButtonTap('ALL_NE', function () {
      var pt = viewportPoint($('neBtn')), any = false, totalCost = 0;
      G.NORTHEAST_IDS.forEach(function (id) {
        var r = G.investCash(game, 'p1', id);
        if (r.ok) { any = true; totalCost += r.cost; }
      });
      renderAll();
      if (any) { spawnFlash(pt.x, pt.y); spawnMoneyText(pt.x, pt.y, totalCost, -1); playSound('money_spent'); showToast('Invested in all Northeast states'); }
      else { shakeInvalid($('neBtn')); showToast('Insufficient funds'); }
    });
  });
  $('delhiBtn').addEventListener('click', function () {
    selectState('INDL');
    handleButtonTap('INDL', function () { investPaid('INDL', viewportPoint($('delhiBtn'))); });
  });
  $('goaBtn').addEventListener('click', function () {
    selectState('INGA');
    handleButtonTap('INGA', function () { investPaid('INGA', viewportPoint($('goaBtn'))); });
  });
  $('rallyBtn').addEventListener('click', onRallyBtn);
  $('specialBtn').addEventListener('click', onSpecialBtn);
  $('nationwideBtn').addEventListener('click', onNationwideBtn);
  $('endPhaseBtn').addEventListener('click', doEndPhase);
  $('playAgainBtn').addEventListener('click', function () {
    $('endOverlay').hidden = true;
    $('selectOverlay').hidden = false;
  });

  $('settingsBtn').addEventListener('click', function () { $('settingsOverlay').hidden = false; });
  $('closeSettingsBtn').addEventListener('click', function () { $('settingsOverlay').hidden = true; });
  $('soundToggleBtn').addEventListener('click', function () {
    soundEnabled = !soundEnabled;
    $('soundToggleState').textContent = soundEnabled ? 'On' : 'Off';
  });
  $('musicToggleBtn').addEventListener('click', function () {
    musicEnabled = !musicEnabled;
    $('musicToggleState').textContent = musicEnabled ? 'On' : 'Off';
    if (musicEnabled) playSound('bg_music'); else sounds.bg_music.pause();
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

  $('welcomeStartBtn').addEventListener('click', function () {
    unlockSounds();
    $('welcomeOverlay').hidden = true;
    $('selectOverlay').hidden = false;
  });

  scheduleAITick();

  G.loadGameData('../data/').then(function (d) {
    data = d;
    renderPolGrid();
  }).catch(function (err) {
    console.error('Failed to load game data — is this served over http(s), not file://?', err);
    showToast('Failed to load game data — serve this over http(s), not file://');
  });
})();
