/**
 * Pulls the real crest and the real player photographs, and records where each
 * one came from and under what licence.
 *
 *   node tools/fetch-photos.mjs
 *
 * Source: Wikipedia / Wikimedia Commons. Two rules are enforced here rather
 * than trusted to memory:
 *
 *   1. Every image must have licence metadata (extmetadata). If a file has none,
 *      or the licence reads as non-free / fair use, the photo is skipped and the
 *      site keeps its generated initials disc for that player.
 *   2. The author and licence are written into assets/js/credits.js, which the
 *      About page renders as a credit list. CC BY-SA requires that.
 *
 * Network note: upload.wikimedia.org answers direct requests, but the thumbnail
 * host (thumb.wikimedia.org) is the one the API hands back, so thumbnails are
 * fetched from exactly the URL the API returns.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'img');
const PLAYERS_DIR = path.join(OUT, 'players');
mkdirSync(PLAYERS_DIR, { recursive: true });

const UA = 'RedDevilsDataDesk/1.0 (student coursework; qianniu2007@users.noreply.github.com)';

/* data.js ids → Wikipedia article titles */
const PLAYERS = {
  schmeichel: 'Peter Schmeichel',
  vandersar: 'Edwin van der Sar',
  gneville: 'Gary Neville',
  irwin: 'Denis Irwin',
  evra: 'Patrice Evra',
  ferdinand: 'Rio Ferdinand',
  vidic: 'Nemanja Vidić',
  stam: 'Jaap Stam',
  pallister: 'Gary Pallister',
  keane: 'Roy Keane',
  scholes: 'Paul Scholes',
  robson: 'Bryan Robson',
  beckham: 'David Beckham',
  giggs: 'Ryan Giggs',
  charlton: 'Bobby Charlton',
  best: 'George Best',
  cantona: 'Eric Cantona',
  rooney: 'Wayne Rooney',
  law: 'Denis Law',
  rvn: 'Ruud van Nistelrooy',
  ronaldo: 'Cristiano Ronaldo',
  cole: 'Andy Cole',
  solskjaer: 'Ole Gunnar Solskjær'
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(host, params) {
  const url = `https://${host}/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${host} ${res.status} for ${params.titles || params.action}`);
  return res.json();
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

function stripHtml(s) {
  if (!s) return '';
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NON_FREE = /non-free|fair use|fair-use|all rights reserved|copyright/i;

async function main() {
  const credits = {};
  const skipped = [];

  /* ---- the crest ------------------------------------------------------ */
  const crestFile = 'Manchester_United_FC_crest.svg';
  try {
    const bytes = await download(
      `https://upload.wikimedia.org/wikipedia/en/7/7a/${crestFile}`,
      path.join(OUT, 'crest-official.svg')
    );
    console.log(`crest: ${bytes} bytes`);

    const info = await api('en.wikipedia.org', {
      action: 'query', prop: 'imageinfo', iiprop: 'extmetadata|url', titles: `File:${crestFile.replace(/_/g, ' ')}`
    });
    const page = Object.values(info.query.pages)[0];
    const meta = page.imageinfo?.[0]?.extmetadata || {};
    credits._crest = {
      file: crestFile,
      licence: stripHtml(meta.LicenseShortName?.value) || 'non-free (Wikipedia fair use)',
      usage: stripHtml(meta.UsageTerms?.value) || '',
      source: 'https://en.wikipedia.org/wiki/File:Manchester_United_FC_crest.svg',
      note: 'Club trademark. Used here for non-commercial coursework, with no claim of affiliation.'
    };
    console.log('crest licence:', credits._crest.licence);
  } catch (err) {
    console.log('crest failed:', err.message);
  }

  /* ---- the players ---------------------------------------------------- */
  for (const [id, title] of Object.entries(PLAYERS)) {
    const dest = path.join(PLAYERS_DIR, `${id}.jpg`);
    try {
      const res = await api('en.wikipedia.org', {
        action: 'query', prop: 'pageimages', piprop: 'name|thumbnail', pithumbsize: '320', titles: title, redirects: '1'
      });
      const page = Object.values(res.query.pages)[0];
      if (!page.thumbnail) { skipped.push(`${id} (no lead image)`); continue; }

      const fileName = page.pageimage; // e.g. "Ryan_Giggs_2015_(cropped).jpg"
      const info = await api('commons.wikimedia.org', {
        action: 'query', prop: 'imageinfo', iiprop: 'extmetadata|url',
        titles: `File:${(fileName || '').replace(/_/g, ' ')}`
      });
      const infoPage = Object.values(info.query.pages)[0];
      const meta = infoPage.imageinfo?.[0]?.extmetadata || {};
      const licence = stripHtml(meta.LicenseShortName?.value);
      const author = stripHtml(meta.Artist?.value) || stripHtml(meta.Credit?.value) || 'Unknown';

      if (!licence || NON_FREE.test(licence)) {
        skipped.push(`${id} (${licence || 'no licence metadata'})`);
        await sleep(120);
        continue;
      }

      await download(page.thumbnail.source, dest);
      credits[id] = {
        file: fileName,
        author,
        licence,
        licenceUrl: meta.LicenseUrl?.value || '',
        source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent((fileName || '').replace(/ /g, '_'))}`
      };
      console.log(`ok  ${id.padEnd(12)} ${licence.padEnd(18)} ${author.slice(0, 40)}`);
    } catch (err) {
      skipped.push(`${id} (${err.message})`);
    }
    await sleep(150);
  }

  writeFileSync(
    path.join(ROOT, 'assets', 'js', 'credits.js'),
    '/* Generated by tools/fetch-photos.mjs — do not edit by hand.\n' +
    '   Photograph authors and licences, as returned by the Wikimedia APIs.\n' +
    '   The About page renders this list; CC BY-SA requires the credit. */\n' +
    'window.UTD_PHOTOS = ' + JSON.stringify(credits, null, 2) + ';\n',
    'utf8'
  );

  writeFileSync(
    path.join(ROOT, 'tools', 'photo-report.txt'),
    `Skipped (no free licence or no image found):\n${skipped.join('\n')}\n`,
    'utf8'
  );

  console.log(`\nwith photo: ${Object.keys(credits).length - 1} / ${Object.keys(PLAYERS).length}`);
  console.log(`skipped: ${skipped.length}`, skipped.length ? `\n  ${skipped.join('\n  ')}` : '');
}

main().catch((e) => { console.error(e); process.exit(1); });
