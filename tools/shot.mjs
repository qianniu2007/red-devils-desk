/**
 * Screenshot helper built on the DevTools protocol, because `--window-size` in
 * headless mode lies about the viewport: it does not emulate a phone, so media
 * queries and the printed width do not match what a real phone sees.
 *
 *   node tools/shot.mjs                        # every page, desktop + mobile
 *   node tools/shot.mjs --page legends --mobile
 *   node tools/shot.mjs --page index --full    # full-page capture
 *   node tools/shot.mjs --page index --dark
 *
 * Writes into screenshots/ (created if missing) and prints the layout width,
 * which is the fastest way to spot horizontal overflow.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
].find((p) => existsSync(p));

const PORT = 9334;
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name, fallback) => {
  const i = argv.indexOf(name);
  return i > -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};

const mobile = flag('--mobile');
const full = flag('--full');
const dark = flag('--dark');
const pageArg = value('--page', null);
const outDir = path.join(ROOT, 'screenshots');
mkdirSync(outDir, { recursive: true });

const PAGES = ['index', 'legends', 'seasons', 'trophies', 'quiz', 'about'];
const pages = pageArg ? [pageArg] : PAGES;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url);
  return res.json();
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = [];

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
    listeners.forEach((fn) => fn(msg));
  });

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  const send = (method, params = {}) => {
    id += 1;
    const myId = id;
    return new Promise((resolve, reject) => {
      pending.set(myId, { resolve, reject });
      ws.send(JSON.stringify({ id: myId, method, params }));
    });
  };

  const once = (method) => new Promise((resolve) => {
    const fn = (msg) => {
      if (msg.method === method) {
        listeners.splice(listeners.indexOf(fn), 1);
        resolve(msg.params);
      }
    };
    listeners.push(fn);
  });

  return { ws, send, once, ready };
}

(async () => {
  if (!EDGE) {
    console.error('No Edge or Chrome found.');
    process.exit(2);
  }

  const profile = path.join(os.tmpdir(), 'rdd-shot-' + Date.now());
  const browser = spawn(EDGE, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'
  ], { stdio: 'ignore' });

  let cdp;
  try {
    let version;
    for (let i = 0; i < 60 && !version; i += 1) {
      try { version = await getJson(`http://127.0.0.1:${PORT}/json/version`); } catch { await sleep(250); }
    }
    if (!version) throw new Error('DevTools never came up');

    const targets = await getJson(`http://127.0.0.1:${PORT}/json/list`);
    cdp = connect(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }]
    });

    const width = Number(value('--w', mobile ? 390 : 1440));
    const height = Number(value('--h', mobile ? 844 : 900));

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: mobile ? 2 : 1, mobile
    });

    const baseUrl = 'file:///' + ROOT.replace(/\\/g, '/');

    for (const page of pages) {
      const loaded = cdp.once('Page.loadEventFired');
      await cdp.send('Page.navigate', { url: `${baseUrl}/${page}.html` });
      await loaded;
      await sleep(400);

      const metrics = await cdp.send('Runtime.evaluate', {
        expression: '({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, vw: innerWidth })',
        returnByValue: true
      });
      const m = metrics.result.value;
      const overflow = m.w > m.vw ? `  OVERFLOW by ${m.w - m.vw}px` : '';
      console.log(`${page} ${mobile ? 'mobile' : 'desktop'} ${m.vw}x${m.h}${overflow}`);

      /* Full-page captures have to scroll through the document first: sections
         below the fold are revealed by an IntersectionObserver, so a naive
         captureBeyondViewport screenshots them while still invisible. */
      if (full) {
        await cdp.send('Runtime.evaluate', {
          expression: '(async () => { const step = innerHeight; const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); })()',
          awaitPromise: true
        });
        await sleep(800);
      }

      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: full,
        ...(full ? { clip: { x: 0, y: 0, width: m.vw, height: Math.min(m.h, 6000), scale: 1 } } : {})
      });

      const suffix = [mobile ? 'mobile' : 'desktop', dark ? 'dark' : '', full ? 'full' : ''].filter(Boolean).join('-');
      const file = path.join(outDir, `${page}-${suffix}.png`);
      writeFileSync(file, Buffer.from(shot.data, 'base64'));
      console.log('  →', path.relative(ROOT, file));
    }
  } catch (err) {
    console.error('failed:', err.message);
    process.exitCode = 1;
  } finally {
    try { cdp?.ws.close(); } catch { }
    browser.kill();
  }
})();
