/* Cabinet page: trophy grid with a type filter, plus a per-decade count.
   The decade numbers are derived, not typed in — that is the point of a data
   file: change one year in data.js and both the cabinet and the chart move. */
(function () {
  'use strict';

  var trophies = window.UTD.trophies;
  var host = document.getElementById('cabinet');
  var countEl = document.querySelector('[data-cab-count]');
  var totalEl = document.querySelector('[data-total]');
  var decadeHost = document.getElementById('decades');

  var state = { group: 'all' };

  var GROUP_LABEL = { all: 'all competitions', domestic: 'domestic', european: 'European', worldwide: 'worldwide' };

  /* ---- Cabinet -------------------------------------------------------- */
  function renderCabinet() {
    var rows = trophies.filter(function (t) {
      return state.group === 'all' || t.group === state.group;
    });

    host.innerHTML = '';

    rows.forEach(function (t) {
      var el = document.createElement('article');
      el.className = 'trophy';

      var years = t.years.map(function (y) {
        var shared = y.indexOf('*') > -1;
        return '<li' + (shared ? ' class="is-shared" title="Shared title"' : '') + '>' + y + '</li>';
      }).join('');

      el.innerHTML =
        '<div class="trophy__head">' +
          '<span class="trophy__count">' + t.count + (t.shared ? '<small> incl. ' + t.shared + ' shared</small>' : '') + '</span>' +
        '</div>' +
        '<h3>' + t.name + '</h3>' +
        '<p class="trophy__detail">' + t.detail + '</p>' +
        '<p>' + t.note + '</p>' +
        '<ul class="years">' + years + '</ul>';

      host.appendChild(el);
    });

    var n = rows.reduce(function (a, b) { return a + b.count; }, 0);
    countEl.textContent = n + (n === 1 ? ' trophy' : ' trophies') + ' · ' + GROUP_LABEL[state.group];
  }

  /* ---- Decades -------------------------------------------------------- */
  function renderDecades() {
    var all = [];
    trophies.forEach(function (t) {
      t.years.forEach(function (y) {
        all.push(parseInt(y.replace(/\*/g, '').slice(0, 4), 10));
      });
    });

    var buckets = {};
    all.forEach(function (year) {
      var d = Math.floor(year / 10) * 10;
      buckets[d] = (buckets[d] || 0) + 1;
    });

    var keys = Object.keys(buckets).map(Number).sort(function (a, b) { return a - b; });
    var max = Math.max.apply(null, keys.map(function (k) { return buckets[k]; }));

    decadeHost.innerHTML = '';

    keys.forEach(function (k) {
      var val = buckets[k];
      var row = document.createElement('div');
      row.className = 'decade-row';
      row.innerHTML =
        '<span class="decade-label">' + k + 's</span>' +
        '<span class="decade-bar"><i style="width:' + ((val / max) * 100).toFixed(1) + '%"></i></span>' +
        '<span class="decade-val">' + val + '</span>';
      decadeHost.appendChild(row);
    });

    decadeHost.setAttribute('role', 'img');
    decadeHost.setAttribute('aria-label',
      'Major trophies per decade: ' + keys.map(function (k) {
        return k + 's, ' + buckets[k];
      }).join('; ') + '.');
  }

  /* ---- Total -----------------------------------------------------------
     No count-up animation: an animated number can be photographed (or read by
     a screen reader) half-finished, and 54 trophies is a lie in any language.
     The honest total is written once, immediately. */
  function renderTotal() {
    var total = trophies.reduce(function (a, b) { return a + b.count; }, 0);
    totalEl.textContent = total;
    totalEl.setAttribute('data-total', String(total));
    totalEl.setAttribute('title', '20 league + 13 FA Cup + 6 League Cup + 21 Community Shield + 3 European Cup + 1 CWC + 1 Super Cup + 1 Europa + 1 Intercontinental + 1 Club World Cup');
  }

  /* ---- Controls ------------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-group]'), function (btn) {
    btn.addEventListener('click', function () {
      state.group = btn.getAttribute('data-group');
      Array.prototype.forEach.call(document.querySelectorAll('[data-group]'), function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      renderCabinet();
    });
  });

  renderTotal();
  renderCabinet();
  renderDecades();
})();
