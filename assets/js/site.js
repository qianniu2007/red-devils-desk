/* Shared behaviour for every page: theme, mobile menu, reveal, tickers. */
(function () {
  'use strict';

  /* ---- Theme ----------------------------------------------------------
     Set as early as possible (see the inline snippet in <head>) so the page
     never flashes the wrong colour. The button just flips the attribute. */
  var root = document.documentElement;
  var themeBtn = document.querySelector('[data-theme-toggle]');

  function setTheme(mode, remember) {
    root.setAttribute('data-theme', mode);
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
      themeBtn.setAttribute(
        'aria-label',
        mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
    }
    if (remember) {
      try { localStorage.setItem('rdd-theme', mode); } catch (e) { /* private mode */ }
    }
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(next, true);
    });
    setTheme(root.getAttribute('data-theme') || 'light', false);
  }

  /* ---- Mobile menu ---------------------------------------------------- */
  var menuBtn = document.querySelector('[data-menu-toggle]');
  var nav = document.querySelector('[data-nav]');

  if (menuBtn && nav) {
    var closeMenu = function () {
      nav.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    };

    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        menuBtn.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
    });
  }

  /* ---- Reveal on scroll ----------------------------------------------- */
  var revealables = document.querySelectorAll('.reveal');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || reduced) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ---- "Since then" tickers -------------------------------------------
     Counts complete years on the anniversary — truthful as the page ages,
     and it never drifts the way a hard-coded number would. Exposed on
     window.RDD so pages that render their own markup can call it again. */
  var now = new Date();

  function renderTickers() {
    if (!window.UTD) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-ticker]'), function (el) {
      var label = el.getAttribute('data-ticker');
      var m = window.UTD.milestones.filter(function (x) { return x.label === label; })[0];
      if (!m) return;
      var then = new Date(m.date + 'T00:00:00');
      var years = now.getFullYear() - then.getFullYear();
      var months = now.getMonth() - then.getMonth();
      if (now.getDate() < then.getDate()) months -= 1;
      if (months < 0) years -= 1;
      var unit = el.querySelector('[data-ticker-unit]');
      el.firstChild.nodeValue = years + ' ';
      if (unit) unit.textContent = years === 1 ? 'year' : 'years';
      el.setAttribute('title', 'Since ' + m.date);
    });
  }

  window.RDD = window.RDD || {};
  window.RDD.renderTickers = renderTickers;
  renderTickers();

  /* ---- Footer year ---------------------------------------------------- */
  var yearEls = document.querySelectorAll('[data-year]');
  Array.prototype.forEach.call(yearEls, function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---- Nav: mark the current page if the HTML forgot to ------------- */
  var here = document.location.pathname.split('/').pop() || 'index.html';
  Array.prototype.forEach.call(document.querySelectorAll('[data-nav] a'), function (a) {
    var target = a.getAttribute('href');
    if (target === here) a.setAttribute('aria-current', 'page');
  });
})();
