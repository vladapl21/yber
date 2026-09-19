# YBER — notes for Claude Code

Boat and yacht rental prototype: Duolingo-style landing, Turo-style search, list-your-boat flow,
accounts with Sea Miles. Plain HTML/CSS/JS, no framework, zero runtime dependencies.

## The one rule that matters

`index.html` is **generated**. Never edit it. It is also gitignored.
Edit files in `src/`, then run `npm run build` (or any npm script below, which builds first).
Edits made directly to `index.html` are silently overwritten by the next build.

## Commands

| Command | What it does |
|---|---|
| `npm start` | Build, then run the backend at http://localhost:3000 (data in `data/db.json`) |
| `npm test` | Build, then run all Playwright tests in both modes (file:// and against the server) |
| `npm run test:file` / `npm run test:server` | One mode only |
| `npm run build` | Inline `src/*` into `index.html` |
| `npm run reset` | Delete `data/` so the next start re-seeds from `src/seed.json` |

Run `npm test` after every change and before saying a task is done. Tests start their own
server on port 3100 with a throwaway `data/test-db.json`; they never touch `data/db.json`.

## Layout

- `src/template.html` HTML shell with `/*__CSS__*/`, `/*__SEED__*/`, `/*__JS__*/` placeholders
- `src/styles.css` all styles; design tokens on `:root`
- `src/seed.json` regions, 38 fictional listings, demo user, review pool. Single source of seed data
- `src/art.js` procedural SVG (boats, mascot, map, icons)
- `src/api.js` data layer. `API.*` has the same surface in two backends: `local` (in-browser, localStorage) and `remote` (fetch to server.js). Business rules live in `YBER_RULES`
- `src/app-core.js` helpers, state `S`, hash router, event delegation (`data-action` → `ACTIONS[name]`), auth modal
- `src/app-views-1.js` landing, onboarding, search/filters/map
- `src/app-views-2.js` boat detail + booking, host flow, account, marinas
- `server.js` Node http server, JSON API under `/api/*`, persists to `data/db.json`
- `build.js` concatenates `src/` into `index.html` (JS files in a fixed order: art, api, app-core, views-1, views-2)
- `tests/flows.spec.js` end-to-end tests

## Conventions

- Any business rule (pricing, XP, validation) must be changed in **both** `src/api.js` (`YBER_RULES` and `local`) and `server.js` (`RULES` and the route), or the two modes disagree. Add a test that runs in both projects.
- UI actions: add `data-action="name"` to the element and a handler at `ACTIONS['name']`. Do not add inline `onclick`.
- Escape any user-supplied string with `esc()` before putting it in HTML.
- No new runtime dependencies without asking. Dev dependencies are fine.
- 2-space indent, LF line endings, single quotes.

## Known prototype shortcuts (do not ship to real users)

- Passwords stored in plain text; bearer token is the user id.
- Payment is simulated. No availability calendar, so double bookings are possible.
- Photos stored as data URLs inside the JSON database.
