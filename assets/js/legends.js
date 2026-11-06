/* Legends page: the XI builder + the sortable index.
   State lives in one object and is written to localStorage after every change. */
(function () {
  'use strict';

  var players = window.UTD.legends;
  var byId = {};
  players.forEach(function (p) { byId[p.id] = p; });

  var STORE = 'rdd-xi';

  /* Which data slots each position on the pitch accepts. */
  var ACCEPT = {
    gk: ['GK'],
    rb: ['RB'],
    cb1: ['CB'],
    cb2: ['CB'],
    lb: ['LB'],
    cm1: ['CM'],
    cm2: ['CM'],
    am: ['AM'],
    rw: ['RW', 'RM'],
    st: ['ST'],
    lw: ['LW', 'LM']
  };

  var SLOT_ORDER = ['gk', 'rb', 'cb1', 'cb2', 'lb', 'cm1', 'cm2', 'am', 'rw', 'st', 'lw'];

  var CLASSIC = {
    gk: 'schmeichel',
    rb: 'gneville',
    cb1: 'ferdinand',
    cb2: 'vidic',
    lb: 'irwin',
    cm1: 'keane',
    cm2: 'scholes',
    am: 'charlton',
    rw: 'ronaldo',
    st: 'rooney',
    lw: 'giggs'
  };

  var state = { xi: {}, active: null };

  /* ---- Persistence ---------------------------------------------------- */
  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return;
      var saved = JSON.parse(raw);
      Object.keys(ACCEPT).forEach(function (slot) {
        var id = saved[slot];
        if (id && byId[id] && fits(id, slot)) state.xi[slot] = id;
      });
    } catch (e) { /* corrupt or blocked: start clean */ }
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state.xi)); } catch (e) { }
  }

  function fits(playerId, slot) {
    var p = byId[playerId];
    if (!p) return false;
    return p.slot.some(function (pos) { return ACCEPT[slot].indexOf(pos) > -1; });
  }

  function usedElsewhere(playerId, slot) {
    return SLOT_ORDER.some(function (s) { return s !== slot && state.xi[s] === playerId; });
  }

  /* ---- Pitch ---------------------------------------------------------- */
  var pitch = document.getElementById('pitch');
  var head = document.querySelector('[data-pick-head]');
  var list = document.querySelector('[data-pick-list]');
  var slots = {};

  Array.prototype.forEach.call(pitch.querySelectorAll('.slot'), function (btn) {
    slots[btn.getAttribute('data-slot')] = btn;
    btn.addEventListener('click', function () {
      state.active = btn.getAttribute('data-slot');
      render();
    });
  });

  function shortName(name) {
    var parts = name.split(' ');
    if (parts.length < 2) return name;
    return parts[0].charAt(0) + '. ' + parts.slice(1).join(' ');
  }

  function renderPitch() {
    SLOT_ORDER.forEach(function (slotId) {
      var btn = slots[slotId];
      var id = state.xi[slotId];
      var label = btn.getAttribute('data-label');
      var filled = !!id;

      btn.classList.toggle('is-filled', filled);
      btn.setAttribute('aria-pressed', state.active === slotId ? 'true' : 'false');

      if (filled) {
        btn.innerHTML = shortName(byId[id].name) + '<small>' + label + '</small>';
        btn.setAttribute('aria-label', label + ': ' + byId[id].name + '. Change or remove.');
      } else {
        btn.textContent = label;
        btn.setAttribute('aria-label', 'Empty ' + label + '. Choose a player.');
      }
    });
  }

  function renderPanel() {
    list.innerHTML = '';

    if (!state.active) {
      head.textContent = 'Choose a position to start';
      var hint = document.createElement('p');
      hint.className = 'pick-empty';
      hint.textContent = 'Tap any of the eleven positions on the pitch. The app will only offer players who actually played there.';
      list.appendChild(hint);
      return;
    }

    var slotId = state.active;
    var label = slots[slotId].getAttribute('data-label');
    head.textContent = 'Pick your ' + label;

    var current = state.xi[slotId];

    if (current) {
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'pick-item';
      remove.innerHTML = '<span>Remove ' + byId[current].name + '</span><span>×</span>';
      remove.addEventListener('click', function () {
        delete state.xi[slotId];
        state.active = null;
        save();
        render();
      });
      list.appendChild(remove);
    }

    var options = players.filter(function (p) {
      if (p.id === current) return false;
      if (usedElsewhere(p.id, slotId)) return false;
      return p.slot.some(function (pos) { return ACCEPT[slotId].indexOf(pos) > -1; });
    });

    if (!options.length) {
      var none = document.createElement('p');
      none.className = 'pick-empty';
      none.textContent = 'Every eligible player is already in your XI.';
      list.appendChild(none);
      return;
    }

    options
      .slice()
      .sort(function (a, b) { return b.apps - a.apps; })
      .forEach(function (p) {
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'pick-item';
        item.innerHTML = '<span>' + p.name + '</span><span>' + p.apps + ' apps · ' + p.goals + ' goals</span>';
        item.addEventListener('click', function () {
          state.xi[slotId] = p.id;
          state.active = null;
          save();
          render();
        });
        list.appendChild(item);
      });
  }

  function renderSummary() {
    var picked = SLOT_ORDER.map(function (s) { return state.xi[s]; }).filter(Boolean);
    var apps = 0;
    var goals = 0;
    var nations = {};
    picked.forEach(function (id) {
      apps += byId[id].apps;
      goals += byId[id].goals;
      nations[byId[id].nation] = true;
    });

    document.querySelector('[data-sum-players]').textContent = picked.length;
    document.querySelector('[data-sum-apps]').textContent = apps.toLocaleString('en-GB');
    document.querySelector('[data-sum-goals]').textContent = goals.toLocaleString('en-GB');
    document.querySelector('[data-sum-nations]').textContent = Object.keys(nations).length;
  }

  function render() {
    renderPitch();
    renderPanel();
    renderSummary();
  }

  /* ---- Buttons -------------------------------------------------------- */
  document.querySelector('[data-xi-clear]').addEventListener('click', function () {
    state.xi = {};
    state.active = null;
    save();
    render();
    status('XI cleared.');
  });

  document.querySelector('[data-xi-fill]').addEventListener('click', function () {
    state.xi = {};
    Object.keys(CLASSIC).forEach(function (slot) { state.xi[slot] = CLASSIC[slot]; });
    state.active = null;
    save();
    render();
    status('A classic XI dropped in. Change anything you disagree with.');
  });

  var statusEl = document.querySelector('[data-copy-status]');
  var statusTimer;
  function status(msg) {
    statusEl.textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { statusEl.textContent = ''; }, 5000);
  }

  document.querySelector('[data-xi-copy]').addEventListener('click', function () {
    var picked = SLOT_ORDER.map(function (s) { return state.xi[s]; }).filter(Boolean);
    if (!picked.length) {
      status('Pick at least one player first.');
      return;
    }
    var apps = 0;
    var goals = 0;
    picked.forEach(function (id) { apps += byId[id].apps; goals += byId[id].goals; });
    var text = 'My Manchester United XI — ' +
      SLOT_ORDER.map(function (s) {
        return state.xi[s] ? slots[s].getAttribute('data-label') + ' ' + byId[state.xi[s]].name : null;
      }).filter(Boolean).join(', ') +
      '. Combined: ' + apps.toLocaleString('en-GB') + ' appearances, ' + goals.toLocaleString('en-GB') + ' goals.';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { status('Copied. Paste it anywhere.'); },
        function () { fallbackCopy(text); }
      );
    } else {
      fallbackCopy(text);
    }
  });

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      status('Copied. Paste it anywhere.');
    } catch (e) {
      status('Copying is blocked in this browser — select the text from the summary instead.');
    }
    document.body.removeChild(ta);
  }

  /* ---- Index table ---------------------------------------------------- */
  var tbody = document.querySelector('[data-rows]');
  var searchInput = document.querySelector('[data-search]');
  var posFilter = document.querySelector('#pos-filter');
  var countEl = document.querySelector('[data-count]');
  var sortableHeaders = Array.prototype.slice.call(document.querySelectorAll('th[data-sort]'));

  var view = { q: '', pos: 'all', key: 'name', dir: 1 };

  var GROUPS = {
    GK: ['GK'],
    CB: ['CB'],
    FB: ['RB', 'LB'],
    MID: ['CM', 'AM', 'RM', 'LM'],
    ATT: ['RW', 'LW', 'ST']
  };

  function matchesPos(p) {
    if (view.pos === 'all') return true;
    return p.slot.some(function (pos) { return GROUPS[view.pos].indexOf(pos) > -1; });
  }

  function matchesQuery(p) {
    if (!view.q) return true;
    var hay = (p.name + ' ' + p.nation + ' ' + p.years).toLowerCase();
    return hay.indexOf(view.q) > -1;
  }

  function sortVal(p) {
    if (view.key === 'years') return parseInt(p.years, 10);
    if (view.key === 'apps' || view.key === 'goals') return p[view.key];
    return p[view.key].toLowerCase();
  }

  function renderTable() {
    var rows = players.filter(function (p) { return matchesPos(p) && matchesQuery(p); });
    rows.sort(function (a, b) {
      var va = sortVal(a);
      var vb = sortVal(b);
      if (va === vb) return a.name.localeCompare(b.name);
      return (va > vb ? 1 : -1) * view.dir;
    });

    tbody.innerHTML = '';
    rows.forEach(function (p) {
      var tr = document.createElement('tr');
      var pos = p.slot.join(' / ');
      tr.innerHTML =
        '<th scope="row">' + p.name + '</th>' +
        '<td><span class="pill">' + pos + '</span></td>' +
        '<td>' + p.nation + '</td>' +
        '<td class="num" style="text-align:left">' + p.years + '</td>' +
        '<td class="num">' + p.apps + '</td>' +
        '<td class="num">' + p.goals + '</td>';
      tbody.appendChild(tr);
    });

    countEl.textContent = rows.length + (rows.length === 1 ? ' player' : ' players');

    sortableHeaders.forEach(function (th) {
      if (th.getAttribute('data-sort') === view.key) {
        th.setAttribute('aria-sort', view.dir === 1 ? 'ascending' : 'descending');
      } else {
        th.removeAttribute('aria-sort');
      }
    });
  }

  sortableHeaders.forEach(function (th) {
    th.addEventListener('click', function () {
      var key = th.getAttribute('data-sort');
      if (view.key === key) {
        view.dir = -view.dir;
      } else {
        view.key = key;
        view.dir = key === 'name' || key === 'nation' ? 1 : -1;
      }
      renderTable();
    });
  });

  searchInput.addEventListener('input', function () {
    view.q = searchInput.value.trim().toLowerCase();
    renderTable();
  });

  posFilter.addEventListener('change', function () {
    view.pos = posFilter.value;
    renderTable();
  });

  /* ---- Boot ----------------------------------------------------------- */
  load();
  render();
  renderTable();
})();
