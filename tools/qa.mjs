/**
 * Headless check of the whole site: links, interactions, console errors.
 *
 *   node tools/qa.mjs            # all pages
 *   node tools/qa.mjs index      # one page
 *
 * It drives Microsoft Edge over the DevTools protocol using only Node built-ins
 * (fetch + WebSocket), so there is nothing to install. Exit code 1 means at
 * least one check failed — which is the point: this is the script I run before
 * pushing.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
].find((p) => existsSync(p));

const PORT = 9333;
const PAGES = ['index.html', 'legends.html', 'seasons.html', 'trophies.html', 'quiz.html', 'about.html'];

if (!EDGE) {
  console.error('No Edge or Chrome found. Install one, or edit EDGE in this script.');
  process.exit(2);
}

const only = process.argv[2];
const pages = only ? PAGES.filter((p) => p.startsWith(only)) : PAGES;

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? ' — ' + detail : ''}`);
}

/* ---- DevTools plumbing ------------------------------------------------ */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url);
  return res.json();
}

async function waitForBrowser() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const v = await getJson(`http://127.0.0.1:${PORT}/json/version`);
      if (v.webSocketDebuggerUrl) return v;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('DevTools endpoint never answered');
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = [];
  const errors = [];

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    }
    listeners.forEach((fn) => fn(msg));
  });

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  function send(method, params = {}) {
    id += 1;
    const myId = id;
    return new Promise((resolve, reject) => {
      pending.set(myId, { resolve, reject });
      ws.send(JSON.stringify({ id: myId, method, params }));
    });
  }

  function once(method) {
    return new Promise((resolve) => {
      const fn = (msg) => {
        if (msg.method === method) {
          const i = listeners.indexOf(fn);
          if (i > -1) listeners.splice(i, 1);
          resolve(msg.params);
        }
      };
      listeners.push(fn);
    });
  }

  return { ws, send, once, ready, errors };
}

async function evaluate(cdp, expression) {
  const res = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception?.description || ''));
  return res.result.value;
}

