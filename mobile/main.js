// PME Mobile — DOM wiring. Reads/writes the DOM only; every rule lives in
// engine.js/game.js. This file is the only one allowed to touch `document`.
(function () {
  'use strict';
  var E = window.PMEEngine, G = window.PMEGame;

  var COLORS = { p1: '#E8871C', p2: '#1C8A4B', others: '#AEB4C0' };
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
  var timerHandle = null, timeLeft = 0, lastLogShown = 0;

  function $(id) { return document.getElementById(id); }
  function fmtPct(bps) { return Math.round(bps / 100) + '%'; }
  function fmtClock(sec) { sec = Math.max(0, sec); var m = Math.floor(sec / 60), s = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }

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
    var others = data.politicians.filter(function (p) { return p.id !== p1Id; });
    var p2Id = others[Math.floor(Math.random() * others.length)].id;
    game = G.createGame(data, p1Id, p2Id, Math.random);
    window.__game = game; // debug/test hook — inspect live state from devtools
    lastLogShown = 0;
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
  }

  function homeStateSvgId(pk) {
    var name = game.players[pk].politician.homeState;
    var s = game.states.filter(function (st) { return st.name === name; })[0];
    return s ? s.svgId : 'INUP';
  }

  // ---------------------------------------------------------------------
  // Phase timer
  // ---------------------------------------------------------------------
  function startPhaseTimer() {
    clearInterval(timerHandle);
    timeLeft = game.cfg.phaseDurationSeconds;
    $('phaseTimer').textContent = fmtClock(timeLeft);
    timerHandle = setInterval(function () {
      timeLeft--;
      $('phaseTimer').textContent = fmtClock(timeLeft);
      if (timeLeft <= 0) doEndPhase();
    }, 1000);
  }

  function doEndPhase() {
    clearInterval(timerHandle);
    G.endPhase(game);
    if (game.winner) { renderAll(); showEndOverlay(); return; }
    renderAll();
    startPhaseTimer();
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
  }

  // ---------------------------------------------------------------------
  // Map / groups / card rendering
  // ---------------------------------------------------------------------
  function leaderColor(svgId) {
    var p = game.pop[svgId];
    if (!p) return COLORS.others;
    if (p.p1 >= p.p2 && p.p1 >= p.others) return COLORS.p1;
    if (p.p2 >= p.p1 && p.p2 >= p.others) return COLORS.p2;
    return COLORS.others;
  }
  function paintMap() {
    document.querySelectorAll('.india-map path[id], .india-map circle[id]').forEach(function (el) {
      el.style.fill = leaderColor(el.id);
    });
  }

  function updateCard() {
    var s = game.statesById[selectedId], p = game.pop[selectedId];
    if (!s || !p) return;
    $('cardName').textContent = s.name;
    $('cardSeats').textContent = s.seats + ' seats';
    $('cardP1Fill').style.width = (p.p1 / 100) + '%';
    $('cardOthFill').style.width = (p.others / 100) + '%';
    $('cardP2Fill').style.width = (p.p2 / 100) + '%';
    $('cardP1Pct').textContent = fmtPct(p.p1);
    $('cardP2Pct').textContent = fmtPct(p.p2);
    var groupsEl = $('cardGroups');
    groupsEl.innerHTML = '';
    if (!s.tags.length) { groupsEl.innerHTML = '<span class="none">No group affiliations</span>'; }
    else s.tags.forEach(function (key) {
      var g = game.groups.filter(function (x) { return x.key === key; })[0]; if (!g) return;
      var chip = document.createElement('span');
      chip.className = 'chip'; chip.title = g.label; chip.textContent = g.icon;
      groupsEl.appendChild(chip);
    });
  }

  function selectState(id) {
    document.querySelectorAll('.india-map path.selected, .india-map circle.selected').forEach(function (p) { p.classList.remove('selected'); });
    var el = document.getElementById(id); if (el) el.classList.add('selected');
    selectedId = id; updateCard();
  }

  var activeGroup = null;
  function applyGroupHighlight() {
    var members = !activeGroup ? null : game.states.filter(function (s) { return s.tags.indexOf(activeGroup) !== -1; }).map(function (s) { return s.svgId; });
    document.querySelectorAll('.india-map path[id], .india-map circle[id]').forEach(function (p) {
      p.style.fillOpacity = (!members || members.indexOf(p.id) !== -1) ? '1' : '0';
    });
    document.querySelectorAll('.gchip').forEach(function (c) { c.classList.remove('qualified'); });
    var readout = $('groupReadout');
    if (!members) { readout.hidden = true; return; }
    var set = game.states.filter(function (s) { return members.indexOf(s.svgId) !== -1; });
    var seats = set.reduce(function (a, s) { return a + s.seats; }, 0);
    var qualifying = set.filter(function (s) { return game.pop[s.svgId].p1 >= game.cfg.regionalDominance.thresholdBps; }).length;
    var gdef = game.groups.filter(function (g) { return g.key === activeGroup; })[0];
    var qualified = qualifying === set.length;
    if (qualified) { var chip = document.querySelector('.gchip[data-key="' + activeGroup + '"]'); if (chip) chip.classList.add('qualified'); }
    readout.hidden = false;
    readout.innerHTML = '<b>' + gdef.icon + ' ' + gdef.label + '</b> &middot; ' + seats + ' seats &middot; leading ' + qualifying + '/' + set.length + (qualified ? ' — bonus qualified!' : '');
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
        b.addEventListener('click', function () {
          activeGroup = (activeGroup === g.key) ? null : g.key;
          document.querySelectorAll('.gchip').forEach(function (x) { x.classList.toggle('on', x.dataset.key === activeGroup); });
          applyGroupHighlight();
        });
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
      btn.className = 'tray-item'; btn.id = safeId; btn.title = name;
      btn.innerHTML =
        '<span class="ti-icon">' + (AGENDA_ICONS[name] || '📜') + '</span>' +
        '<span class="ti-col"><span class="ti-label">' + name + '</span>' +
        '<div class="ti-progress-track"><div class="ti-progress-fill" id="' + safeId + 'Fill" style="width:0%"></div></div></span>' +
        '<span class="ti-badge" id="' + safeId + 'Badge">0%</span>';
      btn.addEventListener('click', function () { doTapAgenda(name); });
      tray.appendChild(btn);
    });
  }

  function renderAgendas() {
    var policies = game.players.p1.politician.policies;
    var doneCount = 0;
    policies.forEach(function (policy) {
      var name = policy.name, safeId = 'agenda' + name.replace(/[^a-zA-Z0-9]/g, '');
      var taps = game.players.p1.agendaProgress[name] || 0;
      var pct = Math.round(taps / game.cfg.agenda.tapsToComplete * 100);
      var done = taps >= game.cfg.agenda.tapsToComplete;
      if (done) doneCount++;
      var fillEl = $(safeId + 'Fill'), badgeEl = $(safeId + 'Badge'), btnEl = $(safeId);
      if (fillEl) fillEl.style.width = pct + '%';
      if (badgeEl) badgeEl.textContent = done ? '✓' : pct + '%';
      if (btnEl) btnEl.classList.toggle('agenda-done', done);
    });
    $('agendaToggleBadge').textContent = policies.length - doneCount;
    $('agendaToggleDot').classList.toggle('show', doneCount > 0 && doneCount < policies.length);
  }

  function doTapAgenda(name) {
    var r = G.tapAgenda(game, 'p1', name);
    if (!r.ok) { showToast(r.reason === 'insufficient_funds' ? 'Not enough funds' : 'Agenda already maxed'); return; }
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

    var readyCount = 0;
    [['special', 'specialBtn', 'specialBadge', game.cfg.rally.specialPowerupCraftCost],
    ['nationwide', 'nationwideBtn', 'nationwideBadge', game.cfg.rally.nationwideRallyCraftCost]]
      .forEach(function (row) {
        var flavor = row[0], btn = $(row[1]), badge = $(row[2]), cost = row[3];
        var state = craftSlotState(flavor);
        btn.classList.remove('locked', 'craftable', 'used', 'armed');
        if (state === 'locked') { btn.classList.add('locked'); badge.textContent = pl.tokens.stateRally + '/' + cost; }
        else if (state === 'craftable') { btn.classList.add('craftable'); badge.textContent = pl.tokens.stateRally + '/' + cost; readyCount++; }
        else if (state === 'ready') { btn.classList.toggle('armed', armed === flavor); badge.textContent = 'READY'; readyCount++; }
        else { btn.classList.add('used'); badge.textContent = '✓'; }
      });

    $('tokenToggleBadge').textContent = pl.tokens.stateRally;
    $('tokenToggleDot').classList.toggle('show', readyCount > 0);
    $('tokenToggleBtn').classList.toggle('armed', !!armed);
  }

  function setArmed(next) {
    armed = (armed === next) ? null : next;
    $('targetBanner').hidden = armed !== 'powerTarget';
    renderTokens();
  }

  function onRallyBtn() {
    if (game.players.p1.tokens.stateRally <= 0) { showToast('No State Rally tokens'); return; }
    setArmed('stateRally');
    setTray(false);
    if (armed) showToast('Tap a state to deploy');
  }

  function onSpecialBtn() {
    var state = craftSlotState('special');
    if (state === 'locked') { showToast('Need ' + game.cfg.rally.specialPowerupCraftCost + ' tokens (have ' + game.players.p1.tokens.stateRally + ')'); return; }
    if (state === 'used') return;
    if (state === 'craftable') {
      var r = G.craftToken(game, 'p1', 'special');
      renderAll();
      showToast(r.ok ? '⭐ Special Powerup crafted — tap to activate' : (r.reason === 'too_early' ? 'Too early to craft (min phase ' + game.cfg.rally.specialPowerupMinPhase + ')' : 'Cannot craft yet'));
      return;
    }
    // ready — resolve target requirements before activating
    var power = game.players.p1.politician.power;
    if (power.requiresTargetState) { setArmed('powerTarget'); setTray(false); showToast('Tap a state to target'); return; }
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
    if (!r.ok) { showToast('Cannot activate: ' + r.reason); return; }
    showToast(r.nullified ? 'Your power fizzled — it had been secretly nullified' : '⚡ ' + game.players.p1.politician.power.name + ' activated');
  }

  function onNationwideBtn() {
    var state = craftSlotState('nationwide');
    if (state === 'locked') { showToast('Need ' + game.cfg.rally.nationwideRallyCraftCost + ' tokens (have ' + game.players.p1.tokens.stateRally + ')'); return; }
    if (state === 'used') return;
    if (state === 'craftable') {
      var r = G.craftToken(game, 'p1', 'nationwide');
      renderAll();
      showToast(r.ok ? '🇮🇳 Nationwide Rally crafted — tap to activate' : (r.reason === 'too_early' ? 'Too early to craft (min phase ' + game.cfg.rally.nationwideRallyMinPhase + ')' : 'Cannot craft yet'));
      return;
    }
    G.activateNationwideRally(game, 'p1');
    renderAll();
    showToast('🇮🇳 Nationwide Rally activated');
  }

  var trayOpen = false, agendaTrayOpen = false;
  function setTray(open) { trayOpen = open; $('tokenTray').classList.toggle('open', trayOpen); if (open) setAgendaTray(false); }
  function setAgendaTray(open) { agendaTrayOpen = open; $('agendaTray').classList.toggle('open', agendaTrayOpen); if (open) setTray(false); }

  // ---------------------------------------------------------------------
  // Investment (map tap / UT quick-invest buttons)
  // ---------------------------------------------------------------------
  function investPaid(svgId) {
    var r = G.investCash(game, 'p1', svgId);
    if (!r.ok) { showToast('Insufficient funds'); return; }
    renderAll();
    var el = document.getElementById(svgId);
    if (el && el.animate) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 220 });
  }

  function onMapTap(svgId) {
    selectState(svgId);
    if (armed === 'stateRally') {
      var r = G.playRallyToken(game, 'p1', svgId);
      if (!r.ok) { showToast(r.reason === 'state_cap' ? 'This state is capped at 2 rally plays' : 'Spend cap reached this phase'); return; }
      showToast('📢 State Rally deployed'); armed = null; renderAll(); return;
    }
    if (armed === 'powerTarget') {
      finishActivatePower({ targetStateSvgId: svgId });
      armed = null; $('targetBanner').hidden = true; renderAll(); return;
    }
    investPaid(svgId);
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
    onMapTap(path.id);
  });
  $('utsBtn').addEventListener('click', function () {
    G.SMALL_UT_IDS.forEach(function (id) { if (id !== 'INDL' && id !== 'INGA') G.investCash(game, 'p1', id); });
    renderAll();
    showToast('Invested in all Union Territories');
  });
  $('delhiBtn').addEventListener('click', function () { selectState('INDL'); investPaid('INDL'); });
  $('goaBtn').addEventListener('click', function () { selectState('INGA'); investPaid('INGA'); });
  $('rallyBtn').addEventListener('click', onRallyBtn);
  $('specialBtn').addEventListener('click', onSpecialBtn);
  $('nationwideBtn').addEventListener('click', onNationwideBtn);
  $('tokenToggleBtn').addEventListener('click', function () { setTray(!trayOpen); });
  $('agendaToggleBtn').addEventListener('click', function () { setAgendaTray(!agendaTrayOpen); });
  $('endPhaseBtn').addEventListener('click', doEndPhase);
  $('playAgainBtn').addEventListener('click', function () {
    $('endOverlay').hidden = true;
    $('selectOverlay').hidden = false;
  });

  G.loadGameData('../data/').then(function (d) {
    data = d;
    renderPolGrid();
  }).catch(function (err) {
    console.error('Failed to load game data — is this served over http(s), not file://?', err);
    showToast('Failed to load game data — serve this over http(s), not file://');
  });
})();
