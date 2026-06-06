# Review: Superteam Local Prototype

## Machine Checks

- `npm run data:build` generated `public/data/pros.json` with 317 players, per-tournament team mappings, 301 player portraits, and 59 team logos.
- `npm run lint` passed.
- `npm run build` passed.
- `npx playwright test docs/code-factory/efforts/2026-06-05-lol-18-0-local/visual-capture.spec.js --reporter=line` passed.

Launch-prep pass:

- `npm run lint` passed after Cloudflare/header/Rift updates.
- `npm run build` passed after Cloudflare/header/Rift updates.
- `npx playwright test docs/code-factory/efforts/2026-06-05-lol-18-0-local/visual-capture.spec.js --reporter=line` passed after Cloudflare/header/Rift updates.

Reference-polish pass:

- `npm run lint` passed after the Superteam lobby upgrade.
- `npm run build` passed after the Superteam lobby upgrade.
- `npx playwright test docs/code-factory/efforts/2026-06-05-lol-18-0-local/visual-capture.spec.js --reporter=line` passed after updating the capture flow for Start Draft.

Brand rename pass:

- `npm run lint` passed after renaming the public brand to Superteam.
- `npm run build` passed after renaming metadata, package names, and Cloudflare project config.
- `npx playwright test docs/code-factory/efforts/2026-06-05-lol-18-0-local/visual-capture.spec.js --reporter=line` passed and refreshed the evidence screenshots.
- Mobile lobby screenshot confirmed the Superteam wordmark fits at 390px width.

Rift/model/UX upgrade pass:

- `npm run lint` passed after the real Rift map, offer logic, projection model, and result-screen updates.
- `npm run build` passed after the real Rift map, offer logic, projection model, and result-screen updates.
- `npx playwright test docs/code-factory/efforts/2026-06-05-lol-18-0-local/visual-capture.spec.js --reporter=line` passed and refreshed home, draw, final, and mobile evidence.
- Local in-app preview was reset to `http://127.0.0.1:5173/` and loaded as `Superteam`; the separate browser automation bridge timed out on one click check, so the Playwright CLI run is the interaction authority for this pass.

## Browser QA

Local URL: `http://127.0.0.1:5173/`

Verified:

- Page loads as `Superteam`.
- No browser console errors or warnings during core flows.
- First screen now presents a Superteam match lobby with Start Draft, difficulty, scouting mode, and a Rift draft board.
- Lobby and roster boards now use Riot Data Dragon's Summoner's Rift map asset instead of CSS-only lane art.
- Spin deals a real team plus timeframe.
- Spin choices are capped to the best available candidate per still-open role from the rolled team/timeframe.
- Active roll displays the rolled team logo.
- Active draw exposes the player choices without making desktop users hunt below the fold.
- Spin dealt five pro choices with five loaded player portraits in the in-app browser QA pass.
- In-app browser image QA loaded 11/11 LoL Esports images after a spin: five player portraits plus team-logo usages.
- Launch-prep browser QA loaded 21/21 visible images after a spin, dealt five choice cards, showed the Rift layer, and confirmed the fan notice was visible.
- Central panel now uses a muted Summoner's Rift map backdrop without adding extra decisions.
- Roster panel now includes a compact Summoner's Rift map that fills with drafted players.
- Roster panel now includes model-read notes explaining carry ceiling, control, synergy, team stacks, Worlds reps, volatility, and championship ceiling.
- Blind mode hides stats and shows memory-based choice cards.
- Reroll remains available once per run.
- Picking a pro advances the roster and preserves the drafted team/timeframe.
- Final state shows projected result, score, title odds, final score/title odds cards, and locked roster.
- Mobile layout keeps the roll and first dealt player visible.

## Model QA

- Before tuning, an elite best-by-role roster scored `87`, making champion outcomes too rare.
- After adding the championship ceiling bonus, the same elite roster scores `93`, a strong Gen.G team stack scores `91`, Bilibili Gaming scores `90`, and weaker regional stacks remain below the title band.

## Evidence

- Baseline screenshot: `docs/code-factory/efforts/2026-06-05-lol-18-0-local/browser-home.png`
- Redesigned home: `docs/code-factory/efforts/2026-06-05-lol-18-0-local/redesign-home.png`
- Active draw: `docs/code-factory/efforts/2026-06-05-lol-18-0-local/redesign-draw.png`
- Completed run: `docs/code-factory/efforts/2026-06-05-lol-18-0-local/redesign-final.png`
- Mobile draw: `docs/code-factory/efforts/2026-06-05-lol-18-0-local/redesign-mobile.png`
- Reference screenshots: `docs/code-factory/efforts/2026-06-05-lol-18-0-local/research/`
- Build artifact: `dist/`

## Launch Prep

- Runtime remains static-only: no backend, auth, database, server functions, or runtime secrets.
- Data refresh requires local env vars, but deploys use the committed static JSON snapshot.
- `public/_headers` adds CSP, frame blocking, MIME sniffing protection, referrer policy, permission policy, and cache rules.
- `wrangler.toml` targets Cloudflare Pages with `dist` as the output directory.
- Footer and README include the Riot fan-project notice under the Superteam name.

## Notes

The app is intentionally frontend-only for the local milestone. Deployment should stay static unless we later need scheduled data refreshes, daily seeded challenges, or user-created saved rosters.
