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
  sounds.bg_music.volume = 0.35;
  function playSound(name) {
    var a = sounds[name];
    if (!a) return;
    if (name === 'bg_music') { if (musicEnabled) a.play().catch(function () {}); return; }
    if (!soundEnabled) return;
    a.currentTime = 0;
    a.play().catch(function () {});
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
  function renderPolGrid() {
    var grid = $('polGrid');
    grid.innerHTML = '';
    data.politicians.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'pol-card';
      var initial = p.name.trim().charAt(0);
      card.innerHTML =
        '<img class="portrait" src="../' + p.image + '" alt="' + p.name + '" ' +
        'style="background:' + (p.primaryColor || '#ccc') + '" ' +
        'onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'portrait\',textContent:\'' + initial + '\',style:\'display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;color:#fff;background:' + (p.primaryColor || '#999') + '\'}))">' +
        '<span class="pol-name">' + p.name + '</span>' +
        '<span class="pol-party">' + p.party + '</span>' +
        '<button>Play</button>';
      card.querySelector('button').addEventListener('click', function () { startGame(p.id); });
      grid.appendChild(card);
    });
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

    lastLogShown = 0;
    armed = null; activeGroup = null;
    lastMapTapId = null; lastBtnTapId = null; timerPaused = false;
    $('pauseToggleBtn').textContent = '⏸ Pause';
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
  // AI pacing — the AI no longer resolves its whole turn instantly; it acts
  // one move at a time via G.aiStep(), throttled to ~20 actions/min (a
  // randomized 2-4s cooldown between ticks, mean 3s) so it plays out visibly
  // instead of dumping all its funds/taps the instant a phase starts.
  // ---------------------------------------------------------------------
  function animateAITap(action) {
    if (!action.svgId) return;
    var el = document.getElementById(action.svgId);
    var pt = viewportPoint(el);
    if (el && el.animate) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 220 });
    spawnFlash(pt.x, pt.y, 'p2');
    if (action.costCr) spawnMoneyText(pt.x, pt.y, action.costCr, -1, 'p2');
  }

  function scheduleAITick() {
    var delay = 2000 + Math.random() * 2000;
    setTimeout(function () {
      if (game && !timerPaused && !game.winner) {
        var action = G.aiStep(game);
        if (action) { renderAll(); animateAITap(action); }
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
    if (game.log.slice(0, 10).some(function (e) { return e.msg.indexOf('💰 You hold') === 0; })) playSound('fanfare');
    if (game.winner) { playSound('game_over'); renderAll(); showEndOverlay(); return; }
    renderAll();
    startPhaseTimer();
    playSound('phase_reset');
    showToast('Phase ' + game.phase + ' begins');
  }

  function showEndOverlay() {
    var seats = game.finalSeats;
    var headline, sub;
    if (game.winner === 'p1') { headline = '🏆 You won the election'; sub = 'You crossed 272 seats.'; }
    else if (game.hungParliament) { headline = '⚖️ Hung parliament'; sub = 'Neither side reached 272 — against an AI opponent, that’s a loss, not a draw.'; }
    else { headline = '💔 You lost the election'; sub = game.players.p2.politician.name + ' crossed 272 seats.'; }
    $('endHeadline').textContent = headline;
    $('endSub').textContent = sub;
    $('endSeats').textContent = 'Final: You ' + seats.p1 + ' · ' + game.players.p2.politician.name + ' ' + seats.p2 + ' · Others ' + seats.others;
    $('endOverlay').hidden = false;
    sounds.bg_music.pause();
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
    if (activeGroup) { renderGroupCard(activeGroup); return; }
    renderStateCard();
  }

  function renderStateCard() {
    var s = game.statesById[selectedId], p = game.pop[selectedId];
    if (!s || !p) return;
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
    if (activeGroup) exitGroupMode(); // picking a specific state drills out of group view
    updateCard();
  }

  var activeGroup = null;
  function exitGroupMode() {
    activeGroup = null;
    document.querySelectorAll('.gchip').forEach(function (x) { x.classList.remove('on'); });
    applyGroupHighlight();
  }
  function setActiveGroup(key) {
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
      btn.className = 'action-btn action-btn-labeled'; btn.id = safeId; btn.title = name;
      btn.innerHTML = '<span class="action-btn-icon">' + (AGENDA_ICONS[name] || '📜') + '</span>' +
        '<span class="action-btn-label">' + name + '</span>' +
        '<span class="badge" id="' + safeId + 'Badge">0%</span>';
      btn.addEventListener('click', function () { doTapAgenda(name); });
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

  function doTapAgenda(name) {
    var safeId = 'agenda' + name.replace(/[^a-zA-Z0-9]/g, '');
    var r = G.tapAgenda(game, 'p1', name);
    if (!r.ok) {
      showToast(r.reason === 'insufficient_funds' ? 'Not enough funds' : 'Agenda already maxed');
      if (r.reason === 'insufficient_funds') shakeInvalid($(safeId));
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
    if (game.players.p1.tokens.stateRally <= 0) { showToast('No State Rally tokens'); shakeInvalid($('rallyBtn')); return; }
    setArmed('stateRally');
    if (armed) showToast('Tap a state to deploy');
  }

  function onSpecialBtn() {
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
    if (!r.nullified) playSound('fanfare');
    showToast(r.nullified ? 'Your power fizzled — it had been secretly nullified' : '⚡ ' + game.players.p1.politician.power.name + ' activated');
  }

  function onNationwideBtn() {
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

  function renderAll() {
    paintMap();
    renderRallyTokens();
    updateCard();
    if (activeGroup) applyGroupHighlight();
    renderHeader();
    renderTokens();
    renderAgendas();
    syncNewsFeed();
  }

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  document.getElementById('map').addEventListener('click', function (e) {
    var path = e.target.closest('path[id], circle[id]'); if (!path) return;
    handleMapTap(path.id, { x: e.clientX, y: e.clientY });
  });
  $('utsBtn').addEventListener('click', function () {
    handleButtonTap('ALL_UTS', function () {
      var pt = viewportPoint($('utsBtn')), any = false, totalCost = 0;
      G.SMALL_UT_IDS.forEach(function (id) {
        if (id === 'INDL' || id === 'INGA') return;
        var r = G.investCash(game, 'p1', id);
        if (r.ok) { any = true; totalCost += r.cost; }
      });
      renderAll();
      if (any) { spawnFlash(pt.x, pt.y); spawnMoneyText(pt.x, pt.y, totalCost, -1); playSound('money_spent'); showToast('Invested in all Union Territories'); }
      else { shakeInvalid($('utsBtn')); showToast('Insufficient funds'); }
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
    $('pauseToggleBtn').textContent = timerPaused ? '▶ Resume' : '⏸ Pause';
    if (timerPaused) clearInterval(timerHandle); else resumePhaseTimer();
  });
  $('newGameBtn').addEventListener('click', function () {
    if (!confirm('Start a new game? Current progress will be lost.')) return;
    clearInterval(timerHandle);
    sounds.bg_music.pause();
    $('settingsOverlay').hidden = true;
    $('stage').hidden = true;
    $('endOverlay').hidden = true;
    $('selectOverlay').hidden = false;
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  scheduleAITick();

  G.loadGameData('../data/').then(function (d) {
    data = d;
    renderPolGrid();
  }).catch(function (err) {
    console.error('Failed to load game data — is this served over http(s), not file://?', err);
    showToast('Failed to load game data — serve this over http(s), not file://');
  });
})();
