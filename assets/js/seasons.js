/* Seasons page: one SVG chart, drawn from the data file, no chart library.
   Two metrics (points / position), three selections (all / Ferguson / after).
   The same numbers are written into the table underneath, so nothing is
   chart-only. */
(function () {
  'use strict';

  var seasons = window.UTD.seasons;
  var svg = document.getElementById('chart');
  var tip = document.getElementById('tip');
  var wrap = document.querySelector('.chart-wrap');
  var tableBody = document.querySelector('[data-season-rows]');

  var state = { metric: 'pts', era: 'all' };

  /* ---- Helpers -------------------------------------------------------- */
  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'];
    var v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function avg(list, key) {
    if (!list.length) return 0;
    var sum = list.reduce(function (a, b) { return a + b[key]; }, 0);
    return sum / list.length;
  }

  function selection() {
    if (state.era === 'ferguson') {
      return seasons.filter(function (s) { return s.mgr === 'Ferguson'; });
    }
    if (state.era === 'after') {
      return seasons.filter(function (s) { return s.mgr !== 'Ferguson'; });
    }
    return seasons;
  }

  /* ---- Chart ---------------------------------------------------------- */
  var W = 1000;
  var H = 400;
  var M = { top: 22, right: 18, bottom: 58, left: 48 };
  var plotW = W - M.left - M.right;
  var plotH = H - M.top - M.bottom;

  function renderChart() {
    var rows = selection();
    var n = rows.length;
    var band = plotW / n;
    var barW = Math.min(band * 0.62, 26);
    var isPts = state.metric === 'pts';

    var maxPts = 100;
    var parts = [];

    /* -- grid + y axis -- */
    if (isPts) {
      [0, 20, 40, 60, 80, 100].forEach(function (v) {
        var y = M.top + plotH * (1 - v / maxPts);
        parts.push('<line class="grid-line" x1="' + M.left + '" x2="' + (W - M.right) + '" y1="' + y + '" y2="' + y + '"/>');
        parts.push('<text class="axis-label" x="' + (M.left - 10) + '" y="' + (y + 4) + '" text-anchor="end">' + v + '</text>');
      });
    } else {
      [1, 5, 10, 15, 20].forEach(function (v) {
        var y = M.top + plotH * ((v - 1) / 19);
        parts.push('<line class="grid-line" x1="' + M.left + '" x2="' + (W - M.right) + '" y1="' + y + '" y2="' + y + '"/>');
        parts.push('<text class="axis-label" x="' + (M.left - 10) + '" y="' + (y + 4) + '" text-anchor="end">' + ordinal(v) + '</text>');
      });
    }

    /* -- the marks -- */
    if (isPts) {
      rows.forEach(function (row, i) {
        var h = plotH * (row.pts / maxPts);
        var x = M.left + band * i + (band - barW) / 2;
        var y = M.top + plotH - h;
        var cls = 'bar' + (row.pos === 1 ? ' is-title' : '');
        parts.push(
          '<g class="bar-g" tabindex="0" role="img" aria-label="' + row.season + ': ' + ordinal(row.pos) + ', ' + row.pts + ' points. ' + row.mgr + '. ' + row.note.replace(/"/g, '&quot;') + '">' +
          '<rect class="' + cls + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + Math.max(h, 1).toFixed(1) + '" rx="1"/>' +
          '<rect x="' + (M.left + band * i).toFixed(1) + '" y="' + M.top + '" width="' + band.toFixed(1) + '" height="' + plotH + '" fill="transparent"/>' +
          '</g>'
        );
      });
    } else {
      var pts = rows.map(function (row, i) {
        var x = M.left + band * i + band / 2;
        var y = M.top + plotH * ((row.pos - 1) / 19);
        return { x: x, y: y, row: row };
      });

      parts.push('<polyline class="chart-line" points="' +
        pts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ') + '"/>');

      pts.forEach(function (p) {
        var r = p.row.pos === 1 ? 5.5 : 3.5;
        parts.push(
          '<g class="bar-g" tabindex="0" role="img" aria-label="' + p.row.season + ': ' + ordinal(p.row.pos) + ', ' + p.row.pts + ' points. ' + p.row.mgr + '. ' + p.row.note.replace(/"/g, '&quot;') + '">' +
          '<circle class="dot" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r + '"/>' +
          '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="14" fill="transparent"/>' +
          '</g>'
        );
      });
    }

    /* -- average line -- */
    var mean = isPts ? avg(rows, 'pts') : avg(rows, 'pos');
    var meanY = isPts
      ? M.top + plotH * (1 - mean / maxPts)
      : M.top + plotH * ((mean - 1) / 19);

    parts.push('<line class="avg-line" x1="' + M.left + '" x2="' + (W - M.right) + '" y1="' + meanY.toFixed(1) + '" y2="' + meanY.toFixed(1) + '"/>');
    var meanLabel = isPts ? 'average ' + mean.toFixed(1) + ' pts' : 'average finish ' + mean.toFixed(1);
    parts.push('<text class="axis-label" x="' + (W - M.right) + '" y="' + (meanY - 7).toFixed(1) + '" text-anchor="end" style="fill:var(--ink)">' + meanLabel + '</text>');

    /* -- x labels: every fourth season, plus the last one -- */
    rows.forEach(function (row, i) {
      if (i % 4 !== 0 && i !== rows.length - 1) return;
      var x = M.left + band * i + band / 2;
      parts.push('<text class="axis-label" x="' + x.toFixed(1) + '" y="' + (H - M.bottom + 18) + '" text-anchor="end" transform="rotate(-45 ' + x.toFixed(1) + ' ' + (H - M.bottom + 18) + ')">' + row.season + '</text>');
    });

    /* -- baseline -- */
    parts.push('<line class="chart-baseline" x1="' + M.left + '" x2="' + (W - M.right) + '" y1="' + (M.top + plotH) + '" y2="' + (M.top + plotH) + '"/>');

    svg.innerHTML = parts.join('');
    wireTooltips(rows);
  }

  /* ---- Tooltip -------------------------------------------------------- */
  function wireTooltips(rows) {
    var groups = svg.querySelectorAll('.bar-g');

    function show(i, el) {
      var row = rows[i];
      tip.innerHTML = '<b>' + row.season + '</b>' +
        ordinal(row.pos) + ' &middot; ' + row.pts + ' pts<br>' +
        row.mgr +
        '<br><span style="opacity:.75">' + row.note + '</span>';
      tip.classList.add('is-on');

      /* Anchor to the mark the visitor actually pointed at, so the tip keeps
         its bearings at any viewport width — including when the chart is
         scrolled sideways on a phone. */
      var box = wrap.getBoundingClientRect();
      var r = el.getBoundingClientRect();
      tip.style.left = (r.left - box.left + wrap.scrollLeft + r.width / 2) + 'px';
      tip.style.top = (r.top - box.top + wrap.scrollTop) + 'px';
    }

    function hide() {
      tip.classList.remove('is-on');
    }

    Array.prototype.forEach.call(groups, function (g, i) {
      g.addEventListener('mouseenter', function () { show(i, g); });
      g.addEventListener('mouseleave', hide);
      g.addEventListener('focus', function () { show(i, g); });
      g.addEventListener('blur', hide);
      g.addEventListener('click', function () {
        var target = document.querySelector('[data-season="' + rows[i].season + '"]');
        if (target) {
          target.scrollIntoView({ block: 'center', behavior: 'smooth' });
          target.style.background = 'var(--paper-3)';
          setTimeout(function () { target.style.background = ''; }, 1600);
        }
      });
    });
  }

  /* ---- KPIs ----------------------------------------------------------- */
  function renderKpis() {
    var rows = selection();
    var titles = rows.filter(function (s) { return s.pos === 1; }).length;
    var best = Math.min.apply(null, rows.map(function (s) { return s.pos; }));
    var worst = Math.max.apply(null, rows.map(function (s) { return s.pos; }));
    var meanPts = avg(rows, 'pts');

    document.querySelector('[data-kpi="titles"]').textContent = titles;
    document.querySelector('[data-kpi="best"]').innerHTML = best + '<small>' + ordinal(best).replace(String(best), '') + '</small>';
    document.querySelector('[data-kpi="worst"]').innerHTML = worst + '<small>' + ordinal(worst).replace(String(worst), '') + '</small>';
    document.querySelector('[data-kpi="avg"]').textContent = meanPts.toFixed(1);
  }

  /* ---- Table ---------------------------------------------------------- */
  function renderTable() {
    var rows = selection();
    tableBody.innerHTML = '';
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.setAttribute('data-season', row.season);
      tr.innerHTML =
        '<th scope="row">' + row.season + '</th>' +
        '<td>' + row.mgr + '</td>' +
        '<td class="num">' + ordinal(row.pos) + '</td>' +
        '<td class="num">' + row.pts + '</td>' +
        '<td style="color:var(--clay);font-size:.86rem">' + row.note + '</td>';
      tableBody.appendChild(tr);
    });
  }

  /* ---- Controls ------------------------------------------------------- */
  function wireControls() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-era]'), function (btn) {
      btn.addEventListener('click', function () {
        state.era = btn.getAttribute('data-era');
        Array.prototype.forEach.call(document.querySelectorAll('[data-era]'), function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        render();
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-metric]'), function (btn) {
      btn.addEventListener('click', function () {
        state.metric = btn.getAttribute('data-metric');
        Array.prototype.forEach.call(document.querySelectorAll('[data-metric]'), function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        renderChart();
      });
    });
  }

  function render() {
    renderChart();
    renderKpis();
    renderTable();
  }

  wireControls();
  render();

  /* Redraw on resize so the tooltip keeps its bearings. */
  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(renderChart, 150);
  });
})();
