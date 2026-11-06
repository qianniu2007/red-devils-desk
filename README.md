# Red Devils Data Desk

A small, fast, checkable data site about Manchester United: every Premier League
season since 1992–93, the full trophy cabinet, 24 players with their real
appearance and goal totals, and an XI builder.

Built with plain HTML, CSS and JavaScript. No framework, no build step, no
dependencies, no back end, no tracking.

**Live:** https://qianniu2007.github.io/red-devils-desk/

---

## The six pages

| Page | What it does |
| --- | --- |
| `index.html` | The pitch: 20 league titles, 68 major trophies, four "since then" counters computed from real dates, a nine-moment timeline. |
| `legends.html` | An XI builder on a 4-3-3 pitch (pick a position, pick an eligible player, watch the totals), plus the sortable, searchable index of all 24 players. |
| `seasons.html` | 33 Premier League seasons as an SVG chart — points or finishing position, all seasons / Ferguson era / after — with a full data table underneath. |
| `trophies.html` | 10 competitions, every winning year, filterable by type, plus a per-decade histogram. |
| `quiz.html` | 10 questions, each correction linking to the page that proves the answer. |
| `about.html` | The brief, the plan, the design tokens, the sources, and an honest note on how AI was used. |

## Running it

Double-click `index.html`. That is the whole install.

It is written to work from `file://` on purpose: all data is a plain script
(`assets/js/data.js`) that assigns `window.UTD`, so there is no `fetch()` to fail
when the page is opened locally.

To serve it over HTTP anyway:

```powershell
python -m http.server 8000     # then open http://localhost:8000
```

## Editing the data

Everything the site claims lives in `assets/js/data.js`:

- `seasons` — one object per season: `season`, `pos`, `pts`, `mgr`, `note`
- `legends` — `name`, `nation`, `years`, `apps`, `goals`, `slot[]`, `note`
- `trophies` — `name`, `group`, `count`, `years[]`, `note`
- `eras` — the nine cards on the home page
- `milestones` — the dates behind the "since then" counters

Change a number there and every page follows. Nothing is typed twice.

## Checking it

Two scripts in `tools/`, both using only Node built-ins and headless Edge
(nothing to install):

```powershell
node tools/qa.mjs        # 70 checks: dead links, interactions, console errors
node tools/shot.mjs      # screenshots (desktop, mobile, dark) into screenshots/
node tools/shot.mjs --page seasons --mobile
```

`qa.mjs` drives a real browser: it clicks through the XI builder, filters the
chart, finishes the quiz and fails if any internal link points at a file that
does not exist. `shot.mjs` emulates a real phone viewport — `--window-size` alone
does not, which is how a layout that looked fine on a laptop broke at 390px.

`tools/make-favicons.py` renders the raster favicons from the same geometry as
`assets/img/favicon.svg` (needs Pillow).

## Structure

```
index.html  legends.html  seasons.html  trophies.html  quiz.html  about.html
og-card.html                  the 1200×630 artwork, rendered to assets/img/og.png
assets/css/site.css           one stylesheet: tokens, layout, components, pages
assets/js/data.js             all the data
assets/js/site.js             theme, mobile nav, reveal, counters
assets/js/legends.js          XI builder + sortable index
assets/js/seasons.js          the SVG chart + the table
assets/js/trophies.js         cabinet filter + decade histogram
assets/js/quiz.js             the quiz
assets/img/                   favicon.svg, favicon-32/180.png, og.png
screenshots/                  desktop and mobile captures
tools/                        qa.mjs, shot.mjs, make-favicons.py
```

## Where the numbers come from

- League positions and points, 1992–93 to 2024–25: the club's season records.
- Honours and winning years: the club's honours list, including the note that
  the 21 Community Shields include four shared titles.
- Appearances and goals: the club's all-time records (Giggs 963, Rooney 253,
  Charlton 249, Law 237).
- Counter dates: the 1968 and 1999 European Cup finals, Ferguson's last match
  (19 May 2013), the 2024 FA Cup final.

The rule used throughout: **if a number cannot be checked against a public
record, it does not go on the page.**

## Not affiliated

An independent, non-commercial student project. Not affiliated with Manchester
United Football Club. No club crests or licensed imagery are used.