/* ---- Static checks ---------------------------------------------------- */
function staticChecks() {
  pages.forEach((page) => {
    const html = readFileSync(path.join(ROOT, page), 'utf8');

    const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
    const badScheme = hrefs.filter((h) => /^(file:|\/|[A-Za-z]:\\)/.test(h));
    check(`${page}: no file:/// or absolute local paths`, badScheme.length === 0, badScheme.join(', '));

    const localLinks = hrefs.filter((h) => !/^(https?:|mailto:|#|data:)/.test(h));
    const missing = localLinks
      .map((h) => h.split('#')[0])
      .filter((h) => h && !existsSync(path.join(ROOT, h)));
    check(`${page}: every internal link resolves to a file`, missing.length === 0, missing.join(', '));

    check(`${page}: has a single <h1>`, (html.match(/<h1[\s>]/g) || []).length === 1);
    check(`${page}: has a meta description`, /<meta name="description"/.test(html));
    check(`${page}: declares a language`, /<html lang="en"/.test(html));
    check(`${page}: has an og:image`, /property="og:image"/.test(html));
  });

  const css = readFileSync(path.join(ROOT, 'assets/css/site.css'), 'utf8');
  check('css: balanced braces', (css.match(/{/g) || []).length === (css.match(/}/g) || []).length);
}

/* ---- Interaction checks ---------------------------------------------- */
async function pageChecks(cdp, baseUrl) {
  async function go(page) {
    const loaded = cdp.once('Page.loadEventFired');
    await cdp.send('Page.navigate', { url: `${baseUrl}/${page}` });
    await loaded;
    await sleep(250); // let the deferred scripts settle
  }

  /* index */
  await go('index.html');
  check('index: data file loaded', (await evaluate(cdp, '!!window.UTD && window.UTD.seasons.length')) === 33);
  check('index: nine eras rendered', (await evaluate(cdp, 'document.querySelectorAll("#eras .era").length')) === 9);
  check('index: four tickers rendered', (await evaluate(cdp, 'document.querySelectorAll(".ticker").length')) === 4);
  check(
    'index: tickers show real numbers',
    (await evaluate(cdp, '[...document.querySelectorAll(".ticker__num")].every(el => /^\\d+\\s/.test(el.textContent))')) === true
  );

  /* legends */
  await go('legends.html');
  await evaluate(cdp, 'document.querySelector(\'[data-slot="gk"]\').click()');
  check('legends: pick list offers goalkeepers', (await evaluate(cdp, 'document.querySelectorAll(".pick-item").length')) === 2);
  await evaluate(cdp, 'document.querySelector(".pick-item").click()');
  check('legends: slot filled after pick', (await evaluate(cdp, 'document.querySelector(\'[data-slot="gk"]\').classList.contains("is-filled")')) === true);
  check('legends: summary counts the pick', (await evaluate(cdp, 'document.querySelector("[data-sum-players]").textContent')) === '1');
  await evaluate(cdp, 'document.querySelector("[data-xi-fill]").click()');
  check('legends: classic XI fills eleven slots', (await evaluate(cdp, 'document.querySelectorAll(".slot.is-filled").length')) === 11);
  check(
    'legends: combined appearances are plausible',
    (await evaluate(cdp, 'Number(document.querySelector("[data-sum-apps]").textContent.replace(/\\D/g, ""))')) > 4000
  );
  await evaluate(cdp, 'document.querySelector("[data-xi-clear]").click()');
  check('legends: clear empties the XI', (await evaluate(cdp, 'document.querySelectorAll(".slot.is-filled").length')) === 0);
  check('legends: index lists 24 players', (await evaluate(cdp, 'document.querySelectorAll("[data-rows] tr").length')) === 24);
  await evaluate(cdp, `(() => { const i = document.querySelector('[data-search]'); i.value = 'scholes'; i.dispatchEvent(new Event('input')); })()`);
  check('legends: search filters to one', (await evaluate(cdp, 'document.querySelectorAll("[data-rows] tr").length')) === 1);
  await evaluate(cdp, `(() => { const i = document.querySelector('[data-search]'); i.value = ''; i.dispatchEvent(new Event('input')); })()`);
  await evaluate(cdp, 'document.querySelector(\'th[data-sort="goals"]\').click()');
  check(
    'legends: sorting by goals puts Rooney first',
    (await evaluate(cdp, 'document.querySelector("[data-rows] tr th").textContent')) === 'Wayne Rooney'
  );

  /* seasons */
  await go('seasons.html');
  check('seasons: 33 bars', (await evaluate(cdp, 'document.querySelectorAll("#chart .bar-g").length')) === 33);
  check('seasons: 13 title bars', (await evaluate(cdp, 'document.querySelectorAll("#chart .bar.is-title").length')) === 13);
  await evaluate(cdp, 'document.querySelector(\'[data-era="after"]\').click()');
  check('seasons: "after Ferguson" shows 12 seasons', (await evaluate(cdp, 'document.querySelectorAll("#chart .bar-g").length')) === 12);
  check(
    'seasons: average points for that selection is 65.9',
    (await evaluate(cdp, 'Number(document.querySelector(\'[data-kpi="avg"]\').textContent)')) === 65.9
  );
  await evaluate(cdp, 'document.querySelector(\'[data-metric="pos"]\').click()');
  check('seasons: position view draws a line', (await evaluate(cdp, '!!document.querySelector("#chart .chart-line")')) === true);
  await evaluate(cdp, 'document.querySelector(\'[data-era="all"]\').click()');
  check('seasons: table has 33 rows', (await evaluate(cdp, 'document.querySelectorAll("[data-season-rows] tr").length')) === 33);

  /* trophies */
  await go('trophies.html');
  check('trophies: ten competitions', (await evaluate(cdp, 'document.querySelectorAll(".trophy").length')) === 10);
  check('trophies: total is 68', (await evaluate(cdp, 'document.querySelector("[data-total]").textContent')) === '68');
  await evaluate(cdp, 'document.querySelector(\'[data-group="european"]\').click()');
  check('trophies: european filter shows four', (await evaluate(cdp, 'document.querySelectorAll(".trophy").length')) === 4);
  check(
    'trophies: european filter totals six',
    (await evaluate(cdp, 'document.querySelector("[data-cab-count]").textContent')).startsWith('6')
  );
  check('trophies: decade chart rendered', (await evaluate(cdp, 'document.querySelectorAll(".decade-row").length')) > 8);

  /* quiz */
  await go('quiz.html');
  check('quiz: first question shown', (await evaluate(cdp, 'document.querySelectorAll(".answer").length')) === 4);
  check('quiz: next is disabled before answering', (await evaluate(cdp, 'document.querySelector("[data-next]").disabled')) === true);
  await evaluate(cdp, 'document.querySelectorAll(".answer")[1].click()');
  check('quiz: next unlocks after answering', (await evaluate(cdp, 'document.querySelector("[data-next]").disabled')) === false);
  for (let i = 0; i < 10; i += 1) {
    if ((await evaluate(cdp, '!!document.querySelector(".score-card")')) === true) break;
    await evaluate(cdp, 'document.querySelector("[data-next]").click()');
    if ((await evaluate(cdp, '!!document.querySelector(".score-card")')) === true) break;
    await evaluate(cdp, 'document.querySelectorAll(".answer")[0].click()');
  }
  check('quiz: finishes with a score card', (await evaluate(cdp, '!!document.querySelector(".score-card")')) === true);
  check('quiz: review lists ten answers', (await evaluate(cdp, 'document.querySelectorAll(".review__row").length')) === 10);
  await evaluate(cdp, 'document.querySelector("[data-restart]").click()');
  check('quiz: restart returns to question one', (await evaluate(cdp, 'document.querySelectorAll(".answer").length')) === 4);

  /* about */
  await go('about.html');
  check('about: six colour tokens shown', (await evaluate(cdp, 'document.querySelectorAll(".swatch").length')) === 6);
  check('about: sitemap block present', (await evaluate(cdp, '!!document.querySelector("pre.ascii")')) === true);
}

/* ---- Run -------------------------------------------------------------- */
(async () => {
  staticChecks();

  console.log('\nLaunching headless Edge…');
  const profile = path.join(os.tmpdir(), 'rdd-qa-' + Date.now());
  const browser = spawn(EDGE, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    'about:blank'
  ], { stdio: 'ignore' });

  let cdp;
  try {
    const version = await waitForBrowser();
    const targets = await getJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageTarget = targets.find((t) => t.type === 'page');
    cdp = connect(pageTarget.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    const baseUrl = 'file:///' + ROOT.replace(/\\/g, '/');
    await pageChecks(cdp, baseUrl);

    check('no console errors or uncaught exceptions', cdp.errors.length === 0, cdp.errors.slice(0, 3).join(' | '));
  } catch (err) {
    check('harness ran to completion', false, err.message);
  } finally {
    try { cdp?.ws.close(); } catch { }
    browser.kill();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
  process.exit(failed.length ? 1 : 0);
})();
